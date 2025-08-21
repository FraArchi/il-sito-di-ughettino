const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.test') });

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
    disconnect: jest.fn(),
    ping: jest.fn().mockResolvedValue('PONG'),
    quit: jest.fn().mockResolvedValue('OK'),
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(true),
    isOpen: true,
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    scan: jest.fn().mockResolvedValue({ cursor: 0, keys: [] }),
    sendCommand: jest.fn().mockResolvedValue(null),
    multi: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
    sIsMember: jest.fn().mockResolvedValue(false),
    sAdd: jest.fn().mockResolvedValue(1),
    sRem: jest.fn().mockResolvedValue(1),
    ft: {
      search: jest.fn().mockResolvedValue({ documents: [] }),
    },
    _client: {
      isOpen: true,
    },
    hSet: jest.fn().mockResolvedValue(1),
    hGetAll: jest.fn().mockResolvedValue({}),
    zAdd: jest.fn().mockResolvedValue(1),
    zRange: jest.fn().mockResolvedValue([]),
    xAdd: jest.fn().mockResolvedValue('12345-0'),
    lPush: jest.fn().mockResolvedValue(1),
    lRange: jest.fn().mockResolvedValue([]),
    publish: jest.fn().mockResolvedValue(1),
    duplicate: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockResolvedValue(true),
    unsubscribe: jest.fn().mockResolvedValue(true),
    pSubscribe: jest.fn().mockResolvedValue(true),
    pUnsubscribe: jest.fn().mockResolvedValue(true),
    sMembers: jest.fn().mockResolvedValue([]),
    del: jest.fn().mockResolvedValue(1),
    memoryUsage: jest.fn().mockResolvedValue(100),
  }
}));

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => {
  const mockStorage = {
    list: jest.fn().mockResolvedValue({
      data: [{ name: 'uploads' }],
      error: null,
    }),
  };

  const mockSupabase = {
    storage: {
      from: jest.fn(() => mockStorage),
      createBucket: jest.fn().mockResolvedValue({
        data: { name: 'uploads' },
        error: null,
      }),
    },
  };
  return {
    createClient: jest.fn(() => mockSupabase),
  };
});

// Mock Prisma client
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    $connect: jest.fn().mockResolvedValue(true),
    $disconnect: jest.fn().mockResolvedValue(true),
    user: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

// Mock axios for model service calls
jest.mock('axios', () => {
  const mockAxios = {
    post: jest.fn().mockResolvedValue({
      status: 200,
      data: {
        text: "Woof! Ciao! *scodinzola felice* Che bello sentirti! Come stai? *inclina la testa curioso*"
      }
    }),
    get: jest.fn().mockResolvedValue({
      status: 200,
      data: { status: 'healthy', model_loaded: true, memory_usage: { used_mb: 100 } }
    }),
    create: jest.fn(() => mockAxios),
  };
  return mockAxios;
});

// Mock UgoAICompanion to prevent Ollama health checks
jest.mock('../src/services/ugoAICompanion', () => {
  return class MockUgoAICompanion {
    constructor() {
      this.isInitialized = true;
      this.model = 'mock-model';
      this.ollamaUrl = 'http://localhost:11434';
    }
    async init() { return true; }
    async checkOllamaHealth() { return true; }
    async chat(message, userId, sessionId) {
      let mood = 'gioia';
      if (message.includes('triste')) {
        mood = 'tristezza';
      } else if (message.includes('paura')) {
        mood = 'paura';
      }
      return {
        response: `Woof! Risposta mockata per: ${message}`,
        mood,
        personality: {},
        context: {}
      };
    }
    async trainUgoPersonality(conversations, stories) {
      return { status: 'completed', message: 'Training mockato completato' };
    }
  };
});

// Clean up mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});
