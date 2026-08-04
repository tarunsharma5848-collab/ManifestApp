import streamifier from 'streamifier';
import { pool } from '../config/db.js';
import cloudinary, { getSignedImageUrl } from '../config/cloudinary.js';
import { awardXp, deductXp, awardBadge, logStar, XP_REWARDS } from '../config/gamification.js';

function uploadBufferToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      // type: 'authenticated' makes the asset private — it can only be viewed
      // via a signed URL (see getSignedImageUrl), not a plain public link.
      { folder, resource_type: 'image', type: 'authenticated' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

// Attaches a fresh signed URL to each row. Rows uploaded before this fix
// (no public_id stored) fall back to their old stored image_url.
function withSignedUrl(item) {
  const signedUrl = item.public_id ? getSignedImageUrl(item.public_id) : null;
  return { ...item, image_url: signedUrl || item.image_url };
}

export async function listItems(req, res) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM vision_board_items WHERE user_id = $1 AND dream_id = $2 ORDER BY position ASC, created_at ASC',
      [req.userId, req.dreamId]
    );
    res.json({ items: rows.map(withSignedUrl) });
  } catch (err) {
    console.error('listItems error', err);
    res.status(500).json({ message: 'Could not load vision board' });
  }
}

export async function addItem(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image provided' });

    const result = await uploadBufferToCloudinary(
      req.file.buffer,
      `manifest/${req.userId}/vision-board`
    );

    const { caption = '' } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO vision_board_items (user_id, dream_id, image_url, public_id, caption)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.userId, req.dreamId, result.secure_url, result.public_id, caption]
    );

    const xp = await awardXp(req.userId, XP_REWARDS.vision_board_upload);
    await logStar(req.userId, req.dreamId, 'vision_board');

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM vision_board_items WHERE user_id = $1 AND dream_id = $2',
      [req.userId, req.dreamId]
    );
    if (Number(countResult.rows[0].count) >= 5) {
      await awardBadge(req.userId, 'vision_5');
    }

    res.status(201).json({ item: withSignedUrl(rows[0]), xp });
  } catch (err) {
    console.error('addItem error', err);
    res.status(500).json({ message: 'Could not upload image' });
  }
}

export async function deleteItem(req, res) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      'DELETE FROM vision_board_items WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Item not found' });

    // Same fix as affirmations — reverse the upload XP so
    // upload/delete/repeat can't be farmed for free XP.
    const xp = await deductXp(req.userId, XP_REWARDS.vision_board_upload);
    if (rows[0].public_id) {
      // Best-effort cleanup of the actual Cloudinary asset so deleted
      // images don't linger as orphaned private files.
      cloudinary.uploader
        .destroy(rows[0].public_id, { type: 'authenticated', resource_type: 'image' })
        .catch((err) => console.error('cloudinary destroy error', err));
    }

    res.json({ message: 'Deleted', xp });
  } catch (err) {
    console.error('deleteItem error', err);
    res.status(500).json({ message: 'Could not delete item' });
  }
}
