import { useEffect, useState } from 'react';
import api from '../api/client';

// Must match backend WHEEL_SEGMENTS order exactly (config/gamification.js).
const SEGMENTS = [5, 10, 15, 20, 30, 50];
const SEGMENT_ANGLE = 360 / SEGMENTS.length;
const COLORS = ['#B794F6', '#FF6EC7', '#C4FF61', '#B794F6', '#FF6EC7', '#C4FF61'];

function buildConicGradient() {
  const stops = SEGMENTS.map((_, i) => {
    const start = i * SEGMENT_ANGLE;
    const end = start + SEGMENT_ANGLE;
    return `${COLORS[i]} ${start}deg ${end}deg`;
  });
  return `conic-gradient(${stops.join(', ')})`;
}

export default function RewardWheel() {
  const [alreadySpun, setAlreadySpun] = useState(false);
  const [todayReward, setTodayReward] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/reward-wheel/status')
      .then((res) => {
        setAlreadySpun(res.data.alreadySpun);
        setTodayReward(res.data.todayReward);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSpin = async () => {
    if (spinning || alreadySpun) return;
    setSpinning(true);
    try {
      const res = await api.post('/reward-wheel/spin');
      const { segmentIndex, reward } = res.data;

      const segmentCenter = segmentIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
      const targetRotation = 360 * 5 + (360 - segmentCenter);
      setRotation(targetRotation);

      setTimeout(() => {
        setAlreadySpun(true);
        setTodayReward(reward);
        setSpinning(false);
        window.dispatchEvent(new Event('manifest:xp-changed'));
      }, 3200);
    } catch (err) {
      setSpinning(false);
      if (err.response?.status === 409) {
        setAlreadySpun(true);
        setTodayReward(err.response.data.todayReward);
      }
    }
  };

  return (
    <div className="relative rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 p-5 flex flex-col items-center overflow-hidden">
      <div className="absolute top-16 w-44 h-44 rounded-full bg-gradient-to-br from-cosmic-lavender/25 via-transparent to-transparent blur-3xl pointer-events-none" />

      <h3 className="relative font-bold text-xl text-cosmic-lavender-light mb-4 self-start">
        Daily Reward Wheel
      </h3>

      <div className="relative w-40 h-40 mb-4">
        <div
          className="absolute left-1/2 -translate-x-1/2 -top-1 z-10 drop-shadow-[0_0_6px_rgba(196,255,97,0.6)]"
          style={{
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '14px solid #C4FF61',
          }}
        />
        <div
          className="w-full h-full rounded-full border-4 shadow-[0_0_25px_rgba(183,148,246,0.35)]"
          style={{
            background: buildConicGradient(),
            borderColor: '#0B0B1F',
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? 'transform 3.2s cubic-bezier(0.17, 0.67, 0.16, 0.99)' : 'none',
          }}
        >
          {SEGMENTS.map((val, i) => {
            const angle = i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
            return (
              <span
                key={i}
                className="absolute text-[10px] font-extrabold text-cosmic-navy-deep"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${angle}deg) translate(0, -58px) rotate(${-angle}deg) translate(-50%, -50%)`,
                }}
              >
                +{val}
              </span>
            );
          })}
        </div>
      </div>

      {loading ? (
        <p className="text-cosmic-star/40 text-sm">Loading...</p>
      ) : alreadySpun ? (
        <p className="relative text-sm font-bold bg-white/5 px-3 py-1.5 rounded-full bg-gradient-to-r from-cosmic-gold to-cosmic-lavender-light bg-clip-text text-transparent">
          {spinning ? 'Spinning...' : `You won +${todayReward} XP today! Come back tomorrow.`}
        </p>
      ) : (
        <button
          onClick={handleSpin}
          disabled={spinning}
          className="relative rounded-full bg-gradient-to-r from-[#B794F6] to-[#FF6EC7] text-cosmic-navy-deep text-sm font-bold px-6 py-2.5 hover:brightness-110 hover:-translate-y-0.5 transition disabled:opacity-50 shadow-[0_0_20px_rgba(255,110,199,0.35)]"
        >
          {spinning ? 'Spinning...' : 'Spin for XP ✨'}
        </button>
      )}
    </div>
  );
}