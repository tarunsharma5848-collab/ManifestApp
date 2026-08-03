import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

export const THEMES = [
  { id: 'cosmic', label: 'Cosmic Night', swatch: ['#0b0f2b', '#d4af6a', '#b9a6dc'] },
  { id: 'pastel', label: 'Soft Pastel', swatch: ['#fdf2f8', '#f472b6', '#a78bfa'] },
  { id: 'dark-academia', label: 'Dark Academia', swatch: ['#1c1410', '#c9a15a', '#8a7361'] },
];

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem('manifest_theme') || 'cosmic');

  useEffect(() => {
    if (theme === 'cosmic') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    localStorage.setItem('manifest_theme', theme);
  }, [theme]);

  const setTheme = (id) => setThemeState(id);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
