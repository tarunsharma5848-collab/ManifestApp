import { useEffect } from 'react';
import { useXp } from '../context/XpContext';

// Fixes bug: "Crossed into Level 2 and nothing happened — no toast, no
// animation, no confetti." Auto-dismisses after 3.5s.
export default function LevelUpToast() {
  const { levelUpEvent, dismissLevelUp } = useXp();

  useEffect(() => {
    if (!levelUpEvent) return;
    const timer = setTimeout(dismissLevelUp, 3500);
    return () => clearTimeout(timer);
  }, [levelUpEvent]);

  if (!levelUpEvent) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-[levelUpIn_0.4s_ease-out]">
      <div className="rounded-2xl bg-gradient-to-r from-cosmic-gold to-cosmic-lavender-light text-cosmic-navy-deep font-bold px-6 py-3 shadow-[0_0_30px_rgba(212,175,106,0.5)] flex items-center gap-2">
        <span className="text-xl">🎉</span>
        <span>Level {levelUpEvent.level} unlocked!</span>
      </div>
      <style>{`
        @keyframes levelUpIn {
          0% { opacity: 0; transform: translate(-50%, -20px) scale(0.9); }
          100% { opacity: 1; transform: translate(-50%, 0) scale(1); }
        }
      `}</style>
    </div>
  );
}
