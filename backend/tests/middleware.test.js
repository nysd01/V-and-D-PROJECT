process.env.JWT_SECRET = 'test-secret-key';

const jwt = require('jsonwebtoken');
const requireAuth = require('../middleware/auth');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('requireAuth middleware', () => {
  test('rejects request with no Authorization header', () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();
    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects Bearer with empty token', () => {
    const req = { headers: { authorization: 'Bearer ' } };
    const res = mockRes();
    const next = jest.fn();
    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects invalid token', () => {
    const req = { headers: { authorization: 'Bearer notarealtoken' } };
    const res = mockRes();
    const next = jest.fn();
    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects expired token', () => {
    const token = jwt.sign({ id: 'u1', type: 'intern' }, 'test-secret-key', { expiresIn: -1 });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();
    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('accepts valid intern token and attaches user', () => {
    const token = jwt.sign({ id: 'u1', type: 'intern' }, 'test-secret-key');
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();
    requireAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user.id).toBe('u1');
    expect(req.user.type).toBe('intern');
  });

  test('accepts valid firm token and attaches user', () => {
    const token = jwt.sign({ id: 'f1', type: 'firm' }, 'test-secret-key');
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();
    requireAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user.type).toBe('firm');
  });
});
