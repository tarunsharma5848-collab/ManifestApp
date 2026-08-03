import { pool } from '../config/db.js';
import { BADGES, levelFromXp, xpIntoLevel, XP_PER_LEVEL } from '../config/gamification.js';

export async function getMyStatus(req, res) {
  try {
    const userResult = await pool.query('SELECT xp FROM users WHERE id = $1', [req.userId]);
    const xp = userResult.rows[0]?.xp || 0;

    const badgesResult = await pool.query(
      'SELECT badge_key, earned_at FROM user_badges WHERE user_id = $1',
      [req.userId]
    );
    const earnedKeys = new Set(badgesResult.rows.map((r) => r.badge_key));

    const badges = Object.entries(BADGES).map(([key, def]) => ({
      key,
      label: def.label,
      desc: def.desc,
      earned: earnedKeys.has(key),
      earned_at: badgesResult.rows.find((r) => r.badge_key === key)?.earned_at || null,
    }));

    res.json({
      xp,
      level: levelFromXp(xp),
      xpIntoLevel: xpIntoLevel(xp),
      xpPerLevel: XP_PER_LEVEL,
      badges,
    });
  } catch (err) {
    console.error('getMyStatus error', err);
    res.status(500).json({ message: 'Could not load gamification status' });
  }
}
