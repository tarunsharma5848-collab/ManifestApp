import { useEffect, useState } from 'react';
import api from '../api/client';

export default function XpBar() {
  const [status, setStatus] = useState(null);

  const load = async () => {
    try {
      const res = await api.get('/gamification/me');
      setStatus(res.data);
    } catch (err) {
      // XP bar is decorative — fail silently, don't block the sidebar
    }
  };

  useEffect(() => {
    load();
    // Refresh when any XP-earning action fires elsewhere in the app.
    const handler = () => load();
    window.addEventListener('manifest:xp-changed', handler);
    return () => window.removeEventListener('manifest:xp-changed', handler);
  }, []);

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
