import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

// FE-16, PQ-08: 기본은 라이트, 선택은 localStorage에 저장
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'todolist-theme',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
);

// tokens.css의 :root[data-theme='dark']가 색 토큰을 덮어쓴다
function syncHtmlTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}
syncHtmlTheme(useThemeStore.getState().theme);
useThemeStore.subscribe((s) => syncHtmlTheme(s.theme));
