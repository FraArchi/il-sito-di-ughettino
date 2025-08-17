// Jest setup for Ugo AI Backend tests
process.env.NODE_ENV = 'test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
process.env.MODEL_SERVICE_URL = 'http://localhost:8000';
process.env.JWT_SECRET = 'test-secret';

// Mock Redis globally for tests
const mockCache = {
  get: jest.fn().mockResolvedValue(null),
  setex: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  flushall: jest.fn().mockResolvedValue('OK'),
  exists: jest.fn().mockResolvedValue(0),
  expire: jest.fn().mockResolvedValue(1)
};

// Mock the redis config module
jest.mock('../src/config/redis', () => ({
  cache: mockCache,
  redisClient: {
    isReady: true,
    disconnect: jest.fn()
  }
}));

// Clean up mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});
