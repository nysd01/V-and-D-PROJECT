require('dotenv').config();
const supabase = require('./db');

async function migrate() {
  // Run raw SQL via Supabase's rpc (postgres function) isn't available without
  // an existing function, so we use the REST schema endpoint instead.
  // Tables are created directly via Supabase SQL editor or the queries below
  // executed through the pg connection. Since we're on HTTPS-only mode,
  // print the SQL for the user to run once in Supabase SQL Editor.

  const sql = `
-- Run this once in Supabase > SQL Editor

CREATE TABLE IF NOT EXISTS users (
  id            BIGSERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('intern', 'firm')),
  profile_picture TEXT,
  university    TEXT,
  company_name  TEXT,
  industry      TEXT,
  address       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS internships (
  id           BIGSERIAL PRIMARY KEY,
  firm_id      BIGINT REFERENCES users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  category     TEXT NOT NULL,
  description  TEXT NOT NULL,
  requirements TEXT,
  location     TEXT DEFAULT 'Remote',
  duration     TEXT,
  work_type    TEXT DEFAULT 'Remote' CHECK (work_type IN ('Remote','Hybrid','In-person')),
  is_paid      BOOLEAN DEFAULT true,
  status       TEXT DEFAULT 'active' CHECK (status IN ('active','closed')),
  posted_on    TIMESTAMPTZ DEFAULT NOW(),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS applications (
  id             BIGSERIAL PRIMARY KEY,
  intern_id      BIGINT REFERENCES users(id) ON DELETE CASCADE,
  internship_id  BIGINT REFERENCES internships(id) ON DELETE CASCADE,
  cover_letter   TEXT,
  status         TEXT DEFAULT 'Pending'
                   CHECK (status IN ('Pending','Interviewing','Accepted','Rejected')),
  applied_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(intern_id, internship_id)
);
  `;

  console.log('\n=== PASTE THIS INTO SUPABASE > SQL EDITOR > RUN ===\n');
  console.log(sql);
  console.log('====================================================\n');

  // Verify connection works
  const { error } = await supabase.from('users').select('id').limit(1);
  if (error && error.code !== 'PGRST116') {
    console.error('Connection check failed:', error.message);
    console.error('Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env');
    process.exit(1);
  }
  console.log('Connection to Supabase OK.');
}

migrate().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
