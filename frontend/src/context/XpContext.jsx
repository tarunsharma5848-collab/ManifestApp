import { createContext, useContext, useEffect, useRef, useState } from 'react';
import api from '../api/client';

const XpContext = createContext(null);

// Single source of truth for XP/level/badges. Every component that needs
// this data reads from here instead of doing its own fetch — this is what
// fixes "two components reading the same value, disagreeing": there's only
// ever one fetch, one piece of state, and every consumer re-renders together.
export function XpProvider({ children }) {
  const [status, setStatus] = useState(null);
  const [levelUpEvent, setLevelUpEvent] = useState(null); // { level } | null
  const prevLevelRef = useRef(null);

  const refresh = async () => {
    try {
      const res = await api.get('/gamification/me');
      const next = res.data;

      if (prevLevelRef.current !== null && next.level > prevLevelRef.current) {
        setLevelUpEvent({ level: next.level });
      }
      prevLevelRef.current = next.level;

      setStatus(next);
    } catch (err) {
      // XP status is supplementary — fail silently, don't block the app
    }
  };

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener('manifest:xp-changed', handler);
    return () => window.removeEventListener('manifest:xp-changed', handler);
  }, []);

  const dismissLevelUp = () => setLevelUpEvent(null);

  return (
    <XpContext.Provider value={{ status, refresh, levelUpEvent, dismissLevelUp }}>
      {children}
    </XpContext.Provider>
  );
}

export function useXp() {
  const ctx = useContext(XpContext);
  if (!ctx) throw new Error('useXp must be used within an XpProvider');
  return ctx;
}
