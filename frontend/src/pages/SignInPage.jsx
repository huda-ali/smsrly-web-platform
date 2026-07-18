import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./AuthPage.module.css";

export default function SignInPage() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect already-logged-in users
  useEffect(() => {
    if (!user) return;
    if (user.role === "admin") navigate("/admin", { replace: true });
    else if (user.role === "owner") navigate("/dashboard", { replace: true });
    else navigate("/search", { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 350));
    const result = await login(email.trim(), password);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    const { role } = result.user;
    if (role === "admin") navigate("/admin");
    else if (role === "owner") navigate("/dashboard");
    else navigate("/search");
  };

  return (
    <div className={styles.page}>
      <div className={styles.center}>
        <Link to="/" className={styles.logoWrap}>
          <div className={styles.logoBox}>
            <i className="fas fa-home fa-lg"></i>
          </div>
          <h1 className={styles.brandTitle}>SMSRLY</h1>
        </Link>
        <p className={styles.brandSub}>Secure access to your housing portal</p>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Welcome Back</h2>
          <p className={styles.cardSub}>
            Your role is set from your account — no selection needed.
          </p>

          {error && (
            <div
              className="alert alert-danger d-flex align-items-center gap-2 py-2 mb-3"
              role="alert"
            >
              <i className="fas fa-exclamation-triangle flex-shrink-0"></i>
              <small className="mb-0">{error}</small>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className={`${styles.field} mb-3`}>
              <label className={styles.fieldLabel}>Email Address</label>
              <div className={styles.inputWrap}>
                <i className={`fas fa-envelope ${styles.inputIcon}`}></i>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className={`${styles.field} mb-3`}>
              <label className={styles.fieldLabel}>Password</label>
              <div className={styles.inputWrap}>
                <i className={`fas fa-lock ${styles.inputIcon}`}></i>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.input}
                  autoComplete="current-password"
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

            <div className="d-flex justify-content-between align-items-center mb-4">
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className={styles.checkbox}
                />
                Remember me
              </label>
              <a
                href="#"
                className={styles.forgotLink}
                onClick={(e) => e.preventDefault()}
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin me-2"></i>Signing In…
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt me-2"></i>Sign In
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
          Don't have an account?{" "}
          <Link to="/signup" className={styles.footerLink}>
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}