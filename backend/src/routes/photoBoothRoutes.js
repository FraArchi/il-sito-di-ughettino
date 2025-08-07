const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authMiddleware } = require('../middleware/authMiddleware');

// Configure multer for photo uploads
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo immagini sono permesse!'), false);
        }
    }
});

// POST /api/photobooth/upload - Upload photo
router.post('/upload', authMiddleware, upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Nessuna foto fornita'
            });
        }

        // Return mock success
        res.json({
            success: true,
            message: 'Foto caricata con successo',
            data: {
                id: Date.now(),
                filename: `photo_${Date.now()}.jpg`,
                size: req.file.size,
                uploadedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error uploading photo:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nel caricamento della foto'
        });
    }
});

// GET /api/photobooth/gallery - Get user gallery
router.get('/gallery', authMiddleware, async (req, res) => {
    try {
        // Return mock gallery
        res.json({
            success: true,
            data: []
        });
    } catch (error) {
        console.error('Error getting gallery:', error);
        res.status(500).json({
            success: false,
            message: 'Errore interno del server'
        });
    }
});

module.exports = router;
