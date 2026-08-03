import { pool } from '../config/db.js';
import { askManifestBro } from '../config/gemini.js';

const DAILY_MESSAGE_CAP = 40; // safety margin under Gemini's free-tier daily limit
const HISTORY_WINDOW = 20; // how many past turns to send back to Gemini for context

export async function getHistory(req, res) {
  try {
    const { rows } = await pool.query(
      'SELECT id, role, content, created_at FROM ai_coach_messages WHERE user_id = $1 ORDER BY created_at ASC',
      [req.userId]
    );
    res.json({ messages: rows });
  } catch (err) {
    console.error('getHistory error', err);
    res.status(500).json({ message: 'Could not load chat history' });
  }
}

async function buildContextBlock(userId, dreamId) {
  const [dreamResult, goalsResult, journalResult, affirmationsResult] = await Promise.all([
    pool.query('SELECT title, why_reason, category FROM dreams WHERE id = $1', [dreamId]),
    pool.query(
      "SELECT title, status FROM goals WHERE user_id = $1 AND dream_id = $2 ORDER BY created_at DESC LIMIT 5",
      [userId, dreamId]
    ),
    pool.query(
      'SELECT content FROM journal_entries WHERE user_id = $1 AND dream_id = $2 ORDER BY created_at DESC LIMIT 2',
      [userId, dreamId]
    ),
    pool.query(
      'SELECT text FROM affirmations WHERE user_id = $1 AND dream_id = $2 AND is_active = TRUE LIMIT 5',
      [userId, dreamId]
    ),
  ]);

  const dream = dreamResult.rows[0];
  const dreamLine = dream
    ? `"${dream.title}" (category: ${dream.category})${dream.why_reason ? ` — why: ${dream.why_reason}` : ''}`
    : 'No dream set yet';

  const goalsLine = goalsResult.rows.length
    ? goalsResult.rows.map((g) => `- ${g.title} (${g.status})`).join('\n')
    : '- No goals set yet';

  const journalLine = journalResult.rows.length
    ? journalResult.rows.map((j) => `- "${j.content.slice(0, 140)}"`).join('\n')
    : '- No journal entries yet';

  const affirmationsLine = affirmationsResult.rows.length
    ? affirmationsResult.rows.map((a) => `- "${a.text}"`).join('\n')
    : '- No active affirmations yet';

  return `CURRENT DREAM: ${dreamLine}\n\nGOALS:\n${goalsLine}\n\nRECENT JOURNAL ENTRIES:\n${journalLine}\n\nACTIVE AFFIRMATIONS:\n${affirmationsLine}`;
}

export async function sendMessage(req, res) {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const today = new Date().toISOString().slice(0, 10);
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM ai_coach_messages
       WHERE user_id = $1 AND role = 'user' AND created_at::date = $2`,
      [req.userId, today]
    );
    if (Number(countResult.rows[0].count) >= DAILY_MESSAGE_CAP) {
      return res.status(429).json({
        message: "You've hit today's chat limit with Manifest Bro. Come back tomorrow 🌙",
      });
    }

    await pool.query(
      "INSERT INTO ai_coach_messages (user_id, role, content) VALUES ($1, 'user', $2)",
      [req.userId, message.trim()]
    );

    const historyResult = await pool.query(
      `SELECT role, content FROM ai_coach_messages WHERE user_id = $1
       ORDER BY created_at DESC LIMIT $2`,
      [req.userId, HISTORY_WINDOW]
    );
    const history = historyResult.rows.reverse();

    const contextBlock = await buildContextBlock(req.userId, req.dreamId);
    const replyText = await askManifestBro(history, contextBlock);

    const insertResult = await pool.query(
      "INSERT INTO ai_coach_messages (user_id, role, content) VALUES ($1, 'assistant', $2) RETURNING *",
      [req.userId, replyText]
    );

    res.status(201).json({ reply: insertResult.rows[0] });
  } catch (err) {
    console.error('sendMessage error', err);
    res.status(500).json({ message: 'Manifest Bro is unavailable right now. Try again in a bit.' });
  }
}

export async function clearHistory(req, res) {
  try {
    await pool.query('DELETE FROM ai_coach_messages WHERE user_id = $1', [req.userId]);
    res.json({ message: 'Cleared' });
  } catch (err) {
    console.error('clearHistory error', err);
    res.status(500).json({ message: 'Could not clear chat history' });
  }
}
