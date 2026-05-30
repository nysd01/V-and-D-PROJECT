const express = require('express');
const supabase = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// GET /api/applications — intern sees their own applications
router.get('/', requireAuth, async (req, res) => {
  if (req.user.type !== 'intern') return res.status(403).json({ error: 'Interns only' });
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('*, internships(id, title, location, work_type, is_paid, duration, users!firm_id(name, company_name))')
      .eq('intern_id', req.user.id)
      .order('applied_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    const rows = (data || []).map((a) => ({
      id: a.id,
      status: a.status,
      applied_at: a.applied_at,
      internship_id: a.internships?.id,
      title: a.internships?.title ?? '',
      location: a.internships?.location ?? '',
      work_type: a.internships?.work_type ?? '',
      is_paid: a.internships?.is_paid,
      duration: a.internships?.duration ?? '',
      firm_name: a.internships?.users?.name ?? '',
      company_name: a.internships?.users?.company_name ?? '',
    }));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/applications/posting/:internship_id — firm sees applicants for one posting
router.get('/posting/:internship_id', requireAuth, async (req, res) => {
  if (req.user.type !== 'firm') return res.status(403).json({ error: 'Firms only' });
  try {
    // Verify posting belongs to this firm
    const { data: posting } = await supabase
      .from('internships')
      .select('id')
      .eq('id', req.params.internship_id)
      .eq('firm_id', req.user.id)
      .single();

    if (!posting) return res.status(403).json({ error: 'Unauthorized' });

    const { data, error } = await supabase
      .from('applications')
      .select('*, users!intern_id(id, name, email, university, profile_picture)')
      .eq('internship_id', req.params.internship_id)
      .order('applied_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    const rows = (data || []).map((a) => ({
      id: a.id,
      status: a.status,
      cover_letter: a.cover_letter,
      document_url: a.document_url ?? null,
      interview_scheduled_at: a.interview_scheduled_at ?? null,
      applied_at: a.applied_at,
      intern_id: a.users?.id,
      name: a.users?.name ?? '',
      email: a.users?.email ?? '',
      university: a.users?.university ?? '',
      profile_picture: a.users?.profile_picture ?? null,
    }));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/applications — intern submits an application
router.post('/', requireAuth, async (req, res) => {
  if (req.user.type !== 'intern') return res.status(403).json({ error: 'Interns only' });
  const { internship_id, cover_letter, document_url } = req.body;
  if (!internship_id) return res.status(400).json({ error: 'internship_id is required' });
  try {
    const { data, error } = await supabase
      .from('applications')
      .insert({ 
        intern_id: req.user.id, 
        internship_id, 
        cover_letter: cover_letter || '',
        document_url: document_url || null
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return res.status(400).json({ error: 'Already applied to this internship' });
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/applications/:id/status — firm updates application status + optional interview time
router.patch('/:id/status', requireAuth, async (req, res) => {
  if (req.user.type !== 'firm') return res.status(403).json({ error: 'Firms only' });
  const { status, interview_scheduled_at } = req.body;
  const valid = ['Pending', 'Interviewing', 'Accepted', 'Rejected'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  try {
    const { data: app } = await supabase
      .from('applications')
      .select('id, internships!internship_id(firm_id)')
      .eq('id', req.params.id)
      .single();

    if (!app || app.internships?.firm_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updates = { status };
    if (interview_scheduled_at !== undefined) updates.interview_scheduled_at = interview_scheduled_at;

    const { data, error } = await supabase
      .from('applications')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/applications/:id — intern withdraws
router.delete('/:id', requireAuth, async (req, res) => {
  if (req.user.type !== 'intern') return res.status(403).json({ error: 'Interns only' });
  try {
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', req.params.id)
      .eq('intern_id', req.user.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
