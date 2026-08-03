import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

const CATEGORIES = [
  { id: 'dream_job', label: '💼 Dream Job' },
  { id: 'money', label: '💰 Money' },
  { id: 'relationship', label: '❤️ Relationship' },
  { id: 'health', label: '💪 Health' },
  { id: 'dream_house', label: '🏡 Dream House' },
  { id: 'dream_car', label: '🚗 Dream Car' },
  { id: 'education', label: '🎓 Education' },
  { id: 'business', label: '📈 Business' },
  { id: 'travel', label: '✈️ Travel' },
  { id: 'custom', label: '✨ Custom Dream' },
];

export default function Dreams() {
  const [dreams, setDreams] = useState([]);
  const [activeDreamId, setActiveDreamId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [whyReason, setWhyReason] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [lifeChange, setLifeChange] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [creating, setCreating] = useState(false);

  const navigate = useNavigate();

  const load = async () => {
    try {
      const res = await api.get('/dreams');
      setDreams(res.data.dreams);
      setActiveDreamId(res.data.activeDreamId);
      if (res.data.dreams.length === 0) setShowForm(true);
    } catch (err) {
      setError('Could not load dreams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const checkDuplicateDebounced = async (value) => {
    if (!value.trim()) {
      setDuplicateWarning(null);
      return;
    }
    try {
      const res = await api.get('/dreams/check-duplicate', { params: { title: value } });
      setDuplicateWarning(res.data.possibleDuplicate);
    } catch (err) {
      // non-critical, ignore
    }
  };

  const handleTitleChange = (value) => {
    setTitle(value);
    checkDuplicateDebounced(value);
  };

  const resetForm = () => {
    setCategory('');
    setTitle('');
    setWhyReason('');
    setTargetDate('');
    setLifeChange('');
    setDuplicateWarning(null);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !category) return;
    setCreating(true);
    setError('');
    try {
      const res = await api.post('/dreams', {
        title: title.trim(),
        category,
        why_reason: whyReason.trim(),
        target_date: targetDate || null,
        life_change: lifeChange.trim(),
      });
      resetForm();
      setShowForm(false);
      // New dream is auto-activated server-side — reload so every page
      // picks up the new active dream's (empty) data.
      window.location.href = '/';
    } catch (err) {
      setError('Could not create dream');
    } finally {
      setCreating(false);
    }
  };

  const handleActivate = async (id) => {
    try {
      await api.patch(`/dreams/${id}/activate`);
      window.location.href = '/';
    } catch (err) {
      setError('Could not switch dream');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/dreams/${id}`);
      load();
    } catch (err) {
      setError('Could not delete dream');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display text-3xl text-cosmic-gold">Your Dreams</h2>
        {dreams.length > 0 && (
          <button
            onClick={() => {
              resetForm();
              setShowForm((s) => !s);
            }}
            className="rounded-lg bg-cosmic-gold text-cosmic-navy-deep text-sm font-medium px-4 py-2 hover:bg-cosmic-gold-light transition"
          >
            {showForm ? 'Cancel' : '+ New Dream'}
          </button>
        )}
      </div>
      <p className="text-cosmic-star/60 mb-8">
        Each dream is its own workspace — vision board, goals, journal, affirmations, all connected.
      </p>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl bg-cosmic-navy-light border border-cosmic-lavender/20 p-6 mb-8 space-y-4"
        >
          <div>
            <p className="text-sm text-cosmic-lavender-light mb-2">What do you want to manifest?</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`rounded-lg border px-2 py-3 text-xs text-center transition ${
                    category === c.id
                      ? 'border-cosmic-gold bg-cosmic-navy text-cosmic-gold'
                      : 'border-cosmic-lavender/20 text-cosmic-star/70 hover:border-cosmic-lavender/40'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-cosmic-lavender-light block mb-1">What is your dream?</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Become a Frontend Developer at a top product company"
              className="w-full rounded-lg bg-cosmic-navy border border-cosmic-lavender/30 px-4 py-2 text-cosmic-star placeholder:text-cosmic-star/40 focus:outline-none focus:border-cosmic-gold"
            />
            {duplicateWarning && (
              <p className="text-xs text-cosmic-gold mt-1">
                You already have a dream called "{duplicateWarning.title}" — this looks similar. You can
                still create a new one if it's genuinely different.
              </p>
            )}
          </div>

          <div>
            <label className="text-sm text-cosmic-lavender-light block mb-1">Why do you want it?</label>
            <textarea
              value={whyReason}
              onChange={(e) => setWhyReason(e.target.value)}
              rows={2}
              placeholder="What's driving this dream?"
              className="w-full rounded-lg bg-cosmic-navy border border-cosmic-lavender/30 px-4 py-2 text-cosmic-star placeholder:text-cosmic-star/40 focus:outline-none focus:border-cosmic-gold resize-none"
            />
          </div>

          <div>
            <label className="text-sm text-cosmic-lavender-light block mb-1">When do you want to achieve it?</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full rounded-lg bg-cosmic-navy border border-cosmic-lavender/30 px-4 py-2 text-cosmic-star focus:outline-none focus:border-cosmic-gold"
            />
          </div>

          <div>
            <label className="text-sm text-cosmic-lavender-light block mb-1">
              How will your life change after achieving it?
            </label>
            <textarea
              value={lifeChange}
              onChange={(e) => setLifeChange(e.target.value)}
              rows={2}
              placeholder="Paint the picture..."
              className="w-full rounded-lg bg-cosmic-navy border border-cosmic-lavender/30 px-4 py-2 text-cosmic-star placeholder:text-cosmic-star/40 focus:outline-none focus:border-cosmic-gold resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={creating || !title.trim() || !category}
            className="w-full rounded-lg bg-cosmic-gold text-cosmic-navy-deep font-medium py-3 hover:bg-cosmic-gold-light transition disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Start This Journey'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-cosmic-star/50">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {dreams.map((d) => (
            <div
              key={d.id}
              className={`rounded-xl border p-5 ${
                d.id === activeDreamId
                  ? 'border-cosmic-gold/50 bg-cosmic-navy-light'
                  : 'border-cosmic-lavender/20 bg-cosmic-navy-light/60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-xl text-cosmic-lavender-light">{d.title}</h3>
                  <p className="text-xs text-cosmic-star/50 mt-0.5 capitalize">
                    {d.category?.replace('_', ' ')}
                  </p>
                  {d.why_reason && (
                    <p className="text-sm text-cosmic-star/70 mt-2">{d.why_reason}</p>
                  )}
                </div>
                {d.id === activeDreamId && (
                  <span className="text-xs text-cosmic-gold shrink-0">Active</span>
                )}
              </div>
              <div className="flex gap-3 mt-4">
                {d.id !== activeDreamId && (
                  <button
                    onClick={() => handleActivate(d.id)}
                    className="text-xs text-cosmic-gold underline"
                  >
                    Continue this journey
                  </button>
                )}
                <button
                  onClick={() => handleDelete(d.id)}
                  className="text-xs text-red-400/70 hover:text-red-400"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
