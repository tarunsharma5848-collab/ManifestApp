import { useEffect, useState } from 'react';
import api from '../api/client';

export default function DailySign({ goalId }) {
  const [streak, setStreak] = useState(0);
  const [signedToday, setSignedToday] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [streakRes, signsRes] = await Promise.all([
        api.get(`/goals/${goalId}/signs/streak`),
        api.get(`/goals/${goalId}/signs`),
      ]);
      setStreak(streakRes.data.streak);
      const today = new Date().toISOString().slice(0, 10);
      setSignedToday(signsRes.data.signs.some((s) => s.sign_date?.slice(0, 10) === today));
    } catch (err) {
      // silent — streak is a nice-to-have, don't block the goal card on it
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalId]);

  const handleSign = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('proof_text', text.trim());
      await api.post(`/goals/${goalId}/signs`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setText('');
      setShowInput(false);
      window.dispatchEvent(new Event('manifest:xp-changed'));
      await load();
    } catch (err) {
      // no-op, keep it lightweight
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-cosmic-lavender/10">
      <div className="flex items-center justify-between">
        <span className="text-xs text-cosmic-lavender-light">
          🔥 {streak} day{streak === 1 ? '' : 's'} sign streak
        </span>
        {!signedToday ? (
          <button
            onClick={() => setShowInput((s) => !s)}
            className="text-xs text-cosmic-gold underline"
          >
            {showInput ? 'Cancel' : 'Sign today'}
          </button>
        ) : (
          <span className="text-xs text-cosmic-gold">✓ Signed today</span>
        )}
      </div>

      {showInput && (
        <form onSubmit={handleSign} className="mt-2 flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="One small proof of progress today..."
            className="flex-1 rounded-lg bg-cosmic-navy border border-cosmic-lavender/30 px-3 py-1.5 text-xs text-cosmic-star placeholder:text-cosmic-star/40 focus:outline-none focus:border-cosmic-gold"
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-cosmic-gold text-cosmic-navy-deep text-xs font-medium px-3 py-1.5 hover:bg-cosmic-gold-light transition disabled:opacity-50"
          >
            {saving ? '...' : 'Save'}
          </button>
        </form>
      )}
    </div>
  );
}
