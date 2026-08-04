import { useEffect, useState } from 'react';
import api from '../api/client';
import VoiceRecorder from '../components/VoiceRecorder';
import ConfirmDialog from '../components/ConfirmDialog';

const MAX_LENGTH = 200;

export default function Affirmations() {
  const [affirmations, setAffirmations] = useState([]);
  const [today, setToday] = useState(null);
  const [newText, setNewText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [confirmId, setConfirmId] = useState(null);

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

  const isDuplicate = (text) =>
    affirmations.some((a) => a.text.trim().toLowerCase() === text.trim().toLowerCase());

  const handleAdd = async (e) => {
    e.preventDefault();
    const text = newText.trim();

    // Fix: was failing silently on empty submit with no feedback at all.
    if (!text) {
      setFieldError('Write something before adding it.');
      return;
    }
    if (text.length > MAX_LENGTH) {
      setFieldError(`Keep it under ${MAX_LENGTH} characters.`);
      return;
    }
    if (isDuplicate(text)) {
      setFieldError("You've already added this exact affirmation.");
      return;
    }

    setFieldError('');
    try {
      const res = await api.post('/affirmations', { text });
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

  const confirmDelete = async () => {
    const id = confirmId;
    setConfirmId(null);
    const prev = affirmations;
    setAffirmations((cur) => cur.filter((a) => a.id !== id));
    try {
      await api.delete(`/affirmations/${id}`);
      // Reverses the XP earned on add — keeps the dashboard/sidebar in sync.
      window.dispatchEvent(new Event('manifest:xp-changed'));
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

      <form onSubmit={handleAdd} className="mb-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={newText}
            onChange={(e) => {
              setNewText(e.target.value);
              if (fieldError) setFieldError('');
            }}
            maxLength={MAX_LENGTH}
            placeholder="I am aligned with everything I desire..."
            className={`flex-1 rounded-lg bg-cosmic-navy-light border px-4 py-2 text-cosmic-star placeholder:text-cosmic-star/40 focus:outline-none ${
              fieldError ? 'border-red-400/60' : 'border-cosmic-lavender/30 focus:border-cosmic-gold'
            }`}
          />
          <button
            type="submit"
            className="rounded-lg bg-cosmic-gold text-cosmic-navy-deep text-sm font-medium px-4 py-2 hover:bg-cosmic-gold-light transition"
          >
            Add
          </button>
        </div>
        <div className="flex items-center justify-between mt-1">
          {fieldError ? (
            <p className="text-xs text-red-400">{fieldError}</p>
          ) : (
            <span />
          )}
          <p className="text-xs text-cosmic-star/30">{newText.length}/{MAX_LENGTH}</p>
        </div>
      </form>

      <div className="space-y-2 mt-4">
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
            <div className="flex items-center gap-4 shrink-0">
              <button
                onClick={() => handleToggle(a.id)}
                className="text-xs text-cosmic-lavender-light underline"
              >
                {a.is_active ? 'Deactivate' : 'Activate'}
              </button>
              {/* Moved further from Deactivate + confirm added, so a misclick can't
                  permanently delete data (was ~20px away with no confirmation). */}
              <button
                onClick={() => setConfirmId(a.id)}
                className="text-xs text-red-400/70 hover:text-red-400 ml-2 pl-2 border-l border-cosmic-lavender/10"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={confirmId !== null}
        title="Delete this affirmation?"
        message="This can't be undone."
        onConfirm={confirmDelete}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}
