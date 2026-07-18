import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  useAuth,
  useProperties,
  useNotifications,
  usePlatform,
} from "../context/AuthContext";
import PropertyMap from "../components/map/PropertyMap";
import ThemeToggle from "../components/ui/ThemeToggle";
import { handleImgError } from "../utils/imageUtils";
import styles from "./PropertyDetailsPage.module.css";

export default function PropertyDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { properties, toggleSavedProperty, updateProperty } = useProperties();
  const { addNotification } = useNotifications();
  const { allUsers } = usePlatform();

  const property = properties.find((p) => p.id === parseInt(id));
  const [msgModal, setMsgModal] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [msgSent, setMsgSent] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const viewCountedRef = useRef(false);

  useEffect(() => {
    if (property && !viewCountedRef.current) {
      viewCountedRef.current = true;
      updateProperty(property.id, { views: (property.views || 0) + 1 });
    }
  }, [property?.id]);

  if (!property)
    return (
      <div className="d-flex flex-column align-items-center justify-content-center min-vh-100">
        <i className="fas fa-home fa-4x text-muted mb-3"></i>
        <h3>Property not found</h3>
        <Link to="/search" className="btn btn-primary mt-2">
          Browse Properties
        </Link>
      </div>
    );

  const {
    title,
    address,
    price,
    bedrooms,
    bathrooms,
    area,
    description,
    images,
    nearby,
    lat,
    lng,
  } = property;
  const ownerSnapshot = property.owner || {
    name: property.ownerName || "Property Owner",
    since: new Date().getFullYear(),
    rating: 5,
    reviews: 0,
    phone: "N/A",
  };
  const liveOwner = (allUsers || []).find((u) => u.id === property.ownerId);
  const owner = {
    ...ownerSnapshot,
    ...(liveOwner
      ? {
          name: liveOwner.name || ownerSnapshot.name,
          phone: liveOwner.phone || ownerSnapshot.phone,
          avatar: liveOwner.avatar,
        }
      : {}),
  };
  const isSaved = (user?.savedProperties || []).includes(property.id);

  const handleSave = () => {
    if (!user) {
      navigate("/signin");
      return;
    }
    toggleSavedProperty(property.id);
  };
  const handleSendMessage = () => {
    if (!user) {
      navigate("/signin");
      return;
    }
    setMsgModal(true);
  };
  const submitMsg = () => {
    if (!msgText.trim()) return;
    addNotification(user, {
      targetUserId: property.ownerId,
      type: "inquiry_message",
      content: `${user.name} sent you a message about "${title}": "${msgText.trim()}"`,
    });
    setMsgSent(true);
    setTimeout(() => {
      setMsgModal(false);
      setMsgSent(false);
      setMsgText("");
    }, 1500);
  };

  return (
    <div className={styles.page}>
      {/* Navbar */}
      <div className={styles.topbar}>
        <div className="d-flex align-items-center gap-3">
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <Link
            to="/"
            className="d-flex align-items-center gap-2 text-decoration-none"
          >
            <div className="brand-logo">
              <i className="fas fa-home"></i>
            </div>
            <span className="brand-name d-none d-md-block">SMSRLY</span>
          </Link>
          <span className={styles.topbarTitle}>{title}</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <ThemeToggle />
          <button
            className={styles.iconBtn}
            title="Share"
            onClick={() => {
              navigator.share?.({ title, url: window.location.href });
            }}
          >
            <i className="fas fa-share-alt"></i>
          </button>
          <button
            className={`${styles.iconBtn} ${isSaved ? styles.iconBtnSaved : ""}`}
            onClick={handleSave}
            title={isSaved ? "Remove from saved" : "Save"}
          >
            <i className={`${isSaved ? "fas" : "far"} fa-heart`}></i>
          </button>
          {user ? (
            <Link to="/profile" className={styles.avatarBtn}>
              {/* Show the uploaded profile picture if set, otherwise the default icon */}
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className={styles.topAvatarImg}
                  onError={handleImgError}
                />
              ) : (
                <i className="fas fa-user-circle fa-lg"></i>
              )}
              <span className="d-none d-md-inline">
                {user.name.split(" ")[0]}
              </span>
            </Link>
          ) : (
            <Link to="/signin" className="btn btn-primary btn-sm">
              Sign In
            </Link>
          )}
        </div>
      </div>

      <div className={styles.body}>
        {/* LEFT COLUMN */}
        <div className={styles.leftCol}>
          {/* Gallery */}
          <div className={styles.gallery}>
            <div className={styles.galleryMain}>
              {images[activeImg] ? (
                <img
                  src={images[activeImg]}
                  alt={title}
                  className={styles.mainImg}
                  onError={handleImgError}
                />
              ) : (
                <div className={styles.noImg}>
                  <i className="fas fa-image fa-3x text-muted"></i>
                </div>
              )}
              {images.length > 1 && (
                <>
                  <button
                    className={`${styles.galleryNav} ${styles.galleryNavL}`}
                    onClick={() =>
                      setActiveImg(
                        (i) => (i - 1 + images.length) % images.length,
                      )
                    }
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <button
                    className={`${styles.galleryNav} ${styles.galleryNavR}`}
                    onClick={() => setActiveImg((i) => (i + 1) % images.length)}
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </>
              )}
            </div>
            <div className={styles.galleryRight}>
              {images.slice(1, 3).map((img, i) => (
                <div
                  key={i}
                  className={`${styles.thumbWrap} ${activeImg === i + 1 ? styles.thumbActive : ""}`}
                  onClick={() => setActiveImg(i + 1)}
                >
                  <img
                    src={img}
                    alt=""
                    className={styles.thumbImg}
                    onError={handleImgError}
                  />
                  {i === 1 && images.length > 3 && (
                    <div className={styles.moreOverlay}>
                      +{images.length - 2} Photos
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Info Card */}
          <div className={styles.infoCard}>
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
              <div>
                <h1 className={styles.propTitle}>{title}</h1>
                <div className={styles.propAddress}>
                  <i className="fas fa-map-marker-alt me-2 text-muted"></i>
                  {address}
                </div>
              </div>
              <div className="text-end">
                <div className={styles.propPrice}>
                  <span
                    style={{
                      fontSize: "22px",
                      color: "#40608d",
                      marginRight: "4px",
                      fontWeight: "bold",
                    }}
                  >
                    EGP
                  </span>
                  {price.toLocaleString()}
                  <span>/mo</span>
                </div>
                <span className={`badge ${styles.availBadge}`}>
                  <i className="fas fa-circle me-1" style={{ fontSize: 8 }}></i>
                  {property.status === "Active"
                    ? "Available Now"
                    : property.status}
                </span>
              </div>
            </div>
            <div className={styles.specs}>
              <div className={styles.spec}>
                <i className="fas fa-bed"></i>
                <div>
                  <div className={styles.specLabel}>BEDROOMS</div>
                  <div className={styles.specVal}>{bedrooms || "Studio"}</div>
                </div>
              </div>
              <div className={styles.spec}>
                <i className="fas fa-bath"></i>
                <div>
                  <div className={styles.specLabel}>BATHROOMS</div>
                  <div className={styles.specVal}>{bathrooms || 1} Full</div>
                </div>
              </div>
              <div className={styles.spec}>
                <i className="fas fa-vector-square"></i>
                <div>
                  <div className={styles.specLabel}>AREA</div>
                  <div className={styles.specVal}>{area} m²</div>
                </div>
              </div>
              <div className={styles.spec}>
                <i className="fas fa-tag"></i>
                <div>
                  <div className={styles.specLabel}>TYPE</div>
                  <div className={styles.specVal}>{property.type}</div>
                </div>
              </div>
            </div>
            <h3 className={styles.aboutTitle}>About this property</h3>
            <p className={styles.aboutText}>{description}</p>
          </div>

          {/* Map */}
          <div className={styles.mapCard}>
            <div className={styles.mapHeader}>
              <div className={styles.mapTitle}>
                <i className="fas fa-map-marked-alt me-2 text-primary"></i>
                Location & Neighborhood
              </div>
            </div>
            <PropertyMap lat={lat} lng={lng} height="260px" zoom={15} />
            {/* Nearby Services */}
            <div className={styles.nearbyGrid}>
              {[
                {
                  key: "pharmacy",
                  label: "Pharmacy",
                  icon: "fa-plus-square",
                  color: "#16a34a",
                  bg: "#f0fdf4",
                },
                {
                  key: "hospital",
                  label: "Hospital",
                  icon: "fa-heartbeat",
                  color: "#dc2626",
                  bg: "#fef2f2",
                },
                {
                  key: "police",
                  label: "Police Station",
                  icon: "fa-shield-alt",
                  color: "#2563eb",
                  bg: "#eff6ff",
                },
              ].map(({ key, label, icon, color, bg }) => {
                const s = nearby[key];
                return (
                  <div key={key} className={styles.nearbyService}>
                    <div
                      className={styles.serviceIcon}
                      style={{ background: bg, color }}
                    >
                      <i className={`fas ${icon}`}></i>
                    </div>
                    <div>
                      <div className={styles.serviceType}>{label}</div>
                      <div className={styles.serviceName}>{s.name}</div>
                      <div className={styles.serviceDist}>
                        <i className="fas fa-walking me-1"></i>
                        {s.distance}
                      </div>
                      <div className={styles.servicePhone}>
                        <i className="fas fa-phone me-1"></i>
                        {s.phone}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className={styles.rightCol}>
          <div className={styles.contactCard}>
            <h3 className={styles.contactTitle}>
              <i className="fas fa-comments me-2"></i>Contact Owner
            </h3>
            <div className={styles.ownerRow}>
              <div className={styles.ownerAvatar}>
                {owner.avatar ? (
                  <img
                    src={owner.avatar}
                    alt={owner.name}
                    className={styles.ownerAvatarImg}
                    onError={handleImgError}
                  />
                ) : (
                  <i className="fas fa-user-circle fa-2x"></i>
                )}
              </div>
              <div>
                <div className={styles.ownerName}>{owner.name}</div>
                <div className={styles.ownerSince}>
                  <i className="fas fa-calendar me-1"></i>Owner since{" "}
                  {owner.since}
                </div>
                <div className={styles.ownerRating}>
                  {[...Array(5)].map((_, i) => (
                    <i
                      key={i}
                      className={`fas fa-star ${i < Math.floor(owner.rating) ? styles.starFilled : styles.starEmpty}`}
                    ></i>
                  ))}
                  <span className="ms-1 text-muted small">
                    {owner.rating} ({owner.reviews} reviews)
                  </span>
                </div>
              </div>
            </div>
            <button className={styles.msgBtn} onClick={handleSendMessage}>
              <i className="fas fa-paper-plane me-2"></i>Send Message
            </button>
            <a href={`tel:${owner.phone}`} className={styles.callBtn}>
              <i className="fas fa-phone me-2"></i>Call: {owner.phone}
            </a>
            <div className={styles.safetyBox}>
              <div className={styles.safetyTitle}>
                <i className="fas fa-shield-alt me-1"></i> SAFETY TIPS
              </div>
              <div className={styles.safetyItem}>
                <i className="fas fa-check-circle text-success me-2"></i>Never
                pay before seeing the property in person.
              </div>
              <div className={styles.safetyItem}>
                <i className="fas fa-check-circle text-success me-2"></i>Always
                use SMSRLY secure chat for communication.
              </div>
            </div>
          </div>

          <div className={styles.demandCard}>
            <div className={styles.demandTitle}>
              <i className="fas fa-fire me-2"></i>
              {(property.views || 0) > 20 ? "High Demand!" : "Getting Noticed"}
            </div>
            <p className={styles.demandText}>
              {(property.views || 0).toLocaleString()}{" "}
              {(property.views || 0) === 1 ? "person has" : "people have"}{" "}
              viewed this property.
            </p>
            <div className={styles.demandBar}>
              <div
                className={styles.demandFill}
                style={{
                  width: `${Math.min(100, ((property.views || 0) / 50) * 100)}%`,
                }}
              ></div>
            </div>
          </div>

          {user?.role === "owner" && property.ownerId === user.id && (
            <div className={styles.ownerActions}>
              <div className={styles.ownerActionsTitle}>
                <i className="fas fa-tools me-2"></i>Your Property
              </div>
              <Link
                to={`/edit-property/${property.id}`}
                className="btn btn-outline-primary w-100 mb-2"
              >
                <i className="fas fa-edit me-2"></i>Edit Listing
              </Link>
              <Link to="/dashboard" className="btn btn-outline-secondary w-100">
                <i className="fas fa-tachometer-alt me-2"></i>Dashboard
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Message Modal */}
      {msgModal && (
        <div className={styles.modalOverlay} onClick={() => setMsgModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h5 className="mb-0">
                <i className="fas fa-paper-plane me-2"></i>Message {owner.name}
              </h5>
              <button
                className={styles.modalClose}
                onClick={() => setMsgModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            {msgSent ? (
              <div className="text-center py-4">
                <i className="fas fa-check-circle fa-3x text-success mb-3"></i>
                <p className="fw-600">Message sent successfully!</p>
              </div>
            ) : (
              <div className={styles.modalBody}>
                <p className="text-muted small mb-3">
                  Regarding: <strong>{title}</strong>
                </p>
                <textarea
                  className="form-control mb-3"
                  rows={5}
                  placeholder="Hi, I'm interested in this property and would like to schedule a viewing..."
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                />
                <div className="d-flex gap-2 justify-content-end">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setMsgModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={submitMsg}
                    disabled={!msgText.trim()}
                  >
                    <i className="fas fa-paper-plane me-2"></i>Send
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
