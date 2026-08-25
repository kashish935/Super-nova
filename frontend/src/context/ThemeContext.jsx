import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'sn:theme';

function getSystemTheme() {
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function getStoredPreference() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'dark';
  } catch {
    return 'dark';
  }
}

export function ThemeProvider({ children }) {
  // preference is what the user chose: 'light' | 'dark' | 'system'.
  const [preference, setPreference] = useState(getStoredPreference);
  // systemTheme only changes in response to the OS-level media query — it's genuinely
  // external state, so it's the only piece that needs its own effect-driven setState.
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);

  // resolvedTheme is what's actually applied to the page — derived at render time,
  // not pushed into state from an effect.
  const resolvedTheme = preference === 'system' ? systemTheme : preference;

  // Sync the resolved theme onto the DOM attribute (the actual external system here).
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, [resolvedTheme]);

  // Persist the user's chosen preference.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      // Storage unavailable — theme still applies, it just won't persist.
    }
  }, [preference]);

  // Track the OS-level preference live while "system" is selected.
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: light)');
    const handleChange = () => setSystemTheme(getSystemTheme());
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  const setTheme = useCallback((value) => setPreference(value), []);

  return (
    <ThemeContext.Provider value={{ preference, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
