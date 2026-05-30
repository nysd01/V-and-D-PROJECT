const express = require('express');
const supabase = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// GET /api/saved — intern gets their saved internships
router.get('/', requireAuth, async (req, res) => {
  if (req.user.type !== 'intern') return res.status(403).json({ error: 'Interns only' });
  try {
    const { data, error } = await supabase
      .from('saved_internships')
      .select('internship_id')
      .eq('intern_id', req.user.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json((data || []).map((r) => r.internship_id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/saved/:internship_id — save an internship
router.post('/:internship_id', requireAuth, async (req, res) => {
  if (req.user.type !== 'intern') return res.status(403).json({ error: 'Interns only' });
  try {
    const { error } = await supabase
      .from('saved_internships')
      .insert({ intern_id: req.user.id, internship_id: req.params.internship_id });

    if (error && error.code !== '23505') return res.status(500).json({ error: error.message });
    res.json({ saved: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/saved/:internship_id — unsave
router.delete('/:internship_id', requireAuth, async (req, res) => {
  if (req.user.type !== 'intern') return res.status(403).json({ error: 'Interns only' });
  try {
    const { error } = await supabase
      .from('saved_internships')
      .delete()
      .eq('intern_id', req.user.id)
      .eq('internship_id', req.params.internship_id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ saved: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
