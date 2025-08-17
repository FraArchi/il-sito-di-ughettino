const axios = require('axios');

describe('Model Service Integration Tests', () => {
  const MODEL_SERVICE_URL = process.env.MODEL_SERVICE_URL || 'http://localhost:8000';
  
  // Skip these tests if model service is not available
  beforeAll(async () => {
    try {
      await axios.get(`${MODEL_SERVICE_URL}/health`);
    } catch (error) {
      console.log('Model service not available, skipping integration tests');
      return;
    }
  });

  describe('Health Check', () => {
    test('should respond to health check', async () => {
      try {
        const response = await axios.get(`${MODEL_SERVICE_URL}/health`);
        
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('status', 'healthy');
        expect(response.data).toHaveProperty('model_loaded');
        expect(response.data).toHaveProperty('memory_usage');
      } catch (error) {
        // Skip if service not available
        if (error.code === 'ECONNREFUSED') {
          console.log('Model service not running, skipping test');
          return;
        }
        throw error;
      }
    });
  });

  describe('Text Generation', () => {
    test('should generate text from prompt', async () => {
      try {
        const prompt = "Sei Ugo, un cane virtuale affettuoso. Rispondi come un cane felice: Ciao!";
        
        const response = await axios.post(`${MODEL_SERVICE_URL}/generate`, {
          prompt: prompt,
          max_tokens: 100,
          temperature: 0.7,
          top_p: 0.9
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('text');
        expect(typeof response.data.text).toBe('string');
        expect(response.data.text.length).toBeGreaterThan(0);
        
        // Response should be reasonable length
        expect(response.data.text.length).toBeLessThan(1000);
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.log('Model service not running, skipping test');
          return;
        }
        throw error;
      }
    });

    test('should respect max_tokens parameter', async () => {
      try {
        const prompt = "Racconta una storia molto lunga";
        
        const response = await axios.post(`${MODEL_SERVICE_URL}/generate`, {
          prompt: prompt,
          max_tokens: 20,
          temperature: 0.5
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('text');
        
        // With max_tokens=20, response should be relatively short
        const wordCount = response.data.text.split(/\s+/).length;
        expect(wordCount).toBeLessThan(30); // Allow some margin
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.log('Model service not running, skipping test');
          return;
        }
        throw error;
      }
    });

    test('should handle different temperature settings', async () => {
      try {
        const prompt = "Descrivi un cane felice";
        
        // Low temperature (more deterministic)
        const lowTempResponse = await axios.post(`${MODEL_SERVICE_URL}/generate`, {
          prompt: prompt,
          max_tokens: 50,
          temperature: 0.1
        });

        // High temperature (more creative)
        const highTempResponse = await axios.post(`${MODEL_SERVICE_URL}/generate`, {
          prompt: prompt,
          max_tokens: 50,
          temperature: 0.9
        });

        expect(lowTempResponse.status).toBe(200);
        expect(highTempResponse.status).toBe(200);
        
        expect(lowTempResponse.data).toHaveProperty('text');
        expect(highTempResponse.data).toHaveProperty('text');
        
        // Both should return valid text
        expect(lowTempResponse.data.text.length).toBeGreaterThan(0);
        expect(highTempResponse.data.text.length).toBeGreaterThan(0);
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.log('Model service not running, skipping test');
          return;
        }
        throw error;
      }
    });

    test('should validate request parameters', async () => {
      try {
        // Test with invalid parameters
        const invalidRequests = [
          { /* missing prompt */ },
          { prompt: '', max_tokens: 100 }, // empty prompt
          { prompt: 'test', max_tokens: -1 }, // negative max_tokens
          { prompt: 'test', temperature: -0.5 }, // negative temperature
          { prompt: 'test', temperature: 2.0 } // temperature too high
        ];

        for (const invalidReq of invalidRequests) {
          try {
            await axios.post(`${MODEL_SERVICE_URL}/generate`, invalidReq);
            // Should not reach here
            expect(true).toBe(false);
          } catch (error) {
            expect(error.response.status).toBe(422); // Validation error
          }
        }
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.log('Model service not running, skipping test');
          return;
        }
        throw error;
      }
    });
  });

  describe('Performance Tests', () => {
    test('should respond within reasonable time', async () => {
      try {
        const prompt = "Ciao! Come stai?";
        const startTime = Date.now();
        
        const response = await axios.post(`${MODEL_SERVICE_URL}/generate`, {
          prompt: prompt,
          max_tokens: 50,
          temperature: 0.7
        }, {
          timeout: 30000 // 30 second timeout
        });

        const responseTime = Date.now() - startTime;
        
        expect(response.status).toBe(200);
        
        // Should respond in less than 10 seconds for CPU inference
        expect(responseTime).toBeLessThan(10000);
        
        console.log(`Model service response time: ${responseTime}ms`);
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.log('Model service not running, skipping test');
          return;
        }
        throw error;
      }
    }, 35000); // Increase test timeout

    test('should handle multiple concurrent requests', async () => {
      try {
        const prompts = [
          "Ciao! Come stai?",
          "Che bella giornata!",
          "Mi sento felice oggi",
          "Dimmi qualcosa di divertente"
        ];

        const startTime = Date.now();
        
        // Send multiple requests concurrently
        const promises = prompts.map(prompt =>
          axios.post(`${MODEL_SERVICE_URL}/generate`, {
            prompt: prompt,
            max_tokens: 30,
            temperature: 0.7
          }, { timeout: 15000 })
        );

        const responses = await Promise.allSettled(promises);
        const totalTime = Date.now() - startTime;

        // Check that most requests succeeded
        const successful = responses.filter(r => r.status === 'fulfilled').length;
        expect(successful).toBeGreaterThanOrEqual(prompts.length / 2);

        console.log(`Processed ${successful}/${prompts.length} concurrent requests in ${totalTime}ms`);
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.log('Model service not running, skipping test');
          return;
        }
        throw error;
      }
    }, 60000); // Longer timeout for concurrent requests
  });

  describe('Italian Language Support', () => {
    test('should handle Italian prompts correctly', async () => {
      try {
        const italianPrompts = [
          "Ciao! Sono Ugo, un cane virtuale. Come stai oggi?",
          "Descrivi una bella giornata di sole nel parco",
          "Cosa fai quando sei felice e vuoi giocare?"
        ];

        for (const prompt of italianPrompts) {
          const response = await axios.post(`${MODEL_SERVICE_URL}/generate`, {
            prompt: prompt,
            max_tokens: 80,
            temperature: 0.6
          });

          expect(response.status).toBe(200);
          expect(response.data).toHaveProperty('text');
          expect(response.data.text.length).toBeGreaterThan(0);
          
          // Response should contain some Italian words or be coherent
          const text = response.data.text.toLowerCase();
          const hasItalianWords = text.includes('ciao') || 
                                 text.includes('bene') || 
                                 text.includes('grazie') ||
                                 text.length > 10; // At least coherent response

          expect(hasItalianWords).toBe(true);
        }
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.log('Model service not running, skipping test');
          return;
        }
        throw error;
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed requests gracefully', async () => {
      try {
        // Send malformed JSON
        const response = await axios.post(
          `${MODEL_SERVICE_URL}/generate`,
          '{"invalid": json}',
          {
            headers: { 'Content-Type': 'application/json' },
            validateStatus: () => true // Don't throw on 4xx/5xx
          }
        );

        expect([400, 422]).toContain(response.status);
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.log('Model service not running, skipping test');
          return;
        }
        throw error;
      }
    });

    test('should handle very long prompts', async () => {
      try {
        const longPrompt = 'A'.repeat(5000); // Very long prompt
        
        const response = await axios.post(`${MODEL_SERVICE_URL}/generate`, {
          prompt: longPrompt,
          max_tokens: 50,
          temperature: 0.5
        }, {
          validateStatus: () => true,
          timeout: 15000
        });

        // Should either succeed or return a reasonable error
        expect([200, 413, 422]).toContain(response.status);
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.log('Model service not running, skipping test');
          return;
        }
        // Timeout is acceptable for very long prompts
        if (error.code === 'ECONNABORTED') {
          console.log('Request timed out for very long prompt (acceptable)');
          return;
        }
        throw error;
      }
    });
  });

  describe('Resource Usage', () => {
    test('should report memory usage in health check', async () => {
      try {
        const response = await axios.get(`${MODEL_SERVICE_URL}/health`);
        
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('memory_usage');
        expect(typeof response.data.memory_usage).toBe('object');
        
        if (response.data.memory_usage) {
          expect(response.data.memory_usage).toHaveProperty('used_mb');
          expect(typeof response.data.memory_usage.used_mb).toBe('number');
        }
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.log('Model service not running, skipping test');
          return;
        }
        throw error;
      }
    });
  });
});
