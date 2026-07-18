import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth, useProperties } from "../context/AuthContext";
import { INITIAL_PROPERTIES } from "../data/mockData";
import PropertyMap from "../components/map/PropertyMap";
import ThemeToggle from "../components/ui/ThemeToggle";
import { compressImageFiles, handleImgError } from "../utils/imageUtils";
import styles from "./AddEditPropertyPage.module.css";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

function filesToDataUrls(files) {
  return compressImageFiles(files, {
    maxWidth: 1600,
    maxHeight: 1600,
    quality: 0.75,
  });
}

const EGYPT_LOCATIONS = [
  {
    gov: "Cairo",
    lat: 30.0444,
    lng: 31.2357,
    cities: [
      {
        name: "Nasr City",
        districts: [
          "Abbas El Akkad",
          "Mostafa El Nahas",
          "Makram Ebeid",
          "El Nozha",
        ],
      },
      {
        name: "Maadi",
        districts: ["Maadi Corniche", "Degla", "New Maadi", "Sarayat"],
      },
      {
        name: "Heliopolis",
        districts: ["Roxy", "Korba", "Merghany", "Alf Maskan"],
      },
      {
        name: "New Cairo",
        districts: [
          "5th Settlement",
          "First Settlement",
          "Third Settlement",
          "Rehab City",
        ],
      },
      {
        name: "Downtown Cairo",
        districts: ["Tahrir", "Garden City", "Bab El Louq", "Opera Square"],
      },
      { name: "Zamalek", districts: ["North Zamalek", "South Zamalek"] },
      {
        name: "Shubra",
        districts: ["Shubra El Kheima", "Rod El Farag", "Warraq"],
      },
      {
        name: "Ain Shams",
        districts: ["Ain Shams East", "Ain Shams West", "Matareya"],
      },
      {
        name: "October",
        districts: [
          "6th of October City",
          "Sheikh Zayed",
          "Dreamland",
          "Hadayek October",
        ],
      },
    ],
  },
  {
    gov: "Giza",
    lat: 30.0131,
    lng: 31.2089,
    cities: [
      {
        name: "6th of October",
        districts: [
          "First District",
          "Second District",
          "Third District",
          "Hay El Motamayez",
        ],
      },
      {
        name: "Sheikh Zayed",
        districts: [
          "Beverly Hills",
          "Hay Al Andalus",
          "Al Rabwa",
          "Zayed 2000",
        ],
      },
      {
        name: "Dokki",
        districts: ["Mesaha Square", "Brazil St", "Tahrir St", "Sudan St"],
      },
      {
        name: "Mohandessin",
        districts: ["Gamaet El Dowal", "Sphinx Square", "Lebnan St"],
      },
      { name: "Haram", districts: ["Haram St", "Faisal", "Harraneyya"] },
      { name: "Agouza", districts: ["Gamaa St", "Bolaq El Dakrour"] },
    ],
  },
  {
    gov: "Alexandria",
    lat: 31.2001,
    lng: 29.9187,
    cities: [
      {
        name: "Smouha",
        districts: ["Smouha Square", "Victor Emmanuel", "Safia Zaghloul"],
      },
      {
        name: "Montazah",
        districts: ["Montazah Palace", "Mandara", "Asafra", "Nouzha"],
      },
      { name: "Agami", districts: ["Bitash", "El Hannoville", "Amreya"] },
      { name: "Stanley", districts: ["Stanley Bay", "Saba Pasha"] },
      { name: "Miami", districts: ["Miami Beach", "Sidi Gaber", "Cleopatra"] },
      {
        name: "Downtown Alexandria",
        districts: ["Raml Station", "El Mansheya", "El Gomrok"],
      },
      {
        name: "Borg El Arab",
        districts: ["New Borg El Arab", "Industrial Zone"],
      },
    ],
  },
  {
    gov: "Qalyubia",
    lat: 30.3299,
    lng: 31.2068,
    cities: [
      { name: "Benha", districts: ["City Center", "El Salam", "Al Nahda"] },
      {
        name: "Shubra El Kheima",
        districts: ["First", "Second", "Industrial"],
      },
      { name: "Qalyub", districts: ["Old Qalyub", "New Buildings"] },
    ],
  },
  {
    gov: "Sharqia",
    lat: 30.5927,
    lng: 31.5021,
    cities: [
      { name: "Zagazig", districts: ["City Center", "El Zohour", "Al Salam"] },
      {
        name: "10th of Ramadan",
        districts: [
          "First Industrial",
          "Second Industrial",
          "Residential A",
          "Residential B",
        ],
      },
      { name: "Bilbeis", districts: ["City Center", "El Geish St"] },
    ],
  },
  {
    gov: "Dakahlia",
    lat: 31.0364,
    lng: 31.3807,
    cities: [
      {
        name: "Mansoura",
        districts: ["Toreil", "El Shoun", "Kafr Saad", "El Gomhoreya St"],
      },
      { name: "Talkha", districts: ["City Center"] },
      { name: "Mit Ghamr", districts: ["El Corniche", "El Azhar District"] },
    ],
  },
  {
    gov: "Beheira",
    lat: 30.848,
    lng: 30.3436,
    cities: [
      {
        name: "Damanhour",
        districts: ["City Center", "Kafr Abo Nour", "El Gomhoreya"],
      },
      { name: "Kafr El Dawwar", districts: ["Industrial Zone", "City Center"] },
      { name: "Rashid", districts: ["Port Area", "Historic Center"] },
    ],
  },
  {
    gov: "Gharbia",
    lat: 30.7865,
    lng: 31.0004,
    cities: [
      {
        name: "Tanta",
        districts: ["El Gharbia", "El Geish", "El Bahr", "Saad Zaghloul"],
      },
      {
        name: "Mahalla El Kubra",
        districts: ["Industrial", "El Geish St", "El Bahr"],
      },
      { name: "Kafr El Zayat", districts: ["City Center"] },
    ],
  },
  {
    gov: "Port Said",
    lat: 31.2653,
    lng: 32.3019,
    cities: [
      {
        name: "Port Said",
        districts: ["Port Fouad", "El Arab", "El Manakh", "El Manol"],
      },
      {
        name: "New Port Said",
        districts: ["New City Center", "Residential Compounds"],
      },
    ],
  },
  {
    gov: "Ismailia",
    lat: 30.5965,
    lng: 32.2715,
    cities: [
      {
        name: "Ismailia",
        districts: ["City Center", "El Guish St", "El Ferdaus"],
      },
      { name: "Qantara", districts: ["East Qantara", "West Qantara"] },
      { name: "New Ismailia", districts: ["Residential A", "Residential B"] },
    ],
  },
  {
    gov: "Suez",
    lat: 29.9668,
    lng: 32.5498,
    cities: [
      {
        name: "Suez City",
        districts: ["El Salam", "Port Tewfik", "El Arbeen", "Faisal"],
      },
      {
        name: "Ain Sokhna",
        districts: ["Galala City", "North Ain Sokhna", "South Ain Sokhna"],
      },
    ],
  },
  {
    gov: "Red Sea",
    lat: 27.2579,
    lng: 33.8116,
    cities: [
      {
        name: "Hurghada",
        districts: ["El Dahar", "Sakala", "El Ahyaa", "Hadaba", "New Hurghada"],
      },
      {
        name: "El Gouna",
        districts: ["El Dahar El Gouna", "Abu Tig Marina", "Kafr El Gouna"],
      },
      { name: "Safaga", districts: ["Port Area", "City Center"] },
      {
        name: "Marsa Alam",
        districts: ["City Center", "Abu Dabab", "Port Ghalib"],
      },
    ],
  },
  {
    gov: "South Sinai",
    lat: 28.6394,
    lng: 33.8748,
    cities: [
      {
        name: "Sharm El Sheikh",
        districts: ["Naama Bay", "Hadaba", "Old Market", "Sharks Bay", "Nabq"],
      },
      { name: "Dahab", districts: ["Blue Hole", "Masbat", "Laguna"] },
      { name: "Nuweiba", districts: ["City", "Port Area"] },
      {
        name: "Saint Catherine",
        districts: ["City Center", "St Catherine Monastery Area"],
      },
    ],
  },
  {
    gov: "North Sinai",
    lat: 30.9197,
    lng: 33.7975,
    cities: [
      { name: "Arish", districts: ["City Center", "El Nour", "El Masaid"] },
      { name: "Sheikh Zuweid", districts: ["City Center"] },
      { name: "Rafah", districts: ["City Center", "Border Area"] },
    ],
  },
  {
    gov: "Luxor",
    lat: 25.6872,
    lng: 32.6396,
    cities: [
      {
        name: "Luxor City",
        districts: ["East Luxor", "West Luxor", "Karnak", "Luxor Temple Area"],
      },
      {
        name: "New Luxor",
        districts: ["Administrative District", "Residential"],
      },
      { name: "Armant", districts: ["City Center"] },
    ],
  },
  {
    gov: "Aswan",
    lat: 24.0889,
    lng: 32.8998,
    cities: [
      {
        name: "Aswan City",
        districts: ["Corniche", "City Center", "Elephantine Island Area"],
      },
      { name: "Edfu", districts: ["City Center", "Temple Area"] },
      { name: "Kom Ombo", districts: ["City Center"] },
      { name: "New Aswan", districts: ["Residential", "Administrative"] },
    ],
  },
  {
    gov: "Asyut",
    lat: 27.1809,
    lng: 31.1837,
    cities: [
      { name: "Asyut City", districts: ["City Center", "El Hamra", "El Waly"] },
      {
        name: "New Asyut",
        districts: ["Administrative", "Residential A", "Residential B"],
      },
      { name: "Dairut", districts: ["City Center"] },
    ],
  },
  {
    gov: "Minya",
    lat: 28.1099,
    lng: 30.7503,
    cities: [
      {
        name: "Minya City",
        districts: ["City Center", "Corniche", "New Minya"],
      },
      { name: "Mallawi", districts: ["City Center"] },
      { name: "Samalut", districts: ["City Center"] },
    ],
  },
  {
    gov: "Beni Suef",
    lat: 29.0661,
    lng: 31.0994,
    cities: [
      {
        name: "Beni Suef City",
        districts: ["City Center", "El Shorouk", "El Salam"],
      },
      { name: "New Beni Suef", districts: ["Administrative", "Residential"] },
      { name: "El Fashn", districts: ["City Center"] },
    ],
  },
  {
    gov: "Fayoum",
    lat: 29.3084,
    lng: 30.8428,
    cities: [
      { name: "Fayoum City", districts: ["City Center", "Roda", "Hawatim"] },
      { name: "New Fayoum", districts: ["Administrative", "Residential"] },
    ],
  },
  {
    gov: "Sohag",
    lat: 26.5562,
    lng: 31.6948,
    cities: [
      { name: "Sohag City", districts: ["City Center", "El Kawther"] },
      {
        name: "New Sohag",
        districts: ["Administrative", "Residential A", "Residential B"],
      },
      { name: "Akhmim", districts: ["City Center"] },
    ],
  },
  {
    gov: "Qena",
    lat: 26.1601,
    lng: 32.7187,
    cities: [
      { name: "Qena City", districts: ["City Center", "El Geish St"] },
      { name: "Nag Hammadi", districts: ["City Center", "Industrial"] },
      { name: "New Qena", districts: ["Administrative", "Residential"] },
    ],
  },
  {
    gov: "Monufia",
    lat: 30.4637,
    lng: 30.939,
    cities: [
      {
        name: "Shebin El Kom",
        districts: ["City Center", "El Geish District"],
      },
      {
        name: "Sadat City",
        districts: ["Industrial Zone", "Residential District", "City Center"],
      },
      { name: "Menouf", districts: ["City Center"] },
    ],
  },
  {
    gov: "Kafr El Sheikh",
    lat: 31.1107,
    lng: 30.9388,
    cities: [
      {
        name: "Kafr El Sheikh City",
        districts: ["City Center", "El Nasr", "El Salam"],
      },
      { name: "Desouk", districts: ["City Center"] },
      { name: "Baltim", districts: ["Beach Area", "City Center"] },
    ],
  },
  {
    gov: "Damietta",
    lat: 31.4165,
    lng: 31.8133,
    cities: [
      {
        name: "Damietta City",
        districts: ["City Center", "El Borg", "El Geish"],
      },
      {
        name: "New Damietta",
        districts: ["Administrative", "Residential", "New City Center"],
      },
      { name: "Faraskour", districts: ["City Center"] },
    ],
  },
  {
    gov: "New Valley",
    lat: 24.5456,
    lng: 27.1735,
    cities: [
      { name: "Kharga", districts: ["City Center", "El Nasser District"] },
      { name: "Dakhla", districts: ["Mut City", "El Qasr"] },
      { name: "Farafra", districts: ["City Center"] },
    ],
  },
  {
    gov: "Matruh",
    lat: 31.3543,
    lng: 27.2373,
    cities: [
      {
        name: "Marsa Matruh",
        districts: ["Corniche", "City Center", "El Rommel Beach"],
      },
      { name: "Sidi Barrani", districts: ["City Center"] },
      { name: "Siwa", districts: ["Siwa Oasis", "City Center"] },
    ],
  },
];

const DRAFT_KEY = "propertyDraft";

function saveDraftToStorage(data) {
  try {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ ...data, savedAt: Date.now() }),
    );
    return true;
  } catch {
    return false;
  }
}

function loadDraftFromStorage() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearDraftFromStorage() {
  localStorage.removeItem(DRAFT_KEY);
}

function validate(fields) {
  const errors = {};
  if (!fields.title.trim()) errors.title = "Title is required.";
  else if (fields.title.trim().length < 5)
    errors.title = "Title must be at least 5 characters.";
  if (!fields.description.trim())
    errors.description = "Description is required.";
  else if (fields.description.trim().length < 20)
    errors.description = "Description must be at least 20 characters.";
  if (!fields.images || fields.images.length === 0)
    errors.images = "At least one property photo is required.";
  if (!fields.area || isNaN(Number(fields.area)) || Number(fields.area) <= 0)
    errors.area = "Area (m²) is required.";
  if (!fields.price || isNaN(Number(fields.price)) || Number(fields.price) <= 0)
    errors.price = "Enter a valid monthly rent.";
  if (!fields.governorate) errors.governorate = "Select a governorate.";
  if (!fields.city) errors.city = "Select a city.";
  if (!fields.address.trim()) errors.address = "Enter a street address.";
  return errors;
}

function SearchableSelect({ options, value, onChange, placeholder, disabled }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const display = value || "";

  return (
    <div className={styles.searchSelect} ref={ref}>
      <div
        className={`${styles.searchSelectTrigger} ${disabled ? styles.searchSelectDisabled : ""}`}
        onClick={() => !disabled && setOpen((v) => !v)}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ")
            !disabled && setOpen((v) => !v);
        }}
        role="combobox"
        aria-expanded={open}
      >
        <span className={display ? "" : styles.searchSelectPlaceholder}>
          {display || placeholder}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points={open ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
        </svg>
      </div>
      {open && (
        <div className={styles.searchSelectDropdown}>
          <div className={styles.searchSelectSearch}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              autoFocus
              className={styles.searchSelectInput}
              placeholder="Search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <ul className={styles.searchSelectList} role="listbox">
            {filtered.length === 0 && (
              <li className={styles.searchSelectEmpty}>No results</li>
            )}
            {filtered.map((opt) => (
              <li
                key={opt}
                className={`${styles.searchSelectOption} ${opt === value ? styles.searchSelectOptionActive : ""}`}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                  setQuery("");
                }}
                role="option"
                aria-selected={opt === value}
              >
                {opt}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Step definitions ───
const STEPS = [
  { n: 1, label: "Basic Information", sub: "Title, description, and type" },
  { n: 2, label: "Photos & Media", sub: "Upload high-quality images" },
  { n: 3, label: "Location & Price", sub: "Set address and monthly rent" },
  { n: 4, label: "Review & Submit", sub: "Confirm all details" },
];

// ─── Main Component ────
export default function AddEditPropertyPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { properties, addProperty, updateProperty } = useProperties();
  const isEdit = Boolean(id);
  const existing = isEdit
    ? properties.find((p) => p.id === parseInt(id))
    : null;

  const [title, setTitle] = useState("");
  const [type, setType] = useState("Apartment");
  const [bedrooms, setBedrooms] = useState("2");
  const [bathrooms, setBathrooms] = useState("1");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [coordinates, setCoordinates] = useState(null);
  const [uploadedImages, setUploadedImages] = useState([]);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftStatus, setDraftStatus] = useState("");
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [currentView, setCurrentView] = useState("details");

  const govData = EGYPT_LOCATIONS.find((g) => g.gov === governorate);
  const cityData = govData?.cities.find((c) => c.name === city);
  const cityOptions = govData?.cities.map((c) => c.name) || [];
  const districtOptions = cityData?.districts || [];

  const isStep1Done =
    title.trim().length >= 5 && description.trim().length >= 20;
  const isStep2Done = uploadedImages.length > 0;
  const isStep3Done = Boolean(price && governorate && city && address.trim());
  const activeStep =
    currentView === "review"
      ? 4
      : !isStep1Done
        ? 1
        : !isStep2Done
          ? 2
          : !isStep3Done
            ? 3
            : 3;

  const getDraftData = useCallback(
    () => ({
      title,
      type,
      bedrooms,
      bathrooms,
      area,
      description,
      price,
      address,
      governorate,
      city,
      district,
      coordinates,
    }),
    [
      title,
      type,
      bedrooms,
      bathrooms,
      area,
      description,
      price,
      address,
      governorate,
      city,
      district,
      coordinates,
    ],
  );

  useEffect(() => {
    if (isEdit && existing) {
      setTitle(existing.title || "");
      setType(existing.type || "Apartment");
      setBedrooms(existing.bedrooms?.toString() || "2");
      setBathrooms(existing.bathrooms?.toString() || "1");
      setArea(existing.area?.toString() || "");
      setDescription(existing.description || "");
      setPrice(existing.price?.toString() || "");
      setAddress(existing.address || "");
      setGovernorate(existing.governorate || "");
      setCity(existing.city || "");
      setDistrict(existing.district || "");
      if (existing.coordinates) setCoordinates(existing.coordinates);
      else if (existing.lat != null && existing.lng != null)
        setCoordinates([existing.lat, existing.lng]);
      setUploadedImages(existing.images || []);
      setDraftLoaded(true);
      return;
    }

    const draft = loadDraftFromStorage();
    if (draft) {
      setTitle(draft.title || "");
      setType(draft.type || "Apartment");
      setBedrooms(draft.bedrooms || "2");
      setBathrooms(draft.bathrooms || "1");
      setArea(draft.area || "");
      setDescription(draft.description || "");
      setPrice(draft.price || "");
      setAddress(draft.address || "");
      setGovernorate(draft.governorate || "");
      setCity(draft.city || "");
      setDistrict(draft.district || "");
      if (draft.coordinates) setCoordinates(draft.coordinates);
      setDraftLoaded(true);
    }
  }, [isEdit, existing]);

  const handleGovernorateChange = useCallback((gov) => {
    setGovernorate(gov);
    setCity("");
    setDistrict("");
    const govEntry = EGYPT_LOCATIONS.find((g) => g.gov === gov);
    if (govEntry) setCoordinates([govEntry.lat, govEntry.lng]);
  }, []);

  const handleCityChange = useCallback((c) => {
    setCity(c);
    setDistrict("");
  }, []);

  const locationLabel =
    [district, city, governorate].filter(Boolean).join(", ") || "Egypt";

  const handleSaveDraft = () => {
    const ok = saveDraftToStorage(getDraftData());
    setDraftStatus(ok ? "saved" : "error");
    setTimeout(() => setDraftStatus(""), 3000);
  };

  const goToReview = () => {
    const fields = {
      title,
      description,
      price,
      area,
      address,
      governorate,
      city,
      images: uploadedImages,
    };
    const errs = validate(fields);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setCurrentView("details");
      setTimeout(() => {
        const firstErrorEl = document.querySelector('[data-error="true"]');
        firstErrorEl?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 0);
      return;
    }
    setErrors({});
    setCurrentView("review");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePublish = async () => {
    const fields = {
      title,
      description,
      price,
      area,
      address,
      governorate,
      city,
      images: uploadedImages,
    };
    const errs = validate(fields);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setCurrentView("details");
      setTimeout(() => {
        const firstErrorEl = document.querySelector('[data-error="true"]');
        firstErrorEl?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 0);
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    const payload = {
      title,
      type,
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      area: Number(area),
      description,
      price: Number(price),
      address,
      governorate,
      city,
      district,
      coordinates,
      lat: coordinates ? coordinates[0] : undefined,
      lng: coordinates ? coordinates[1] : undefined,
      images: uploadedImages,
    };

    await new Promise((r) => setTimeout(r, 700));

    if (isEdit && existing) {
      updateProperty(existing.id, payload);
    } else {
      addProperty(payload, user);
    }

    setIsSubmitting(false);
    clearDraftFromStorage();
    navigate("/dashboard");
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button
          className={styles.backBtn}
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div className={styles.headerMeta}>
          <span className={styles.headerTitle}>
            {isEdit ? "Edit Property" : "Add New Property"}
          </span>
          <span className={styles.headerLocation}>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#64748b"
              strokeWidth="2"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {locationLabel}
          </span>
        </div>
        <div className={styles.headerActions}>
          <ThemeToggle />
          {draftStatus === "saved" && (
            <span className={styles.draftSavedBadge}>✓ Draft saved</span>
          )}
          {draftStatus === "error" && (
            <span className={styles.draftErrorBadge}>Draft save failed</span>
          )}
          <button className={styles.draftBtn} onClick={handleSaveDraft}>
            Save Draft
          </button>
          {currentView === "details" ? (
            <button className={styles.publishBtn} onClick={goToReview}>
              Continue to Review
            </button>
          ) : (
            <button
              className={styles.publishBtn}
              onClick={handlePublish}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Publishing…"
                : isEdit
                  ? "Save Changes"
                  : "Publish Listing"}
            </button>
          )}
        </div>
      </div>

      {draftLoaded && !isEdit && (
        <div className={styles.draftBanner}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          Draft restored — your previous progress has been loaded.
          <button
            className={styles.draftBannerDismiss}
            onClick={() => setDraftLoaded(false)}
          >
            ✕
          </button>
        </div>
      )}

      <div className={styles.body}>
        <aside className={styles.stepsSidebar}>
          {STEPS.map((step, idx) => (
            <div
              key={step.n}
              className={styles.stepItem}
              onClick={() =>
                step.n === 4 ? goToReview() : setCurrentView("details")
              }
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  step.n === 4 ? goToReview() : setCurrentView("details");
                }
              }}
              style={{ cursor: "pointer" }}
            >
              <div
                className={`${styles.stepNum} ${step.n === activeStep ? styles.stepActive : step.n < activeStep ? styles.stepDone : ""}`}
              >
                {step.n < activeStep ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  step.n
                )}
              </div>
              <div>
                <div className={styles.stepLabel}>{step.label}</div>
                <div className={styles.stepSub}>{step.sub}</div>
              </div>
              {idx < STEPS.length - 1 && <div className={styles.stepLine} />}
            </div>
          ))}
        </aside>

        {currentView === "details" ? (
          <div className={styles.formArea}>
            {/* ── Section 1: Basic Information ── */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#1d4ed8"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                Basic Information
              </div>

              <div className={styles.field} data-error={!!errors.title}>
                <label className={styles.label}>Property Title</label>
                <input
                  className={`${styles.input} ${errors.title ? styles.inputError : ""}`}
                  placeholder="e.g. Modern Studio in Downtown Cairo"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title)
                      setErrors((prev) => ({ ...prev, title: "" }));
                  }}
                />
                {errors.title && (
                  <span className={styles.errorMsg}>{errors.title}</span>
                )}
              </div>

              <div className={styles.row2}>
                <div className={styles.field}>
                  <label className={styles.label}>Property Type</label>
                  <div className={styles.selectWrap}>
                    <select
                      className={styles.select}
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                    >
                      <option>Apartment</option>
                      <option>House</option>
                      <option>Studio</option>
                    </select>
                    <svg
                      className={styles.selectArrow}
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Bedrooms</label>
                  <input
                    className={styles.input}
                    type="number"
                    min="0"
                    max="20"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Bathrooms</label>
                  <input
                    className={styles.input}
                    type="number"
                    min="0"
                    max="20"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                  />
                </div>
                <div className={styles.field} data-error={!!errors.area}>
                  <label className={styles.label}>
                    Area (m²) <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    className={`${styles.input} ${errors.area ? styles.inputError : ""}`}
                    type="number"
                    min="1"
                    placeholder="e.g. 1200"
                    value={area}
                    onChange={(e) => {
                      setArea(e.target.value);
                      if (errors.area)
                        setErrors((prev) => ({ ...prev, area: "" }));
                    }}
                  />
                  {errors.area && (
                    <span className={styles.errorMsg}>{errors.area}</span>
                  )}
                </div>
              </div>

              <div className={styles.field} data-error={!!errors.description}>
                <label className={styles.label}>Description</label>
                <textarea
                  className={`${styles.textarea} ${errors.description ? styles.inputError : ""}`}
                  placeholder="Tell potential tenants about your property, its features, nearby amenities…"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (errors.description)
                      setErrors((prev) => ({ ...prev, description: "" }));
                  }}
                  rows={5}
                />
                <span className={styles.charCount}>
                  {description.length} characters
                  {description.length < 20
                    ? ` (${20 - description.length} more needed)`
                    : ""}
                </span>
                {errors.description && (
                  <span className={styles.errorMsg}>{errors.description}</span>
                )}
              </div>
            </div>

            {/* ── Section 2: Photos & Media ── */}
            <div className={styles.section} data-error={!!errors.images}>
              <div className={styles.sectionTitle}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#1d4ed8"
                  strokeWidth="2"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                Photos & Media
              </div>

              <div
                className={styles.uploadZone}
                onClick={() => document.getElementById("fileInput").click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const files = Array.from(e.dataTransfer.files).filter((f) =>
                    f.type.startsWith("image/"),
                  );
                  if (files.some((f) => f.size > MAX_IMAGE_SIZE)) {
                    setErrors((prev) => ({
                      ...prev,
                      images: "Each photo must be under 10MB.",
                    }));
                    return;
                  }
                  filesToDataUrls(files).then((dataUrls) => {
                    setUploadedImages((prev) => [...prev, ...dataUrls]);
                  });
                  if (errors.images)
                    setErrors((prev) => ({ ...prev, images: "" }));
                }}
              >
                <div className={styles.uploadIcon}>
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <div className={styles.uploadText}>
                  Click to upload or drag and drop
                </div>
                <div className={styles.uploadHint}>
                  PNG, JPG or WEBP (max. 10 MB per file)
                </div>
                <input
                  id="fileInput"
                  type="file"
                  multiple
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    if (files.some((f) => f.size > MAX_IMAGE_SIZE)) {
                      setErrors((prev) => ({
                        ...prev,
                        images: "Each photo must be under 10MB.",
                      }));
                      e.target.value = "";
                      return;
                    }
                    filesToDataUrls(files).then((dataUrls) => {
                      setUploadedImages((prev) => [...prev, ...dataUrls]);
                    });
                    if (errors.images)
                      setErrors((prev) => ({ ...prev, images: "" }));
                    e.target.value = "";
                  }}
                />
              </div>

              <div className={styles.thumbGrid}>
                {uploadedImages.length > 0 ? (
                  uploadedImages.map((src, i) => (
                    <div key={i} className={styles.thumb}>
                      <img
                        src={src}
                        alt={`Upload ${i + 1}`}
                        className={styles.thumbImg}
                        onError={handleImgError}
                      />
                      <button
                        className={styles.thumbRemove}
                        onClick={() =>
                          setUploadedImages((prev) =>
                            prev.filter((_, j) => j !== i),
                          )
                        }
                        aria-label="Remove image"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                ) : (
                  <>
                    <div className={styles.thumbPlaceholder}>
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#cbd5e1"
                        strokeWidth="1.5"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                    <div className={styles.thumbAdd}>
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#cbd5e1"
                        strokeWidth="2"
                      >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </div>
                  </>
                )}
              </div>
              {errors.images && (
                <span className={styles.errorMsg}>{errors.images}</span>
              )}
            </div>

            {/* ── Section 3: Pricing & Location ── */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#1d4ed8"
                  strokeWidth="2"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Pricing & Location
              </div>

              {/* Price */}
              <div className="row g-3 mb-3">
                <div className="col-md-6" data-error={!!errors.price}>
                  <label className={styles.label}>Monthly Rent (EGP)</label>
                  <div className="input-group">
                    <span className="input-group-text">EGP</span>
                    <input
                      type="number"
                      className={`form-control ${errors.price ? "is-invalid" : ""}`}
                      placeholder="15,000"
                      value={price}
                      onChange={(e) => {
                        setPrice(e.target.value);
                        if (errors.price)
                          setErrors((p) => ({ ...p, price: "" }));
                      }}
                    />
                    {errors.price && (
                      <div className="invalid-feedback">{errors.price}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Egypt Location Cascade */}
              <div className={styles.locationCascade}>
                <div className={styles.field} data-error={!!errors.governorate}>
                  <label className={styles.label}>Governorate</label>
                  <SearchableSelect
                    options={EGYPT_LOCATIONS.map((g) => g.gov)}
                    value={governorate}
                    onChange={handleGovernorateChange}
                    placeholder="Select governorate…"
                  />
                  {errors.governorate && (
                    <span className={styles.errorMsg}>
                      {errors.governorate}
                    </span>
                  )}
                </div>

                <div className={styles.field} data-error={!!errors.city}>
                  <label className={styles.label}>City / Area</label>
                  <SearchableSelect
                    options={cityOptions}
                    value={city}
                    onChange={handleCityChange}
                    placeholder={
                      governorate ? "Select city…" : "Select governorate first"
                    }
                    disabled={!governorate}
                  />
                  {errors.city && (
                    <span className={styles.errorMsg}>{errors.city}</span>
                  )}
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>
                    District / Neighbourhood{" "}
                    <span className={styles.optional}>(optional)</span>
                  </label>
                  <SearchableSelect
                    options={districtOptions}
                    value={district}
                    onChange={setDistrict}
                    placeholder={
                      city ? "Select district…" : "Select city first"
                    }
                    disabled={!city}
                  />
                </div>
              </div>

              {/* Street Address */}
              <div className={styles.field} data-error={!!errors.address}>
                <label className={styles.label}>Street Address</label>
                <input
                  className={`${styles.input} ${errors.address ? styles.inputError : ""}`}
                  placeholder="Building number, street name, floor / apt number"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (errors.address)
                      setErrors((prev) => ({ ...prev, address: "" }));
                  }}
                />
                {errors.address && (
                  <span className={styles.errorMsg}>{errors.address}</span>
                )}
              </div>

              {/* Leaflet Map — identical shared component used on Search & Property Details */}
              <div className={styles.mapSection}>
                <div className={styles.mapLabel}>Pin Location on Map</div>
                <div className={styles.mapWrapper}>
                  <PropertyMap
                    lat={coordinates ? coordinates[0] : undefined}
                    lng={coordinates ? coordinates[1] : undefined}
                    editable
                    height="320px"
                    zoom={coordinates ? 13 : 6}
                    onLocationSelect={(lat, lng) => setCoordinates([lat, lng])}
                  />
                  <div className={styles.mapHint}>
                    {coordinates
                      ? `📍 ${coordinates[0].toFixed(5)}, ${coordinates[1].toFixed(5)} — drag pin or click to reposition`
                      : "Select a governorate to place the map pin, or click the map directly"}
                  </div>
                </div>
              </div>
            </div>

            {/* Continue to the Review step */}
            <div className={styles.formFooter}>
              <button className={styles.publishBtn} onClick={goToReview}>
                Continue to Review
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ marginLeft: 8, verticalAlign: "-3px" }}
                >
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          /* ── Step 4: Review & Submit (separate view) ── */
          <div className={styles.formArea}>
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#1d4ed8"
                  strokeWidth="2"
                >
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                Review & Submit
              </div>
              <p className={styles.reviewIntro}>
                Double-check everything below before it goes live. You can go
                back to any step to make changes.
              </p>

              <div className={styles.reviewGrid}>
                <div className={styles.reviewRow}>
                  <span className={styles.reviewLabel}>Title</span>
                  <span className={styles.reviewValue}>{title || "—"}</span>
                </div>
                <div className={styles.reviewRow}>
                  <span className={styles.reviewLabel}>Type</span>
                  <span className={styles.reviewValue}>{type}</span>
                </div>
                <div className={styles.reviewRow}>
                  <span className={styles.reviewLabel}>Bedrooms</span>
                  <span className={styles.reviewValue}>{bedrooms}</span>
                </div>
                <div className={styles.reviewRow}>
                  <span className={styles.reviewLabel}>Bathrooms</span>
                  <span className={styles.reviewValue}>{bathrooms}</span>
                </div>
                <div className={styles.reviewRow}>
                  <span className={styles.reviewLabel}>Area (m²)</span>
                  <span className={styles.reviewValue}>{area || "—"}</span>
                </div>
                <div className={styles.reviewRow}>
                  <span className={styles.reviewLabel}>Description</span>
                  <span className={styles.reviewValue}>
                    {description || "—"}
                  </span>
                </div>
                <div className={styles.reviewRow}>
                  <span className={styles.reviewLabel}>Monthly Rent</span>
                  <span className={styles.reviewValue}>
                    {price ? `EGP ${Number(price).toLocaleString()}` : "—"}
                  </span>
                </div>
                <div className={styles.reviewRow}>
                  <span className={styles.reviewLabel}>Location</span>
                  <span className={styles.reviewValue}>{locationLabel}</span>
                </div>
                <div className={styles.reviewRow}>
                  <span className={styles.reviewLabel}>Street Address</span>
                  <span className={styles.reviewValue}>{address || "—"}</span>
                </div>
                <div className={styles.reviewRow}>
                  <span className={styles.reviewLabel}>Map Pin</span>
                  <span className={styles.reviewValue}>
                    {coordinates
                      ? `📍 ${coordinates[0].toFixed(5)}, ${coordinates[1].toFixed(5)}`
                      : "Not set"}
                  </span>
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  Photos ({uploadedImages.length})
                </label>
                <div className={styles.thumbGrid}>
                  {uploadedImages.length > 0 ? (
                    uploadedImages.map((src, i) => (
                      <div key={i} className={styles.thumb}>
                        <img
                          src={src}
                          alt={`Upload ${i + 1}`}
                          className={styles.thumbImg}
                          onError={handleImgError}
                        />
                      </div>
                    ))
                  ) : (
                    <span className={styles.reviewValue}>
                      No photos uploaded
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.formFooter}>
              <button
                className={styles.draftBtn}
                onClick={() => setCurrentView("details")}
              >
                ← Back to Edit
              </button>
              <button
                className={styles.publishBtn}
                onClick={handlePublish}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Publishing…"
                  : isEdit
                    ? "Save Changes"
                    : "Publish Listing"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
