const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

function makeToken(user) {
  return jwt.sign({ id: user.id, type: user.type }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function safeUser(row) {
  const { password_hash, ...rest } = row;
  return { ...rest, companyName: rest.company_name };
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, name, type, university, companyName, industry, address } = req.body;
  if (!email || !password || !name || !type) {
    return res.status(400).json({ error: 'email, password, name and type are required' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase().trim(),
        password_hash: hash,
        name,
        type,
        university: university || null,
        company_name: companyName || null,
        industry: industry || null,
        address: address || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return res.status(400).json({ error: 'Email already registered' });
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ token: makeToken(data), user: safeUser(data) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/google
router.post('/google', async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) return res.status(400).json({ error: 'accessToken required' });

  try {
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!googleRes.ok) return res.status(401).json({ error: 'Invalid Google token' });

    const { email, name, picture } = await googleRes.json();
    if (!email) return res.status(401).json({ error: 'Could not retrieve email from Google' });

    const { data: existing } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existing) {
      return res.json({ token: makeToken(existing), user: safeUser(existing) });
    }

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase().trim(),
        password_hash: '',
        name: name || email.split('@')[0],
        type: 'intern',
        profile_picture: picture || null,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ token: makeToken(newUser), user: safeUser(newUser) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !user) return res.status(401).json({ error: 'No account found for this email' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Incorrect password' });

    res.json({ token: makeToken(user), user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me — return current user from token
router.get('/me', requireAuth, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !user) return res.status(404).json({ error: 'User not found' });
    res.json(safeUser(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/auth/me — update current user's profile
router.patch('/me', requireAuth, async (req, res) => {
  const { name, university, companyName, industry, address, profile_picture } = req.body;
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (university !== undefined) updates.university = university;
  if (companyName !== undefined) updates.company_name = companyName;
  if (industry !== undefined) updates.industry = industry;
  if (address !== undefined) updates.address = address;
  if (profile_picture !== undefined) updates.profile_picture = profile_picture;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(safeUser(data));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
