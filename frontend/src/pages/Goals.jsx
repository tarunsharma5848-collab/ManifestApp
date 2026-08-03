import { useEffect, useState } from 'react';
import api from '../api/client';
import DailySign from '../components/DailySign';

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    try {
      const res = await api.get('/goals');
      setGoals(res.data.goals);
    } catch (err) {
      setError('Could not load goals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const res = await api.post('/goals', {
        title: title.trim(),
        description: description.trim(),
        target_date: targetDate || null,
      });
      setGoals((prev) => [res.data.goal, ...prev]);
      setTitle('');
      setDescription('');
      setTargetDate('');
      setShowForm(false);
    } catch (err) {
      setError('Could not add goal');
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await api.patch(`/goals/${id}/toggle`);
      setGoals((prev) => prev.map((g) => (g.id === id ? res.data.goal : g)));
      if (res.data.xp) window.dispatchEvent(new Event('manifest:xp-changed'));
    } catch (err) {
      setError('Could not update goal');
    }
  };

  const handleDelete = async (id) => {
    const prev = goals;
    setGoals((cur) => cur.filter((g) => g.id !== id));
    try {
      await api.delete(`/goals/${id}`);
    } catch (err) {
      setGoals(prev);
      setError('Could not delete goal');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display text-3xl text-cosmic-gold">Goals</h2>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-lg bg-cosmic-gold text-cosmic-navy-deep text-sm font-medium px-4 py-2 hover:bg-cosmic-gold-light transition"
        >
          {showForm ? 'Cancel' : '+ Add Goal'}
        </button>
      </div>
      <p className="text-cosmic-star/60 mb-8">
        Track the milestones on the way to your vision.
      </p>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="rounded-xl bg-cosmic-navy-light border border-cosmic-lavender/20 p-5 mb-6 space-y-3"
        >
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Goal title"
            className="w-full rounded-lg bg-cosmic-navy border border-cosmic-lavender/30 px-4 py-2 text-cosmic-star placeholder:text-cosmic-star/40 focus:outline-none focus:border-cosmic-gold"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Description (optional)"
            className="w-full rounded-lg bg-cosmic-navy border border-cosmic-lavender/30 px-4 py-2 text-cosmic-star placeholder:text-cosmic-star/40 focus:outline-none focus:border-cosmic-gold resize-none"
          />
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full rounded-lg bg-cosmic-navy border border-cosmic-lavender/30 px-4 py-2 text-cosmic-star focus:outline-none focus:border-cosmic-gold"
          />
          <button
            type="submit"
            className="rounded-lg bg-cosmic-gold text-cosmic-navy-deep text-sm font-medium px-4 py-2 hover:bg-cosmic-gold-light transition"
          >
            Save Goal
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-cosmic-star/50">Loading...</p>
      ) : goals.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-cosmic-lavender/30 p-12 text-center text-cosmic-star/50">
          No goals yet. Click "+ Add Goal" to set your first one.
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((g) => (
            <div
              key={g.id}
              className={`rounded-lg border p-4 ${
                g.status === 'achieved'
                  ? 'bg-cosmic-navy-light border-cosmic-gold/40'
                  : 'bg-cosmic-navy-light border-cosmic-lavender/10'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3
                    className={`font-display text-lg ${
                      g.status === 'achieved'
                        ? 'text-cosmic-gold line-through'
                        : 'text-cosmic-lavender-light'
                    }`}
                  >
                    {g.title}
                  </h3>
                  {g.description && (
                    <p className="text-sm text-cosmic-star/60 mt-1">{g.description}</p>
                  )}
                  {g.target_date && (
                    <p className="text-xs text-cosmic-star/40 mt-1">
                      Target:{' '}
                      {new Date(g.target_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button
                    onClick={() => handleToggle(g.id)}
                    className="text-xs text-cosmic-lavender-light underline whitespace-nowrap"
                  >
                    {g.status === 'achieved' ? 'Mark in progress' : 'Mark achieved'}
                  </button>
                  <button
                    onClick={() => handleDelete(g.id)}
                    className="text-xs text-red-400/70 hover:text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {g.status !== 'achieved' && <DailySign goalId={g.id} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
