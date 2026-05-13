const express = require('express');
const supabase = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// GET /api/internships?search=X&filter=Paid
router.get('/', async (req, res) => {
  const { search = '', filter = 'All' } = req.query;
  try {
    let query = supabase
      .from('internships')
      .select('*, users!firm_id(name, company_name, profile_picture)')
      .eq('status', 'active')
      .order('posted_on', { ascending: false });

    if (search) {
      query = query.or(`title.ilike.%${search}%,category.ilike.%${search}%`);
    }
    if (filter === 'Paid')       query = query.eq('is_paid', true);
    if (filter === 'Remote')     query = query.eq('work_type', 'Remote');
    if (filter === 'Hybrid')     query = query.eq('work_type', 'Hybrid');
    if (filter === 'In-person')  query = query.eq('work_type', 'In-person');

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    // Flatten joined user fields
    const rows = (data || []).map((r) => ({
      ...r,
      firm_name: r.users?.name ?? '',
      company_name: r.users?.company_name ?? '',
      firm_logo_url: r.users?.profile_picture ?? null,
      users: undefined,
    }));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/internships/mine — firm's own postings with applicant counts
router.get('/mine', requireAuth, async (req, res) => {
  if (req.user.type !== 'firm') return res.status(403).json({ error: 'Firms only' });
  try {
    const { data, error } = await supabase
      .from('internships')
      .select('*, applications(id)')
      .eq('firm_id', req.user.id)
      .order('posted_on', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    const rows = (data || []).map((r) => ({
      ...r,
      applicant_count: r.applications?.length ?? 0,
      applications: undefined,
    }));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/internships/:id
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('internships')
      .select('*, users!firm_id(name, company_name, industry, address, profile_picture)')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Not found' });

    res.json({
      ...data,
      firm_name: data.users?.name ?? '',
      company_name: data.users?.company_name ?? '',
      firm_logo_url: data.users?.profile_picture ?? null,
      industry: data.users?.industry ?? '',
      address: data.users?.address ?? '',
      users: undefined,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/internships
router.post('/', requireAuth, async (req, res) => {
  if (req.user.type !== 'firm') return res.status(403).json({ error: 'Firms only' });
  const { title, category, description, requirements, location, duration, work_type, is_paid } = req.body;
  if (!title || !category || !description) {
    return res.status(400).json({ error: 'title, category and description are required' });
  }
  try {
    const { data, error } = await supabase
      .from('internships')
      .insert({
        firm_id: req.user.id,
        title,
        category,
        description,
        requirements: requirements || null,
        location: location || 'Remote',
        duration: duration || '',
        work_type: work_type || 'Remote',
        is_paid: is_paid !== false,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/internships/:id/status
router.patch('/:id/status', requireAuth, async (req, res) => {
  if (req.user.type !== 'firm') return res.status(403).json({ error: 'Firms only' });
  const { status } = req.body;
  if (!['active', 'closed'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  try {
    const { data, error } = await supabase
      .from('internships')
      .update({ status })
      .eq('id', req.params.id)
      .eq('firm_id', req.user.id)
      .select()
      .single();

    if (error || !data) return res.status(404).json({ error: 'Not found or unauthorized' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/internships/:id
router.delete('/:id', requireAuth, async (req, res) => {
  if (req.user.type !== 'firm') return res.status(403).json({ error: 'Firms only' });
  try {
    const { data: posting, error: postingError } = await supabase
      .from('internships')
      .select('id')
      .eq('id', req.params.id)
      .eq('firm_id', req.user.id)
      .single();

    if (postingError || !posting) return res.status(404).json({ error: 'Not found or unauthorized' });

    const { error: applicationsError } = await supabase
      .from('applications')
      .delete()
      .eq('internship_id', req.params.id);

    if (applicationsError) return res.status(500).json({ error: applicationsError.message });

    const { error } = await supabase
      .from('internships')
      .delete()
      .eq('id', req.params.id)
      .eq('firm_id', req.user.id);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
