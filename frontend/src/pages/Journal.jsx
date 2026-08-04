import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import ConfirmDialog from '../components/ConfirmDialog';

const SESSIONS = [
  { key: '3', label: 'Morning', count: 3 },
  { key: '6', label: 'Afternoon', count: 6 },
  { key: '9', label: 'Evening', count: 9 },
];
const CONTENT_MAX = 3000;

export default function Journal() {
  const [entries, setEntries] = useState([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [search, setSearch] = useState('');

  // --- 369 method state ---
  // Real implementation: pick a session (3/6/9 reps), then actually write
  // the intention that many times — this is the actual 369 practice, not
  // just a plain textarea with copy in the subtitle.
  const [session, setSession] = useState(SESSIONS[0]);
  const [lines, setLines] = useState(Array(SESSIONS[0].count).fill(''));

  // --- Edit state ---
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');

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

  const changeSession = (s) => {
    setSession(s);
    setLines(Array(s.count).fill(''));
    setFieldError('');
  };

  const updateLine = (i, value) => {
    setLines((prev) => {
      const next = [...prev];
      next[i] = value;
      return next;
    });
  };

  const filledCount = lines.filter((l) => l.trim()).length;
  const combinedContent = lines.map((l, i) => `${i + 1}. ${l.trim()}`).join('\n');

  const handleSave = async (e) => {
    e.preventDefault();

    if (filledCount === 0) {
      setFieldError('Write your intention at least once before saving.');
      return;
    }
    if (filledCount < session.count) {
      setFieldError(`Fill in all ${session.count} lines (${filledCount}/${session.count} so far) — that's the whole point of the 369 method.`);
      return;
    }
    const content = `[${session.label} ×${session.count}]\n${combinedContent}`;
    if (content.length > CONTENT_MAX) {
      setFieldError(`Entry is too long — keep it under ${CONTENT_MAX} characters.`);
      return;
    }

    setFieldError('');
    setSaving(true);
    try {
      const res = await api.post('/journal', { content, method: '369' });
      setEntries((prev) => [res.data.entry, ...prev]);
      window.dispatchEvent(new Event('manifest:xp-changed'));
      setLines(Array(session.count).fill(''));
      const streakRes = await api.get('/journal/streak');
      setStreak(streakRes.data.streak);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save entry');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    const id = confirmId;
    setConfirmId(null);
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

  const startEdit = (entry) => {
    setEditingId(entry.id);
    setEditContent(entry.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const saveEdit = async (id) => {
    if (!editContent.trim()) return;
    try {
      const res = await api.patch(`/journal/${id}`, { content: editContent.trim() });
      setEntries((prev) => prev.map((e) => (e.id === id ? res.data.entry : e)));
      setEditingId(null);
    } catch (err) {
      setError('Could not update entry');
    }
  };

  const filteredEntries = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.trim().toLowerCase();
    return entries.filter((e) => e.content.toLowerCase().includes(q));
  }, [entries, search]);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display text-3xl text-cosmic-gold">Journal</h2>
        <span className="text-sm text-cosmic-lavender-light">
          🔥 {streak} day{streak === 1 ? '' : 's'} streak
        </span>
      </div>
      <p className="text-cosmic-star/60 mb-6">
        369 method: write your intention 3, 6, and 9 times across the day.
      </p>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <form onSubmit={handleSave} className="mb-8 rounded-xl bg-cosmic-navy-light border border-cosmic-lavender/20 p-4">
        <div className="flex gap-2 mb-4">
          {SESSIONS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => changeSession(s)}
              className={`flex-1 rounded-lg border px-3 py-2 text-xs text-center transition ${
                session.key === s.key
                  ? 'border-cosmic-gold bg-cosmic-navy text-cosmic-gold'
                  : 'border-cosmic-lavender/20 text-cosmic-star/70 hover:border-cosmic-lavender/40'
              }`}
            >
              {s.label} ×{s.count}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {lines.map((line, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-cosmic-star/40 w-5 shrink-0 text-right">{i + 1}.</span>
              <input
                type="text"
                value={line}
                onChange={(e) => updateLine(i, e.target.value)}
                placeholder="I am so grateful now that..."
                className="flex-1 rounded-lg bg-cosmic-navy border border-cosmic-lavender/30 px-3 py-2 text-sm text-cosmic-star placeholder:text-cosmic-star/40 focus:outline-none focus:border-cosmic-gold"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-cosmic-star/50">
            {filledCount}/{session.count} written
          </p>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-cosmic-gold text-cosmic-navy-deep text-sm font-medium px-4 py-2 hover:bg-cosmic-gold-light transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Entry'}
          </button>
        </div>
        {fieldError && <p className="text-xs text-red-400 mt-2">{fieldError}</p>}
      </form>

      {entries.length > 0 && (
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your entries..."
          className="w-full rounded-lg bg-cosmic-navy-light border border-cosmic-lavender/30 px-4 py-2 text-sm text-cosmic-star placeholder:text-cosmic-star/40 focus:outline-none focus:border-cosmic-gold mb-4"
        />
      )}

      {loading ? (
        <p className="text-cosmic-star/50">Loading...</p>
      ) : entries.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-cosmic-lavender/30 p-12 text-center text-cosmic-star/50">
          No entries yet. Write your first one above.
        </div>
      ) : filteredEntries.length === 0 ? (
        <p className="text-cosmic-star/50 text-sm">No entries match "{search}".</p>
      ) : (
        <div className="space-y-3">
          {filteredEntries.map((e) => (
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
                {editingId === e.id ? (
                  <div className="flex gap-3">
                    <button onClick={() => saveEdit(e.id)} className="text-xs text-cosmic-gold underline">
                      Save
                    </button>
                    <button onClick={cancelEdit} className="text-xs text-cosmic-star/50 underline">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => startEdit(e)}
                      className="text-xs text-cosmic-lavender-light underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmId(e.id)}
                      className="text-xs text-red-400/70 hover:text-red-400 pl-3 border-l border-cosmic-lavender/10"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
              {editingId === e.id ? (
                <textarea
                  value={editContent}
                  onChange={(ev) => setEditContent(ev.target.value)}
                  maxLength={CONTENT_MAX}
                  rows={5}
                  className="w-full rounded-lg bg-cosmic-navy border border-cosmic-gold/40 px-3 py-2 text-sm text-cosmic-star focus:outline-none resize-none"
                />
              ) : (
                <p className="text-cosmic-star/90 whitespace-pre-wrap text-sm">{e.content}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmId !== null}
        title="Delete this entry?"
        message="This can't be undone."
        onConfirm={confirmDelete}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}
