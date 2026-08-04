import { pool } from './db.js';

export const XP_REWARDS = {
  journal_entry: 10,
  daily_sign: 15,
  affirmation_added: 5,
  vision_board_upload: 5,
  goal_achieved: 50,
};

// Order matters — the frontend wheel renders segments in this exact order.
// weight controls rarity (higher = more common). Sum doesn't need to be 100.
export const WHEEL_SEGMENTS = [
  { reward: 5, weight: 30 },
  { reward: 10, weight: 25 },
  { reward: 15, weight: 20 },
  { reward: 20, weight: 15 },
  { reward: 30, weight: 7 },
  { reward: 50, weight: 3 },
];

export function pickWeightedReward() {
  const totalWeight = WHEEL_SEGMENTS.reduce((sum, s) => sum + s.weight, 0);
  let roll = Math.random() * totalWeight;
  for (let i = 0; i < WHEEL_SEGMENTS.length; i += 1) {
    roll -= WHEEL_SEGMENTS[i].weight;
    if (roll <= 0) return { index: i, reward: WHEEL_SEGMENTS[i].reward };
  }
  return { index: 0, reward: WHEEL_SEGMENTS[0].reward };
}

export const XP_PER_LEVEL = 100;

export function levelFromXp(xp) {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function xpIntoLevel(xp) {
  return xp % XP_PER_LEVEL;
}

export const BADGES = {
  first_journal: { label: 'First Reflection', desc: 'Wrote your first journal entry' },
  streak_7: { label: 'Week of Momentum', desc: '7-day journal streak' },
  first_goal_achieved: { label: 'Goal Getter', desc: 'Achieved your first goal' },
  vision_5: { label: 'Visionary', desc: 'Added 5 images to your vision board' },
  affirmation_5: { label: 'Wordsmith', desc: 'Added 5 affirmations' },
  first_sign: { label: 'Proof of Progress', desc: 'Logged your first daily sign' },
};

export async function awardXp(userId, amount) {
  const { rows } = await pool.query(
    'UPDATE users SET xp = xp + $1 WHERE id = $2 RETURNING xp',
    [amount, userId]
  );
  return rows[0]?.xp ?? 0;
}

// Reverses XP when a user deletes something they were credited for (e.g. an
// affirmation). Clamped at 0 so it can never push a user negative. Without
// this, add -> delete -> add -> delete is infinite free XP.
export async function deductXp(userId, amount) {
  const { rows } = await pool.query(
    'UPDATE users SET xp = GREATEST(xp - $1, 0) WHERE id = $2 RETURNING xp',
    [amount, userId]
  );
  return rows[0]?.xp ?? 0;
}

// Awards a badge if not already earned. Silently no-ops on duplicate
// thanks to the UNIQUE(user_id, badge_key) constraint.
export async function awardBadge(userId, badgeKey) {
  if (!BADGES[badgeKey]) return null;
  const { rows } = await pool.query(
    `INSERT INTO user_badges (user_id, badge_key) VALUES ($1, $2)
     ON CONFLICT (user_id, badge_key) DO NOTHING
     RETURNING *`,
    [userId, badgeKey]
  );
  return rows[0] || null; // null means already had it
}

// Every completed action lights one star in that dream's constellation.
// Called alongside awardXp at each action's call site.
export async function logStar(userId, dreamId, actionType) {
  if (!dreamId) return; // some actions (e.g. account-wide badges) have no dream context
  await pool.query(
    'INSERT INTO stars (user_id, dream_id, action_type) VALUES ($1, $2, $3)',
    [userId, dreamId, actionType]
  );
}
