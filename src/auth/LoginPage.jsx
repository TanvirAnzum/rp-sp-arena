import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import { useAuth } from "./AuthContext";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  const { login, disabledMsg } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [resetSending, setResetSending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      const msg = err?.message ?? "";
      if (msg.includes("deactivated") || msg.includes("No account")) {
        setError(msg);
      } else {
        setError("Invalid email or password.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    if (!resetEmail) return;
    setResetSending(true);
    setResetMsg("");
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setResetMsg("Reset link sent! Check your email.");
    } catch {
      setResetMsg("Could not send reset email. Check the address and try again.");
    } finally {
      setResetSending(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      {/* ── Left panel: banner hero ── */}
      <div className={styles.hero}>
        <img src="/banner.jpg" alt="Rangpur Sports Arena" className={styles.bannerImg} />
        <div className={styles.heroOverlay}>
          <img src="/logo.png" alt="RSA Logo" className={styles.heroLogo} />
          <h2 className={styles.heroTitle}>Rangpur Sports Arena</h2>
          <p className={styles.heroTagline}>Play · Perform · Inspire</p>
        </div>
      </div>

      {/* ── Right panel: login form ── */}
      <div className={styles.formPanel}>
        <div className={styles.card}>
          <div className={styles.logoBlock}>
            <img src="/logo.png" alt="RSA Logo" className={styles.cardLogo} />
            <h1 className={styles.title}>Welcome Back</h1>
            <p className={styles.subtitle}>Staff & Owner Portal</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {disabledMsg && <p className={styles.error}>{disabledMsg}</p>}
            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" className={styles.btn} disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <button
            type="button"
            className={styles.forgotLink}
            onClick={() => { setShowReset((v) => !v); setResetMsg(""); }}
          >
            {showReset ? "Back to Sign In" : "Forgot password?"}
          </button>

          {showReset && (
            <form className={styles.resetForm} onSubmit={handleReset}>
              <p className={styles.resetHint}>
                Enter your email and we'll send a password reset link.
              </p>
              <input
                className={styles.resetInput}
                type="email"
                placeholder="your@email.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
              {resetMsg && (
                <p className={resetMsg.includes("sent") ? styles.resetSuccess : styles.resetError}>
                  {resetMsg}
                </p>
              )}
              <button type="submit" className={styles.resetBtn} disabled={resetSending}>
                {resetSending ? "Sending…" : "Send Reset Link"}
              </button>
            </form>
          )}
        </div>
        <p className={styles.devCredit}>Developed by Tanvir Anzum</p>
      </div>
    </div>
  );
}