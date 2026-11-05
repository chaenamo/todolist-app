import { useT } from '../i18n';
import { useThemeStore, type FontSize } from '../stores/themeStore';
import styles from './LanguageSelect.module.css';

const SIZES: FontSize[] = ['small', 'medium', 'large'];

// FE-17: 언어·모드 선택과 같은 모양
export function FontSizeSelect() {
  const t = useT();
  const fontSize = useThemeStore((s) => s.fontSize);
  const setFontSize = useThemeStore((s) => s.setFontSize);
  return (
    <select
      className={styles.select}
      aria-label={t.fontSize.label}
      value={fontSize}
      onChange={(e) => setFontSize(e.target.value as FontSize)}
    >
      {SIZES.map((value) => (
        <option key={value} value={value}>
          {t.fontSize[value]}
        </option>
      ))}
    </select>
  );
}
