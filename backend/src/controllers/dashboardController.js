import { pool } from '../config/db.js';
import { BADGES, levelFromXp, xpIntoLevel, XP_PER_LEVEL } from '../config/gamification.js';

export async function getStats(req, res) {
  try {
    const userId = req.userId;
    const dreamId = req.dreamId;

    const [
      userResult,
      dreamResult,
      badgesResult,
      journalDaysResult,
      goalsResult,
      visionCountResult,
      affirmationsResult,
    ] = await Promise.all([
      pool.query('SELECT xp FROM users WHERE id = $1', [userId]),
      pool.query('SELECT title, category FROM dreams WHERE id = $1', [dreamId]),
      // XP/badges stay account-wide — achievements across all dreams count.
      pool.query('SELECT badge_key FROM user_badges WHERE user_id = $1', [userId]),
      pool.query(
        `SELECT entry_date, COUNT(*) AS count FROM journal_entries
         WHERE user_id = $1 AND dream_id = $2 AND entry_date >= CURRENT_DATE - INTERVAL '13 days'
         GROUP BY entry_date`,
        [userId, dreamId]
      ),
      pool.query(
        `SELECT status, COUNT(*) AS count FROM goals WHERE user_id = $1 AND dream_id = $2 GROUP BY status`,
        [userId, dreamId]
      ),
      pool.query('SELECT COUNT(*) FROM vision_board_items WHERE user_id = $1 AND dream_id = $2', [
        userId,
        dreamId,
      ]),
      pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE is_active = TRUE) AS active,
           COUNT(*) AS total
         FROM affirmations WHERE user_id = $1 AND dream_id = $2`,
        [userId, dreamId]
      ),
    ]);

    const xp = userResult.rows[0]?.xp || 0;

    // Build a continuous 14-day series, filling in zero-entry days.
    const dayCounts = new Map(
      journalDaysResult.rows.map((r) => [
        new Date(r.entry_date).toISOString().slice(0, 10),
        Number(r.count),
      ])
    );
    const journalActivity = [];
    for (let i = 13; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      journalActivity.push({
        date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        count: dayCounts.get(key) || 0,
      });
    }

    const goalsByStatus = { in_progress: 0, achieved: 0 };
    goalsResult.rows.forEach((r) => {
      goalsByStatus[r.status] = Number(r.count);
    });

    res.json({
      dreamTitle: dreamResult.rows[0]?.title || null,
      dreamCategory: dreamResult.rows[0]?.category || null,
      xp,
      level: levelFromXp(xp),
      xpIntoLevel: xpIntoLevel(xp),
      xpPerLevel: XP_PER_LEVEL,
      badgesEarned: badgesResult.rows.length,
      badgesTotal: Object.keys(BADGES).length,
      journalActivity,
      goalsAchieved: goalsByStatus.achieved,
      goalsInProgress: goalsByStatus.in_progress,
      visionBoardCount: Number(visionCountResult.rows[0].count),
      affirmationsActive: Number(affirmationsResult.rows[0].active),
      affirmationsTotal: Number(affirmationsResult.rows[0].total),
    });
  } catch (err) {
    console.error('getStats error', err);
    res.status(500).json({ message: 'Could not load dashboard stats' });
  }
}
