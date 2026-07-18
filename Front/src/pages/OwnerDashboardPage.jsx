import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth, useProperties } from "../context/AuthContext";
import { useToast, ToastContainer } from "../hooks/useToast.jsx";
import NotificationBell from "../components/notifications/NotificationBell.jsx";
import ThemeToggle from "../components/ui/ThemeToggle";
import { handleImgError } from "../utils/imageUtils";
import styles from "./OwnerDashboardPage.module.css";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "fa-th-large" },
  { id: "listings", label: "My Listings", icon: "fa-list" },
  { id: "inquiries", label: "Inquiries", icon: "fa-comments", badge: 3 },
  { id: "analytics", label: "Analytics", icon: "fa-chart-bar" },
];

export default function OwnerDashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { properties, deleteProperty } = useProperties();
  const { toasts, showToast } = useToast();

  const [activeNav, setActiveNav] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 5;

  const myProperties = properties.filter((p) => p.ownerId === user?.id);
  const filtered = myProperties.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.city.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const totalInquiries = myProperties.reduce((s, p) => s + p.inquiries, 0);
  const totalViews = myProperties.reduce((s, p) => s + p.views, 0);

  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  const newThisMonth = myProperties.filter(
    (p) => Date.now() - p.id < THIRTY_DAYS,
  ).length;
  const propertiesWithInquiries = myProperties.filter(
    (p) => p.inquiries > 0,
  ).length;
  const avgViewsPerListing = myProperties.length
    ? Math.round(totalViews / myProperties.length)
    : 0;
  const mapMarkers = myProperties
    .filter((p) => p.lat && p.lng)
    .map((p) => ({ lat: p.lat, lng: p.lng, price: p.price, id: p.id }));

  const confirmDelete = () => {
    deleteProperty(deleteConfirm.id);
    setDeleteConfirm(null);
    showToast("Property deleted.", "success");
  };

  const switchNav = (id) => {
    setActiveNav(id);
    setSidebarOpen(false);
  };

  const renderContent = () => {
    if (activeNav === "inquiries")
      return (
        <div className={styles.contentCard}>
          <div className={styles.tableHeader}>
            <h2 className={styles.contentTitle}>
              <i className="fas fa-comments me-2"></i>Inquiries
            </h2>
          </div>
          <div className="text-center py-5 px-3">
            <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
            <h5>
              {totalInquiries} Active Inquir{totalInquiries === 1 ? "y" : "ies"}
            </h5>
            <p className="text-muted small mb-3">
              {propertiesWithInquiries > 0
                ? `Across ${propertiesWithInquiries} of your ${myProperties.length} listing${myProperties.length === 1 ? "" : "s"}.`
                : "Inquiries from tenants interested in your properties."}
            </p>
            <Link to="/search" className="btn btn-outline-primary btn-sm">
              Browse Market
            </Link>
          </div>
        </div>
      );

    if (activeNav === "analytics")
      return (
        <div className={styles.contentCard}>
          <div className={styles.tableHeader}>
            <h2 className={styles.contentTitle}>
              <i className="fas fa-chart-bar me-2"></i>Analytics
            </h2>
          </div>
          <div className="p-3 p-md-4">
            <div className="row g-3">
              {[
                {
                  label: "Total Views",
                  value: totalViews.toLocaleString(),
                  icon: "fa-eye",
                  color: "#8b5cf6",
                },
                {
                  label: "Inquiry Rate",
                  value: totalViews
                    ? ((totalInquiries / totalViews) * 100).toFixed(1) + "%"
                    : "0%",
                  icon: "fa-percentage",
                  color: "#f59e0b",
                },
                {
                  label: "Active Listings",
                  value: myProperties.filter((p) => p.status === "Active")
                    .length,
                  icon: "fa-check-circle",
                  color: "#16a34a",
                },
                {
                  label: "Avg. Rent",
                  value: myProperties.length
                    ? "EGP " +
                      Math.round(
                        myProperties.reduce((s, p) => s + p.price, 0) /
                          myProperties.length,
                      ).toLocaleString()
                    : "EGP 0",
                  icon: "fa-money-bill-wave",
                  color: "#2563eb",
                },
              ].map((m) => (
                <div className="col-6 col-lg-3" key={m.label}>
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body d-flex align-items-center gap-3 p-3">
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 10,
                          background: `${m.color}18`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: m.color,
                          fontSize: 18,
                          flexShrink: 0,
                        }}
                      >
                        <i className={`fas ${m.icon}`}></i>
                      </div>
                      <div className="min-width-0">
                        <div
                          className="text-muted"
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: 0.4,
                          }}
                        >
                          {m.label}
                        </div>
                        <div className="fw-bold fs-5">{m.value}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    return (
      <div className={styles.contentCard}>
        <div className={styles.tableHeader}>
          <h2 className={styles.contentTitle}>
            <i className="fas fa-home me-2"></i>My Properties
          </h2>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <div className={styles.searchBox}>
              <i
                className="fas fa-search text-muted"
                style={{ fontSize: 13 }}
              ></i>
              <input
                className={styles.searchInput}
                placeholder="Search listings…"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
              />
              {searchTerm && (
                <button
                  className={styles.clearSearch}
                  onClick={() => setSearchTerm("")}
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
            <Link to="/add-property" className="btn btn-primary btn-sm">
              <i className="fas fa-plus me-1"></i>
              <span className="d-none d-sm-inline">Add New</span>
            </Link>
          </div>
        </div>

        {paginated.length === 0 ? (
          <div className="text-center py-5 px-3">
            <i className="fas fa-home fa-3x text-muted mb-3"></i>
            <h5>{searchTerm ? "No matches" : "No properties yet"}</h5>
            <p className="text-muted small">
              {searchTerm
                ? "Try a different search."
                : "Add your first listing."}
            </p>
            {!searchTerm && (
              <Link to="/add-property" className="btn btn-primary btn-sm">
                <i className="fas fa-plus me-1"></i>Add Property
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead className={styles.thead}>
                  <tr>
                    <th>PROPERTY</th>
                    <th>STATUS</th>
                    <th className="d-none d-md-table-cell">PRICE</th>
                    <th className="d-none d-lg-table-cell">INQUIRIES</th>
                    <th className="d-none d-lg-table-cell">VIEWS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((p) => (
                    <tr key={p.id} className={styles.trow}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className={styles.propThumb}
                            onClick={() => navigate("/property/" + p.id)}
                          >
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
                              className={styles.propName}
                              onClick={() => navigate("/property/" + p.id)}
                            >
                              {p.title}
                            </div>
                            <div
                              className="text-muted d-md-none"
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
                            <div
                              className="text-muted"
                              style={{ fontSize: 11 }}
                            >
                              <i className="fas fa-map-marker-alt me-1"></i>
                              {p.city}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${p.status === "Active" ? styles.badgeActive : styles.badgeRented}`}
                        >
                          <i
                            className="fas fa-circle me-1"
                            style={{ fontSize: 6 }}
                          ></i>
                          {p.status}
                        </span>
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
                      <td
                        className="d-none d-lg-table-cell"
                        style={{ fontSize: 13 }}
                      >
                        {p.inquiries}
                      </td>
                      <td
                        className="d-none d-lg-table-cell"
                        style={{ fontSize: 13 }}
                      >
                        {p.views.toLocaleString()}
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            title="View"
                            onClick={() => navigate("/property/" + p.id)}
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <Link
                            to={`/edit-property/${p.id}`}
                            className="btn btn-sm btn-outline-primary"
                            title="Edit"
                          >
                            <i className="fas fa-edit"></i>
                          </Link>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            title="Delete"
                            onClick={() => setDeleteConfirm(p)}
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
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <span className="text-muted small d-none d-sm-inline">
                  Showing {(page - 1) * PER_PAGE + 1}–
                  {Math.min(page * PER_PAGE, filtered.length)} of{" "}
                  {filtered.length}
                </span>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <button
                    className="btn btn-sm btn-primary"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="sidebar-layout">
      <ToastContainer toasts={toasts} />

      {/* Sidebar backdrop (mobile) */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
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
          {NAV.map((item) => {
            const badge = item.id === "inquiries" ? totalInquiries : null;
            return (
              <button
                key={item.id}
                className={`sidebar-nav-item ${activeNav === item.id ? "active" : ""}`}
                onClick={() => switchNav(item.id)}
              >
                <i className={`fas ${item.icon}`}></i>
                <span>{item.label}</span>
                {badge > 0 && (
                  <span className="badge bg-success ms-auto">{badge}</span>
                )}
              </button>
            );
          })}
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
                <i className="fas fa-user-circle fa-lg"></i>
              )}
            </div>
            <div className="min-width-0">
              <div className="fw-bold small text-truncate">{user?.name}</div>
              <div className="text-muted" style={{ fontSize: 11 }}>
                Property Owner
              </div>
            </div>
          </div>
          <ThemeToggle className="w-100 justify-content-center mb-2" />
          <Link
            to="/profile"
            className="btn btn-sm btn-outline-secondary w-100 mb-2"
            onClick={() => setSidebarOpen(false)}
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

      {/* Main */}
      <main className="sidebar-content">
        <div className={styles.topbar}>
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-sm btn-outline-secondary d-lg-none"
              onClick={() => setSidebarOpen(true)}
            >
              <i className="fas fa-bars"></i>
            </button>
            <div>
              <h1 className={styles.pageTitle}>Owner Dashboard</h1>
              <p className="text-muted small mb-0 d-none d-sm-block">
                Welcome back, {user?.name?.split(" ")[0]}!
              </p>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <NotificationBell />
            <Link to="/add-property" className="btn btn-primary btn-sm">
              <i className="fas fa-plus me-1"></i>
              <span className="d-none d-sm-inline">Add New Property</span>
            </Link>
          </div>
        </div>

        <div className={styles.mainBody}>
          {/* Stats */}
          <div className="row g-3 mb-4">
            {[
              {
                label: "Total Listings",
                value: myProperties.length,
                change:
                  newThisMonth > 0
                    ? `+${newThisMonth} added this month`
                    : "No new listings this month",
                up: newThisMonth > 0,
                icon: "fa-home",
                color: "#2563eb",
              },
              {
                label: "Active Inquiries",
                value: totalInquiries,
                change:
                  propertiesWithInquiries > 0
                    ? `${propertiesWithInquiries} listing${propertiesWithInquiries === 1 ? "" : "s"} with activity`
                    : "No inquiries yet",
                up: totalInquiries > 0,
                icon: "fa-comments",
                color: "#16a34a",
              },
              {
                label: "Monthly Views",
                value:
                  totalViews >= 1000
                    ? (totalViews / 1000).toFixed(1) + "k"
                    : totalViews,
                change: myProperties.length
                  ? `${avgViewsPerListing} avg views / listing`
                  : "No listings yet",
                up: totalViews > 0,
                icon: "fa-eye",
                color: "#8b5cf6",
              },
            ].map((s) => (
              <div className="col-12 col-sm-4" key={s.label}>
                <div className="stat-card">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="stat-label">{s.label}</div>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: `${s.color}18`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: s.color,
                        flexShrink: 0,
                      }}
                    >
                      <i className={`fas ${s.icon}`}></i>
                    </div>
                  </div>
                  <div className="stat-value">{s.value}</div>
                  <div
                    className={`stat-change ${s.up ? "text-success" : "text-muted"}`}
                  >
                    <i
                      className={`fas ${s.up ? "fa-arrow-up" : "fa-minus"} me-1`}
                    ></i>
                    {s.change}
                  </div>
                  <div
                    className="stat-bar"
                    style={{ background: s.color }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          {renderContent()}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <div className="mobile-bottom-nav">
        <div className="mobile-bottom-nav-inner">
          {NAV.map((item) => {
            const badge = item.id === "inquiries" ? totalInquiries : null;
            return (
              <button
                key={item.id}
                className={`mobile-nav-btn ${activeNav === item.id ? "active" : ""}`}
                onClick={() => setActiveNav(item.id)}
                style={{ position: "relative" }}
              >
                <i className={`fas ${item.icon}`}></i>
                <span>{item.label.split(" ")[0]}</span>
                {badge > 0 && <span className="mob-badge">{badge}</span>}
              </button>
            );
          })}
          <Link to="/profile" className="mobile-nav-btn">
            <i className="fas fa-user"></i>
            <span>Profile</span>
          </Link>
        </div>
      </div>

      {/* Delete modal */}
      {deleteConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className="text-center">
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  background: "#fef2f2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px",
                  fontSize: 26,
                  color: "#dc2626",
                }}
              >
                <i className="fas fa-trash"></i>
              </div>
              <h5 className="fw-bold mb-2">Delete Property?</h5>
              <p className="text-muted small mb-4">
                Delete <strong>"{deleteConfirm.title}"</strong>? This cannot be
                undone.
              </p>
              <div className="d-flex gap-2 justify-content-center">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setDeleteConfirm(null)}
                >
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={confirmDelete}>
                  <i className="fas fa-trash me-2"></i>Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
