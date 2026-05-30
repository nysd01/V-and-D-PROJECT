process.env.JWT_SECRET = 'test-secret-key';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

const request = require('supertest');
const express = require('express');

// Mock bcrypt so the native binary is never loaded (Windows vs Linux ELF issue)
jest.mock('bcrypt', () => ({
  hash:    jest.fn().mockResolvedValue('$hashed$'),
  compare: jest.fn().mockResolvedValue(true),
}));

// ── Supabase mock ──────────────────────────────────────────────────────────────
const mockSingle = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();

jest.mock('../db', () => {
  const chain = {
    select: (...a) => { mockSelect(...a); return chain; },
    eq:     (...a) => { mockEq(...a);     return chain; },
    single: (...a) => mockSingle(...a),
    insert: (...a) => { mockInsert(...a); return chain; },
    update: (...a) => { mockUpdate(...a); return chain; },
    order:  ()     => chain,
  };
  return { from: () => chain };
});

const authRouter = require('../routes/auth');
const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

// ── Register ───────────────────────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  test('returns 400 when fields are missing', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  test('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ password: '123456', name: 'Test', type: 'intern' });
    expect(res.statusCode).toBe(400);
  });

  test('returns 400 when type is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@b.com', password: '123456', name: 'Test' });
    expect(res.statusCode).toBe(400);
  });

  test('creates user and returns token on success', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: 'u1', email: 'test@test.com', name: 'Test', type: 'intern', password_hash: 'x' },
      error: null,
    });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@test.com', password: 'password123', name: 'Test', type: 'intern' });
    expect(res.statusCode).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('test@test.com');
  });

  test('returns 400 on duplicate email (23505)', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { code: '23505', message: 'duplicate' } });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@test.com', password: 'password123', name: 'Dup', type: 'intern' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/already registered/i);
  });
});

// ── Login ──────────────────────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  test('returns 400 when email missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ password: '123' });
    expect(res.statusCode).toBe(400);
  });

  test('returns 400 when password missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com' });
    expect(res.statusCode).toBe(400);
  });

  test('returns 401 when user not found', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'no rows' } });
    const res = await request(app).post('/api/auth/login').send({ email: 'x@x.com', password: '123' });
    expect(res.statusCode).toBe(401);
  });
});

// ── Forgot password ────────────────────────────────────────────────────────────
describe('POST /api/auth/forgot-password', () => {
  test('returns 400 when email missing', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({});
    expect(res.statusCode).toBe(400);
  });

  test('returns 404 when email not found', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: null });
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'notfound@test.com' });
    expect(res.statusCode).toBe(404);
  });
});

// ── Reset password ─────────────────────────────────────────────────────────────
describe('POST /api/auth/reset-password', () => {
  test('returns 400 when fields missing', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({ email: 'a@b.com' });
    expect(res.statusCode).toBe(400);
  });

  test('returns 404 when user not found', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: null });
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'x@x.com', code: '123456', newPassword: 'newpass' });
    expect(res.statusCode).toBe(404);
  });

  test('returns 400 when code is wrong', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: 'u1', reset_token: '999999', reset_token_expires: new Date(Date.now() + 60000).toISOString() },
      error: null,
    });
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'a@b.com', code: '000000', newPassword: 'newpass' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/invalid reset code/i);
  });
});
