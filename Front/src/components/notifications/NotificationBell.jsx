import { useEffect, useRef, useState } from "react";
import { useAuth, useNotifications } from "../../context/AuthContext";
import styles from "./NotificationBell.module.css";

const TYPE_ICON = {
  user_signup: "fa-user-plus",
  listing_published: "fa-home",
  listing_removed: "fa-trash-alt",
  account_verified: "fa-check-circle",
  account_flagged: "fa-flag",
  general: "fa-bell",
};

function timeAgo(ts) {
  const diff = Math.max(0, Date.now() - ts);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(ts).toLocaleDateString();
}

export default function NotificationBell() {
  const { user } = useAuth();
  const { notifications, markNotificationsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!user) return null;

  const mine = notifications
    .filter(
      (n) =>
        n.targetUserId === user.id ||
        (!n.targetUserId && n.targetRole === user.role),
    )
    .sort((a, b) => b.timestamp - a.timestamp);

  const unread = mine.filter((n) => !n.read);

  const toggle = () => {
    setOpen((o) => {
      const next = !o;
      if (next && unread.length) markNotificationsRead(unread.map((n) => n.id));
      return next;
    });
  };

  return (
    <div className={styles.wrap} ref={ref}>
      <button className={styles.bellBtn} title="Notifications" onClick={toggle}>
        <i className="fas fa-bell"></i>
        {unread.length > 0 && (
          <span className={styles.badge}>
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <span>Notifications</span>
            {mine.length > 0 && (
              <span className={styles.count}>{mine.length}</span>
            )}
          </div>
          <div className={styles.list}>
            {mine.length === 0 ? (
              <div className={styles.empty}>
                <i className="fas fa-bell-slash mb-2"></i>
                <div>No notifications yet</div>
              </div>
            ) : (
              mine.slice(0, 30).map((n) => (
                <div
                  key={n.id}
                  className={`${styles.item} ${!n.read ? styles.itemUnread : ""}`}
                >
                  <div className={styles.itemIcon}>
                    <i
                      className={`fas ${TYPE_ICON[n.type] || TYPE_ICON.general}`}
                    ></i>
                  </div>
                  <div className={styles.itemBody}>
                    <div className={styles.itemContent}>{n.content}</div>
                    <div className={styles.itemMeta}>
                      <span>{n.actorName}</span>
                      <span className={styles.dot}>•</span>
                      <span>{timeAgo(n.timestamp)}</span>
                    </div>
                  </div>
                  {!n.read && <span className={styles.unreadDot}></span>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
