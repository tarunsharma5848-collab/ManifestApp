import { useEffect, useState } from 'react';
import api from '../api/client';

export default function Journal() {
  const [entries, setEntries] = useState([]);
  const [streak, setStreak] = useState(0);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [entriesRes, streakRes] = await Promise.all([
        api.get('/journal'),
        api.get('/journal/streak'),
      ]);
      setEntries(entriesRes.data.entries);
      setStreak(streakRes.data.streak);
    } catch (err) {
      setError('Could not load journal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    try {
      const res = await api.post('/journal', { content: content.trim(), method: '369' });
      setEntries((prev) => [res.data.entry, ...prev]);
      window.dispatchEvent(new Event('manifest:xp-changed'));
      setContent('');
      const streakRes = await api.get('/journal/streak');
      setStreak(streakRes.data.streak);
    } catch (err) {
      setError('Could not save entry');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const prev = entries;
    setEntries((cur) => cur.filter((e) => e.id !== id));
    try {
      await api.delete(`/journal/${id}`);
      const streakRes = await api.get('/journal/streak');
      setStreak(streakRes.data.streak);
    } catch (err) {
      setEntries(prev);
      setError('Could not delete entry');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display text-3xl text-cosmic-gold">Journal</h2>
        <span className="text-sm text-cosmic-lavender-light">
          🔥 {streak} day{streak === 1 ? '' : 's'} streak
        </span>
      </div>
      <p className="text-cosmic-star/60 mb-8">
        369 method: write your intention 3, 6, and 9 times.
      </p>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <form onSubmit={handleSave} className="mb-8">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          placeholder="I am so grateful now that..."
          className="w-full rounded-lg bg-cosmic-navy-light border border-cosmic-lavender/30 px-4 py-3 text-cosmic-star placeholder:text-cosmic-star/40 focus:outline-none focus:border-cosmic-gold resize-none"
        />
        <button
          type="submit"
          disabled={saving}
          className="mt-3 rounded-lg bg-cosmic-gold text-cosmic-navy-deep text-sm font-medium px-4 py-2 hover:bg-cosmic-gold-light transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Entry'}
        </button>
      </form>

      {loading ? (
        <p className="text-cosmic-star/50">Loading...</p>
      ) : entries.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-cosmic-lavender/30 p-12 text-center text-cosmic-star/50">
          No entries yet. Write your first one above.
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((e) => (
            <div
              key={e.id}
              className="rounded-lg bg-cosmic-navy-light border border-cosmic-lavender/10 p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-cosmic-lavender-light">
                  {new Date(e.entry_date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
                <button
                  onClick={() => handleDelete(e.id)}
                  className="text-xs text-red-400/70 hover:text-red-400"
                >
                  Delete
                </button>
              </div>
              <p className="text-cosmic-star/90 whitespace-pre-wrap text-sm">{e.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
