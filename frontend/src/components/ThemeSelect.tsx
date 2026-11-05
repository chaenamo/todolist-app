import { useT } from '../i18n';
import { useThemeStore, type Theme } from '../stores/themeStore';
import styles from './LanguageSelect.module.css';

const THEMES: Theme[] = ['light', 'dark'];

// FE-16: 언어 선택과 같은 모양
export function ThemeSelect() {
  const t = useT();
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  return (
    <select
      className={styles.select}
      aria-label={t.theme.label}
      value={theme}
      onChange={(e) => setTheme(e.target.value as Theme)}
    >
      {THEMES.map((value) => (
        <option key={value} value={value}>
          {t.theme[value]}
        </option>
      ))}
    </select>
  );
}
