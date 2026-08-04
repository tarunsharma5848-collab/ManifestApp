import { useXp } from '../context/XpContext';

// Now reads from the shared XpContext (single source of truth) instead of
// doing its own independent fetch. Fixes bug: dashboard and sidebar XP
// disagreeing after an action like the reward wheel spin.
export default function XpBar() {
  const { status } = useXp();

  if (!status) return null;

  const pct = Math.round((status.xpIntoLevel / status.xpPerLevel) * 100);

  return (
    <div className="px-1">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-cosmic-gold font-medium">Level {status.level}</span>
        <span className="text-cosmic-star/40">
          {status.xpIntoLevel}/{status.xpPerLevel} XP
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-cosmic-navy overflow-hidden">
        <div
          className="h-full bg-cosmic-gold transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
