import { useTheme } from "../../context/ThemeContext";
import styles from "./ThemeToggle.module.css";

export default function ThemeToggle({ className = "" }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className={`${styles.toggle} ${className}`}
      onClick={toggleTheme}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle dark mode"
    >
      {isDark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1zm0 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm9-6a1 1 0 0 1-1 1h-1a1 1 0 1 1 0-2h1a1 1 0 0 1 1 1zM5 12a1 1 0 0 1-1 1H3a1 1 0 1 1 0-2h1a1 1 0 0 1 1 1zm12.66-6.66a1 1 0 0 1 0 1.42l-.71.7a1 1 0 1 1-1.41-1.41l.7-.71a1 1 0 0 1 1.42 0zM7.46 17.54a1 1 0 0 1 0 1.41l-.7.71a1 1 0 1 1-1.42-1.42l.71-.7a1 1 0 0 1 1.41 0zM12 20a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1zM6.34 6.34a1 1 0 0 1-1.41 0l-.71-.7a1 1 0 1 1 1.42-1.42l.7.71a1 1 0 0 1 0 1.41zm11.2 11.2a1 1 0 0 1-1.41 0l-.71-.7a1 1 0 0 1 1.42-1.42l.7.71a1 1 0 0 1 0 1.41z" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21.64 13a1 1 0 0 0-1.05-.14 8.05 8.05 0 0 1-3.37.73 8.15 8.15 0 0 1-8.14-8.1 8.59 8.59 0 0 1 .27-2.13A1 1 0 0 0 8 2.36a10.14 10.14 0 1 0 13.79 13.79 1 1 0 0 0-.15-.15z" />
        </svg>
      )}
      <span className={styles.label}>{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}
