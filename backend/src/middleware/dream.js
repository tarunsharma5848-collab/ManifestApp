import { pool } from '../config/db.js';

// Resolves the user's currently active dream and attaches it as req.dreamId.
// Every dream-scoped route (goals, journal, affirmations, vision board) uses
// this after requireAuth so controllers don't each have to re-fetch it.
export async function attachActiveDream(req, res, next) {
  try {
    const { rows } = await pool.query('SELECT active_dream_id FROM users WHERE id = $1', [
      req.userId,
    ]);
    if (!rows[0]?.active_dream_id) {
      return res.status(400).json({ message: 'No active dream set — create a dream first' });
    }
    req.dreamId = rows[0].active_dream_id;
    next();
  } catch (err) {
    console.error('attachActiveDream error', err);
    res.status(500).json({ message: 'Could not resolve active dream' });
  }
}
