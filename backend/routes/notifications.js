const express = require('express');
const supabase = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

function formatRelativeTime(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) return '1 week ago';
  return `${diffWeeks} weeks ago`;
}

function statusMeta(status) {
  switch (status) {
    case 'Accepted':
      return { type: 'success', icon: 'checkmark-circle-outline', title: 'Application accepted' };
    case 'Interviewing':
      return { type: 'info', icon: 'calendar-outline', title: 'Interview update' };
    case 'Rejected':
      return { type: 'alert', icon: 'close-circle-outline', title: 'Application update' };
    default:
      return { type: 'warning', icon: 'time-outline', title: 'Application received' };
  }
}

router.get('/', requireAuth, async (req, res) => {
  try {
    if (req.user.type === 'intern') {
      const { data, error } = await supabase
        .from('applications')
        .select('id, status, applied_at, internships(id, title, users!firm_id(name, company_name))')
        .eq('intern_id', req.user.id)
        .order('applied_at', { ascending: false });

      if (error) return res.status(500).json({ error: error.message });

      const rows = (data || []).map((row) => {
        const meta = statusMeta(row.status);
        const company = row.internships?.users?.company_name || row.internships?.users?.name || 'the company';
        const title = row.internships?.title || 'an internship';
        return {
          id: row.id,
          title: meta.title,
          message: row.status === 'Accepted'
            ? `Your application for ${title} at ${company} was accepted.`
            : row.status === 'Interviewing'
              ? `Your application for ${title} at ${company} is moving to interviews.`
              : row.status === 'Rejected'
                ? `Your application for ${title} at ${company} was not selected.`
                : `Your application for ${title} at ${company} is under review.`,
          type: meta.type,
          timestamp: formatRelativeTime(row.applied_at),
          read: row.status !== 'Pending',
          icon: meta.icon,
        };
      });

      return res.json(rows);
    }

    if (req.user.type === 'firm') {
      const { data: postings, error: postingsError } = await supabase
        .from('internships')
        .select('id, title, posted_on, status')
        .eq('firm_id', req.user.id)
        .order('posted_on', { ascending: false });

      if (postingsError) return res.status(500).json({ error: postingsError.message });

      const postingMap = new Map((postings || []).map((posting) => [posting.id, posting]));
      const postingIds = [...postingMap.keys()];

      const { data: applications, error: applicationsError } = postingIds.length
        ? await supabase
            .from('applications')
            .select('id, status, applied_at, internship_id, users!intern_id(name, university, profile_picture)')
            .in('internship_id', postingIds)
            .order('applied_at', { ascending: false })
        : { data: [], error: null };

      if (applicationsError) return res.status(500).json({ error: applicationsError.message });

      const rows = (applications || []).map((row) => {
        const posting = postingMap.get(row.internship_id);
        const candidate = row.users?.name || 'An applicant';
        const title = posting?.title || 'your internship';
        return {
          id: row.id,
          title: row.status === 'Pending' ? 'New application received' : statusMeta(row.status).title,
          message: row.status === 'Pending'
            ? `${candidate} applied for ${title}.`
            : `${candidate}'s application for ${title} is now ${row.status.toLowerCase()}.`,
          type: row.status === 'Accepted' ? 'success' : row.status === 'Rejected' ? 'alert' : row.status === 'Interviewing' ? 'info' : 'warning',
          timestamp: formatRelativeTime(row.applied_at),
          read: row.status !== 'Pending',
          icon: row.status === 'Accepted' ? 'checkmark-circle-outline' : row.status === 'Rejected' ? 'close-circle-outline' : row.status === 'Interviewing' ? 'calendar-outline' : 'person-add-outline',
        };
      });

      const recentPostings = (postings || []).slice(0, 3).map((posting) => ({
        id: `posting-${posting.id}`,
        title: 'New internship published',
        message: `${posting.title} is now live on your profile.`,
        type: 'info',
        timestamp: formatRelativeTime(posting.posted_on),
        read: posting.status !== 'active',
        icon: 'briefcase-outline',
      }));

      return res.json([...recentPostings, ...rows]);
    }

    return res.status(403).json({ error: 'Unsupported account type' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
// POST /api/notifications — create a success notification for application submission
router.post('/', requireAuth, async (req, res) => {
  if (req.user.type !== 'intern') return res.status(403).json({ error: 'Interns only' });
  const { application_id, company_name, title } = req.body;
  if (!application_id || !company_name) {
    return res.status(400).json({ error: 'application_id and company_name are required' });
  }
  try {
    // Just return a formatted notification - notifications are derived from applications table
    const timestamp = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    res.status(201).json({
      id: application_id,
      title: 'Application Sent Successfully',
      message: `Your application has been sent to ${company_name}${title ? ` for ${title}` : ''} on ${timestamp}.`,
      type: 'success',
      timestamp: 'Just now',
      read: false,
      icon: 'send-outline',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;