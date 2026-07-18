import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth, usePlatform } from "../context/AuthContext";
import styles from "./AuthPage.module.css";

export default function SignUpPage() {
  const navigate = useNavigate();
  const { signup, user } = useAuth();
  const { platformSettings } = usePlatform();
  const [role, setRole] = useState("tenant");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nationalID, setNationalID] = useState("");
  const [businessTaxID, setBusinessTaxID] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!firstName.trim()) {
      setError("First name is required.");
      return;
    }

    if (!lastName.trim()) {
      setError("Last name is required.");
      return;
    }

    if (!nationalID.trim()) {
      setError("National ID is required.");
      return;
    }

    if (role === "owner" && !businessTaxID.trim()) {
      setError("Business Tax ID is required.");
      return;
    }
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 350));
    const result = await signup({
      firstName,
      lastName,
      nationalID,
      phoneNumber: phone,
      email,
      password,
      businessTaxID,
      role: role === "owner" ? "Owner" : "Tenant",
    });
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    if (role === "owner") navigate("/dashboard");
    else navigate("/search");
  };

  if (!platformSettings.userRegistration) {
    return (
      <div className={styles.page}>
        <div className={styles.center}>
          <Link to="/" className={styles.logoWrap}>
            <div className={styles.logoBox}>
              <i className="fas fa-home fa-lg"></i>
            </div>
            <h1 className={styles.brandTitle}>SMSRLY</h1>
          </Link>
          <div className={styles.card}>
            <div className="text-center py-3">
              <i className="fas fa-user-lock fa-2x text-muted mb-3"></i>
              <h2 className={styles.cardTitle}>Registration Closed</h2>
              <p className="text-muted small mb-3">
                New account registration is temporarily disabled by the platform
                administrators. Please check back later.
              </p>
              <Link to="/signin" className="btn btn-primary btn-sm">
                Go to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.center}>
        <Link to="/" className={styles.logoWrap}>
          <div className={styles.logoBox}>
            <i className="fas fa-home fa-lg"></i>
          </div>
          <h1 className={styles.brandTitle}>SMSRLY</h1>
        </Link>
        <p className={styles.brandSub}>Create your free account today</p>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Join SMSRLY</h2>

          {error && (
            <div className="alert alert-danger d-flex align-items-center gap-2 py-2 mb-3">
              <i className="fas fa-exclamation-triangle flex-shrink-0"></i>
              <small className="mb-0">{error}</small>
            </div>
          )}

          {/* Role selector */}
          <div className="mb-3">
            <label className={styles.fieldLabel}>I am a…</label>
            <div className={styles.roleGrid}>
              <button
                type="button"
                className={`${styles.roleBtn} ${role === "tenant" ? styles.roleActive : ""}`}
                onClick={() => setRole("tenant")}
              >
                <i className="fas fa-user me-2"></i>Tenant
              </button>
              <button
                type="button"
                className={`${styles.roleBtn} ${role === "owner" ? styles.roleActive : ""}`}
                onClick={() => setRole("owner")}
              >
                <i className="fas fa-building me-2"></i>Owner
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {[
              {
                label: "First Name",
                type: "text",
                ph: "John",
                icon: "fa-user",
                val: firstName,
                set: setFirstName,
              },
              {
                label: "Last Name",
                type: "text",
                ph: "Doe",
                icon: "fa-user",
                val: lastName,
                set: setLastName,
              },
              {
                label: "National ID",
                type: "text",
                ph: "298xxxxxxxxxxxxx",
                icon: "fa-id-card",
                val: nationalID,
                set: setNationalID,
              },
              {
                label: "Email",
                type: "email",
                ph: "john@example.com",
                icon: "fa-envelope",
                val: email,
                set: setEmail,
              },
              {
                label: "Phone (optional)",
                type: "tel",
                ph: "(555) 123-4567",
                icon: "fa-phone",
                val: phone,
                set: setPhone,
              },
            ].map((f) => (
              <div className={`${styles.field} mb-3`} key={f.label}>
                <label className={styles.fieldLabel}>{f.label}</label>
                <div className={styles.inputWrap}>
                  <i className={`fas ${f.icon} ${styles.inputIcon}`}></i>
                  <input
                    type={f.type}
                    placeholder={f.ph}
                    value={f.val}
                    onChange={(e) => f.set(e.target.value)}
                    className={styles.input}
                    required={!f.label.includes("optional")}
                  />
                </div>
              </div>
            ))}

            <div className={`${styles.field} mb-3`}>
              <label className={styles.fieldLabel}>Password</label>
              <div className={styles.inputWrap}>
                <i className={`fas fa-lock ${styles.inputIcon}`}></i>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.input}
                  required
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword((s) => !s)}
                  tabIndex={-1}
                >
                  <i
                    className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                  ></i>
                </button>
              </div>
            </div>

            <div className={`${styles.field} mb-4`}>
              <label className={styles.fieldLabel}>Confirm Password</label>
              <div className={styles.inputWrap}>
                <i className={`fas fa-lock ${styles.inputIcon}`}></i>
                <input
                  type="password"
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin me-2"></i>Creating
                  Account…
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus me-2"></i>Create Account
                </>
              )}
            </button>
          </form>

          <div className={styles.divider}>
            <span>OR CONTINUE WITH</span>
          </div>
          <div className="row g-2">
            <div className="col-6">
              <button className={styles.socialBtn}>
                <i className="fab fa-google me-2"></i>Google
              </button>
            </div>
            <div className="col-6">
              <button className={styles.socialBtn}>
                <i className="fab fa-facebook me-2"></i>Facebook
              </button>
            </div>
          </div>
        </div>

        <div className={styles.footerText}>
          Already have an account?{" "}
          <Link to="/signin" className={styles.footerLink}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
