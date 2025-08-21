const express = require('express');
const cors = require('cors');

// Test app without supabase dependencies
const app = express();

// Mock middleware
app.use(cors());
app.use(express.json({
  strict: true,
  // Handle malformed JSON
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ error: 'Malformed JSON' });
      throw e;
    }
  }
}));

// No rate limiting for tests

// Mock ugoChat route for testing
app.post('/api/ugo/chat', async (req, res) => {
  try {
    const { user_id, session_id, message, context_flags = {} } = req.body;
    
    // Validation
    if (!user_id || !session_id || !message) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['user_id', 'session_id', 'message']
      });
    }

    if (message.length > 500) {
      return res.status(400).json({
        error: 'Message too long',
        max_length: 500
      });
    }

    // Mock response following exact contract - adjust based on message
    let mockResponse;
    
    // Determine mood based on message content
    const messageLower = message.toLowerCase();
    let mood = "gioia"; // default
    let text = "Woof! Ciao! *scodinzola felice* Che bello sentirti! Come stai? *inclina la testa curioso*";
    let scodinzolio = "veloce";
    let posizione = "in piedi";
    
    if (messageLower.includes('triste') || messageLower.includes('solo') || messageLower.includes('male')) {
      mood = "tristezza";
      text = "Oh no... *si avvicina dolcemente* Mi dispiace tanto. *appoggia la testa vicino* Sono qui con te.";
      scodinzolio = "lento";
      posizione = "sdraiato";
    } else if (messageLower.includes('arrabbiato') || messageLower.includes('furioso') || messageLower.includes('basta')) {
      mood = "rabbia";
      text = "Capisco che sei agitato... *orecchie dritte* Posso aiutarti? *sta in piedi attento*";
      scodinzolio = "rigido";
      posizione = "teso";
    } else if (messageLower.includes('paura') || messageLower.includes('spavento')) {
      mood = "paura";
      text = "Non avere paura... *si nasconde dietro* Sono qui per proteggerti! *guarda nervoso*";
      scodinzolio = "basso";
      posizione = "accovacciato";
    } else if (messageLower.includes('come stai') || messageLower.includes('?')) {
      mood = "neutro";
      text = "Sto bene, grazie! *scodinzola moderato* E tu come stai? *inclina la testa*";
      scodinzolio = "medio";
      posizione = "seduto";
    }
    
    mockResponse = {
      text: text,
      mood: mood,
      behavior: {
        scodinzolio: scodinzolio,
        posizione: posizione
      },
      metadata: {
        model: "test-mistral-7b",
        latency_ms: Math.floor(Math.random() * 1000) + 500
      }
    };

    // Add debug info in development
    if (process.env.NODE_ENV === 'development') {
      mockResponse.debug = {
        analysis: {
          sentiment: "positivo",
          confidence: 0.8
        }
      };
    }

    res.json(mockResponse);
  } catch (error) {
    console.error('Mock chat error:', error);
    res.status(500).json({
      text: "Mi dispiace, ho avuto un problemino tecnico! *orecchie basse*",
      mood: "neutro", 
      behavior: {
        scodinzolio: "lento",
        posizione: "seduto"
      },
      metadata: {
        model: "test-fallback",
        latency_ms: 100,
        error: true
      }
    });
  }
});

// Mock feedback endpoint
app.post('/api/ugo/feedback', async (req, res) => {
  try {
    const { user_id, session_id, rating, comment, feedback_type, consent_given, can_use_for_training } = req.body;
    
    if (!user_id || !session_id || !rating || consent_given === undefined) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['user_id', 'session_id', 'rating', 'consent_given']
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        error: 'Rating must be between 1 and 5'
      });
    }

    if (feedback_type && !['general', 'accuracy', 'personality', 'helpfulness', 'bug_report'].includes(feedback_type)) {
      return res.status(400).json({
        error: 'Invalid feedback_type'
      });
    }

    res.json({
      message: 'Feedback received successfully',
      feedback_id: 'mock-' + Date.now(),
      consent_status: consent_given ? 'granted' : 'denied',
      can_use_for_training: can_use_for_training || false
    });
  } catch (error) {
    console.error('Mock feedback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mock stats endpoints
app.get('/api/ugo/feedback/stats', (req, res) => {
  res.json({
    today: {
      total: 10,
      ratings: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 },
      avgRating: 4.2,
      feedbackTypes: { general: 5, accuracy: 2, personality: 2, helpfulness: 1 }
    }
  });
});

app.get('/api/ugo/stats', (req, res) => {
  res.json({
    engine_stats: {
      sentimentAnalyzer: { requests: 100, avg_response_time: 50 },
      currentMood: 'gioia',
      currentEmotions: { happiness: 0.8, excitement: 0.6 }
    },
    uptime: Date.now() - 1000000,
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
