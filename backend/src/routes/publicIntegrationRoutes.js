const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const supabase = require('../config/supabase');

// Shared response helper
function respond(res, success, data, error, status=200) {
  return res.status(status).json({ success, data, error });
}

// Rate limiters (stricter)
const newsletterLimiter = rateLimit({ windowMs: 60 * 1000, max: 5 });
const contactLimiter = rateLimit({ windowMs: 60 * 1000, max: 5 });
const uploadLimiter = rateLimit({ windowMs: 60 * 1000, max: 3 });

// Middleware validation result handler
const { validationResult } = require('express-validator');
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return respond(res, false, null, { message: 'Validation failed', errors: errors.array() }, 422);
  }
  next();
}

// Newsletter subscribe
router.post('/newsletter', newsletterLimiter, [
  body('email').isEmail().withMessage('Email non valida')
], validate, async (req, res) => {
  const { email } = req.body;
  try {
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email })
      .select();
    if (error) {
      console.error('[newsletter insert error]', error);
      throw error;
    }
    console.log('[newsletter insert ok]', data);
    return respond(res, true, data[0], null, 201);
  } catch (err) {
    return respond(res, false, null, { message: err.message, stack: process.env.NODE_ENV==='development'?err.stack:undefined }, 500);
  }
});

// Contact form
router.post('/contact', contactLimiter, [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Nome non valido'),
  body('email').isEmail().withMessage('Email non valida'),
  body('message').trim().isLength({ min: 5, max: 2000 }).withMessage('Messaggio troppo corto')
], validate, async (req, res) => {
  const { name, email, message } = req.body;
  try {
    const { data, error } = await supabase
      .from('contacts')
      .insert({ name, email, message })
      .select();
    if (error) { console.error('[contact insert error]', error); throw error; }
    console.log('[contact insert ok]', data);
    return respond(res, true, data[0], null, 201);
  } catch (err) {
    return respond(res, false, null, { message: err.message }, 500);
  }
});

// Upload (base64 / multipart handled externally) — here expect single file via multipart
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024) },
  fileFilter: (req, file, cb) => {
    const allowed = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp').split(',');
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Tipo file non consentito'));
    }
    cb(null, true);
  }
});

router.post('/upload', uploadLimiter, upload.single('file'), async (req, res) => {
  if (!req.file) return respond(res, false, null, { message: 'Nessun file' }, 400);
  try {
    const ext = path.extname(req.file.originalname).toLowerCase();
    const safeName = req.file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const filename = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}_${safeName}`;

    // Upload to storage bucket 'uploads'
    const { error: storageError } = await supabase.storage
      .from('uploads')
      .upload(filename, req.file.buffer, {
        cacheControl: '3600',
        contentType: req.file.mimetype,
        upsert: false
      });
    if (storageError) throw storageError;

    const { data: publicUrlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(filename);

    const publicUrl = publicUrlData?.publicUrl;

    // Save metadata
    const { data: meta, error: metaErr } = await supabase
      .from('uploads')
      .insert({
        path: filename,
        url: publicUrl,
        filename: req.file.originalname,
        content_type: req.file.mimetype,
        size: req.file.size
      })
      .select();
    if (metaErr) throw metaErr;

    return respond(res, true, { publicUrl, metadata: meta[0] }, null, 201);
  } catch (err) {
    return respond(res, false, null, { message: err.message }, 500);
  }
});

module.exports = router;
