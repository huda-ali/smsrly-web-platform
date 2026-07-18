import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth, useProperties, usePlatform } from "../context/AuthContext";
import { useToast, ToastContainer } from "../hooks/useToast.jsx";
import { getAllUsers } from "../api/admin";
import { describeError } from "../api/client";
import { activityData } from "../data/mockData";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import NotificationBell from "../components/notifications/NotificationBell.jsx";
import ThemeToggle from "../components/ui/ThemeToggle";
import { handleImgError } from "../utils/imageUtils";
import styles from "./AdminPanelPage.module.css";

const NAV = [
  { id: "overview", label: "Overview", icon: "fa-th-large" },
  { id: "users", label: "User Management", icon: "fa-users" },
  { id: "listings", label: "Listing Moderation", icon: "fa-list", badge: 8 },
  { id: "activity", label: "System Activity", icon: "fa-chart-line" },
  { id: "settings", label: "Platform Settings", icon: "fa-cog" },
];

function timeAgo(ts) {
  if (!ts) return "—";
  const diff = Math.max(0, Date.now() - ts);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min} min${min === 1 ? "" : "s"} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} day${day === 1 ? "" : "s"} ago`;
  return new Date(ts).toLocaleDateString();
}
const roleLabel = (r) => {
  if (!r) return "—";
  const normalized = r.toLowerCase() === "tentant" ? "tenant" : r;
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

export default function AdminPanelPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { properties, deleteProperty } = useProperties();
  const {
    allUsers,
    verifyUser,
    flagUser,
    removeUser,
    upsertAllUser,
    platformSettings,
    updatePlatformSetting,
  } = usePlatform();
  const { toasts, showToast } = useToast();

  const [activeNav, setActiveNav] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deleteUserConfirm, setDeleteUserConfirm] = useState(null);
  const [deletePropConfirm, setDeletePropConfirm] = useState(null);
  const [userSearch, setUserSearch] = useState("");
  const [propSearch, setPropSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    getAllUsers()
      .then((backendUsers) => {
        if (cancelled || !Array.isArray(backendUsers)) return;

        const knownEmails = new Set(
          allUsers.map((u) => (u.email || "").toLowerCase()),
        );

        backendUsers.forEach((bu) => {
          const email = (bu.email || "").toLowerCase();
          if (!email || knownEmails.has(email)) return;

          upsertAllUser({
            id: `backend_${bu.usserId}`,
            name: `${bu.firstName || ""} ${bu.lastName || ""}`.trim() || email,
            email: bu.email,
            role: (bu.role || "").toLowerCase(),
            phone: bu.phoneNumber || "",
            status: "Pending",
            verified: false,
            provider: "email",
            joined: Date.now(),
            lastActivity: Date.now(),
          });
        });
      })
      .catch((err) => {
        if (!cancelled) showToast(describeError(err), "error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredUsers = allUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()),
  );
  const filteredProps = properties.filter(
    (p) =>
      p.title.toLowerCase().includes(propSearch.toLowerCase()) ||
      p.city.toLowerCase().includes(propSearch.toLowerCase()),
  );

  const pendingCount = allUsers.filter((u) => u.status !== "Verified").length;
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  const newSignups7d = allUsers.filter(
    (u) => Date.now() - (u.joined || 0) < SEVEN_DAYS,
  ).length;

  const handleVerify = (id) => {
    verifyUser(id, user);
    showToast("User verified. They have been notified.", "success");
  };
  const handleFlag = (id) => {
    flagUser(id, user);
    showToast("User flagged for review.", "success");
  };

  const switchNav = (id) => {
    setActiveNav(id);
    setSidebarOpen(false);
  };

  const renderContent = () => {
    if (activeNav === "users")
      return (
        <div className={styles.contentCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <i className="fas fa-users me-2"></i>User Management
            </h2>
            <div className={styles.searchBox}>
              <i
                className="fas fa-search text-muted"
                style={{ fontSize: 13 }}
              ></i>
              <input
                className={styles.searchInput}
                placeholder="Search users…"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead className={styles.thead}>
                <tr>
                  <th>USER</th>
                  <th className="d-none d-sm-table-cell">ROLE</th>
                  <th>STATUS</th>
                  <th className="d-none d-md-table-cell">ACTIVITY</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, index) => (
                  <tr
                    key={u.usserId || u.id || `user-row-${index}`}
                    className={styles.trow}
                  >
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className={styles.userAva}>
                          {u.avatar ? (
                            <img
                              src={u.avatar}
                              alt={u.name}
                              className={styles.userAvaImg}
                              onError={handleImgError}
                            />
                          ) : (
                            <i className="fas fa-user-circle fa-lg text-muted"></i>
                          )}
                        </div>
                        <div className="min-width-0">
                          <div className="fw-semibold" style={{ fontSize: 13 }}>
                            {u.name}
                          </div>
                          <div
                            className="text-muted text-truncate"
                            style={{ fontSize: 11, maxWidth: 140 }}
                          >
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="d-none d-sm-table-cell">
                      <span
                        className="badge bg-light text-dark"
                        style={{ fontSize: 11 }}
                      >
                        {roleLabel(u.role)}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${u.status === "Verified" ? styles.badgeVerified : u.status === "Flagged" ? styles.badgeFlagged : styles.badgePending}`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td
                      className="d-none d-md-table-cell text-muted"
                      style={{ fontSize: 12 }}
                    >
                      {timeAgo(u.lastActivity)}
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        {u.status !== "Verified" && (
                          <button
                            className="btn btn-sm btn-outline-success"
                            title="Verify"
                            onClick={() => handleVerify(u.usserId || u.id)}
                          >
                            <i className="fas fa-check"></i>
                          </button>
                        )}
                        {u.status !== "Flagged" && (
                          <button
                            className="btn btn-sm btn-outline-warning"
                            title="Flag"
                            onClick={() => handleFlag(u.usserId || u.id)}
                          >
                            <i className="fas fa-flag"></i>
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-outline-danger"
                          title="Delete"
                          onClick={() => setDeleteUserConfirm(u)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr key="no-users-found">
                    <td colSpan={5} className="text-center text-muted py-4">
                      No users match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      );

    if (activeNav === "listings")
      return (
        <div className={styles.contentCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <i className="fas fa-list me-2"></i>Listing Moderation
            </h2>
            <div className={styles.searchBox}>
              <i
                className="fas fa-search text-muted"
                style={{ fontSize: 13 }}
              ></i>
              <input
                className={styles.searchInput}
                placeholder="Search listings…"
                value={propSearch}
                onChange={(e) => setPropSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead className={styles.thead}>
                <tr>
                  <th>PROPERTY</th>
                  <th className="d-none d-sm-table-cell">OWNER</th>
                  <th className="d-none d-md-table-cell">PRICE</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredProps.map((p) => (
                  <tr key={p.id} className={styles.trow}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className={styles.propThumb}>
                          {p.images[0] ? (
                            <img
                              src={p.images[0]}
                              alt=""
                              onError={handleImgError}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <i
                              className="fas fa-image text-muted"
                              style={{ fontSize: 12 }}
                            ></i>
                          )}
                        </div>
                        <div className="min-width-0">
                          <div
                            className="fw-semibold"
                            style={{
                              fontSize: 13,
                              cursor: "pointer",
                              color: "#2563eb",
                            }}
                            onClick={() => navigate("/property/" + p.id)}
                          >
                            {p.title}
                          </div>
                          <div className="text-muted" style={{ fontSize: 11 }}>
                            {p.city}
                          </div>
                          <div
                            className="d-md-none text-muted"
                            style={{ fontSize: 11 }}
                          >
                            <span
                              style={{
                                fontSize: "12px",
                                marginRight: "4px",
                                fontWeight: "bold",
                              }}
                            >
                              EGP
                            </span>
                            {p.price.toLocaleString()}/mo
                          </div>
                        </div>
                      </div>
                    </td>
                    <td
                      className="d-none d-sm-table-cell"
                      style={{ fontSize: 13 }}
                    >
                      {p.ownerName}
                    </td>
                    <td
                      className="d-none d-md-table-cell fw-semibold"
                      style={{ fontSize: 13 }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          marginRight: "4px",
                          fontWeight: "bold",
                        }}
                      >
                        EGP
                      </span>
                      {p.price.toLocaleString()}/mo
                    </td>
                    <td>
                      <span
                        className={`badge ${p.status === "Active" ? styles.badgeVerified : styles.badgePending}`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => navigate("/property/" + p.id)}
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => setDeletePropConfirm(p)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

    if (activeNav === "activity")
      return (
        <div className={styles.contentCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <i className="fas fa-chart-line me-2"></i>System Activity
            </h2>
          </div>
          <div className="p-3 p-md-4">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1d3a6b" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#1d3a6b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="lg2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid var(--gray-200)",
                    background: "var(--gray-100)",
                    color: "var(--gray-800)",
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "var(--gray-800)" }}
                  itemStyle={{ color: "var(--gray-700)" }}
                />
                <Area
                  type="monotone"
                  dataKey="logins"
                  stroke="#1d3a6b"
                  strokeWidth={2.5}
                  fill="url(#lg1)"
                  dot={{ r: 3, fill: "#1d3a6b", strokeWidth: 0 }}
                  name="Logins"
                />
                <Area
                  type="monotone"
                  dataKey="listings"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#lg2)"
                  dot={{ r: 3, fill: "#22c55e", strokeWidth: 0 }}
                  name="New Listings"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      );

    if (activeNav === "settings")
      return (
        <div className={styles.contentCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <i className="fas fa-cog me-2"></i>Platform Settings
            </h2>
          </div>
          <div className="p-3 p-md-4">
            {[
              {
                key: "emailNotifications",
                label: "Email Notifications",
                desc: "Send email alerts for new listings and inquiries (also drives in-app notifications)",
              },
              {
                key: "autoVerifyListings",
                label: "Auto-verify Listings",
                desc: "Automatically mark newly published listings as verified",
              },
              {
                key: "userRegistration",
                label: "User Registration",
                desc: "Allow new users to register on the platform",
              },
            ].map((s) => (
              <div
                key={s.key}
                className="d-flex justify-content-between align-items-start gap-3 py-3 border-bottom flex-wrap"
              >
                <div>
                  <div className="fw-semibold" style={{ fontSize: 14 }}>
                    {s.label}
                  </div>
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    {s.desc}
                  </div>
                </div>
                <div className="form-check form-switch mb-0 flex-shrink-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={!!platformSettings[s.key]}
                    style={{ width: 40, height: 22, cursor: "pointer" }}
                    onChange={(e) => {
                      updatePlatformSetting(s.key, e.target.checked);
                      showToast(
                        `${s.label} ${e.target.checked ? "enabled" : "disabled"}.`,
                        "success",
                      );
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    // Overview
    return (
      <>
        <div className="row g-3 mb-4">
          {[
            {
              label: "TOTAL USERS",
              value: allUsers.length + "",
              change: `${newSignups7d} new in 7 days`,
              icon: "fa-users",
              color: "#2563eb",
              alert: false,
            },
            {
              label: "ACTIVE LISTINGS",
              value: properties.length + "",
              change: `${properties.filter((p) => p.status === "Active").length} active now`,
              icon: "fa-home",
              color: "#22c55e",
              alert: false,
            },
            {
              label: "PENDING REVIEWS",
              value: pendingCount + "",
              change: pendingCount > 0 ? "Action Needed" : "All clear",
              icon: "fa-exclamation-triangle",
              color: pendingCount > 0 ? "#dc2626" : "#22c55e",
              alert: pendingCount > 0,
            },
            {
              label: "NEW SIGNUPS (7D)",
              value: newSignups7d + "",
              change: "Based on real activity",
              icon: "fa-user-plus",
              color: "#8b5cf6",
              alert: false,
            },
          ].map((s) => (
            <div className="col-6 col-xl-3" key={s.label}>
              <div className="stat-card">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="stat-label">{s.label}</div>
                  <div style={{ color: s.color, fontSize: 17 }}>
                    <i className={`fas ${s.icon}`}></i>
                  </div>
                </div>
                <div className={`stat-value ${s.alert ? "text-danger" : ""}`}>
                  {s.value}
                </div>
                <div
                  className={`stat-change ${s.alert ? "text-danger" : "text-success"}`}
                >
                  {s.change}
                </div>
                <div className="stat-bar" style={{ background: s.color }}></div>
              </div>
            </div>
          ))}
        </div>

        <div className={`${styles.contentCard} mb-4`}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <i className="fas fa-chart-area me-2"></i>Platform Activity (7
              Days)
            </h2>
            <div className="d-flex gap-3 d-none d-sm-flex">
              <span className="d-flex align-items-center gap-1 small">
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#1d3a6b",
                    display: "inline-block",
                  }}
                ></span>
                Logins
              </span>
              <span className="d-flex align-items-center gap-1 small">
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#22c55e",
                    display: "inline-block",
                  }}
                ></span>
                Listings
              </span>
            </div>
          </div>
          <div className="p-3 p-md-4 pt-0">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="lg1b" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1d3a6b" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#1d3a6b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="lg2b" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid var(--gray-200)",
                    background: "var(--gray-100)",
                    color: "var(--gray-800)",
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "var(--gray-800)" }}
                  itemStyle={{ color: "var(--gray-700)" }}
                />
                <Area
                  type="monotone"
                  dataKey="logins"
                  stroke="#1d3a6b"
                  strokeWidth={2.5}
                  fill="url(#lg1b)"
                  dot={{ r: 3, fill: "#1d3a6b", strokeWidth: 0 }}
                  name="Logins"
                />
                <Area
                  type="monotone"
                  dataKey="listings"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#lg2b)"
                  dot={{ r: 3, fill: "#22c55e", strokeWidth: 0 }}
                  name="Listings"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.contentCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <i className="fas fa-users me-2"></i>User Moderation
            </h2>
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => setActiveNav("users")}
            >
              View All
            </button>
          </div>
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead className={styles.thead}>
                <tr>
                  <th>USER</th>
                  <th className="d-none d-sm-table-cell">ROLE</th>
                  <th>STATUS</th>
                  <th className="d-none d-md-table-cell">ACTIVITY</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {[...allUsers]
                  .sort(
                    (a, b) =>
                      (a.status === "Verified") - (b.status === "Verified"),
                  )
                  .slice(0, 4)
                  .map((u, index) => (
                    <tr
                      key={u.usserId || u.id || `mod-user-${index}`}
                      className={styles.trow}
                    >
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className={styles.userAva}>
                            {u.avatar ? (
                              <img
                                src={u.avatar}
                                alt={u.name}
                                className={styles.userAvaImg}
                                onError={handleImgError}
                              />
                            ) : (
                              <i className="fas fa-user-circle fa-lg text-muted"></i>
                            )}
                          </div>
                          <div className="min-width-0">
                            <div
                              className="fw-semibold text-truncate"
                              style={{ fontSize: 13 }}
                            >
                              {u.name}
                            </div>
                            <div
                              className="text-muted text-truncate d-none d-sm-block"
                              style={{ fontSize: 11 }}
                            >
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td
                        className="d-none d-sm-table-cell"
                        style={{ fontSize: 13 }}
                      >
                        {roleLabel(u.role)}
                      </td>
                      <td>
                        <span
                          className={`badge ${u.status === "Verified" ? styles.badgeVerified : u.status === "Flagged" ? styles.badgeFlagged : styles.badgePending}`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td
                        className="d-none d-md-table-cell text-muted"
                        style={{ fontSize: 12 }}
                      >
                        {timeAgo(u.lastActivity)}
                      </td>
                      <td className="d-flex gap-1">
                        {u.status !== "Verified" && (
                          <button
                            className="btn btn-sm btn-outline-success"
                            title="Verify"
                            onClick={() => handleVerify(u.id)}
                          >
                            <i className="fas fa-check"></i>
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => setDeleteUserConfirm(u)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="sidebar-layout">
      <ToastContainer toasts={toasts} />
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar-panel ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-logo">
          <Link
            to="/"
            className="d-flex align-items-center gap-2 text-decoration-none"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="brand-logo">
              <i className="fas fa-home"></i>
            </div>
            <span className="brand-name">SMSRLY</span>
          </Link>
        </div>
        <nav className="sidebar-nav">
          {NAV.map((item) => (
            <button
              key={item.id}
              className={`sidebar-nav-item ${activeNav === item.id ? "active" : ""}`}
              onClick={() => switchNav(item.id)}
            >
              <i className={`fas ${item.icon}`}></i>
              <span>{item.label}</span>
              {item.id === "users" && pendingCount > 0 && (
                <span className="badge bg-danger ms-auto">{pendingCount}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="d-flex align-items-center gap-2 mb-3">
            <div className={styles.userAva}>
              {/* Show the uploaded profile picture if the user set one, otherwise the default icon */}
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className={styles.userAvaImg}
                  onError={handleImgError}
                />
              ) : (
                <i className="fas fa-user-shield fa-lg text-muted"></i>
              )}
            </div>
            <div className="min-width-0">
              <div className="fw-bold small text-truncate">{user?.name}</div>
              <div className="text-muted" style={{ fontSize: 11 }}>
                Root Access
              </div>
            </div>
          </div>
          <ThemeToggle className="w-100 justify-content-center mb-2" />
          <Link
            to="/profile"
            className="btn btn-sm btn-outline-secondary w-100 mb-2"
          >
            <i className="fas fa-user me-1"></i>My Profile
          </Link>
          <button
            className="btn btn-sm btn-outline-danger w-100"
            onClick={() => {
              logout();
              navigate("/");
            }}
          >
            <i className="fas fa-sign-out-alt me-1"></i>Log Out
          </button>
        </div>
      </aside>

      <main className="sidebar-content">
        <div className={styles.topbar}>
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-sm btn-outline-secondary d-lg-none"
              onClick={() => setSidebarOpen(true)}
            >
              <i className="fas fa-bars"></i>
            </button>
            <h1 className={styles.pageTitle}>
              {NAV.find((n) => n.id === activeNav)?.label || "Overview"}
            </h1>
          </div>
          <div className="d-flex align-items-center gap-2">
            <div className={styles.statusBadge}>
              <span className={styles.statusDot}></span>
              <span className="d-none d-sm-inline">SYSTEM </span>ONLINE
            </div>
            <NotificationBell />
          </div>
        </div>
        <div className={styles.mainBody}>{renderContent()}</div>
      </main>

      {/* Mobile bottom nav */}
      <div className="mobile-bottom-nav">
        <div className="mobile-bottom-nav-inner">
          {NAV.slice(0, 4).map((item) => (
            <button
              key={item.id}
              className={`mobile-nav-btn ${activeNav === item.id ? "active" : ""}`}
              onClick={() => setActiveNav(item.id)}
              style={{ position: "relative" }}
            >
              <i className={`fas ${item.icon}`}></i>
              <span>{item.label.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {deleteUserConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className="text-center">
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "#fef2f2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px",
                  fontSize: 24,
                  color: "#dc2626",
                }}
              >
                <i className="fas fa-user-times"></i>
              </div>
              <h5 className="fw-bold mb-2">Remove User?</h5>
              <p className="text-muted small mb-4">
                Remove <strong>{deleteUserConfirm.name}</strong> from the
                platform?
              </p>
              <div className="d-flex gap-2 justify-content-center">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setDeleteUserConfirm(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    removeUser(deleteUserConfirm.id);
                    setDeleteUserConfirm(null);
                    showToast("User removed.", "success");
                  }}
                >
                  <i className="fas fa-trash me-1"></i>Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {deletePropConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className="text-center">
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "#fef2f2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px",
                  fontSize: 24,
                  color: "#dc2626",
                }}
              >
                <i className="fas fa-home"></i>
              </div>
              <h5 className="fw-bold mb-2">Remove Listing?</h5>
              <p className="text-muted small mb-4">
                Remove <strong>"{deletePropConfirm.title}"</strong>?
              </p>
              <div className="d-flex gap-2 justify-content-center">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setDeletePropConfirm(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    deleteProperty(deletePropConfirm.id, user);
                    setDeletePropConfirm(null);
                    showToast("Listing removed.", "success");
                  }}
                >
                  <i className="fas fa-trash me-1"></i>Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
