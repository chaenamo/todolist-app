import { useId, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router';
import styles from './Layout.module.css';

const NAV_ITEMS = [
  { to: '/todos', label: '목록' },
  { to: '/calendar', label: '캘린더' },
  { to: '/categories', label: '카테고리' },
  { to: '/me', label: '내 정보' },
];

export function Layout({ onLogout }: { onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const navId = useId();

  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>
          <Link to="/todos" className={styles.brand}>
            TodoList
          </Link>
          <button
            type="button"
            className={styles.hamburger}
            aria-label={open ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={open}
            aria-controls={navId}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? '×' : '☰'}
          </button>
          <nav id={navId} aria-label="주 메뉴" className={styles.nav} data-open={open}>
            <ul className={styles.list}>
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
              <li className={styles.logoutItem}>
                <button
                  type="button"
                  className={`${styles.link} ${styles.logout}`}
                  onClick={onLogout}
                >
                  로그아웃
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </>
  );
}
