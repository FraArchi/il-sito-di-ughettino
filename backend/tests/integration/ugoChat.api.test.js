const request = require('supertest');
const app = require('../testApp'); // Use test app instead of main app

// Mock del model service per test
jest.mock('axios', () => ({
  post: jest.fn(() => Promise.resolve({
    data: {
      text: "Woof! Ciao! *scodinzola felice* Che bello sentirti! Come stai? *inclina la testa curioso*"
    }
  }))
}));

describe('Ugo Chat API Integration Tests', () => {
  describe('POST /api/ugo/chat', () => {
    test('should handle valid chat request', async () => {
      const chatRequest = {
        user_id: 'test-user-1',
        session_id: 'test-session-1',
        message: 'Ciao Ugo!',
        context_flags: {
          use_memory: true,
          urgent: false
        }
      };

      const response = await request(app)
        .post('/api/ugo/chat')
        .send(chatRequest)
        .expect(200);

      // Verifica struttura risposta secondo contratto
      expect(response.body).toHaveProperty('text');
      expect(response.body).toHaveProperty('mood');
      expect(response.body).toHaveProperty('behavior');
      expect(response.body).toHaveProperty('metadata');

      // Verifica campi behavior
      expect(response.body.behavior).toHaveProperty('scodinzolio');
      expect(response.body.behavior).toHaveProperty('posizione');

      // Verifica mood valido
      expect(['gioia', 'tristezza', 'rabbia', 'paura', 'neutro'])
        .toContain(response.body.mood);

      // Verifica metadata
      expect(response.body.metadata).toHaveProperty('model');
      expect(response.body.metadata).toHaveProperty('latency_ms');
      expect(typeof response.body.metadata.latency_ms).toBe('number');
    });

    test('should handle different emotions correctly', async () => {
      const testCases = [
        {
          message: 'Sono molto felice oggi!',
          expectedMood: 'gioia'
        },
        {
          message: 'Mi sento molto triste e solo...',
          expectedMood: 'tristezza' 
        },
        {
          message: 'Come stai?',
          expectedMood: 'neutro'
        }
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .post('/api/ugo/chat')
          .send({
            user_id: 'test-user',
            session_id: 'test-session',
            message: testCase.message
          })
          .expect(200);

        expect(response.body.mood).toBe(testCase.expectedMood);
      }
    });

    test('should validate required fields', async () => {
      const invalidRequests = [
        {}, // Empty request
        { user_id: 'test' }, // Missing session_id and message
        { user_id: 'test', session_id: 'session' }, // Missing message
        { message: 'Hello' } // Missing user_id and session_id
      ];

      for (const invalidRequest of invalidRequests) {
        await request(app)
          .post('/api/ugo/chat')
          .send(invalidRequest)
          .expect(400);
      }
    });

    test('should validate field types and lengths', async () => {
      const invalidRequests = [
        {
          user_id: '', // Empty user_id
          session_id: 'session',
          message: 'Hello'
        },
        {
          user_id: 'user',
          session_id: '',
          message: 'Hello'
        },
        {
          user_id: 'user',
          session_id: 'session', 
          message: '' // Empty message
        },
        {
          user_id: 'user',
          session_id: 'session',
          message: 'A'.repeat(501) // Too long message
        }
      ];

      for (const invalidRequest of invalidRequests) {
        await request(app)
          .post('/api/ugo/chat')
          .send(invalidRequest)
          .expect(400);
      }
    });

    test('should handle context flags correctly', async () => {
      const requestWithFlags = {
        user_id: 'test-user',
        session_id: 'test-session',
        message: 'Aiuto urgente!',
        context_flags: {
          use_memory: true,
          urgent: true
        }
      };

      const response = await request(app)
        .post('/api/ugo/chat')
        .send(requestWithFlags)
        .expect(200);

      expect(response.body).toHaveProperty('text');
      expect(response.body).toHaveProperty('mood');
      expect(response.body).toHaveProperty('behavior');
    });

    test('should include debug info in development mode', async () => {
      // Temporarily set NODE_ENV to development
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const response = await request(app)
        .post('/api/ugo/chat')
        .send({
          user_id: 'test-user',
          session_id: 'test-session',
          message: 'Test message'
        })
        .expect(200);

      expect(response.body).toHaveProperty('debug');
      expect(response.body.debug).toHaveProperty('analysis');

      // Restore original NODE_ENV
      process.env.NODE_ENV = originalEnv;
    });

    test('should handle rate limiting', async () => {
      // Make many rapid requests to trigger rate limiting
      const requests = Array(35).fill(0).map((_, i) => 
        request(app)
          .post('/api/ugo/chat')
          .send({
            user_id: 'test-user',
            session_id: 'test-session', 
            message: `Message ${i}`
          })
      );

      const responses = await Promise.allSettled(requests);
      
      // Some requests should be rate limited (429)
      const rateLimitedResponses = responses.filter(
        result => result.status === 'fulfilled' && result.value.status === 429
      );

      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    }, 15000); // Timeout increased for rate limit test

    test('should return error response for model service failure', async () => {
      // Mock axios to fail
      const axios = require('axios');
      axios.post.mockRejectedValueOnce(new Error('Model service unavailable'));

      const response = await request(app)
        .post('/api/ugo/chat')
        .send({
          user_id: 'test-user',
          session_id: 'test-session',
          message: 'Test message'
        })
        .expect(200); // Should still return 200 with fallback response

      expect(response.body.text).toBeDefined();
      expect(response.body.mood).toBeDefined();
      expect(response.body.behavior).toBeDefined();
      
      // Reset mock
      axios.post.mockResolvedValue({
        data: { text: "Mock response" }
      });
    });

    test('should handle very long conversations', async () => {
      const longConversation = Array(10).fill(0).map((_, i) => ({
        user_id: 'test-user',
        session_id: 'long-session',
        message: `Message number ${i + 1} in a very long conversation`
      }));

      // Send messages sequentially to build conversation context
      for (const message of longConversation) {
        const response = await request(app)
          .post('/api/ugo/chat')
          .send(message)
          .expect(200);

        expect(response.body.text).toBeDefined();
      }
    }, 20000);
  });

  describe('POST /api/ugo/feedback', () => {
    test('should accept valid feedback', async () => {
      const feedback = {
        user_id: 'test-user',
        session_id: 'test-session',
        rating: 5,
        comment: 'Ugo è fantastico!',
        feedback_type: 'general',
        consent_given: true,
        can_use_for_training: true
      };

      const response = await request(app)
        .post('/api/ugo/feedback')
        .send(feedback)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('feedback_id');
      expect(response.body).toHaveProperty('consent_status', 'granted');
      expect(response.body).toHaveProperty('can_use_for_training', true);
    });

    test('should validate feedback fields', async () => {
      const invalidFeedback = [
        {
          user_id: 'test-user',
          session_id: 'test-session',
          rating: 6, // Invalid rating (> 5)
          consent_given: true
        },
        {
          user_id: 'test-user',
          session_id: 'test-session', 
          rating: 0, // Invalid rating (< 1)
          consent_given: true
        },
        {
          user_id: 'test-user',
          session_id: 'test-session',
          rating: 3,
          feedback_type: 'invalid_type', // Invalid feedback_type
          consent_given: true
        }
      ];

      for (const invalid of invalidFeedback) {
        await request(app)
          .post('/api/ugo/feedback')
          .send(invalid)
          .expect(400);
      }
    });

    test('should require consent_given field', async () => {
      const feedbackWithoutConsent = {
        user_id: 'test-user',
        session_id: 'test-session',
        rating: 4,
        comment: 'Good response'
        // Missing consent_given
      };

      await request(app)
        .post('/api/ugo/feedback')
        .send(feedbackWithoutConsent)
        .expect(400);
    });

    test('should handle different feedback types', async () => {
      const feedbackTypes = ['general', 'accuracy', 'personality', 'helpfulness', 'bug_report'];
      
      for (const type of feedbackTypes) {
        const response = await request(app)
          .post('/api/ugo/feedback')
          .send({
            user_id: 'test-user',
            session_id: 'test-session',
            rating: 4,
            feedback_type: type,
            consent_given: true
          })
          .expect(200);

        expect(response.body).toHaveProperty('message');
      }
    });
  });

  describe('GET /api/ugo/feedback/stats', () => {
    test('should return feedback statistics', async () => {
      // First submit some feedback
      await request(app)
        .post('/api/ugo/feedback')
        .send({
          user_id: 'stats-user',
          session_id: 'stats-session',
          rating: 5,
          consent_given: true
        })
        .expect(200);

      // Then get stats
      const response = await request(app)
        .get('/api/ugo/feedback/stats')
        .expect(200);

      expect(response.body).toHaveProperty('today');
      expect(response.body.today).toHaveProperty('total');
      expect(response.body.today).toHaveProperty('ratings');
      expect(response.body.today).toHaveProperty('avgRating');
      expect(response.body.today).toHaveProperty('feedbackTypes');
    });
  });

  describe('GET /api/ugo/stats', () => {
    test('should return engine statistics', async () => {
      const response = await request(app)
        .get('/api/ugo/stats')
        .expect(200);

      expect(response.body).toHaveProperty('engine_stats');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('timestamp');
      
      expect(response.body.engine_stats).toHaveProperty('sentimentAnalyzer');
      expect(response.body.engine_stats).toHaveProperty('currentMood');
      expect(response.body.engine_stats).toHaveProperty('currentEmotions');
    });
  });

  describe('Error handling', () => {
    test('should return 500 error response in proper format on system failure', async () => {
      // Mock a system failure by making Redis unavailable temporarily
      const originalCache = require('../../src/config/redis').cache;
      
      // Mock cache to throw error
      require('../../src/config/redis').cache = {
        get: jest.fn().mockRejectedValue(new Error('Redis unavailable')),
        setex: jest.fn().mockRejectedValue(new Error('Redis unavailable'))
      };

      const response = await request(app)
        .post('/api/ugo/chat')
        .send({
          user_id: 'error-test-user',
          session_id: 'error-test-session',
          message: 'Test error handling'
        })
        .expect(500);

      // Should still return proper error format according to contract
      expect(response.body).toHaveProperty('text');
      expect(response.body).toHaveProperty('mood');
      expect(response.body).toHaveProperty('behavior');
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.metadata.error).toBe(true);

      // Restore original cache
      require('../../src/config/redis').cache = originalCache;
    });

    test('should handle malformed JSON requests', async () => {
      const response = await request(app)
        .post('/api/ugo/chat')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}') // Malformed JSON
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should handle missing content-type header', async () => {
      const response = await request(app)
        .post('/api/ugo/chat')
        .send({
          user_id: 'test-user',
          session_id: 'test-session', 
          message: 'Test'
        });

      // Should still work or return appropriate error
      expect([200, 400, 415]).toContain(response.status);
    });
  });

  describe('Response format compliance', () => {
    test('should always return response in exact contract format', async () => {
      const response = await request(app)
        .post('/api/ugo/chat')
        .send({
          user_id: 'contract-test-user',
          session_id: 'contract-test-session',
          message: 'Test contract compliance'
        })
        .expect(200);

      // Exact contract validation
      expect(typeof response.body.text).toBe('string');
      expect(['gioia', 'tristezza', 'rabbia', 'paura', 'neutro'])
        .toContain(response.body.mood);
      
      expect(response.body.behavior).toHaveProperty('scodinzolio');
      expect(response.body.behavior).toHaveProperty('posizione');
      
      expect(typeof response.body.behavior.scodinzolio).toBe('string');
      expect(typeof response.body.behavior.posizione).toBe('string');
      
      expect(response.body.metadata).toHaveProperty('model');
      expect(response.body.metadata).toHaveProperty('latency_ms');
      expect(typeof response.body.metadata.model).toBe('string');
      expect(typeof response.body.metadata.latency_ms).toBe('number');
    });

    test('should return text under 100 words', async () => {
      const response = await request(app)
        .post('/api/ugo/chat')
        .send({
          user_id: 'length-test-user',
          session_id: 'length-test-session',
          message: 'Raccontami una storia molto lunga con tanti dettagli'
        })
        .expect(200);

      const wordCount = response.body.text.split(/\s+/).length;
      expect(wordCount).toBeLessThanOrEqual(100);
    });

    test('should include physical behavior in response text', async () => {
      const response = await request(app)
        .post('/api/ugo/chat')
        .send({
          user_id: 'behavior-test-user',
          session_id: 'behavior-test-session',
          message: 'Ciao Ugo!'
        })
        .expect(200);

      const text = response.body.text.toLowerCase();
      const hasBehavior = text.includes('scodinzol') || 
                         text.includes('coda') ||
                         text.includes('*') ||
                         text.includes('seduto') ||
                         text.includes('in piedi');

      expect(hasBehavior).toBe(true);
    });
  });
});
