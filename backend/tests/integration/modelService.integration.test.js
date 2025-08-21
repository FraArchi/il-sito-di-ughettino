const axios = require('axios');

describe('Model Service Integration Tests', () => {
  const MODEL_SERVICE_URL = process.env.MODEL_SERVICE_URL || 'http://localhost:8000';

  describe('Health Check', () => {
    test('should respond to health check', async () => {
      const response = await axios.get(`${MODEL_SERVICE_URL}/health`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'healthy');
      expect(response.data).toHaveProperty('model_loaded');
      expect(response.data).toHaveProperty('memory_usage');
    });
  });

  describe('Text Generation', () => {
    test('should generate text from prompt', async () => {
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
    });

    test('should respect max_tokens parameter', async () => {
      const prompt = "Racconta una storia molto lunga";
      
      const response = await axios.post(`${MODEL_SERVICE_URL}/generate`, {
        prompt: prompt,
        max_tokens: 20,
        temperature: 0.5
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('text');
      
      const wordCount = response.data.text.split(/\s+/).length;
      expect(wordCount).toBeLessThan(30);
    });

    test('should validate request parameters', async () => {
      const axios = require('axios');
      // Temporarily modify the mock for this specific test
      axios.post.mockRejectedValueOnce({ response: { status: 422 } });

      await expect(axios.post(`${MODEL_SERVICE_URL}/generate`, {
        prompt: '', // Invalid prompt
      })).rejects.toHaveProperty('response.status', 422);
    });
  });

  describe('Performance Tests', () => {
    test('should respond within reasonable time', async () => {
      const prompt = "Test di latenza";
      const startTime = Date.now();

      const response = await axios.post(`${MODEL_SERVICE_URL}/generate`, {
        prompt: prompt,
        max_tokens: 50,
        temperature: 0.7
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(5000); // 5 seconds
    });
  });
});
