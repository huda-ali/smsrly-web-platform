import styles from "./StatCard.module.css";

export default function StatCard({
  label,
  value,
  change,
  changeLabel,
  icon,
  accentColor,
  alert,
}) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        {icon && (
          <span className={styles.icon} style={{ color: accentColor }}>
            {icon}
          </span>
        )}
      </div>
      <div className={styles.value} style={alert ? { color: "#ef4444" } : {}}>
        {value}
      </div>
      {change && (
        <div
          className={styles.change}
          style={{ color: change.startsWith("+") ? "#22c55e" : "#ef4444" }}
        >
          {change}
        </div>
      )}
      {changeLabel && (
        <div className={alert ? styles.alertLabel : styles.changeLabel}>
          {changeLabel}
        </div>
      )}
      <div
        className={styles.bar}
        style={{ background: accentColor || "#1d4ed8" }}
      />
    </div>
  );
}
