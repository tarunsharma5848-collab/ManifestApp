import { pool } from '../config/db.js';
import { awardXp, pickWeightedReward, WHEEL_SEGMENTS } from '../config/gamification.js';

export async function getStatus(req, res) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { rows } = await pool.query(
      'SELECT reward FROM daily_spins WHERE user_id = $1 AND spin_date = $2',
      [req.userId, today]
    );
    res.json({
      alreadySpun: rows.length > 0,
      todayReward: rows[0]?.reward ?? null,
      segments: WHEEL_SEGMENTS.map((s) => s.reward),
    });
  } catch (err) {
    console.error('getStatus error', err);
    res.status(500).json({ message: 'Could not check spin status' });
  }
}

export async function spin(req, res) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const existing = await pool.query(
      'SELECT reward FROM daily_spins WHERE user_id = $1 AND spin_date = $2',
      [req.userId, today]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Already spun today', todayReward: existing.rows[0].reward });
    }

    const { index, reward } = pickWeightedReward();

    await pool.query(
      'INSERT INTO daily_spins (user_id, reward, spin_date) VALUES ($1, $2, $3)',
      [req.userId, reward, today]
    );

    const xp = await awardXp(req.userId, reward);

    res.status(201).json({ segmentIndex: index, reward, xp });
  } catch (err) {
    console.error('spin error', err);
    res.status(500).json({ message: 'Could not spin the wheel' });
  }
}
