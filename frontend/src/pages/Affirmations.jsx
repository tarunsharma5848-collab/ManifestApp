import { useEffect, useState } from 'react';
import api from '../api/client';
import VoiceRecorder from '../components/VoiceRecorder';

export default function Affirmations() {
  const [affirmations, setAffirmations] = useState([]);
  const [today, setToday] = useState(null);
  const [newText, setNewText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [listRes, todayRes] = await Promise.all([
        api.get('/affirmations'),
        api.get('/affirmations/today'),
      ]);
      setAffirmations(listRes.data.affirmations);
      setToday(todayRes.data.affirmation);
    } catch (err) {
      setError('Could not load affirmations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newText.trim()) return;
    try {
      const res = await api.post('/affirmations', { text: newText.trim() });
      setAffirmations((prev) => [res.data.affirmation, ...prev]);
      window.dispatchEvent(new Event('manifest:xp-changed'));
      setNewText('');
      if (!today) setToday(res.data.affirmation);
    } catch (err) {
      setError('Could not add affirmation');
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await api.patch(`/affirmations/${id}/toggle`);
      setAffirmations((prev) => prev.map((a) => (a.id === id ? res.data.affirmation : a)));
    } catch (err) {
      setError('Could not update affirmation');
    }
  };

  const handleDelete = async (id) => {
    const prev = affirmations;
    setAffirmations((cur) => cur.filter((a) => a.id !== id));
    try {
      await api.delete(`/affirmations/${id}`);
    } catch (err) {
      setAffirmations(prev);
      setError('Could not delete affirmation');
    }
  };

  const handleVoiceSaved = (updated) => {
    setAffirmations((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    if (today?.id === updated.id) setToday(updated);
  };

  return (
    <div>
      <h2 className="font-display text-3xl text-cosmic-gold mb-1">Affirmations</h2>
      <p className="text-cosmic-star/60 mb-8">Daily words to reprogram your reality.</p>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <div className="rounded-xl bg-cosmic-navy-light border border-cosmic-lavender/20 p-8 text-center mb-8">
        {loading ? (
          <p className="text-cosmic-star/50">Loading...</p>
        ) : today ? (
          <>
            <p className="font-display text-2xl text-cosmic-lavender-light italic mb-3">
              "{today.text}"
            </p>
            {today.audio_url && (
              <audio controls src={today.audio_url} className="mx-auto h-8" />
            )}
          </>
        ) : (
          <p className="text-cosmic-star/50">
            Add an affirmation below and mark it active to see it here.
          </p>
        )}
      </div>

      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="I am aligned with everything I desire..."
          className="flex-1 rounded-lg bg-cosmic-navy-light border border-cosmic-lavender/30 px-4 py-2 text-cosmic-star placeholder:text-cosmic-star/40 focus:outline-none focus:border-cosmic-gold"
        />
        <button
          type="submit"
          className="rounded-lg bg-cosmic-gold text-cosmic-navy-deep text-sm font-medium px-4 py-2 hover:bg-cosmic-gold-light transition"
        >
          Add
        </button>
      </form>

      <div className="space-y-2">
        {affirmations.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between gap-3 rounded-lg bg-cosmic-navy-light border border-cosmic-lavender/10 px-4 py-3"
          >
            <span className={`flex-1 ${a.is_active ? 'text-cosmic-star' : 'text-cosmic-star/40 line-through'}`}>
              {a.text}
            </span>
            <VoiceRecorder
              affirmationId={a.id}
              existingAudioUrl={a.audio_url}
              onSaved={handleVoiceSaved}
            />
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => handleToggle(a.id)}
                className="text-xs text-cosmic-lavender-light underline"
              >
                {a.is_active ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={() => handleDelete(a.id)}
                className="text-xs text-red-400/70 hover:text-red-400"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
