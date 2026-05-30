const express = require('express');
const crypto = require('crypto');
const supabase = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// Increase JSON body limit for base64 files (10 MB base64 ≈ 7.5 MB file)
const jsonParser = express.json({ limit: '15mb' });

// POST /api/upload/document
router.post('/document', requireAuth, jsonParser, async (req, res) => {
  const { base64, mimeType, fileName } = req.body;
  if (!base64 || !mimeType) return res.status(400).json({ error: 'base64 and mimeType are required' });

  try {
    const buffer = Buffer.from(base64, 'base64');
    const ext = (fileName?.split('.').pop()) || mimeType.split('/')[1] || 'pdf';
    const filePath = `documents/${req.user.id}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from('internconnect')
      .upload(filePath, buffer, { contentType: mimeType, upsert: false });

    if (error) return res.status(500).json({ error: error.message });

    const { data } = supabase.storage.from('internconnect').getPublicUrl(filePath);
    res.json({ url: data.publicUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/upload/avatar
router.post('/avatar', requireAuth, jsonParser, async (req, res) => {
  const { base64, mimeType } = req.body;
  if (!base64 || !mimeType) return res.status(400).json({ error: 'base64 and mimeType are required' });

  try {
    const buffer = Buffer.from(base64, 'base64');
    const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
    const filePath = `avatars/${req.user.id}.${ext}`;

    const { error } = await supabase.storage
      .from('internconnect')
      .upload(filePath, buffer, { contentType: mimeType, upsert: true });

    if (error) return res.status(500).json({ error: error.message });

    const { data } = supabase.storage.from('internconnect').getPublicUrl(filePath);

    await supabase.from('users').update({ profile_picture: data.publicUrl }).eq('id', req.user.id);

    res.json({ url: data.publicUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
