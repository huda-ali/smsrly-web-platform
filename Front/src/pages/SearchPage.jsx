import { useState, useMemo } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth, useProperties } from "../context/AuthContext";
import PropertyMap from "../components/map/PropertyMap";
import ThemeToggle from "../components/ui/ThemeToggle";
import { handleImgError } from "../utils/imageUtils";
import styles from "./SearchPage.module.css";

const AMENITY = {
  Hospital: { color: "#dc2626", bg: "#fef2f2", icon: "fa-heartbeat" },
  Pharmacy: { color: "#16a34a", bg: "#f0fdf4", icon: "fa-plus-square" },
  Police: { color: "#2563eb", bg: "#eff6ff", icon: "fa-shield-alt" },
};

export default function SearchPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { properties, toggleSavedProperty } = useProperties();
  const [searchParams, setSearchParams] = useSearchParams();

  const initLocation = searchParams.get("location") || "";
  const initMax = searchParams.get("maxPrice")
    ? parseInt(searchParams.get("maxPrice"))
    : 8000;
  const initRooms = searchParams.get("rooms")
    ? parseInt(searchParams.get("rooms"))
    : 0;

  const [locationSearch, setLocationSearch] = useState(initLocation);
  const [minPrice, setMinPrice] = useState(500);
  const [maxPrice, setMaxPrice] = useState(initMax);
  const [bedrooms, setBedrooms] = useState(
    initRooms > 0 ? `${initRooms}+` : "any",
  );
  const [propTypes, setPropTypes] = useState({
    Apartment: false,
    House: false,
    Studio: false,
  });

  const [amenities, setAmenities] = useState({
    Hospitals: false,
    Pharmacies: false,
    "Police Stations": false,
  });

  const [sort, setSort] = useState("newest");
  const [mapView, setMapView] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const saved = user?.savedProperties || [];

  const filtered = useMemo(() => {
    let list = [...properties];
    if (locationSearch.trim()) {
      const q = locationSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.city?.toLowerCase().includes(q) ||
          p.address?.toLowerCase().includes(q) ||
          p.title?.toLowerCase().includes(q),
      );
    }
    list = list.filter((p) => p.price >= minPrice && p.price <= maxPrice);
    if (bedrooms !== "any") {
      const min = parseInt(bedrooms);
      list = list.filter((p) => p.bedrooms >= min);
    }

    const checked = Object.entries(propTypes)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (checked.length > 0) {
      list = list.filter((p) => checked.includes(p.type));
    }

    const checkedAmenities = Object.entries(amenities)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (checkedAmenities.length > 0) {
      const mapKey = (name) => {
        if (name === "Hospitals") return "Hospital";
        if (name === "Pharmacies") return "Pharmacy";
        if (name === "Police Stations") return "Police";
        return name;
      };
      list = list.filter((p) =>
        checkedAmenities.every((amenity) =>
          p.nearbyTags?.includes(mapKey(amenity)),
        ),
      );
    }

    if (sort === "priceAsc") list.sort((a, b) => a.price - b.price);
    else if (sort === "priceDesc") list.sort((a, b) => b.price - a.price);
    else list.sort((a, b) => b.id - a.id);
    return list;
  }, [
    properties,
    locationSearch,
    minPrice,
    maxPrice,
    bedrooms,
    propTypes,
    amenities,
    sort,
  ]);

  const mapMarkers = useMemo(
    () =>
      filtered.map((p) => ({
        lat: p.lat,
        lng: p.lng,
        price: p.price,
        id: p.id,
      })),
    [filtered],
  );

  const FilterPanel = () => (
    <div className={styles.filterInner}>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className={styles.sidebarTitle}>
          <i className="fas fa-sliders-h me-2 text-primary"></i>Filters
        </h3>
      </div>

      <div className={styles.filterSection}>
        <div className={styles.filterLabel}>
          <i className="fas fa-money-bill-wave me-1"></i>Price Range
        </div>
        <div className="d-flex justify-content-between mb-1">
          <span className={styles.priceVal}>
            <span className={styles.currencyLabel}>EGP </span>
            {minPrice.toLocaleString()}
          </span>

          <span className={styles.priceVal}>
            <span className={styles.currencyLabel}>EGP </span>
            {maxPrice.toLocaleString()}
          </span>
        </div>
        <input
          type="range"
          min="500"
          max="10000"
          step="100"
          value={maxPrice}
          onChange={(e) => setMaxPrice(+e.target.value)}
          className={styles.rangeSlider}
        />
      </div>

      <div className={styles.filterSection}>
        <div className={styles.filterLabel}>
          <i className="fas fa-bed me-1"></i>Bedrooms
        </div>
        <div className={styles.bedBtns}>
          {["any", "1+", "2+", "3+"].map((b) => (
            <button
              key={b}
              className={`${styles.bedBtn} ${bedrooms === b ? styles.bedActive : ""}`}
              onClick={() => setBedrooms(b)}
            >
              {b === "any" ? "Any" : b}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.filterSection}>
        <div className={styles.filterLabel}>
          <i className="fas fa-building me-1"></i>Property Type
        </div>
        {[
          ["Apartment", "fa-building"],
          ["House", "fa-home"],
          ["Studio", "fa-door-open"],
        ].map(([t, icon]) => (
          <label key={t} className={styles.checkRow}>
            <input
              type="checkbox"
              checked={propTypes[t]}
              onChange={(e) =>
                setPropTypes((p) => ({ ...p, [t]: e.target.checked }))
              }
              className={styles.cb}
            />
            <i className={`fas ${icon} me-2 text-muted`}></i>
            {t}
          </label>
        ))}
      </div>

      <div className={styles.filterSection}>
        <div className={styles.filterLabel}>
          <i className="fas fa-map-pin me-1"></i>Nearby Amenities
        </div>
        {[
          ["Hospitals", "fa-heartbeat", "#dc2626"],
          ["Pharmacies", "fa-plus-square", "#16a34a"],
          ["Police Stations", "fa-shield-alt", "#2563eb"],
        ].map(([label, icon, color]) => (
          <label key={label} className={styles.checkRow}>
            <input
              type="checkbox"
              className={styles.cb}
              checked={amenities[label] || false}
              onChange={(e) =>
                setAmenities((prev) => ({ ...prev, [label]: e.target.checked }))
              }
            />
            <i className={`fas ${icon} me-2`} style={{ color }}></i>
            {label}
          </label>
        ))}
      </div>

      {/* Apply button on mobile */}
      <button
        className={`btn btn-primary w-100 d-lg-none mt-2 ${styles.applyBtn}`}
        onClick={() => setFilterOpen(false)}
      >
        <i className="fas fa-check me-2"></i>Apply Filters ({filtered.length}{" "}
        results)
      </button>
    </div>
  );

  return (
    <div className={styles.page}>
      {/* ── Topbar ── */}
      <div className={styles.topbar}>
        <div className="d-flex align-items-center gap-2 flex-1 min-width-0">
          <Link
            to="/"
            className="d-flex align-items-center gap-2 text-decoration-none flex-shrink-0"
          >
            <div className="brand-logo">
              <i className="fas fa-home"></i>
            </div>
            <span className="brand-name d-none d-sm-block">SMSRLY</span>
          </Link>

          <div className={styles.searchMini}>
            <i className="fas fa-search text-muted me-2"></i>
            <input
              placeholder="Search location, title…"
              value={locationSearch}
              onChange={(e) => {
                const val = e.target.value;
                setLocationSearch(val);
                if (val.trim()) {
                  searchParams.set("location", val);
                } else {
                  searchParams.delete("location");
                }
                setSearchParams(searchParams);
              }}
              className={styles.searchMiniInput}
            />

            {locationSearch && (
              <button
                className={styles.clearBtn}
                style={{ background: "none", border: "none", padding: "0 4px" }}
                onClick={() => {
                  setLocationSearch("");
                  searchParams.delete("location");
                  setSearchParams(searchParams);
                }}
              >
                <i className="fas fa-times text-muted"></i>
              </button>
            )}
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 flex-shrink-0">
          {/* Filter toggle — mobile only */}
          <button
            className={`btn btn-sm btn-outline-secondary d-lg-none ${filterOpen ? "active" : ""}`}
            onClick={() => setFilterOpen((f) => !f)}
          >
            <i className="fas fa-sliders-h me-1"></i>Filters
          </button>

          <button
            className={`btn btn-sm ${mapView ? "btn-primary" : "btn-outline-secondary"}`}
            onClick={() => setMapView((m) => !m)}
          >
            <i className={`fas ${mapView ? "fa-list" : "fa-map"} me-1`}></i>
            <span className="d-none d-sm-inline">
              {mapView ? "List" : "Map"}
            </span>
          </button>

          <ThemeToggle />

          {user ? (
            <Link to="/profile" className={styles.avatarBtn} title={user.name}>
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
              <span className={styles.avatarName}>
                {user.name.split(" ")[0]}
              </span>
            </Link>
          ) : (
            <Link to="/signin" className={styles.avatarBtn}>
              <i className="fas fa-user-circle fa-lg text-muted"></i>
              <span className={styles.avatarName}>Guest</span>
            </Link>
          )}
        </div>
      </div>

      {/* ── Mobile filter drawer ── */}
      {filterOpen && (
        <div
          className={styles.mobileFilterOverlay}
          onClick={() => setFilterOpen(false)}
        >
          <div
            className={styles.mobileFilterDrawer}
            onClick={(e) => e.stopPropagation()}
          >
            <FilterPanel />
          </div>
        </div>
      )}

      <div className={styles.layout}>
        {/* ── Desktop sidebar ── */}
        <aside className={styles.sidebar}>
          <FilterPanel />
        </aside>

        {/* ── Results ── */}
        <main className={styles.main}>
          <div className={styles.resultsHeader}>
            <h2 className={styles.resultsCount}>
              <span>{filtered.length}</span> Propert
              {filtered.length === 1 ? "y" : "ies"} Found
            </h2>
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted small d-none d-sm-inline">Sort:</span>
              <select
                className={styles.sortSelect}
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="priceAsc">Price: Low → High</option>
                <option value="priceDesc">Price: High → Low</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className={styles.empty}>
              <i className="fas fa-search fa-3x text-muted mb-3"></i>
              <h5>No properties found</h5>
              <p className="text-muted small mb-3">
                Try adjusting your filters or search a different location.
              </p>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setLocationSearch("");
                  setMaxPrice(5000);
                  setBedrooms("any");
                  setPropTypes({
                    Apartment: false,
                    House: false,
                    Studio: false,
                  });
                  setAmenities({
                    Hospitals: false,
                    Pharmacies: false,
                    "Police Stations": false,
                  });
                }}
              >
                <i className="fas fa-times me-1"></i>Clear All Filters
              </button>
            </div>
          ) : (
            <div className={styles.cardsGrid}>
              {filtered.map((p) => {
                const isSaved = saved.includes(p.id);
                return (
                  <div
                    key={p.id}
                    className={styles.card}
                    onClick={() => navigate("/property/" + p.id)}
                  >
                    <div className={styles.cardImg}>
                      {p.images[0] ? (
                        <img
                          src={p.images[0]}
                          alt={p.title}
                          loading="lazy"
                          onError={handleImgError}
                        />
                      ) : (
                        <div className={styles.noImg}>
                          <i className="fas fa-image fa-2x text-muted"></i>
                        </div>
                      )}
                      <div className={styles.cardTags}>
                        {p.tags.map((t) => (
                          <span
                            key={t}
                            className={`${styles.tag} ${t === "VERIFIED" ? styles.tagVerified : styles.tagNew}`}
                          >
                            {t === "VERIFIED" && (
                              <i
                                className="fas fa-check-circle me-1"
                                style={{ fontSize: 9 }}
                              ></i>
                            )}
                            {t}
                          </span>
                        ))}
                      </div>
                      {p.city && (
                        <div className={styles.locTag}>
                          <i className="fas fa-map-marker-alt me-1"></i>
                          {p.city}
                        </div>
                      )}
                      <button
                        className={`${styles.heartBtn} ${isSaved ? styles.heartSaved : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!user) {
                            navigate("/signin");
                            return;
                          }
                          toggleSavedProperty(p.id);
                        }}
                        title={isSaved ? "Remove from saved" : "Save property"}
                      >
                        <i
                          className={`${isSaved ? "fas" : "far"} fa-heart`}
                        ></i>
                      </button>
                    </div>
                    <div className={styles.cardBody}>
                      <div className="d-flex justify-content-between align-items-start mb-1 gap-2">
                        <div className={styles.cardTitle}>{p.title}</div>
                        <div className={styles.cardPrice}>
                          <span
                            style={{
                              fontSize: "12px",
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
                      </div>
                      <div className={styles.cardDesc}>
                        {p.description.slice(0, 65)}…
                      </div>
                      <div className={styles.cardSpecs}>
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
                          {p.area} m²
                        </span>
                      </div>
                      {p.nearbyTags.length > 0 && (
                        <div className={styles.nearbyRow}>
                          <span className={styles.nearbyLabel}>NEARBY:</span>
                          {p.nearbyTags.map((t) => {
                            const c = AMENITY[t] || {
                              color: "#64748b",
                              bg: "#f1f5f9",
                              icon: "fa-circle",
                            };
                            return (
                              <span
                                key={t}
                                className={styles.nearbyTag}
                                style={{ color: c.color, background: c.bg }}
                              >
                                <i className={`fas ${c.icon} me-1`}></i>
                                {t}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* ── Map panel ── */}
        <div
          className={`${styles.mapPanel} ${mapView ? styles.mapPanelVisible : ""}`}
        >
          <PropertyMap
            lat={
              mapMarkers.length === 0 ? filtered[0]?.lat || 30.0444 : undefined
            }
            lng={
              mapMarkers.length === 0 ? filtered[0]?.lng || 31.2357 : undefined
            }
            markers={mapMarkers}
            height="100%"
            zoom={filtered[0] ? 12 : 6}
          />
          <button
            className={styles.showListBtn}
            onClick={() => setMapView(false)}
          >
            <i className="fas fa-list me-2"></i>Show List
          </button>
        </div>
      </div>
    </div>
  );
}
