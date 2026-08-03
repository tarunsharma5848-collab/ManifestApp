import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import XpBar from './XpBar';
import DreamSwitcher from './DreamSwitcher';

const navItems = [
  { to: '/', label: 'Dashboard', end: true, icon: '🏠' },
  { to: '/dreams', label: 'My Dreams', icon: '💭' },
  { to: '/vision-board', label: 'Vision Board', icon: '🖼️' },
  { to: '/affirmations', label: 'Affirmations', icon: '✨' },
  { to: '/journal', label: 'Journal', icon: '📓' },
  { to: '/goals', label: 'Goals', icon: '🎯' },
  { to: '/coach', label: 'Manifest Bro 🤖', icon: '🤖' },
  { to: '/universe', label: 'Universe 🌌', icon: '🌌' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

// The 4 items that live permanently in the mobile bottom bar.
// Everything else (+ logout) lives inside the "More" drawer.
const primaryMobileItems = navItems.filter((item) =>
  ['/', '/vision-board', '/journal', '/goals'].includes(item.to)
);
const moreMobileItems = navItems.filter(
  (item) => !['/', '/vision-board', '/journal', '/goals'].includes(item.to)
);

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-cosmic-navy text-cosmic-star flex flex-col md:flex-row">
      {/* ---------- Mobile top bar (logo only, compact) ---------- */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-cosmic-lavender/20">
        <h1 className="font-display text-xl text-cosmic-gold">Manifest</h1>
        <DreamSwitcher />
      </header>

      {/* ---------- Desktop sidebar (unchanged) ---------- */}
      <aside className="hidden md:flex md:w-56 border-r border-cosmic-lavender/20 p-4 flex-col justify-between">
        <div>
          <h1 className="font-display text-2xl text-cosmic-gold mb-4">Manifest</h1>
          <div className="mb-2">
            <DreamSwitcher />
          </div>
          <div className="mb-6">
            <XpBar />
          </div>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm whitespace-nowrap transition ${
                    isActive
                      ? 'bg-cosmic-navy-light text-cosmic-gold'
                      : 'text-cosmic-star/70 hover:text-cosmic-star'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div>
          <p className="text-xs text-cosmic-star/50 mb-2">{user?.email}</p>
          <button onClick={handleLogout} className="text-xs text-cosmic-lavender-light underline">
            Log out
          </button>
        </div>
      </aside>

      {/* ---------- Page content ---------- */}
      <main className="flex-1 p-4 pb-24 md:p-8 md:pb-8">
        <Outlet />
      </main>

      {/* ---------- Mobile bottom tab bar ---------- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-cosmic-navy-light/95 backdrop-blur-md border-t border-cosmic-lavender/20 flex items-center justify-around py-2">
        {primaryMobileItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] transition ${
                isActive ? 'text-cosmic-gold' : 'text-cosmic-star/60'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] text-cosmic-star/60"
        >
          <span className="text-lg">☰</span>
          More
        </button>
      </nav>

      {/* ---------- Mobile "More" drawer ---------- */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-30 flex items-end">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMoreOpen(false)}
          />
          <div className="relative w-full bg-cosmic-navy-light rounded-t-2xl border-t border-cosmic-lavender/20 p-4 pb-8 max-h-[70vh] overflow-y-auto">
            <div className="w-10 h-1 bg-cosmic-lavender/30 rounded-full mx-auto mb-4" />
            <div className="mb-4">
              <XpBar />
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {moreMobileItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1 p-3 rounded-xl text-xs text-center transition ${
                      isActive
                        ? 'bg-cosmic-navy text-cosmic-gold'
                        : 'bg-cosmic-navy text-cosmic-star/70'
                    }`
                  }
                >
                  <span className="text-xl">{item.icon}</span>
                  {item.label.replace(/[🤖🌌]/g, '').trim()}
                </NavLink>
              ))}
            </div>
            <div className="border-t border-cosmic-lavender/20 pt-3 flex items-center justify-between">
              <p className="text-xs text-cosmic-star/50">{user?.email}</p>
              <button onClick={handleLogout} className="text-xs text-cosmic-lavender-light underline">
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}