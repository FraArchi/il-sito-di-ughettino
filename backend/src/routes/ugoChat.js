const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Services
const EnhancedEmotionEngine = require('../services/enhancedEmotionEngine');
const UgoContextBuilder = require('../services/ugoContextBuilderV2');
const { cache } = require('../config/redis');

const router = express.Router();

// Initialize services
const emotionEngine = new EnhancedEmotionEngine();
const contextBuilder = new UgoContextBuilder();

// Rate limiting per chat API
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // 30 richieste per minuto per IP
  message: {
    error: 'Too many chat requests',
    message: 'Aspetta un momento prima di continuare la conversazione'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * POST /api/ugo/chat
 * Chat principale con Ugo AI Companion - Versione Production
 * 
 * Contratto API ufficiale per il sistema emotivo-canino
 */
router.post('/chat', 
  chatLimiter,
  [
    body('user_id')
      .notEmpty()
      .withMessage('user_id è obbligatorio')
      .isString()
      .withMessage('user_id deve essere una stringa')
      .isLength({ min: 1, max: 100 })
      .withMessage('user_id deve essere tra 1 e 100 caratteri'),
    
    body('session_id')
      .notEmpty()
      .withMessage('session_id è obbligatorio')
      .isString()
      .withMessage('session_id deve essere una stringa')
      .isLength({ min: 1, max: 100 })
      .withMessage('session_id deve essere tra 1 e 100 caratteri'),
    
    body('message')
      .notEmpty()
      .withMessage('message è obbligatorio')
      .isString()
      .withMessage('message deve essere una stringa')
      .isLength({ min: 1, max: 500 })
      .withMessage('message deve essere tra 1 e 500 caratteri'),
    
    body('context_flags')
      .optional()
      .isObject()
      .withMessage('context_flags deve essere un oggetto'),
    
    body('context_flags.use_memory')
      .optional()
      .isBoolean()
      .withMessage('use_memory deve essere un boolean'),
    
    body('context_flags.urgent')
      .optional()
      .isBoolean()
      .withMessage('urgent deve essere un boolean')
  ],
  async (req, res) => {
    const startTime = Date.now();
    
    try {
      // Validazione input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Dati di input non validi',
          details: errors.array(),
          latency_ms: Date.now() - startTime
        });
      }
      
      const { user_id, session_id, message, context_flags = {} } = req.body;
      
      logger.info(`UgoChat request from user ${user_id}:`, { 
        session_id, 
        message_length: message.length 
      });
      
      // 1. Controllo cache per richieste identiche
      const cacheKey = `ugo_chat:${user_id}:${Buffer.from(message).toString('base64')}`;
      let cachedResponse = null;
      
      try {
        cachedResponse = await cache.get(cacheKey);
        if (cachedResponse) {
          const parsed = JSON.parse(cachedResponse);
          logger.info('Returning cached response for user:', user_id);
          return res.json({
            ...parsed,
            metadata: {
              ...parsed.metadata,
              latency_ms: Date.now() - startTime,
              cached: true
            }
          });
        }
      } catch (cacheError) {
        logger.warn('Cache error (continuing without cache):', cacheError.message);
      }
      
      // 2. Processa con Emotion Engine
      const emotionResult = emotionEngine.processMessage({
        user_id,
        session_id,
        message,
        context_flags
      });
      
      // 3. Ottieni contesto conversazione (se richiesto)
      let conversationContext = [];
      if (context_flags.use_memory !== false) {
        try {
          conversationContext = await getConversationContext(user_id, session_id);
        } catch (contextError) {
          logger.warn('Context retrieval error (continuing without context):', contextError.message);
        }
      }
      
      // 4. Costruisci prompt per generazione
      const promptData = contextBuilder.buildUgoPrompt({
        userMessage: message,
        mood: emotionResult.mood,
        behavior: emotionResult.behavior,
        conversationContext: conversationContext.slice(-3), // Ultimi 3 messaggi
        emotionalState: emotionResult.emotional_state
      });
      
      // 5. Genera risposta con model service
      let generatedText;
      try {
        generatedText = await generateUgoResponse(promptData);
      } catch (modelError) {
        logger.error('Model service error:', modelError);
        // If the model service is unavailable, we should throw to trigger the 500 error handler
        if (modelError.message.includes('Model service not available')) {
          throw modelError;
        }
        // Fallback a risposta predefinita
        generatedText = generateFallbackResponse(emotionResult.mood, message);
      }
      
      // 6. Post-processing: applicazione stile canino e limitazioni
      const finalText = postProcessUgoResponse(generatedText, emotionResult);
      
      // 7. Costruisci risposta finale secondo contratto API
      const response = {
        text: finalText,
        mood: emotionResult.mood,
        behavior: {
          scodinzolio: emotionResult.behavior.scodinzolio,
          posizione: emotionResult.behavior.posizione
        },
        metadata: {
          model: process.env.MODEL_BACKEND || 'mistral-7b-q4',
          latency_ms: Date.now() - startTime
        }
      };
      
      // 8. Aggiungi debug info se in development
      if (process.env.NODE_ENV === 'development') {
        response.debug = {
          analysis: {
            sentiment: emotionResult.sentiment,
            triggers: emotionResult.debug.triggers,
            emotional_state: emotionResult.emotional_state,
            prompt_preview: promptData.substring(0, 200) + '...',
            original_generation: generatedText !== finalText ? generatedText : undefined
          }
        };
      }
      
      // 9. Salva conversazione e cache risposta
      try {
        await saveConversationExchange(user_id, session_id, {
          userMessage: message,
          ugoResponse: finalText,
          mood: emotionResult.mood,
          behavior: emotionResult.behavior,
          timestamp: new Date()
        });
        
        // Cache per 5 minuti per richieste identiche
        await cache.setex(cacheKey, 300, JSON.stringify(response));
      } catch (saveError) {
        logger.warn('Conversation save error (response still returned):', saveError.message);
      }
      
      logger.info(`UgoChat response generated in ${Date.now() - startTime}ms for user ${user_id}`);
      res.json(response);
      
    } catch (error) {
      const latency = Date.now() - startTime;
      logger.error('UgoChat error:', error);
      
      // Risposta di errore che rispetta comunque il contratto
      res.status(500).json({
        text: "Woof! Scusa, ho avuto un piccolo problema tecnico. Prova di nuovo tra poco! 🐕",
        mood: "neutro",
        behavior: {
          scodinzolio: "medio",
          posizione: "seduto"
        },
        metadata: {
          model: "fallback",
          latency_ms: latency,
          error: true
        }
      });
    }
  }
);

/**
 * Genera risposta usando il model service
 */
async function generateUgoResponse(promptData) {
  const modelServiceUrl = process.env.MODEL_SERVICE_URL || 'http://localhost:9000';
  
  const requestPayload = {
    prompt: promptData,
    max_tokens: parseInt(process.env.UGO_MAX_TOKENS) || 120,
    temperature: parseFloat(process.env.UGO_TEMPERATURE) || 0.7,
    top_p: parseFloat(process.env.UGO_TOP_P) || 0.9,
    stop: ['\\n\\n', 'Human:', 'User:', '###']
  };
  
  const axios = require('axios');
  
  try {
    const response = await axios.post(`${modelServiceUrl}/generate`, requestPayload, {
      timeout: 25000, // 25 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data && response.data.text) {
      return response.data.text.trim();
    } else {
      throw new Error('Invalid response from model service');
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Model service not available');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Model service timeout');
    } else {
      throw new Error(`Model service error: ${error.message}`);
    }
  }
}

/**
 * Genera risposta di fallback predefinita
 */
function generateFallbackResponse(mood, userMessage) {
  const fallbackResponses = {
    'gioia': [
      "Woof woof! Sono così felice di sentirti! 🐕",
      "Che bello parlare con te! Mi fai sempre sorridere!",
      "Sono tutto eccitato! Raccontami di più!"
    ],
    'tristezza': [
      "Mi dispiace che tu sia triste... Sono qui con te. ❤️",
      "Ti mando tante coccole virtuali! Non sei solo.",
      "Voglio starti vicino in questo momento difficile."
    ],
    'paura': [
      "Non aver paura, io sono qui a proteggerti!",
      "Insieme possiamo superare qualsiasi cosa!",
      "Ti sto vicino, non ti lascio mai solo."
    ],
    'rabbia': [
      "Capisco la tua frustrazione... Respiriamo insieme.",
      "A volte è normale arrabbiarsi. Io ti voglio bene lo stesso.",
      "Sono qui per te, anche nei momenti difficili."
    ],
    'neutro': [
      "Ciao! Come stai oggi? Io sono qui e pronto ad ascoltarti!",
      "Che bello sentirti! Cosa vuoi che facciamo insieme?",
      "Sono tutto orecchie! Dimmi tutto!"
    ]
  };
  
  const responses = fallbackResponses[mood] || fallbackResponses['neutro'];
  return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Post-processing della risposta per stile canino
 */
function postProcessUgoResponse(text, emotionResult) {
  let processed = text.trim();
  
  // Limita lunghezza (max ~100 parole)
  const words = processed.split(/\\s+/);
  if (words.length > 100) {
    processed = words.slice(0, 95).join(' ') + '...';
  }
  
  // Rimuovi contenuto inappropriato o troppo lungo
  processed = processed.replace(/[\\n\\r]+/g, ' '); // Rimuovi newlines
  processed = processed.replace(/\\s{2,}/g, ' '); // Rimuovi spazi multipli
  
  // Assicurati che finisca con punteggiatura
  if (!/[.!?]$/.test(processed)) {
    processed += '.';
  }
  
  // Aggiungi comportamento fisico come frase finale
  const behaviorDescription = emotionResult.behavior.description;
  if (behaviorDescription && !processed.includes('coda') && !processed.includes('scodinzol')) {
    processed += ` *${behaviorDescription.charAt(0).toUpperCase() + behaviorDescription.slice(1)}*`;
  }
  
  // Safety: assicurati che non sia vuoto
  if (processed.length < 10) {
    processed = generateFallbackResponse(emotionResult.mood, 'fallback');
  }
  
  return processed;
}

/**
 * Ottieni contesto conversazione
 */
async function getConversationContext(userId, sessionId) {
  // Implementazione placeholder - sostituire con database reale
  const contextKey = `conversation:${userId}:${sessionId}`;
  
  try {
    const cached = await cache.get(contextKey);
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    logger.warn('Context retrieval error:', error);
    return [];
  }
}

/**
 * Salva scambio conversazione
 */
async function saveConversationExchange(userId, sessionId, exchange) {
  const contextKey = `conversation:${userId}:${sessionId}`;
  
  try {
    // Recupera contesto esistente
    let context = [];
    const existing = await cache.get(contextKey);
    if (existing) {
      context = JSON.parse(existing);
    }
    
    // Aggiungi nuovo scambio
    context.push(exchange);
    
    // Mantieni solo ultimi 10 scambi
    if (context.length > 10) {
      context = context.slice(-10);
    }
    
    // Salva per 1 ora
    await cache.setex(contextKey, 3600, JSON.stringify(context));
    
  } catch (error) {
    logger.error('Save conversation error:', error);
    throw error;
  }
}

/**
 * GET /api/ugo/stats - Statistiche del motore emotivo
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = emotionEngine.getEngineStats();
    res.json({
      engine_stats: stats,
      uptime: process.uptime(),
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve stats' });
  }
});

/**
 * POST /api/ugo/reset - Reset stato emotivo (solo development)
 */
if (process.env.NODE_ENV === 'development') {
  router.post('/reset', (req, res) => {
    try {
      emotionEngine.resetEmotions();
      res.json({ message: 'Emotional state reset successfully' });
    } catch (error) {
      logger.error('Reset error:', error);
      res.status(500).json({ error: 'Failed to reset emotional state' });
    }
  });
}

/**
 * POST /api/ugo/feedback - Raccoglie feedback sulle risposte di Ugo
 */
router.post('/feedback',
  [
    body('user_id').notEmpty().isString().isLength({ min: 1, max: 100 }),
    body('session_id').notEmpty().isString().isLength({ min: 1, max: 100 }),
    body('message_id').optional().isString().isLength({ max: 100 }),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating deve essere tra 1 e 5'),
    body('comment').optional().isString().isLength({ max: 1000 }),
    body('feedback_type').optional().isIn(['general', 'accuracy', 'personality', 'helpfulness', 'bug_report']),
    body('consent_given').isBoolean().withMessage('consent_given è obbligatorio'),
    body('can_use_for_training').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const {
        user_id,
        session_id,
        message_id,
        rating,
        comment,
        feedback_type = 'general',
        consent_given,
        can_use_for_training = false,
        context = {}
      } = req.body;

      // Log feedback request
      logger.info(`Feedback received from user ${user_id}:`, { 
        rating, 
        feedback_type, 
        consent_given 
      });

      // Per ora salviamo in Redis, ma in produzione va nel database
      const feedbackData = {
        user_id,
        session_id,
        message_id,
        rating,
        comment,
        feedback_type,
        consent_given,
        can_use_for_training,
        context,
        timestamp: new Date().toISOString(),
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      };

      try {
        // Salva in Redis con TTL di 7 giorni
        const feedbackKey = `ugo_feedback:${user_id}:${Date.now()}`;
        await cache.setex(feedbackKey, 604800, JSON.stringify(feedbackData));
        
        // Aggiorna statistiche di feedback
        const statsKey = `ugo_feedback_stats:${new Date().toISOString().split('T')[0]}`;
        const currentStats = await cache.get(statsKey);
        const stats = currentStats ? JSON.parse(currentStats) : {
          total: 0,
          ratings: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          avgRating: 0,
          feedbackTypes: {}
        };
        
        stats.total++;
        stats.ratings[rating]++;
        stats.feedbackTypes[feedback_type] = (stats.feedbackTypes[feedback_type] || 0) + 1;
        
        // Ricalcola media
        const totalRating = Object.entries(stats.ratings).reduce((sum, [rating, count]) => {
          return sum + (parseInt(rating) * count);
        }, 0);
        stats.avgRating = (totalRating / stats.total).toFixed(2);
        
        await cache.setex(statsKey, 86400, JSON.stringify(stats)); // 24h TTL
        
      } catch (cacheError) {
        logger.warn('Feedback cache error (continuing):', cacheError.message);
      }

      // Risposta di successo
      res.json({
        message: 'Feedback ricevuto con successo',
        feedback_id: `${user_id}_${Date.now()}`,
        consent_status: consent_given ? 'granted' : 'not_granted',
        can_use_for_training: can_use_for_training && consent_given,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Feedback submission error:', error);
      res.status(500).json({
        error: 'Failed to submit feedback',
        message: 'Si è verificato un errore nel salvataggio del feedback'
      });
    }
  }
);

/**
 * GET /api/ugo/feedback/stats - Statistiche feedback aggregate
 */
router.get('/feedback/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const statsKey = `ugo_feedback_stats:${today}`;
    
    const todayStats = await cache.get(statsKey);
    const parsed = todayStats ? JSON.parse(todayStats) : {
      total: 0,
      ratings: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      avgRating: 0,
      feedbackTypes: {}
    };

    res.json({
      today: parsed,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Feedback stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve feedback stats' });
  }
});

module.exports = router;
