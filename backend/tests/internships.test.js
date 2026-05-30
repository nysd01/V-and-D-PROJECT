process.env.JWT_SECRET = 'test-secret-key';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// ── Supabase mock ──────────────────────────────────────────────────────────────
const mockResolve = jest.fn();

jest.mock('../db', () => {
  const chain = {
    select:  () => chain,
    eq:      () => chain,
    single:  (...a) => mockResolve(...a),
    insert:  () => chain,
    update:  () => chain,
    delete:  () => chain,
    order:   () => chain,
    or:      () => chain,
    then:    (cb) => mockResolve().then(cb),
  };
  return { from: () => chain };
});

const internshipsRouter = require('../routes/internships');
const app = express();
app.use(express.json());
app.use('/api/internships', internshipsRouter);

const firmToken = jwt.sign({ id: 'firm1', type: 'firm' }, 'test-secret-key');
const internToken = jwt.sign({ id: 'intern1', type: 'intern' }, 'test-secret-key');

// ── GET / ──────────────────────────────────────────────────────────────────────
describe('GET /api/internships', () => {
  test('returns list of internships', async () => {
    mockResolve.mockResolvedValueOnce({ data: [], error: null });
    const res = await request(app).get('/api/internships');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('returns 500 on DB error', async () => {
    mockResolve.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });
    const res = await request(app).get('/api/internships');
    expect(res.statusCode).toBe(500);
  });
});

// ── GET /mine ──────────────────────────────────────────────────────────────────
describe('GET /api/internships/mine', () => {
  test('returns 401 without token', async () => {
    const res = await request(app).get('/api/internships/mine');
    expect(res.statusCode).toBe(401);
  });

  test('returns 403 for intern user', async () => {
    const res = await request(app)
      .get('/api/internships/mine')
      .set('Authorization', `Bearer ${internToken}`);
    expect(res.statusCode).toBe(403);
  });

  test('returns firm postings for firm user', async () => {
    mockResolve.mockResolvedValueOnce({ data: [], error: null });
    const res = await request(app)
      .get('/api/internships/mine')
      .set('Authorization', `Bearer ${firmToken}`);
    expect(res.statusCode).toBe(200);
  });
});

// ── POST / ────────────────────────────────────────────────────────────────────
describe('POST /api/internships', () => {
  test('returns 401 without token', async () => {
    const res = await request(app).post('/api/internships').send({ title: 'Dev Intern' });
    expect(res.statusCode).toBe(401);
  });

  test('returns 403 for intern user', async () => {
    const res = await request(app)
      .post('/api/internships')
      .set('Authorization', `Bearer ${internToken}`)
      .send({ title: 'Dev', category: 'Tech', description: 'Desc' });
    expect(res.statusCode).toBe(403);
  });

  test('returns 400 when required fields missing', async () => {
    const res = await request(app)
      .post('/api/internships')
      .set('Authorization', `Bearer ${firmToken}`)
      .send({ title: 'Dev' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  test('creates internship for firm', async () => {
    mockResolve.mockResolvedValueOnce({
      data: { id: 'i1', title: 'Dev Intern', category: 'Tech', description: 'Desc' },
      error: null,
    });
    const res = await request(app)
      .post('/api/internships')
      .set('Authorization', `Bearer ${firmToken}`)
      .send({ title: 'Dev Intern', category: 'Tech', description: 'Desc' });
    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe('Dev Intern');
  });
});

// ── PATCH /:id/status ─────────────────────────────────────────────────────────
describe('PATCH /api/internships/:id/status', () => {
  test('returns 400 for invalid status', async () => {
    const res = await request(app)
      .patch('/api/internships/i1/status')
      .set('Authorization', `Bearer ${firmToken}`)
      .send({ status: 'invalid' });
    expect(res.statusCode).toBe(400);
  });

  test('returns 403 for intern user', async () => {
    const res = await request(app)
      .patch('/api/internships/i1/status')
      .set('Authorization', `Bearer ${internToken}`)
      .send({ status: 'closed' });
    expect(res.statusCode).toBe(403);
  });
});
