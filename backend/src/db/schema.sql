-- Manifestation App schema (PostgreSQL)

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(20),
  xp INTEGER DEFAULT 0,
  active_dream_id INTEGER, -- FK added below, after dreams exists (avoids circular dependency)
  created_at TIMESTAMP DEFAULT NOW()
);

-- A "Dream" is the core entity everything else hangs off. One user can have
-- several dreams; only one is "active" at a time (users.active_dream_id).
CREATE TABLE IF NOT EXISTS dreams (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50) DEFAULT 'custom', -- dream_job | money | relationship | health | dream_house | dream_car | education | business | travel | custom
  why_reason TEXT,
  target_date DATE,
  life_change TEXT, -- "how will your life change after achieving it"
  status VARCHAR(20) DEFAULT 'active', -- 'active' | 'achieved' | 'archived'
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS active_dream_id INTEGER REFERENCES dreams(id);

CREATE TABLE IF NOT EXISTS user_badges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  badge_key VARCHAR(50) NOT NULL,
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, badge_key)
);

CREATE TABLE IF NOT EXISTS otp_codes (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  consumed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vision_board_items (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  dream_id INTEGER REFERENCES dreams(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  public_id TEXT, -- Cloudinary public_id, used to generate short-lived signed URLs (auth fix)
  caption VARCHAR(255),
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Migration for existing DBs: add public_id if the table already existed
ALTER TABLE vision_board_items ADD COLUMN IF NOT EXISTS public_id TEXT;

-- Migration for existing DBs: tracks whether a goal has EVER paid out its
-- achieved-XP, so toggling achieved -> in_progress -> achieved repeatedly
-- can't re-farm XP. Fixed value once true; never reset.
ALTER TABLE goals ADD COLUMN IF NOT EXISTS xp_awarded BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS affirmations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  dream_id INTEGER REFERENCES dreams(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  audio_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  dream_id INTEGER REFERENCES dreams(id) ON DELETE CASCADE,
  method VARCHAR(20) DEFAULT '369', -- '369' | 'free'
  content TEXT NOT NULL,
  entry_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  dream_id INTEGER REFERENCES dreams(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_date DATE,
  status VARCHAR(20) DEFAULT 'in_progress', -- 'in_progress' | 'achieved'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_signs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  goal_id INTEGER REFERENCES goals(id) ON DELETE CASCADE,
  proof_text TEXT,
  proof_image_url TEXT,
  sign_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (goal_id, sign_date)
);

CREATE TABLE IF NOT EXISTS daily_spins (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  reward INTEGER NOT NULL,
  spin_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, spin_date)
);

CREATE TABLE IF NOT EXISTS ai_coach_messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(10) NOT NULL, -- 'user' | 'assistant'
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stars (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  dream_id INTEGER REFERENCES dreams(id) ON DELETE CASCADE,
  action_type VARCHAR(30) NOT NULL, -- journal | daily_sign | affirmation | vision_board | goal_achieved
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stars_dream ON stars(dream_id);
CREATE INDEX IF NOT EXISTS idx_dreams_user ON dreams(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_signs_goal ON daily_signs(goal_id);
CREATE INDEX IF NOT EXISTS idx_ai_coach_user ON ai_coach_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_vision_user ON vision_board_items(user_id);
CREATE INDEX IF NOT EXISTS idx_affirmations_user ON affirmations(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_user ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_vision_dream ON vision_board_items(dream_id);
CREATE INDEX IF NOT EXISTS idx_affirmations_dream ON affirmations(dream_id);
CREATE INDEX IF NOT EXISTS idx_journal_dream ON journal_entries(dream_id);
CREATE INDEX IF NOT EXISTS idx_goals_dream ON goals(dream_id);

-- ============================================================
-- MIGRATION for existing databases (safe to re-run):
-- backfills a default dream for any user who doesn't have one yet,
-- and assigns their existing goals/journal/affirmations/vision items to it.
-- ============================================================
DO $$
DECLARE
  u RECORD;
  new_dream_id INTEGER;
BEGIN
  FOR u IN SELECT id FROM users WHERE active_dream_id IS NULL LOOP
    INSERT INTO dreams (user_id, title, category, status)
    VALUES (u.id, 'My Manifestation Journey', 'custom', 'active')
    RETURNING id INTO new_dream_id;

    UPDATE users SET active_dream_id = new_dream_id WHERE id = u.id;
    UPDATE goals SET dream_id = new_dream_id WHERE user_id = u.id AND dream_id IS NULL;
    UPDATE journal_entries SET dream_id = new_dream_id WHERE user_id = u.id AND dream_id IS NULL;
    UPDATE affirmations SET dream_id = new_dream_id WHERE user_id = u.id AND dream_id IS NULL;
    UPDATE vision_board_items SET dream_id = new_dream_id WHERE user_id = u.id AND dream_id IS NULL;
  END LOOP;
END $$;
