import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth, useProperties, usePlatform } from "../context/AuthContext";
import { useToast, ToastContainer } from "../hooks/useToast.jsx";
import ThemeToggle from "../components/ui/ThemeToggle";
import { compressImageFile, handleImgError } from "../utils/imageUtils";
import styles from "./ProfilePage.module.css";

const MAX_AVATAR_SIZE = 8 * 1024 * 1024;

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const { properties } = useProperties();
  const { upsertAllUser } = usePlatform();
  const { toasts, showToast } = useToast();
  const fileInputRef = useRef(null);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");

  const [businessName, setBusinessName] = useState(user?.businessName || "");
  const [formError, setFormError] = useState("");

  if (!user)
    return (
      <div className={styles.guestPage}>
        <Link
          to="/"
          className="d-flex align-items-center gap-2 text-decoration-none mb-4"
        >
          <div className="brand-logo">
            <i className="fas fa-home"></i>
          </div>
          <span className="brand-name">SMSRLY</span>
        </Link>
        <div className={styles.guestCard}>
          <div className={styles.guestIcon}>
            <i className="fas fa-user-circle"></i>
          </div>
          <h2 className={styles.guestTitle}>Guest</h2>
          <p className="text-muted mb-4">
            You're browsing as a guest. Sign in to access your profile, save
            properties, and more.
          </p>
          <div className="d-flex gap-2 justify-content-center flex-wrap">
            <Link to="/signin" className="btn btn-primary">
              <i className="fas fa-sign-in-alt me-2"></i>Sign In
            </Link>
            <Link to="/signup" className="btn btn-outline-primary">
              <i className="fas fa-user-plus me-2"></i>Create Account
            </Link>
          </div>
        </div>
      </div>
    );

  const myProperties =
    user.role === "owner"
      ? properties.filter((p) => p.ownerId === user.id)
      : properties.filter((p) => (user.savedProperties || []).includes(p.id));

  const handleSave = () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      setFormError("Full name is required.");
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      setFormError("Please enter a valid email address.");
      return;
    }
    setFormError("");

    const updates = {
      name: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      ...(user.role === "owner" ? { businessName: businessName.trim() } : {}),
    };
    updateUser(updates);
    upsertAllUser({ id: user.id, ...updates });
    showToast("Profile updated!", "success");
    setEditing(false);
  };

  // ── Profile picture upload ───
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please choose an image file.", "error");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      showToast("Image is too large — please pick one under 8MB.", "error");
      return;
    }

    compressImageFile(file, { maxWidth: 400, maxHeight: 400, quality: 0.85 })
      .then((dataUrl) => {
        updateUser({ avatar: dataUrl });
        upsertAllUser({ id: user.id, avatar: dataUrl });
        showToast("Profile picture updated!", "success");
      })
      .catch(() => showToast("Couldn't process that image.", "error"));
  };

  const handleRemoveAvatar = () => {
    updateUser({ avatar: null });
    upsertAllUser({ id: user.id, avatar: null });
    showToast("Profile picture removed.", "success");
  };

  const ROLE_COLORS = { owner: "#16a34a", tenant: "#2563eb", admin: "#dc2626" };
  const ROLE_ICONS = {
    owner: "fa-building",
    tenant: "fa-user",
    admin: "fa-shield-alt",
  };

  return (
    <div className={styles.page}>
      <ToastContainer toasts={toasts} />

      {/* Topbar */}
      <nav className={styles.topbar}>
        <Link
          to="/"
          className="d-flex align-items-center gap-2 text-decoration-none"
        >
          <div className="brand-logo">
            <i className="fas fa-home"></i>
          </div>
          <span className="brand-name d-none d-sm-block">SMSRLY</span>
        </Link>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <ThemeToggle />
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => navigate(-1)}
          >
            <i className="fas fa-arrow-left me-1"></i>
            <span className="d-none d-sm-inline">Back</span>
          </button>
          {user.role === "owner" && (
            <Link to="/dashboard" className="btn btn-sm btn-primary">
              <i className="fas fa-tachometer-alt me-1"></i>
              <span className="d-none d-sm-inline">Dashboard</span>
            </Link>
          )}
          {user.role === "admin" && (
            <Link to="/admin" className="btn btn-sm btn-danger">
              <i className="fas fa-shield-alt me-1"></i>
              <span className="d-none d-sm-inline">Admin</span>
            </Link>
          )}
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={() => {
              logout();
              navigate("/");
            }}
          >
            <i className="fas fa-sign-out-alt me-1"></i>
            <span className="d-none d-sm-inline">Logout</span>
          </button>
        </div>
      </nav>

      <div className={styles.body}>
        <div className="row g-4">
          {/* Left column */}
          <div className="col-lg-4">
            {/* Profile card */}
            <div className={styles.profileCard}>
              <div className={styles.avatarWrap}>
                {/* Hidden file input triggered by the camera button below */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: "none" }}
                />
                {user.avatar ? (
                  <div className={styles.avatarPhotoWrap}>
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className={styles.avatarPhoto}
                      onError={handleImgError}
                    />
                    <button
                      type="button"
                      className={styles.avatarUploadBtn}
                      title="Change profile picture"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <i className="fas fa-camera"></i>
                    </button>
                  </div>
                ) : (
                  <div className={styles.avatarPhotoWrap}>
                    <div className={styles.avatar}>
                      <i className="fas fa-user-circle"></i>
                    </div>
                    <button
                      type="button"
                      className={styles.avatarUploadBtn}
                      title="Upload profile picture"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <i className="fas fa-camera"></i>
                    </button>
                  </div>
                )}
                {user.avatar && (
                  <button
                    type="button"
                    className={styles.avatarRemoveBtn}
                    onClick={handleRemoveAvatar}
                  >
                    Remove photo
                  </button>
                )}
                <div
                  className={styles.roleBadge}
                  style={{ background: ROLE_COLORS[user.role] || "#64748b" }}
                >
                  <i
                    className={`fas ${ROLE_ICONS[user.role] || "fa-user"} me-1`}
                  ></i>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </div>
              </div>

              {editing ? (
                <div className={styles.editForm}>
                  {formError && (
                    <div className="alert alert-danger py-2 px-3 small mb-3">
                      {formError}
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">
                      Full Name
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="fas fa-user"></i>
                      </span>
                      <input
                        className="form-control"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">
                      Email Address
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="fas fa-envelope"></i>
                      </span>
                      <input
                        type="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">
                      Phone Number
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="fas fa-phone"></i>
                      </span>
                      <input
                        className="form-control"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(555) 000-0000"
                      />
                    </div>
                  </div>
                  {/* Role-specific field: owners can set the public business name shown on listings */}
                  {user.role === "owner" && (
                    <div className="mb-3">
                      <label className="form-label fw-semibold small">
                        Business / Company Name
                        <span className="text-muted fw-normal">
                          {" "}
                          (optional)
                        </span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="fas fa-building"></i>
                        </span>
                        <input
                          className="form-control"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          placeholder="e.g. Wilson Properties"
                        />
                      </div>
                    </div>
                  )}
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-primary flex-fill"
                      onClick={handleSave}
                    >
                      <i className="fas fa-save me-1"></i>Save
                    </button>
                    <button
                      className="btn btn-outline-secondary flex-fill"
                      onClick={() => {
                        setEditing(false);
                        setFormError("");
                        setName(user.name);
                        setEmail(user.email || "");
                        setPhone(user.phone || "");
                        setBusinessName(user.businessName || "");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className={styles.userName}>{user.name}</h3>
                  <div className={styles.infoList}>
                    {[
                      { icon: "fa-envelope", value: user.email },
                      {
                        icon: "fa-phone",
                        value: user.phone || (
                          <span className="text-muted fst-italic">Not set</span>
                        ),
                      },
                      {
                        icon: ROLE_ICONS[user.role] || "fa-user",
                        value:
                          user.role.charAt(0).toUpperCase() +
                          user.role.slice(1),
                      },
                      ...(user.role === "owner" && user.businessName
                        ? [{ icon: "fa-building", value: user.businessName }]
                        : []),
                      ...(user.since
                        ? [
                            {
                              icon: "fa-calendar",
                              value: `Member since ${user.since}`,
                            },
                          ]
                        : []),
                    ].map((item, i) => (
                      <div key={i} className={styles.infoItem}>
                        <i
                          className={`fas ${item.icon} text-muted flex-shrink-0`}
                        ></i>
                        <span>{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    className={`btn btn-outline-primary w-100 mt-3 ${styles.editBtn}`}
                    onClick={() => setEditing(true)}
                  >
                    <i className="fas fa-edit me-2"></i>Edit Profile
                  </button>
                </>
              )}
            </div>

            {/* Quick actions */}
            <div className={styles.actionsCard}>
              <div className={styles.actionsTitle}>Quick Actions</div>
              {user.role === "owner" && (
                <>
                  <Link to="/add-property" className={styles.actionItem}>
                    <i className="fas fa-plus-circle text-success"></i>
                    <span>Add New Property</span>
                    <i className="fas fa-chevron-right ms-auto text-muted small"></i>
                  </Link>
                  <Link to="/dashboard" className={styles.actionItem}>
                    <i className="fas fa-tachometer-alt text-primary"></i>
                    <span>Owner Dashboard</span>
                    <i className="fas fa-chevron-right ms-auto text-muted small"></i>
                  </Link>
                </>
              )}
              {user.role === "tenant" && (
                <Link to="/search" className={styles.actionItem}>
                  <i className="fas fa-search text-primary"></i>
                  <span>Browse Properties</span>
                  <i className="fas fa-chevron-right ms-auto text-muted small"></i>
                </Link>
              )}
              {user.role === "admin" && (
                <Link to="/admin" className={styles.actionItem}>
                  <i className="fas fa-shield-alt text-danger"></i>
                  <span>Admin Panel</span>
                  <i className="fas fa-chevron-right ms-auto text-muted small"></i>
                </Link>
              )}
              <Link to="/search" className={styles.actionItem}>
                <i className="fas fa-home text-muted"></i>
                <span>Browse All Properties</span>
                <i className="fas fa-chevron-right ms-auto text-muted small"></i>
              </Link>
              <button
                className={`${styles.actionItem} w-100 text-start border-0 bg-transparent`}
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                style={{ color: "#dc2626" }}
              >
                <i className="fas fa-sign-out-alt"></i>
                <span>Sign Out</span>
                <i className="fas fa-chevron-right ms-auto text-muted small"></i>
              </button>
            </div>
          </div>

          {/* Right column — properties */}
          <div className="col-lg-8">
            <div className={styles.propsCard}>
              <div className={styles.propsHeader}>
                <h3 className={styles.propsTitle}>
                  <i
                    className={`fas ${user.role === "owner" ? "fa-home" : "fa-heart"} me-2`}
                  ></i>
                  {user.role === "owner"
                    ? "My Listed Properties"
                    : "Saved Properties"}
                </h3>
                {user.role === "owner" && (
                  <Link to="/add-property" className="btn btn-primary btn-sm">
                    <i className="fas fa-plus me-1"></i>
                    <span className="d-none d-sm-inline">Add New</span>
                  </Link>
                )}
                {user.role === "tenant" && (
                  <Link to="/search" className="btn btn-outline-primary btn-sm">
                    <i className="fas fa-search me-1"></i>
                    <span className="d-none d-sm-inline">Browse</span>
                  </Link>
                )}
              </div>

              {myProperties.length === 0 ? (
                <div className={styles.emptyProps}>
                  <i
                    className={`fas ${user.role === "owner" ? "fa-home" : "fa-heart"} fa-3x text-muted mb-3`}
                  ></i>
                  <h5>
                    {user.role === "owner"
                      ? "No properties listed yet"
                      : "No saved properties yet"}
                  </h5>
                  <p className="text-muted small">
                    {user.role === "owner"
                      ? "Start by adding your first property listing."
                      : "Browse properties and click ♥ to save them here."}
                  </p>
                  {user.role === "owner" ? (
                    <Link to="/add-property" className="btn btn-primary btn-sm">
                      <i className="fas fa-plus me-1"></i>Add Property
                    </Link>
                  ) : (
                    <Link to="/search" className="btn btn-primary btn-sm">
                      <i className="fas fa-search me-1"></i>Browse Properties
                    </Link>
                  )}
                </div>
              ) : (
                <div className="row g-3">
                  {myProperties.map((p) => (
                    <div className="col-md-6 col-xl-4" key={p.id}>
                      <div
                        className={styles.propCard}
                        onClick={() => navigate("/property/" + p.id)}
                      >
                        <div className={styles.propImg}>
                          {p.images[0] ? (
                            <img
                              src={p.images[0]}
                              alt={p.title}
                              loading="lazy"
                              onError={handleImgError}
                            />
                          ) : (
                            <div className={styles.propImgPlaceholder}>
                              <i className="fas fa-image fa-2x text-muted"></i>
                            </div>
                          )}
                          <span
                            className={`badge ${styles.statusBadge} ${p.status === "Active" ? styles.badgeActive : styles.badgeRented}`}
                          >
                            {p.status}
                          </span>
                        </div>
                        <div className={styles.propInfo}>
                          <div className={styles.propTitle}>{p.title}</div>
                          <div className={styles.propCity}>
                            <i className="fas fa-map-marker-alt me-1"></i>
                            {p.city}
                          </div>
                          <div className={styles.propPrice}>
                            <span
                              style={{
                                fontSize: "14px",
                                color: "#40608d",
                                marginRight: "4px",
                                fontWeight: "bold",
                              }}
                            >
                              EGP
                            </span>
                            {p.price.toLocaleString()}
                            <span>/mo</span>
                          </div>
                          <div className={styles.propSpecs}>
                            <span>
                              <i className="fas fa-bed me-1"></i>
                              {p.bedrooms || "Studio"}
                            </span>
                            <span>
                              <i className="fas fa-bath me-1"></i>
                              {p.bathrooms}
                            </span>
                            <span>
                              <i className="fas fa-vector-square me-1"></i>
                              {p.area} sqm
                            </span>
                          </div>
                        </div>
                        {user.role === "owner" && p.ownerId === user.id && (
                          <div className={styles.propActions}>
                            <Link
                              to={`/edit-property/${p.id}`}
                              className="btn btn-sm btn-outline-primary w-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <i className="fas fa-edit me-1"></i>Edit Listing
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
