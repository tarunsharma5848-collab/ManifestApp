import streamifier from 'streamifier';
import { pool } from '../config/db.js';
import cloudinary from '../config/cloudinary.js';
import { awardXp, awardBadge, logStar, XP_REWARDS } from '../config/gamification.js';

function uploadBufferToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    // Cloudinary treats audio as a 'video' resource type — there's no
    // separate 'audio' type, this is expected and correct.
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'video' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

export async function listAffirmations(req, res) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM affirmations WHERE user_id = $1 AND dream_id = $2 ORDER BY created_at DESC',
      [req.userId, req.dreamId]
    );
    res.json({ affirmations: rows });
  } catch (err) {
    console.error('listAffirmations error', err);
    res.status(500).json({ message: 'Could not load affirmations' });
  }
}

export async function addAffirmation(req, res) {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Affirmation text is required' });

    const { rows } = await pool.query(
      'INSERT INTO affirmations (user_id, dream_id, text) VALUES ($1, $2, $3) RETURNING *',
      [req.userId, req.dreamId, text.trim()]
    );

    const xp = await awardXp(req.userId, XP_REWARDS.affirmation_added);
    await logStar(req.userId, req.dreamId, 'affirmation');

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM affirmations WHERE user_id = $1 AND dream_id = $2',
      [req.userId, req.dreamId]
    );
    if (Number(countResult.rows[0].count) >= 5) {
      await awardBadge(req.userId, 'affirmation_5');
    }

    res.status(201).json({ affirmation: rows[0], xp });
  } catch (err) {
    console.error('addAffirmation error', err);
    res.status(500).json({ message: 'Could not add affirmation' });
  }
}

export async function toggleActive(req, res) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `UPDATE affirmations SET is_active = NOT is_active
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, req.userId]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Affirmation not found' });
    res.json({ affirmation: rows[0] });
  } catch (err) {
    console.error('toggleActive error', err);
    res.status(500).json({ message: 'Could not update affirmation' });
  }
}

export async function uploadVoice(req, res) {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ message: 'No audio file provided' });

    const ownerCheck = await pool.query(
      'SELECT id FROM affirmations WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (ownerCheck.rows.length === 0) return res.status(404).json({ message: 'Affirmation not found' });

    const result = await uploadBufferToCloudinary(
      req.file.buffer,
      `manifest/${req.userId}/voice-affirmations`
    );

    const { rows } = await pool.query(
      'UPDATE affirmations SET audio_url = $1 WHERE id = $2 RETURNING *',
      [result.secure_url, id]
    );

    res.json({ affirmation: rows[0] });
  } catch (err) {
    console.error('uploadVoice error', err);
    res.status(500).json({ message: 'Could not save voice recording' });
  }
}

export async function deleteAffirmation(req, res) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      'DELETE FROM affirmations WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Affirmation not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('deleteAffirmation error', err);
    res.status(500).json({ message: 'Could not delete affirmation' });
  }
}

// Picks one active affirmation deterministically per day, so it stays the
// same "today's affirmation" all day but rotates day to day.
export async function todayAffirmation(req, res) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM affirmations WHERE user_id = $1 AND dream_id = $2 AND is_active = TRUE ORDER BY id ASC',
      [req.userId, req.dreamId]
    );
    if (rows.length === 0) return res.json({ affirmation: null });

    const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const pick = rows[dayIndex % rows.length];
    res.json({ affirmation: pick });
  } catch (err) {
    console.error('todayAffirmation error', err);
    res.status(500).json({ message: 'Could not load today\'s affirmation' });
  }
}
