import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./LandingPage.module.css";

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [location, setLocation] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [rooms, setRooms] = useState("");
  const [searchError, setSearchError] = useState("");

  const handleSearch = () => {
    if (!location.trim() && !maxPrice.trim() && !rooms.trim()) {
      setSearchError(
        "Please enter a location, price, or number of rooms to search.",
      );
      return;
    }
    setSearchError("");
    const params = new URLSearchParams();
    if (location.trim()) params.set("location", location.trim());
    if (maxPrice.trim()) params.set("maxPrice", maxPrice.trim());
    if (rooms.trim()) params.set("rooms", rooms.trim());
    navigate("/search?" + params.toString());
  };

  return (
    <div className={styles.page}>
      {/* ── Navbar ── */}
      <nav className={`navbar navbar-expand-lg ${styles.navbar}`}>
        <div className="container-fluid px-3 px-md-4">
          <Link
            to="/"
            className="navbar-brand d-flex align-items-center gap-2 text-decoration-none p-0"
          >
            <div className="brand-logo">
              <i className="fas fa-home"></i>
            </div>
            <span className="brand-name">SMSRLY</span>
          </Link>

          <button
            className="navbar-toggler border-0 shadow-none"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navMain"
            aria-controls="navMain"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navMain">
            <ul className="navbar-nav mx-auto mb-2 mb-lg-0 gap-lg-1">
              <li className="nav-item">
                <Link to="/search" className={styles.navLink}>
                  <i className="fas fa-search me-1 d-lg-none"></i>Browse Homes
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  to={user?.role === "owner" ? "/dashboard" : "/signup"}
                  className={styles.navLink}
                >
                  <i className="fas fa-building me-1 d-lg-none"></i>For Owners
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/search?nearby=true" className={styles.navLink}>
                  <i className="fas fa-map-marker-alt me-1 d-lg-none"></i>Nearby
                  Services
                </Link>
              </li>
            </ul>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              {user ? (
                <>
                  <Link
                    to="/profile"
                    className={`btn btn-light btn-sm d-flex align-items-center gap-2 ${styles.profileBtn}`}
                  >
                    <i className="fas fa-user-circle fa-lg"></i>
                    <span>{user.name.split(" ")[0]}</span>
                  </Link>
                  {user.role === "owner" && (
                    <Link
                      to="/dashboard"
                      className="btn btn-outline-primary btn-sm fw-600"
                    >
                      Dashboard
                    </Link>
                  )}
                  {user.role === "admin" && (
                    <Link
                      to="/admin"
                      className="btn btn-outline-danger btn-sm fw-600"
                    >
                      Admin
                    </Link>
                  )}
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => {
                      logout();
                    }}
                  >
                    <i className="fas fa-sign-out-alt me-1"></i>
                    <span className="d-none d-sm-inline">Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link to="/signin" className={styles.signInBtn}>
                    Sign In
                  </Link>
                  <Link to="/signup" className={styles.getStartedBtn}>
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={`${styles.heroContent} px-3`}>
          <h1 className={styles.heroTitle}>
            Find Your Next Home
            <br className="d-none d-sm-block" /> With Confidence
          </h1>
          <p className={styles.heroSubtitle}>
            The most secure platform for tenants and owners. Verified listings,
            direct communication, and neighborhood insights at your fingertips.
          </p>

          {/* Search bar */}
          <div className={styles.searchBar}>
            <div className={styles.searchField}>
              <i
                className={`fas fa-map-marker-alt ${styles.searchFieldIcon}`}
              ></i>
              <input
                placeholder="Enter location…"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setSearchError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className={styles.searchInput}
              />
            </div>
            <div className={styles.searchDivider} />
            <div className={styles.searchField}>
              <span className={styles.searchFieldIcon}>EGP</span>
              <input
                placeholder="Max Price"
                type="number"
                min="0"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  setSearchError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className={styles.searchInput}
              />
            </div>
            <div className={styles.searchDivider} />
            <div className={styles.searchField}>
              <i className={`fas fa-bed ${styles.searchFieldIcon}`}></i>
              <input
                placeholder="Rooms"
                type="number"
                min="0"
                value={rooms}
                onChange={(e) => {
                  setRooms(e.target.value);
                  setSearchError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className={styles.searchInput}
              />
            </div>
            <button className={styles.searchBtn} onClick={handleSearch}>
              <i className="fas fa-search me-2"></i>
              <span>Search</span>
            </button>
          </div>

          {searchError && (
            <p className={styles.searchError}>
              <i className="fas fa-exclamation-circle me-2"></i>
              {searchError}
            </p>
          )}
        </div>
      </section>

      {/* ── Choose Your Path ── */}
      <section className="py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className={styles.sectionTitle}>Choose Your Path</h2>
            <p className={styles.sectionSub}>
              Tailored experiences for tenants and owners alike.
            </p>
          </div>
          <div className="row g-4">
            <div className="col-md-6">
              <div className={styles.pathCard}>
                <div
                  className={styles.pathIcon}
                  style={{ background: "#eff6ff", color: "#2563eb" }}
                >
                  <i className="fas fa-user fa-lg"></i>
                </div>
                <h3 className={styles.pathTitle}>I'm a Tenant</h3>
                <p className={styles.pathDesc}>
                  Browse thousands of verified listings, view neighborhood
                  safety scores, and contact owners directly.
                </p>
                <Link to="/search" className={styles.pathLink}>
                  Find a Home <i className="fas fa-arrow-right ms-1"></i>
                </Link>
              </div>
            </div>
            <div className="col-md-6">
              <div className={styles.pathCard}>
                <div
                  className={styles.pathIcon}
                  style={{ background: "#f0fdf4", color: "#16a34a" }}
                >
                  <i className="fas fa-building fa-lg"></i>
                </div>
                <h3 className={styles.pathTitle}>I'm an Owner</h3>
                <p className={styles.pathDesc}>
                  List your property, upload high-quality images, and manage
                  your rentals with our powerful dashboard.
                </p>
                <Link
                  to={user?.role === "owner" ? "/dashboard" : "/signup"}
                  className={styles.pathLink}
                  style={{ color: "#16a34a" }}
                >
                  List Property <i className="fas fa-arrow-right ms-1"></i>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Know Your Neighborhood ── */}
      <section className={styles.neighborhoodSection}>
        <div className="container">
          <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
            <div>
              <h2 className={styles.sectionTitle}>Know Your Neighborhood</h2>
              <p className={styles.sectionSub} style={{ maxWidth: 420 }}>
                We go beyond the four walls. See nearby hospitals, pharmacies,
                and police stations for every listing.
              </p>
            </div>
            <Link to="/search?nearby=true" className={styles.learnMore}>
              Learn More <i className="fas fa-external-link-alt ms-1 fa-sm"></i>
            </Link>
          </div>
          <div className="row g-4">
            {[
              {
                color: "#2563eb",
                bg: "#eff6ff",
                icon: "fa-shield-alt",
                title: "Police Stations",
                desc: "Direct contact info and proximity markers for every listing.",
              },
              {
                color: "#dc2626",
                bg: "#fef2f2",
                icon: "fa-heartbeat",
                title: "Medical Facilities",
                desc: "Quick access to the nearest hospitals and emergency care.",
              },
              {
                color: "#16a34a",
                bg: "#f0fdf4",
                icon: "fa-plus-square",
                title: "Pharmacies",
                desc: "Find 24/7 pharmacies within walking distance of your new home.",
              },
            ].map((a) => (
              <div className="col-md-4" key={a.title}>
                <div className={styles.amenityItem}>
                  <div
                    className={styles.amenityIcon}
                    style={{ color: a.color, background: a.bg }}
                  >
                    <i className={`fas ${a.icon} fa-lg`}></i>
                  </div>
                  <div>
                    <div className={styles.amenityTitle}>{a.title}</div>
                    <div className={styles.amenityDesc}>{a.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className="container">
          <div className="row g-4 pb-4">
            <div className="col-lg-4 col-md-6">
              <Link
                to="/"
                className="d-flex align-items-center gap-2 mb-3 text-decoration-none"
              >
                <div className="brand-logo">
                  <i className="fas fa-home"></i>
                </div>
                <span className="brand-name" style={{ color: "#fff" }}>
                  SMSRLY
                </span>
              </Link>
              <p className={styles.footerTagline}>
                Empowering tenants and owners with secure, data-driven housing
                solutions.
              </p>
              <div className="d-flex gap-3 mt-3">
                {[
                  "fa-twitter",
                  "fa-facebook",
                  "fa-instagram",
                  "fa-linkedin",
                ].map((ic) => (
                  <a
                    key={ic}
                    href="#"
                    className={styles.socialIcon}
                    onClick={(e) => e.preventDefault()}
                  >
                    <i className={`fab ${ic}`}></i>
                  </a>
                ))}
              </div>
            </div>
            <div className="col-lg-2 col-6">
              <div className={styles.footerHeading}>Platform</div>
              <Link to="/search" className={styles.footerLink}>
                Search Houses
              </Link>
              <Link to="/add-property" className={styles.footerLink}>
                List Property
              </Link>
              <Link to="/signup" className={styles.footerLink}>
                Security
              </Link>
            </div>
            <div className="col-lg-2 col-6">
              <div className={styles.footerHeading}>Support</div>
              <Link to="/search" className={styles.footerLink}>
                Help Center
              </Link>
              <Link to="/admin" className={styles.footerLink}>
                Contact Admin
              </Link>
              <Link to="/signin" className={styles.footerLink}>
                Privacy Policy
              </Link>
            </div>
            <div className="col-lg-4 col-md-6">
              <div className={styles.footerHeading}>Newsletter</div>
              <p className={styles.footerTagline}>
                Stay updated with the latest listings.
              </p>
              <div className={styles.newsletterForm}>
                <input
                  placeholder="Email address"
                  className={styles.newsletterInput}
                  type="email"
                />
                <button className={styles.newsletterBtn} onClick={() => {}}>
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            </div>
          </div>
          <div className={styles.footerBottom}>
            © 2024 SMSRLY. All rights reserved. Secure housing for everyone.
          </div>
        </div>
      </footer>
    </div>
  );
}
