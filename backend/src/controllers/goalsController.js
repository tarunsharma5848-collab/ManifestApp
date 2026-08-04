import { pool } from '../config/db.js';
import { awardXp, awardBadge, logStar, XP_REWARDS } from '../config/gamification.js';

export async function listGoals(req, res) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM goals WHERE user_id = $1 AND dream_id = $2 ORDER BY status ASC, target_date ASC NULLS LAST, created_at DESC',
      [req.userId, req.dreamId]
    );
    res.json({ goals: rows });
  } catch (err) {
    console.error('listGoals error', err);
    res.status(500).json({ message: 'Could not load goals' });
  }
}

export async function addGoal(req, res) {
  try {
    const { title, description = '', target_date = null } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ message: 'Goal title is required' });
    if (title.trim().length > 150) {
      return res.status(400).json({ message: 'Goal title must be under 150 characters' });
    }
    if (target_date) {
      const todayStr = new Date().toISOString().slice(0, 10);
      if (target_date < todayStr) {
        return res.status(400).json({ message: 'Target date cannot be in the past' });
      }
    }

    const { rows } = await pool.query(
      `INSERT INTO goals (user_id, dream_id, title, description, target_date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.userId, req.dreamId, title.trim(), description, target_date]
    );
    res.status(201).json({ goal: rows[0] });
  } catch (err) {
    console.error('addGoal error', err);
    res.status(500).json({ message: 'Could not add goal' });
  }
}

export async function toggleStatus(req, res) {
  try {
    const { id } = req.params;

    const before = await pool.query(
      'SELECT status, xp_awarded FROM goals WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (before.rows.length === 0) return res.status(404).json({ message: 'Goal not found' });
    const wasAchieved = before.rows[0].status === 'achieved';
    const alreadyPaidOut = before.rows[0].xp_awarded;

    // Only pay XP the first time a goal is ever marked achieved. Toggling
    // achieved -> in_progress -> achieved again must NOT re-pay — xp_awarded
    // is a one-way flag, never reset, regardless of how many times status flips.
    const willAwardXp = !wasAchieved && !alreadyPaidOut;

    const { rows } = await pool.query(
      `UPDATE goals
       SET status = CASE WHEN status = 'achieved' THEN 'in_progress' ELSE 'achieved' END,
           xp_awarded = xp_awarded OR $3
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, req.userId, willAwardXp]
    );

    let xp = null;
    if (willAwardXp && rows[0].status === 'achieved') {
      // XP and badges stay account-wide (across all dreams) — achieving any
      // goal in any dream is still worth celebrating the same way.
      xp = await awardXp(req.userId, XP_REWARDS.goal_achieved);
      await logStar(req.userId, req.dreamId, 'goal_achieved');

      const countResult = await pool.query(
        "SELECT COUNT(*) FROM goals WHERE user_id = $1 AND status = 'achieved'",
        [req.userId]
      );
      if (Number(countResult.rows[0].count) === 1) {
        await awardBadge(req.userId, 'first_goal_achieved');
      }
    }

    res.json({ goal: rows[0], xp });
  } catch (err) {
    console.error('toggleStatus error', err);
    res.status(500).json({ message: 'Could not update goal' });
  }
}

export async function deleteGoal(req, res) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      'DELETE FROM goals WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Goal not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('deleteGoal error', err);
    res.status(500).json({ message: 'Could not delete goal' });
  }
}
