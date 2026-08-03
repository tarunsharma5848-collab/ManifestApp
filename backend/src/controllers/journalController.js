import { pool } from '../config/db.js';
import { awardXp, awardBadge, logStar, XP_REWARDS } from '../config/gamification.js';

export async function listEntries(req, res) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM journal_entries WHERE user_id = $1 AND dream_id = $2 ORDER BY entry_date DESC, created_at DESC',
      [req.userId, req.dreamId]
    );
    res.json({ entries: rows });
  } catch (err) {
    console.error('listEntries error', err);
    res.status(500).json({ message: 'Could not load journal entries' });
  }
}

// Consecutive days (ending today or yesterday) with at least one entry —
// scoped to the current dream, so each dream has its own streak.
async function calculateStreak(userId, dreamId) {
  const { rows } = await pool.query(
    `SELECT DISTINCT entry_date FROM journal_entries WHERE user_id = $1 AND dream_id = $2 ORDER BY entry_date DESC`,
    [userId, dreamId]
  );
  if (rows.length === 0) return 0;

  const dates = rows.map((r) => new Date(r.entry_date).setHours(0, 0, 0, 0));
  const oneDay = 24 * 60 * 60 * 1000;
  const today = new Date().setHours(0, 0, 0, 0);

  if (dates[0] !== today && dates[0] !== today - oneDay) return 0;

  let cursor = dates[0];
  let streak = 0;
  for (const d of dates) {
    if (d === cursor) {
      streak += 1;
      cursor -= oneDay;
    } else if (d < cursor) {
      break;
    }
  }
  return streak;
}

export async function addEntry(req, res) {
  try {
    const { content, method = '369' } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ message: 'Entry content is required' });

    const { rows } = await pool.query(
      `INSERT INTO journal_entries (user_id, dream_id, method, content) VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.userId, req.dreamId, method, content.trim()]
    );

    const xp = await awardXp(req.userId, XP_REWARDS.journal_entry);
    await logStar(req.userId, req.dreamId, 'journal');

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM journal_entries WHERE user_id = $1',
      [req.userId]
    );
    if (Number(countResult.rows[0].count) === 1) {
      await awardBadge(req.userId, 'first_journal');
    }

    const streak = await calculateStreak(req.userId, req.dreamId);
    if (streak >= 7) {
      await awardBadge(req.userId, 'streak_7');
    }

    res.status(201).json({ entry: rows[0], xp, streak });
  } catch (err) {
    console.error('addEntry error', err);
    res.status(500).json({ message: 'Could not save entry' });
  }
}

export async function deleteEntry(req, res) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      'DELETE FROM journal_entries WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Entry not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('deleteEntry error', err);
    res.status(500).json({ message: 'Could not delete entry' });
  }
}

export async function getStreak(req, res) {
  try {
    const streak = await calculateStreak(req.userId, req.dreamId);
    res.json({ streak });
  } catch (err) {
    console.error('getStreak error', err);
    res.status(500).json({ message: 'Could not calculate streak' });
  }
}
