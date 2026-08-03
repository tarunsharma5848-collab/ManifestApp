import { useEffect, useState } from 'react';
import api from '../api/client';

// Purely level-driven — no new backend data needed, reuses /gamification/me.
function stageForLevel(level) {
  if (level >= 11) return 5; // Full bloom, cosmic stars
  if (level >= 7) return 4; // Full tree
  if (level >= 4) return 3; // Sapling
  if (level >= 2) return 2; // Sprout
  return 1; // Seed
}

const STAGE_LABELS = {
  1: 'Seed',
  2: 'Sprout',
  3: 'Sapling',
  4: 'Young Tree',
  5: 'Blooming Tree',
};

function TreeSvg({ stage }) {
  return (
    <svg viewBox="0 0 200 220" className="w-full h-full">
      <ellipse cx="100" cy="205" rx="55" ry="8" fill="var(--color-cosmic-lavender)" opacity="0.15" />

      {stage === 1 && (
        <>
          <circle cx="100" cy="190" r="6" fill="var(--color-cosmic-gold)" />
          <path d="M100 196 Q100 200 100 205" stroke="var(--color-cosmic-lavender)" strokeWidth="2" fill="none" />
        </>
      )}

      {stage >= 2 && (
        <>
          <path
            d="M100 205 L100 150"
            stroke="var(--color-cosmic-lavender)"
            strokeWidth={stage >= 3 ? 6 : 4}
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="100" cy="140" r={stage >= 3 ? 22 : 14} fill="var(--color-cosmic-gold)" opacity="0.85" />
        </>
      )}

      {stage >= 3 && (
        <>
          <path d="M100 170 Q75 155 65 130" stroke="var(--color-cosmic-lavender)" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M100 170 Q125 155 135 130" stroke="var(--color-cosmic-lavender)" strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx="65" cy="122" r="16" fill="var(--color-cosmic-gold)" opacity="0.75" />
          <circle cx="135" cy="122" r="16" fill="var(--color-cosmic-gold)" opacity="0.75" />
        </>
      )}

      {stage >= 4 && (
        <>
          <path d="M100 150 Q60 130 45 95" stroke="var(--color-cosmic-lavender)" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M100 150 Q140 130 155 95" stroke="var(--color-cosmic-lavender)" strokeWidth="5" fill="none" strokeLinecap="round" />
          <circle cx="100" cy="100" r="38" fill="var(--color-cosmic-gold)" opacity="0.9" />
          <circle cx="55" cy="90" r="22" fill="var(--color-cosmic-gold)" opacity="0.75" />
          <circle cx="145" cy="90" r="22" fill="var(--color-cosmic-gold)" opacity="0.75" />
        </>
      )}

      {stage === 5 && (
        <>
          {[
            [70, 60], [130, 55], [100, 40], [50, 100], [150, 100], [100, 130],
          ].map(([cx, cy], i) => (
            <g key={i}>
              <path
                d={`M${cx} ${cy} l3 -3 l1.5 3 l3 0 l-2.4 2.4 l0.9 3.3 l-2.9 -1.9 l-2.9 1.9 l0.9 -3.3 l-2.4 -2.4 z`}
                fill="var(--color-cosmic-lavender-light)"
              />
            </g>
          ))}
          <circle cx="100" cy="95" r="12" fill="var(--color-cosmic-lavender-light)" opacity="0.9" />
        </>
      )}
    </svg>
  );
}

export default function GrowthTree() {
  const [level, setLevel] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/gamification/me')
      .then((res) => setLevel(res.data.level))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stage = stageForLevel(level);
  const nextThreshold = { 1: 2, 2: 4, 3: 7, 4: 11, 5: null }[stage];

  return (
    <div className="relative rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 p-5 overflow-hidden">
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full bg-gradient-to-br from-cosmic-lavender/25 to-cosmic-gold/20 blur-3xl pointer-events-none" />

      <div className="relative flex items-center justify-between mb-2">
        <h3 className="font-bold text-xl text-cosmic-lavender-light">Your Dream Tree</h3>
        {!loading && (
          <span className="text-xs text-cosmic-star/60 bg-white/5 px-2 py-1 rounded-full">
            {nextThreshold ? `Next stage at Lv.${nextThreshold}` : 'Fully bloomed 🌟'}
          </span>
        )}
      </div>
      <div className="relative h-44 flex items-center justify-center">
        {loading ? (
          <p className="text-cosmic-star/40 text-sm">Loading...</p>
        ) : (
          <TreeSvg stage={stage} />
        )}
      </div>
      {!loading && (
        <p className="relative text-center text-sm font-bold bg-gradient-to-r from-cosmic-gold to-cosmic-lavender-light bg-clip-text text-transparent">
          {STAGE_LABELS[stage]}
        </p>
      )}
    </div>
  );
}