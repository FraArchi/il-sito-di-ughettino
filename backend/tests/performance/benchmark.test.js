const autocannon = require('autocannon');
const { startServer } = require('../../src/server');

describe('Performance Benchmarks', () => {
  let server;
  const SERVER_URL = 'http://localhost:3000';

  beforeAll(async () => {
    try {
      console.log('Starting server for performance tests...');
      server = await startServer();
      console.log('Server started for performance tests.');
    } catch (error) {
      console.error('Failed to start server for performance tests:', error);
      throw new Error(`Server failed to start for performance tests: ${error.message}`);
    }
  }, 35000);

  afterAll(async () => {
    if (server) {
      await new Promise(resolve => server.close(resolve));
      console.log('Server stopped for performance tests.');
    }
  });

  describe('Ugo Chat API Performance', () => {
    test('should handle load test with acceptable performance', async () => {
      const result = await autocannon({
        url: `${SERVER_URL}/api/ugo/chat`,
        connections: 10,
        pipelining: 1,
        duration: 30, // 30 seconds
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: 'perf-test-user',
          session_id: 'perf-test-session',
          message: 'Ciao Ugo! Come stai?'
        })
      });

      console.log('\n=== Ugo Chat API Performance Results ===');
      console.log(`Average Latency: ${result.latency.average}ms`);
      console.log(`95th Percentile: ${result.latency.p95}ms`);
      console.log(`99th Percentile: ${result.latency.p99}ms`);
      console.log(`Requests/sec: ${result.requests.average}`);
      console.log(`Total Requests: ${result.requests.total}`);
      console.log(`Errors: ${result.errors}`);
      console.log(`Timeouts: ${result.timeouts}`);

      // Performance expectations for CPU-only setup
      expect(result.latency.average).toBeLessThan(5000); // 5 seconds average
      expect(result.latency.p95).toBeLessThan(10000); // 10 seconds 95th percentile
      expect(result.requests.average).toBeGreaterThan(0.1); // At least 0.1 req/sec
      expect(result.errors).toBe(0); // No errors
      expect(result.timeouts).toBe(0); // No timeouts

      // Log results for analysis
      console.log('Performance test completed successfully');
    }, 60000); // 60 second timeout

    test('should maintain performance under sustained load', async () => {
      const result = await autocannon({
        url: `${SERVER_URL}/api/ugo/chat`,
        connections: 5,
        pipelining: 1,
        duration: 60, // 1 minute sustained load
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: 'sustained-test-user',
          session_id: 'sustained-test-session',
          message: 'Test messaggio di carico sostenuto'
        })
      });

      console.log('\n=== Sustained Load Test Results ===');
      console.log(`Average Latency: ${result.latency.average}ms`);
      console.log(`95th Percentile: ${result.latency.p95}ms`);
      console.log(`Requests/sec: ${result.requests.average}`);
      console.log(`Total Requests: ${result.requests.total}`);
      console.log(`Errors: ${result.errors}`);

      // Should maintain reasonable performance over time
      expect(result.latency.average).toBeLessThan(8000); // Slightly higher allowance for sustained load
      expect(result.requests.average).toBeGreaterThan(0.05);
      expect(result.errors).toBeLessThan(result.requests.total * 0.05); // Less than 5% error rate
    }, 90000);

    test('should handle burst load gracefully', async () => {
      const result = await autocannon({
        url: `${SERVER_URL}/api/ugo/chat`,
        connections: 20, // Higher connection count for burst
        pipelining: 1,
        duration: 15, // Short burst
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: 'burst-test-user',
          session_id: 'burst-test-session',
          message: 'Messaggio di test per carico esplosivo'
        })
      });

      console.log('\n=== Burst Load Test Results ===');
      console.log(`Average Latency: ${result.latency.average}ms`);
      console.log(`95th Percentile: ${result.latency.p95}ms`);
      console.log(`Max Latency: ${result.latency.max}ms`);
      console.log(`Requests/sec: ${result.requests.average}`);
      console.log(`Errors: ${result.errors}`);

      // Should handle burst without crashing
      expect(result.requests.total).toBeGreaterThan(0);
      // Allow higher error rate for burst testing
      expect(result.errors).toBeLessThan(result.requests.total * 0.3);
    }, 30000);
  });

  describe('API Endpoint Comparison', () => {
    test('should compare performance of different endpoints', async () => {
      // Test feedback endpoint
      const feedbackResult = await autocannon({
        url: `${SERVER_URL}/api/ugo/feedback`,
        connections: 10,
        duration: 10,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: 'perf-feedback-user',
          session_id: 'perf-feedback-session',
          rating: 5,
          consent_given: true
        })
      });

      // Test stats endpoint
      const statsResult = await autocannon({
        url: `${SERVER_URL}/api/ugo/stats`,
        connections: 10,
        duration: 10,
        method: 'GET'
      });

      console.log('\n=== Endpoint Performance Comparison ===');
      console.log(`Feedback API - Avg Latency: ${feedbackResult.latency.average}ms, Req/sec: ${feedbackResult.requests.average}`);
      console.log(`Stats API - Avg Latency: ${statsResult.latency.average}ms, Req/sec: ${statsResult.requests.average}`);

      // Stats endpoint should be much faster
      expect(statsResult.latency.average).toBeLessThan(feedbackResult.latency.average);
      expect(statsResult.requests.average).toBeGreaterThan(feedbackResult.requests.average);
    }, 45000);
  });

  describe('Memory and Resource Usage', () => {
    test('should not leak memory under load', async () => {
      // Get initial memory usage
      const initialMemory = process.memoryUsage();
      
      // Run load test
      await autocannon({
        url: `${SERVER_URL}/api/ugo/chat`,
        connections: 5,
        duration: 30,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: 'memory-test-user',
          session_id: 'memory-test-session',
          message: 'Test per monitoraggio memoria'
        })
      });

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      console.log('\n=== Memory Usage Analysis ===');
      console.log(`Initial Memory: ${Math.round(initialMemory.heapUsed / 1024 / 1024)}MB`);
      console.log(`Final Memory: ${Math.round(finalMemory.heapUsed / 1024 / 1024)}MB`);
      console.log(`Memory Increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);

      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    }, 60000);
  });

  describe('CPU Optimization Validation', () => {
    test('should demonstrate CPU-only optimization benefits', async () => {
      // Test with different message complexities
      const simpleMessage = 'Ciao';
      const complexMessage = 'Dimmi una storia molto dettagliata e lunga su un cane che vive avventure incredibili nel parco giochi insieme ai suoi amici animali';

      const simpleResult = await autocannon({
        url: `${SERVER_URL}/api/ugo/chat`,
        connections: 5,
        duration: 15,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: 'simple-test-user',
          session_id: 'simple-test-session',
          message: simpleMessage
        })
      });

      const complexResult = await autocannon({
        url: `${SERVER_URL}/api/ugo/chat`,
        connections: 5,
        duration: 15,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: 'complex-test-user',
          session_id: 'complex-test-session',
          message: complexMessage
        })
      });

      console.log('\n=== CPU Optimization Analysis ===');
      console.log(`Simple Message - Avg Latency: ${simpleResult.latency.average}ms`);
      console.log(`Complex Message - Avg Latency: ${complexResult.latency.average}ms`);
      console.log(`Performance Ratio: ${(complexResult.latency.average / simpleResult.latency.average).toFixed(2)}x`);

      // Complex messages should not be dramatically slower
      const performanceRatio = complexResult.latency.average / simpleResult.latency.average;
      expect(performanceRatio).toBeLessThan(3); // Less than 3x slower
    }, 60000);
  });

  describe('Real-world Usage Simulation', () => {
    test('should simulate realistic conversation patterns', async () => {
      const conversationMessages = [
        'Ciao Ugo!',
        'Come stai oggi?',
        'Voglio giocare con te',
        'Sei un bravo cane',
        'Mi sento felice',
        'Grazie per essere qui',
        'A domani!'
      ];

      let totalLatency = 0;
      let requestCount = 0;

      for (let i = 0; i < conversationMessages.length; i++) {
        const startTime = Date.now();
        
        const result = await autocannon({
          url: `${SERVER_URL}/api/ugo/chat`,
          connections: 1, // Single user conversation
          amount: 1, // Single request
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: 'conversation-user',
            session_id: 'realistic-conversation',
            message: conversationMessages[i]
          })
        });

        const requestTime = Date.now() - startTime;
        totalLatency += requestTime;
        requestCount++;

        // Wait between messages (realistic user behavior)
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const avgConversationLatency = totalLatency / requestCount;
      
      console.log('\n=== Realistic Conversation Simulation ===');
      console.log(`Average Response Time: ${avgConversationLatency}ms`);
      console.log(`Messages Processed: ${requestCount}`);

      // Should maintain good performance for realistic usage
      expect(avgConversationLatency).toBeLessThan(5000); // 5 seconds per message
    }, 120000);
  });
});
