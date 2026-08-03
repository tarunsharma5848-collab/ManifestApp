import { pool } from '../config/db.js';
import { generateDreamContent } from '../config/gemini.js';

export async function listDreams(req, res) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM dreams WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    const userResult = await pool.query('SELECT active_dream_id FROM users WHERE id = $1', [
      req.userId,
    ]);
    res.json({ dreams: rows, activeDreamId: userResult.rows[0]?.active_dream_id || null });
  } catch (err) {
    console.error('listDreams error', err);
    res.status(500).json({ message: 'Could not load dreams' });
  }
}

export async function getActiveDream(req, res) {
  try {
    const userResult = await pool.query('SELECT active_dream_id FROM users WHERE id = $1', [
      req.userId,
    ]);
    const activeDreamId = userResult.rows[0]?.active_dream_id;
    if (!activeDreamId) return res.json({ dream: null });

    const { rows } = await pool.query('SELECT * FROM dreams WHERE id = $1 AND user_id = $2', [
      activeDreamId,
      req.userId,
    ]);
    res.json({ dream: rows[0] || null });
  } catch (err) {
    console.error('getActiveDream error', err);
    res.status(500).json({ message: 'Could not load active dream' });
  }
}

export async function createDream(req, res) {
  try {
    const { title, category = 'custom', why_reason = '', target_date = null, life_change = '' } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ message: 'Dream title is required' });

    const { rows } = await pool.query(
      `INSERT INTO dreams (user_id, title, category, why_reason, target_date, life_change)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.userId, title.trim(), category, why_reason, target_date, life_change]
    );

    // Newly created dream becomes the active one — you just made it, you're
    // presumably here to work on it.
    await pool.query('UPDATE users SET active_dream_id = $1 WHERE id = $2', [
      rows[0].id,
      req.userId,
    ]);

    // AI-generate a starting set of affirmations + goals so the user never
    // has to write them from scratch. If this fails (rate limit, no API
    // key, network), the dream is still created successfully — this is a
    // nice-to-have layered on top, not a blocker.
    let contentGenerated = false;
    let generatedCounts = { affirmations: 0, goals: 0 };
    try {
      const content = await generateDreamContent({
        title: rows[0].title,
        category: rows[0].category,
        whyReason: rows[0].why_reason,
        lifeChange: rows[0].life_change,
      });

      for (const text of content.affirmations) {
        await pool.query('INSERT INTO affirmations (user_id, dream_id, text) VALUES ($1, $2, $3)', [
          req.userId,
          rows[0].id,
          text,
        ]);
      }
      for (const g of content.goals) {
        await pool.query(
          'INSERT INTO goals (user_id, dream_id, title, description) VALUES ($1, $2, $3, $4)',
          [req.userId, rows[0].id, g.title, g.description || '']
        );
      }
      contentGenerated = true;
      generatedCounts = { affirmations: content.affirmations.length, goals: content.goals.length };
    } catch (genErr) {
      console.error('AI dream content generation failed (dream still created)', genErr);
    }

    res.status(201).json({ dream: rows[0], contentGenerated, generatedCounts });
  } catch (err) {
    console.error('createDream error', err);
    res.status(500).json({ message: 'Could not create dream' });
  }
}

export async function activateDream(req, res) {
  try {
    const { id } = req.params;
    const ownerCheck = await pool.query('SELECT id FROM dreams WHERE id = $1 AND user_id = $2', [
      id,
      req.userId,
    ]);
    if (ownerCheck.rows.length === 0) return res.status(404).json({ message: 'Dream not found' });

    await pool.query('UPDATE users SET active_dream_id = $1 WHERE id = $2', [id, req.userId]);
    res.json({ message: 'Activated', activeDreamId: Number(id) });
  } catch (err) {
    console.error('activateDream error', err);
    res.status(500).json({ message: 'Could not switch dream' });
  }
}

export async function checkDuplicate(req, res) {
  try {
    const { title } = req.query;
    if (!title || !title.trim()) return res.json({ possibleDuplicate: null });

    const words = title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2);

    if (words.length === 0) return res.json({ possibleDuplicate: null });

    const { rows } = await pool.query(
      "SELECT id, title FROM dreams WHERE user_id = $1 AND status != 'archived'",
      [req.userId]
    );

    const match = rows.find((d) => {
      const existingWords = d.title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/);
      const overlap = words.filter((w) => existingWords.includes(w));
      return overlap.length / words.length >= 0.5;
    });

    res.json({ possibleDuplicate: match || null });
  } catch (err) {
    console.error('checkDuplicate error', err);
    res.status(500).json({ message: 'Could not check for duplicates' });
  }
}

export async function deleteDream(req, res) {
  try {
    const { id } = req.params;
    const ownerCheck = await pool.query('SELECT id FROM dreams WHERE id = $1 AND user_id = $2', [
      id,
      req.userId,
    ]);
    if (ownerCheck.rows.length === 0) return res.status(404).json({ message: 'Dream not found' });

    await pool.query('DELETE FROM dreams WHERE id = $1', [id]);

    const userResult = await pool.query('SELECT active_dream_id FROM users WHERE id = $1', [
      req.userId,
    ]);
    if (String(userResult.rows[0]?.active_dream_id) === String(id)) {
      const remaining = await pool.query(
        'SELECT id FROM dreams WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
        [req.userId]
      );
      await pool.query('UPDATE users SET active_dream_id = $1 WHERE id = $2', [
        remaining.rows[0]?.id || null,
        req.userId,
      ]);
    }

    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('deleteDream error', err);
    res.status(500).json({ message: 'Could not delete dream' });
  }
}