import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../api/client';
import GrowthTree from '../components/GrowthTree';
import RewardWheel from '../components/RewardWheel';

// Gen-Z stat card: glass surface, gradient border glow, bigger punchy number
function StatCard({ label, value, sub, icon }) {
  return (
    <div className="relative rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 p-5 overflow-hidden group hover:border-cosmic-gold/40 transition">
      <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br from-cosmic-lavender/30 to-cosmic-gold/20 blur-2xl pointer-events-none" />
      <div className="relative">
        {icon && <p className="text-lg mb-1">{icon}</p>}
        <p className="text-4xl font-extrabold bg-gradient-to-r from-cosmic-gold to-cosmic-lavender-light bg-clip-text text-transparent">
          {value}
        </p>
        <p className="text-sm text-cosmic-star mt-1 font-medium">{label}</p>
        {sub && <p className="text-xs text-cosmic-star/50 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.get('/dashboard/stats'), api.get('/gamification/me')])
      .then(([statsRes, gamificationRes]) => {
        setStats(statsRes.data);
        setBadges(gamificationRes.data.badges);
      })
      .catch((err) => {
        if (err.response?.status === 400) {
          navigate('/dreams');
        }
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const earnedBadges = badges.filter((b) => b.earned);
  const lockedBadges = badges.filter((b) => !b.earned);

  return (
    <div>
      <h2 className="font-extrabold text-3xl sm:text-4xl tracking-tight bg-gradient-to-r from-cosmic-gold via-cosmic-lavender-light to-cosmic-gold bg-clip-text text-transparent mb-1">
        {stats?.dreamTitle ? `Continue your "${stats.dreamTitle}" journey` : 'Welcome back'}
      </h2>
      <p className="text-cosmic-star/60 mb-8">Here's your manifestation snapshot.</p>

      {loading || !stats ? (
        <p className="text-cosmic-star/50">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard icon="⚡" label="Level" value={stats.level} sub={`${stats.xpIntoLevel}/${stats.xpPerLevel} XP`} />
            <StatCard
              icon="🎯"
              label="Goals Achieved"
              value={stats.goalsAchieved}
              sub={`${stats.goalsInProgress} in progress`}
            />
            <StatCard icon="🖼️" label="Vision Board" value={stats.visionBoardCount} sub="images pinned" />
            <StatCard
              icon="✨"
              label="Affirmations"
              value={stats.affirmationsActive}
              sub={`${stats.affirmationsTotal} total`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <GrowthTree />
            <RewardWheel />
          </div>

          <div className="rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 p-5 mb-6">
            <h3 className="font-bold text-xl text-cosmic-lavender-light mb-4">
              Journal activity — last 14 days
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats.journalActivity}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d4af6a" />
                    <stop offset="100%" stopColor="#b9a6dc" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(185,166,220,0.1)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#f5f0e6', fontSize: 10, opacity: 0.5 }}
                  axisLine={{ stroke: 'rgba(185,166,220,0.2)' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#f5f0e6', fontSize: 10, opacity: 0.5 }}
                  axisLine={false}
                  tickLine={false}
                  width={24}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0b0f2b',
                    border: '1px solid rgba(185,166,220,0.3)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: '#f5f0e6' }}
                  itemStyle={{ color: '#d4af6a' }}
                />
                <Bar dataKey="count" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-xl text-cosmic-lavender-light">Badges</h3>
              <span className="text-xs text-cosmic-star/50 bg-white/5 px-2 py-1 rounded-full">
                {stats.badgesEarned}/{stats.badgesTotal} earned
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[...earnedBadges, ...lockedBadges].map((b) => (
                <div
                  key={b.key}
                  className={`rounded-xl border p-3 text-center transition ${
                    b.earned
                      ? 'border-cosmic-gold/40 bg-gradient-to-br from-cosmic-gold/10 to-cosmic-lavender/10'
                      : 'border-white/10 opacity-40'
                  }`}
                >
                  <p className="text-xl mb-1">{b.earned ? '🏅' : '🔒'}</p>
                  <p className="text-xs text-cosmic-star font-medium">{b.label}</p>
                  <p className="text-[10px] text-cosmic-star/50 mt-0.5">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {[
              { label: 'Vision Board', desc: 'Add or view your images', to: '/vision-board', icon: '🖼️' },
              { label: "Today's Affirmation", desc: 'Set your intention', to: '/affirmations', icon: '✨' },
              { label: 'Journal', desc: '369 method entries', to: '/journal', icon: '📓' },
              { label: 'Goals', desc: 'Track your progress', to: '/goals', icon: '🎯' },
            ].map((card) => (
              <Link
                key={card.label}
                to={card.to}
                className="rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 p-5 hover:border-cosmic-gold/50 hover:bg-white/[0.06] hover:-translate-y-0.5 transition"
              >
                <p className="text-lg mb-1">{card.icon}</p>
                <h3 className="font-bold text-xl text-cosmic-lavender-light mb-1">{card.label}</h3>
                <p className="text-sm text-cosmic-star/60">{card.desc}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}