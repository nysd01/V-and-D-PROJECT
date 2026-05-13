const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../db');

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

module.exports = router;
