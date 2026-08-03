import { useEffect, useState } from 'react';
import api from '../api/client';

const ACTION_LABELS = {
  journal: 'Journal entry',
  daily_sign: 'Daily proof',
  affirmation: 'Affirmation',
  vision_board: 'Vision board image',
  goal_achieved: 'Goal achieved',
};

const VIEW_W = 800;
const VIEW_H = 480;
const PADDING = 40;

// Deterministic pseudo-random position from a star's id — stable across
// reloads (no re-shuffling every visit) without needing to store x/y in DB.
function starPosition(id) {
  const x = PADDING + (Math.abs(Math.sin(id * 12.9898)) % 1) * (VIEW_W - PADDING * 2);
  const y = PADDING + (Math.abs(Math.sin(id * 78.233)) % 1) * (VIEW_H - PADDING * 2);
  return { x, y };
}

export default function Universe() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStar, setSelectedStar] = useState(null);

  useEffect(() => {
    api
      .get('/universe')
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-cosmic-star/50">Loading your universe...</p>;
  }

  if (!data) {
    return <p className="text-cosmic-star/50">Could not load your universe.</p>;
  }

  const { stars, totalStars, streakDays, milestone, completionPercent, dreamTitle } = data;
  const positions = stars.map((s) => ({ ...s, ...starPosition(s.id) }));
  const linePoints = positions.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div>
      <h2 className="font-display text-3xl text-cosmic-gold mb-1">Your Universe</h2>
      <p className="text-cosmic-star/60 mb-2">
        {dreamTitle ? `"${dreamTitle}"` : 'Your dream'} — every completed action lights a star.
      </p>
      <p className="text-cosmic-lavender-light text-sm mb-8 italic">
        "The universe doesn't respond to wishes. It responds to consistent action."
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl bg-cosmic-navy-light border border-cosmic-lavender/20 p-4 text-center">
          <p className="text-2xl font-display text-cosmic-gold">{totalStars}</p>
          <p className="text-xs text-cosmic-star/60 mt-0.5">Stars lit</p>
        </div>
        <div className="rounded-xl bg-cosmic-navy-light border border-cosmic-lavender/20 p-4 text-center">
          <p className="text-2xl font-display text-cosmic-gold">{streakDays}</p>
          <p className="text-xs text-cosmic-star/60 mt-0.5">Day streak</p>
        </div>
        <div className="rounded-xl bg-cosmic-navy-light border border-cosmic-lavender/20 p-4 text-center">
          <p className="text-2xl font-display text-cosmic-gold">{completionPercent}%</p>
          <p className="text-xs text-cosmic-star/60 mt-0.5">Constellation complete</p>
        </div>
        <div className="rounded-xl bg-cosmic-navy-light border border-cosmic-lavender/20 p-4 text-center">
          <p className="text-2xl">{milestone ? milestone.icon : '🌑'}</p>
          <p className="text-xs text-cosmic-star/60 mt-0.5">
            {milestone ? milestone.label : 'Keep going'}
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-cosmic-navy-deep border border-cosmic-lavender/20 p-4 overflow-hidden relative">
        {stars.length === 0 ? (
          <div className="h-[480px] flex items-center justify-center text-cosmic-star/40 text-sm text-center px-8">
            No stars yet — your first journal entry, affirmation, vision board image, or goal
            milestone will light the first one.
          </div>
        ) : (
          <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full h-auto">
            {/* Faint background stars for atmosphere */}
            {Array.from({ length: 40 }).map((_, i) => {
              const bx = (Math.abs(Math.sin(i * 45.1)) % 1) * VIEW_W;
              const by = (Math.abs(Math.sin(i * 91.7)) % 1) * VIEW_H;
              return (
                <circle
                  key={`bg-${i}`}
                  cx={bx}
                  cy={by}
                  r={0.8}
                  fill="var(--color-cosmic-star)"
                  opacity={0.15}
                />
              );
            })}

            {/* Constellation lines connecting stars in chronological order */}
            {positions.length > 1 && (
              <polyline
                points={linePoints}
                fill="none"
                stroke="var(--color-cosmic-lavender)"
                strokeWidth={1}
                opacity={0.35}
              />
            )}

            {/* The actual stars */}
            {positions.map((p, i) => (
              <g key={p.id} onClick={() => setSelectedStar(p)} className="cursor-pointer">
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={5}
                  fill="var(--color-cosmic-gold)"
                  style={{
                    animation: `twinkle 2.4s ease-in-out ${(i % 10) * 0.3}s infinite`,
                  }}
                />
                <circle cx={p.x} cy={p.y} r={10} fill="var(--color-cosmic-gold)" opacity={0.15} />
              </g>
            ))}
          </svg>
        )}

        {selectedStar && (
          <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-cosmic-navy-light border border-cosmic-gold/40 px-4 py-2 flex items-center justify-between">
            <span className="text-sm text-cosmic-star">
              ⭐ {ACTION_LABELS[selectedStar.action_type] || selectedStar.action_type} —{' '}
              {new Date(selectedStar.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <button
              onClick={() => setSelectedStar(null)}
              className="text-xs text-cosmic-star/50"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      <p className="text-center text-cosmic-star/40 text-xs mt-4">
        {totalStars > 0
          ? `You've completed ${totalStars} action${totalStars === 1 ? '' : 's'} for this dream. Your constellation is ${completionPercent}% complete.`
          : 'Your dreams are aligning with your actions — one star at a time.'}
      </p>
    </div>
  );
}
