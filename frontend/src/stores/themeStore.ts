import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark';
export type FontSize = 'small' | 'medium' | 'large';

// 화면 설정: 모드(FE-16) + 글자 크기(FE-17)
interface ThemeState {
  theme: Theme;
  fontSize: FontSize;
  setTheme: (theme: Theme) => void;
  setFontSize: (fontSize: FontSize) => void;
}

// PQ-08, PQ-09: 기본은 라이트·중간, 선택은 localStorage에 저장
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      fontSize: 'medium',
      setTheme: (theme) => set({ theme }),
      setFontSize: (fontSize) => set({ fontSize }),
    }),
    {
      name: 'todolist-theme',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme, fontSize: state.fontSize }),
    },
  ),
);

// tokens.css의 :root[data-theme]·[data-font-size]가 토큰을 덮어쓴다
function syncHtml({ theme, fontSize }: ThemeState): void {
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.fontSize = fontSize;
}
syncHtml(useThemeStore.getState());
useThemeStore.subscribe(syncHtml);
