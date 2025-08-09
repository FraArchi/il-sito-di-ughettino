const request = require('supertest');
const app = require('../src/app');

// Mock supabase client used by routes
jest.mock('../src/config/supabase', () => ({
  from: () => ({
    insert: () => ({ select: () => Promise.resolve({ data: [{}], error: null }) })
  }),
  storage: {
    from: () => ({
      upload: async () => ({ error: null }),
      getPublicUrl: () => ({ data: { publicUrl: 'https://example.com/file.png' } })
    })
  }
}));

describe('Public routes', () => {
  it('POST /api/public/newsletter should return 201', async () => {
    const res = await request(app)
      .post('/api/public/newsletter')
      .send({ email: 'test@example.com' })
      .set('Content-Type', 'application/json');
    expect([200,201]).toContain(res.statusCode);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/public/contact should return 201', async () => {
    const res = await request(app)
      .post('/api/public/contact')
      .send({ name: 'Test User', email: 't@example.com', message: 'hello world' })
      .set('Content-Type', 'application/json');
    expect([200,201]).toContain(res.statusCode);
    expect(res.body.success).toBe(true);
  });
});
