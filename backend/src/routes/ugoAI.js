const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const UgoAICompanion = require('../services/ugoAICompanion');
const ConversationMemory = require('../services/conversationMemory');
const UgoPersonality = require('../services/ugoPersonality');
const EmotionEngine = require('../services/emotionEngine');
const { authMiddleware } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

const router = express.Router();

// Inizializza servizi AI
const ugoAI = new UgoAICompanion();
const conversationMemory = new ConversationMemory();
const ugoPersonality = new UgoPersonality();
const emotionEngine = new EmotionEngine();

/**
 * POST /api/ugo-ai/chat
 * Chat principale con Ugo AI Companion
 */
router.post('/chat', 
  authMiddleware,
  [
    body('message')
      .notEmpty()
      .withMessage('Il messaggio è obbligatorio')
      .isLength({ max: 500 })
      .withMessage('Il messaggio non può superare i 500 caratteri'),
    body('sessionId')
      .optional()
      .isString()
      .withMessage('Session ID deve essere una stringa'),
    body('context')
      .optional()
      .isObject()
      .withMessage('Context deve essere un oggetto')
  ],
  async (req, res) => {
    try {
      // Valida input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dati non validi',
          errors: errors.array()
        });
      }

      const { message, sessionId, context } = req.body;
      const userId = req.user.id;

      logger.info(`UgoAI chat request from user ${userId}: "${message.substring(0, 50)}..."`);

      // Chat con Ugo
      const response = await ugoAI.chat(message, userId, sessionId);

      // Log risposta per monitoring
      logger.info(`UgoAI response to user ${userId}: mood=${response.mood}, length=${response.response.length}`);

      res.json({
        success: true,
        data: {
          message: response.response,
          mood: response.mood,
          personality: response.personality,
          context: response.context,
          sessionId: sessionId || 'default',
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('UgoAI chat error:', error);
      res.status(500).json({
        success: false,
        message: 'Errore durante la conversazione con Ugo',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Errore interno'
      });
    }
  }
);

/**
 * GET /api/ugo-ai/personality
 * Ottieni stato personalità di Ugo
 */
router.get('/personality', authMiddleware, async (req, res) => {
  try {
    const personality = ugoPersonality.getCurrentState();
    const emotionalSummary = emotionEngine.getEmotionalSummary();

    res.json({
      success: true,
      data: {
        personality,
        emotions: emotionalSummary,
        interactionSuggestions: emotionEngine.getInteractionSuggestions()
      }
    });

  } catch (error) {
    logger.error('Error getting personality:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero della personalità di Ugo'
    });
  }
});

/**
 * POST /api/ugo-ai/personality/feedback
 * Fornisci feedback per evoluzione personalità
 */
router.post('/personality/feedback',
  authMiddleware,
  [
    body('feedback')
      .isIn(['positive', 'negative', 'neutral'])
      .withMessage('Feedback deve essere positive, negative o neutral'),
    body('interactionType')
      .optional()
      .isString()
      .withMessage('Interaction type deve essere una stringa'),
    body('conversationId')
      .optional()
      .isString()
      .withMessage('Conversation ID deve essere una stringa')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dati non validi',
          errors: errors.array()
        });
      }

      const { feedback, interactionType, conversationId } = req.body;
      const userId = req.user.id;

      // Evolve personalità basandosi sul feedback
      ugoPersonality.evolvePersonality(feedback, interactionType, 'neutral');

      // Se specificato, aggiorna rating conversazione
      if (conversationId) {
        const rating = feedback === 'positive' ? 5 : feedback === 'negative' ? 1 : 3;
        await conversationMemory.updateConversationRating(userId, conversationId, rating);
      }

      logger.info(`Personality feedback from user ${userId}: ${feedback}`);

      res.json({
        success: true,
        message: 'Feedback ricevuto, Ugo sta imparando!',
        data: {
          updatedPersonality: ugoPersonality.getCurrentState()
        }
      });

    } catch (error) {
      logger.error('Error processing personality feedback:', error);
      res.status(500).json({
        success: false,
        message: 'Errore nell\'elaborazione del feedback'
      });
    }
  }
);

/**
 * GET /api/ugo-ai/memory/stats
 * Statistiche memoria conversazionale
 */
router.get('/memory/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const memoryStats = await conversationMemory.getMemoryStats(userId);
    const userPatterns = await conversationMemory.getUserPatterns(userId);

    res.json({
      success: true,
      data: {
        memory: memoryStats,
        patterns: userPatterns
      }
    });

  } catch (error) {
    logger.error('Error getting memory stats:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle statistiche memoria'
    });
  }
});

/**
 * GET /api/ugo-ai/conversation/history
 * Storia conversazioni
 */
router.get('/conversation/history',
  authMiddleware,
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit deve essere tra 1 e 50'),
    query('sessionId')
      .optional()
      .isString()
      .withMessage('Session ID deve essere una stringa')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Parametri non validi',
          errors: errors.array()
        });
      }

      const { limit = 20, sessionId } = req.query;
      const userId = req.user.id;

      const context = await conversationMemory.getContext(userId, sessionId, parseInt(limit));

      res.json({
        success: true,
        data: {
          conversations: context,
          totalCount: context.length,
          sessionId: sessionId || 'default'
        }
      });

    } catch (error) {
      logger.error('Error getting conversation history:', error);
      res.status(500).json({
        success: false,
        message: 'Errore nel recupero della storia conversazioni'
      });
    }
  }
);

/**
 * POST /api/ugo-ai/emotion/force
 * Forza un mood specifico (per testing)
 */
router.post('/emotion/force',
  authMiddleware,
  [
    body('mood')
      .isIn(['excited', 'happy', 'curious', 'playful', 'calm', 'affectionate', 'alert', 'confused'])
      .withMessage('Mood non valido'),
    body('intensity')
      .optional()
      .isFloat({ min: 0, max: 1 })
      .withMessage('Intensity deve essere tra 0 e 1')
  ],
  async (req, res) => {
    try {
      // Solo in development mode
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
          success: false,
          message: 'Funzione disponibile solo in development'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dati non validi',
          errors: errors.array()
        });
      }

      const { mood, intensity = 0.8 } = req.body;

      emotionEngine.forceMood(mood, intensity);

      res.json({
        success: true,
        message: `Mood di Ugo forzato a: ${mood}`,
        data: {
          currentMood: mood,
          emotionalSummary: emotionEngine.getEmotionalSummary(),
          interactionSuggestions: emotionEngine.getInteractionSuggestions()
        }
      });

    } catch (error) {
      logger.error('Error forcing emotion:', error);
      res.status(500).json({
        success: false,
        message: 'Errore nel forzare l\'emozione'
      });
    }
  }
);

/**
 * POST /api/ugo-ai/train
 * Avvia training personalizzato di Ugo
 */
router.post('/train',
  authMiddleware,
  [
    body('includeStories')
      .optional()
      .isBoolean()
      .withMessage('Include stories deve essere boolean'),
    body('includeConversations')
      .optional()
      .isBoolean()
      .withMessage('Include conversations deve essere boolean'),
    body('minRating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Min rating deve essere tra 1 e 5')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Parametri non validi',
          errors: errors.array()
        });
      }

      const { includeStories = true, includeConversations = true, minRating = 4 } = req.body;
      const userId = req.user.id;

      // TODO: Implementare raccolta dati per training
      const conversations = []; // await getTrainingConversations(userId, minRating);
      const stories = []; // await getTrainingStories();

      // Avvia training asincrono
      const trainingResult = await ugoAI.trainUgoPersonality(conversations, stories);

      logger.info(`Training initiated for user ${userId}:`, trainingResult);

      res.json({
        success: true,
        message: 'Training di Ugo avviato con successo!',
        data: trainingResult
      });

    } catch (error) {
      logger.error('Error starting training:', error);
      res.status(500).json({
        success: false,
        message: 'Errore nell\'avvio del training',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Errore interno'
      });
    }
  }
);

/**
 * GET /api/ugo-ai/health
 * Health check per servizi AI
 */
router.get('/health', async (req, res) => {
  try {
    // Verifica stato Ollama
    const isOllamaHealthy = await ugoAI.checkOllamaHealth();
    
    // Verifica inizializzazione servizi
    const servicesStatus = {
      ugoAI: ugoAI.isInitialized,
      conversationMemory: true,
      personality: true,
      emotions: true,
      ollama: isOllamaHealthy
    };

    const allHealthy = Object.values(servicesStatus).every(status => status === true);

    res.status(allHealthy ? 200 : 503).json({
      success: allHealthy,
      message: allHealthy ? 'Tutti i servizi AI sono operativi' : 'Alcuni servizi AI non sono disponibili',
      data: {
        services: servicesStatus,
        timestamp: new Date().toISOString(),
        model: ugoAI.model,
        ollamaUrl: ugoAI.ollamaUrl
      }
    });

  } catch (error) {
    logger.error('AI health check error:', error);
    res.status(503).json({
      success: false,
      message: 'Errore nel controllo stato servizi AI',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Errore interno'
    });
  }
});

/**
 * GET /api/ugo-ai/stats
 * Statistiche generali AI
 */
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Raccolta statistiche
    const [memoryStats, userPatterns, personalityStats] = await Promise.all([
      conversationMemory.getMemoryStats(userId),
      conversationMemory.getUserPatterns(userId),
      Promise.resolve(ugoPersonality.getEvolutionStats())
    ]);

    const emotionalSummary = emotionEngine.getEmotionalSummary();

    res.json({
      success: true,
      data: {
        memory: memoryStats,
        patterns: userPatterns,
        personality: personalityStats,
        emotions: emotionalSummary,
        ai: {
          model: ugoAI.model,
          initialized: ugoAI.isInitialized,
          ollamaHealthy: await ugoAI.checkOllamaHealth().catch(() => false)
        }
      }
    });

  } catch (error) {
    logger.error('Error getting AI stats:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle statistiche AI'
    });
  }
});

module.exports = router;
