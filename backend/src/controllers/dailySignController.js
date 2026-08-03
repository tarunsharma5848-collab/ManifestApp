import streamifier from 'streamifier';
import { pool } from '../config/db.js';
import cloudinary from '../config/cloudinary.js';
import { awardXp, awardBadge, logStar, XP_REWARDS } from '../config/gamification.js';

function uploadBufferToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

// One sign per goal per day. If today's already exists, update it instead
// of erroring, so retrying/editing feels natural.
export async function addSign(req, res) {
  try {
    const { goalId } = req.params;
    const { proof_text = '' } = req.body;

    const goalCheck = await pool.query('SELECT id, dream_id FROM goals WHERE id = $1 AND user_id = $2', [
      goalId,
      req.userId,
    ]);
    if (goalCheck.rows.length === 0) return res.status(404).json({ message: 'Goal not found' });

    let imageUrl = null;
    if (req.file) {
      const result = await uploadBufferToCloudinary(
        req.file.buffer,
        `manifest/${req.userId}/daily-signs`
      );
      imageUrl = result.secure_url;
    }

    const { rows } = await pool.query(
      `INSERT INTO daily_signs (user_id, goal_id, proof_text, proof_image_url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (goal_id, sign_date)
       DO UPDATE SET proof_text = EXCLUDED.proof_text,
                     proof_image_url = COALESCE(EXCLUDED.proof_image_url, daily_signs.proof_image_url)
       RETURNING *`,
      [req.userId, goalId, proof_text, imageUrl]
    );

    const xp = await awardXp(req.userId, XP_REWARDS.daily_sign);
    await logStar(req.userId, goalCheck.rows[0].dream_id, 'daily_sign');

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM daily_signs WHERE user_id = $1',
      [req.userId]
    );
    if (Number(countResult.rows[0].count) === 1) {
      await awardBadge(req.userId, 'first_sign');
    }

    res.status(201).json({ sign: rows[0], xp });
  } catch (err) {
    console.error('addSign error', err);
    res.status(500).json({ message: 'Could not save daily sign' });
  }
}

export async function listSigns(req, res) {
  try {
    const { goalId } = req.params;
    const { rows } = await pool.query(
      'SELECT * FROM daily_signs WHERE goal_id = $1 AND user_id = $2 ORDER BY sign_date DESC',
      [goalId, req.userId]
    );
    res.json({ signs: rows });
  } catch (err) {
    console.error('listSigns error', err);
    res.status(500).json({ message: 'Could not load signs' });
  }
}

export async function goalStreak(req, res) {
  try {
    const { goalId } = req.params;
    const { rows } = await pool.query(
      'SELECT sign_date FROM daily_signs WHERE goal_id = $1 AND user_id = $2 ORDER BY sign_date DESC',
      [goalId, req.userId]
    );

    if (rows.length === 0) return res.json({ streak: 0 });

    const dates = rows.map((r) => new Date(r.sign_date).setHours(0, 0, 0, 0));
    const oneDay = 24 * 60 * 60 * 1000;
    const today = new Date().setHours(0, 0, 0, 0);

    if (dates[0] !== today && dates[0] !== today - oneDay) {
      return res.json({ streak: 0 });
    }

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

    res.json({ streak });
  } catch (err) {
    console.error('goalStreak error', err);
    res.status(500).json({ message: 'Could not calculate streak' });
  }
}
