import styles from "./Sidebar.module.css";

export default function Sidebar({ logo, navItems, footer, activeItem }) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>{logo}</div>
      <nav className={styles.nav}>
        {navItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={`${styles.navItem} ${activeItem === item.label ? styles.active : ""}`}
            onClick={item.onClick}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
            {item.badge && <span className={styles.badge}>{item.badge}</span>}
          </a>
        ))}
      </nav>
      {footer && <div className={styles.footer}>{footer}</div>}
    </aside>
  );
}
