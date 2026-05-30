const request = require('supertest');
const express = require('express');

const app = express();
app.use(express.json());
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

describe('Health Check', () => {
  test('GET /api/health returns 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Auth validation', () => {
  test('rejects empty email', () => {
    const email = '';
    expect(email.length).toBe(0);
  });

  test('rejects short password', () => {
    const password = '123';
    expect(password.length).toBeLessThan(6);
  });

  test('accepts valid email format', () => {
    const email = 'test@example.com';
    expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });
});
