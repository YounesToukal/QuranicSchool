import { create } from 'zustand';

export type Theme = 'dark' | 'light';

interface ThemeStore {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

function applyTheme(t: Theme) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem('qurandec-theme', t); } catch { /* noop */ }
}

const initialTheme: Theme = (() => {
  try { return (localStorage.getItem('qurandec-theme') as Theme) || 'dark'; } catch { return 'dark'; }
})();

export const useThemeStore = create<ThemeStore>()((set, get) => ({
  theme: initialTheme,
  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    set({ theme: next });
  },
  setTheme: (t: Theme) => {
    applyTheme(t);
    set({ theme: t });
  },
}));
