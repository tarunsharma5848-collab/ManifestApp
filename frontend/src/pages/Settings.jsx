import { useTheme, THEMES } from '../context/ThemeContext';

export default function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <h2 className="font-display text-3xl text-cosmic-gold mb-1">Settings</h2>
      <p className="text-cosmic-star/60 mb-8">Make it feel like yours.</p>

      <h3 className="text-cosmic-lavender-light text-sm uppercase tracking-wide mb-3">Theme</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`rounded-xl border p-4 text-left transition ${
              theme === t.id
                ? 'border-cosmic-gold bg-cosmic-navy-light'
                : 'border-cosmic-lavender/20 bg-cosmic-navy-light/50 hover:border-cosmic-lavender/40'
            }`}
          >
            <div className="flex gap-1.5 mb-3">
              {t.swatch.map((c) => (
                <span
                  key={c}
                  className="w-6 h-6 rounded-full border border-black/10"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <p className="text-cosmic-star text-sm font-medium">{t.label}</p>
            {theme === t.id && <p className="text-cosmic-gold text-xs mt-1">Active</p>}
          </button>
        ))}
      </div>
    </div>
  );
}
