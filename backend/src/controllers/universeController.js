import { pool } from '../config/db.js';

const MILESTONES = [
  { days: 365, label: 'The entire universe glows', icon: '🌍✨' },
  { days: 100, label: 'The Milky Way lights up', icon: '🌠' },
  { days: 30, label: 'A galaxy appears', icon: '🌌' },
  { days: 7, label: 'A small constellation appears', icon: '✨' },
];

// Longest CURRENT consecutive-day streak of star activity (any action counts)
// for this dream — this is what the milestone tiers are measured against.
function calculateStreak(dates) {
  if (dates.length === 0) return 0;
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

export async function getUniverse(req, res) {
  try {
    const dreamId = req.dreamId;

    const [starsResult, dreamResult] = await Promise.all([
      pool.query(
        'SELECT id, action_type, created_at FROM stars WHERE dream_id = $1 ORDER BY created_at ASC',
        [dreamId]
      ),
      pool.query('SELECT title FROM dreams WHERE id = $1', [dreamId]),
    ]);

    const stars = starsResult.rows;

    const distinctDates = [
      ...new Set(stars.map((s) => new Date(s.created_at).setHours(0, 0, 0, 0))),
    ].sort((a, b) => b - a);

    const streakDays = calculateStreak(distinctDates);
    const milestone = MILESTONES.find((m) => streakDays >= m.days) || null;

    // Arbitrary but reasonable "full constellation" target — 50 stars feels
    // like a meaningfully consistent dream without taking a year to fill.
    const CONSTELLATION_TARGET = 50;
    const completionPercent = Math.min(
      100,
      Math.round((stars.length / CONSTELLATION_TARGET) * 100)
    );

    res.json({
      dreamTitle: dreamResult.rows[0]?.title || null,
      stars,
      totalStars: stars.length,
      streakDays,
      milestone,
      completionPercent,
    });
  } catch (err) {
    console.error('getUniverse error', err);
    res.status(500).json({ message: 'Could not load your universe' });
  }
}
