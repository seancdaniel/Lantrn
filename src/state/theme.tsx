import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useLocalStorage } from '@/hooks';

export type ThemeChoice = 'system' | 'light' | 'dark';
export type MotionChoice = 'system' | 'reduced';

interface ThemeValue {
  theme: ThemeChoice;
  setTheme: (t: ThemeChoice) => void;
  toggle: () => void;
  motion: MotionChoice;
  setMotion: (m: MotionChoice) => void;
  resolved: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeValue | null>(null);

function resolve(choice: ThemeChoice): 'light' | 'dark' {
  if (choice !== 'system') return choice;
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useLocalStorage<ThemeChoice>('lantrn.theme', 'system');
  const [motion, setMotion] = useLocalStorage<MotionChoice>('lantrn.motion', 'system');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (motion === 'system') delete root.dataset.motion;
    else root.dataset.motion = motion;
  }, [motion]);

  const value = useMemo<ThemeValue>(
    () => ({
      theme,
      setTheme,
      motion,
      setMotion,
      resolved: resolve(theme),
      toggle: () => setTheme(resolve(theme) === 'dark' ? 'light' : 'dark'),
    }),
    [theme, setTheme, motion, setMotion],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
