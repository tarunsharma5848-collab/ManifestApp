import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function DreamSwitcher() {
  const [dreams, setDreams] = useState([]);
  const [activeDreamId, setActiveDreamId] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const res = await api.get('/dreams');
      setDreams(res.data.dreams);
      setActiveDreamId(res.data.activeDreamId);
    } catch (err) {
      // silent — sidebar shouldn't block on this
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSwitch = async (id) => {
    if (id === activeDreamId) {
      setOpen(false);
      return;
    }
    try {
      await api.patch(`/dreams/${id}/activate`);
      // Full reload is intentional: every page's data (goals, journal,
      // affirmations, vision board, dashboard) is scoped server-side to the
      // active dream, so the simplest correct refresh is a hard reload
      // rather than trying to re-sync a dozen components' local state.
      window.location.href = '/';
    } catch (err) {
      setOpen(false);
    }
  };

  const activeDream = dreams.find((d) => d.id === activeDreamId);

  if (loading) return null;

  if (dreams.length === 0) {
    return (
      <button
        onClick={() => navigate('/dreams')}
        className="w-full text-left rounded-lg bg-cosmic-navy border border-cosmic-gold/40 px-3 py-2 text-xs text-cosmic-gold mb-4"
      >
        + Create your first dream
      </button>
    );
  }

  return (
    <div className="relative mb-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left rounded-lg bg-cosmic-navy border border-cosmic-lavender/20 px-3 py-2 flex items-center justify-between"
      >
        <span className="text-xs text-cosmic-star truncate">
          {activeDream ? activeDream.title : 'Select a dream'}
        </span>
        <span className="text-cosmic-star/40 text-xs shrink-0 ml-2">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg bg-cosmic-navy-light border border-cosmic-lavender/20 shadow-lg overflow-hidden">
          {dreams.map((d) => (
            <button
              key={d.id}
              onClick={() => handleSwitch(d.id)}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-cosmic-navy transition ${
                d.id === activeDreamId ? 'text-cosmic-gold' : 'text-cosmic-star/80'
              }`}
            >
              {d.title}
            </button>
          ))}
          <button
            onClick={() => {
              setOpen(false);
              navigate('/dreams');
            }}
            className="w-full text-left px-3 py-2 text-xs text-cosmic-lavender-light border-t border-cosmic-lavender/10"
          >
            + New dream / manage
          </button>
        </div>
      )}
    </div>
  );
}
