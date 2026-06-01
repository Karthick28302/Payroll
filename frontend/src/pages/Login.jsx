import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { ADMIN_TOKEN_KEY, ADMIN_USER_KEY } from "../utils/auth";

const Login = () => {
  const [username,     setUsername]     = useState("");
  const [password,     setPassword]     = useState("");
  const [loading,      setLoading]      = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState("");

  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await API.post("/api/login", { username: username.trim(), password });
      const token = response?.data?.data?.token;
      const admin = response?.data?.data?.admin;
      if (!token) {
        throw new Error("Missing auth token from server.");
      }
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
      localStorage.setItem(
        ADMIN_USER_KEY,
        JSON.stringify({
          username: admin?.username || username.trim(),
          role: admin?.role || "admin",
        })
      );
      localStorage.setItem("isAdmin", "true");
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => e.key === "Enter" && handleLogin();

  return (
    <div style={s.page}>

      {/* ── Dot-grid background ── */}
      <div style={s.dotGrid} />

      {/* ── Ambient glow ── */}
      <div style={s.glowTop} />
      <div style={s.glowBottom} />

      {/* ── Card ── */}
      <div style={s.card}>

        {/* Accent top bar */}
        <div style={s.accentBar} />

        {/* Logo + heading */}
        <div style={s.logoRow}>
          <div style={s.logoMark}>SA</div>
          <div>
            <p style={s.logoName}>SmartAttend</p>
            <p style={s.logoSub}>Attendance Management System</p>
          </div>
        </div>

        <h1 style={s.title}>Welcome back</h1>
        <p  style={s.subtitle}>Sign in to access the admin console</p>

        {/* ── Fields ── */}
        <div style={s.fields}>

          {/* Username */}
          <div style={s.fieldGroup}>
            <label style={s.label}>Username</label>
            <div style={s.inputWrap}>
              <span style={s.inputIcon}>◎</span>
              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(""); }}
                onKeyDown={onKey}
                style={{ ...s.input, paddingLeft: "40px" }}
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

          {/* Password */}
          <div style={s.fieldGroup}>
            <label style={s.label}>Password</label>
            <div style={s.inputWrap}>
              <span style={s.inputIcon}>◉</span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                onKeyDown={onKey}
                style={{ ...s.input, paddingLeft: "40px", paddingRight: "44px" }}
                autoComplete="current-password"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                style={s.eyeBtn}
                type="button"
                tabIndex={-1}
              >
                {showPassword ? "○" : "●"}
              </button>
            </div>
          </div>

        </div>

        {/* ── Error ── */}
        {error && (
          <div style={s.errorBox}>
            <span style={s.errorIcon}>⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* ── Submit ── */}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ ...s.submitBtn, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? (
            <>
              <span style={s.spinner} />
              Signing in...
            </>
          ) : (
            <>Sign In →</>
          )}
        </button>

        {/* ── Footer note ── */}
        <p style={s.footerNote}>
          Face recognition powered · Secure admin access
        </p>

      </div>
    </div>
  );
};

export default Login;

/* ─────────────────────────────────────────
   STYLES
───────────────────────────────────────── */
const s = {

  /* Page */
  page: {
    minHeight       : "100vh",
    display         : "flex",
    alignItems      : "center",
    justifyContent  : "center",
    background      : "var(--bg)",
    position        : "relative",
    overflow        : "hidden",
    fontFamily      : "var(--font-body)",
  },

  /* Dot grid background */
  dotGrid: {
    position        : "absolute",
    inset           : 0,
    backgroundImage : "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
    backgroundSize  : "28px 28px",
    pointerEvents   : "none",
  },

  /* Ambient glows */
  glowTop: {
    position      : "absolute",
    top           : "-160px",
    left          : "50%",
    transform     : "translateX(-50%)",
    width         : "700px",
    height        : "400px",
    background    : "radial-gradient(ellipse, rgba(0,212,168,0.07) 0%, transparent 70%)",
    pointerEvents : "none",
  },
  glowBottom: {
    position      : "absolute",
    bottom        : "-160px",
    left          : "50%",
    transform     : "translateX(-50%)",
    width         : "500px",
    height        : "300px",
    background    : "radial-gradient(ellipse, rgba(77,166,255,0.05) 0%, transparent 70%)",
    pointerEvents : "none",
  },

  /* Card */
  card: {
    position        : "relative",
    width           : "100%",
    maxWidth        : "420px",
    background      : "var(--surface-1)",
    border          : "1px solid var(--border)",
    borderRadius    : "var(--r-xl)",
    padding         : "0 0 32px",
    boxShadow       : "var(--shadow-lg)",
    overflow        : "hidden",
    animation       : "fadeUp 0.45s ease both",
    zIndex          : 1,
  },

  /* Accent top bar */
  accentBar: {
    height          : "3px",
    background      : "linear-gradient(90deg, var(--accent), var(--info))",
    marginBottom    : "28px",
  },

  /* Logo row */
  logoRow: {
    display         : "flex",
    alignItems      : "center",
    gap             : "12px",
    padding         : "0 32px",
    marginBottom    : "28px",
  },
  logoMark: {
    width           : "42px",
    height          : "42px",
    background      : "var(--accent)",
    borderRadius    : "11px",
    display         : "flex",
    alignItems      : "center",
    justifyContent  : "center",
    fontFamily      : "var(--font-display)",
    fontWeight      : "800",
    fontSize        : "15px",
    color           : "#050D1C",
    flexShrink      : 0,
    boxShadow       : "0 4px 14px rgba(0,212,168,0.3)",
  },
  logoName: {
    fontFamily      : "var(--font-display)",
    fontWeight      : "700",
    fontSize        : "15px",
    color           : "var(--text-primary)",
    margin          : 0,
  },
  logoSub: {
    fontSize        : "11px",
    color           : "var(--text-muted)",
    margin          : "2px 0 0",
  },

  /* Heading */
  title: {
    fontFamily      : "var(--font-display)",
    fontSize        : "26px",
    fontWeight      : "800",
    color           : "var(--text-primary)",
    padding         : "0 32px",
    margin          : "0 0 6px",
    lineHeight      : 1.2,
  },
  subtitle: {
    fontSize        : "13.5px",
    color           : "var(--text-secondary)",
    padding         : "0 32px",
    margin          : "0 0 28px",
  },

  /* Fields */
  fields: {
    display         : "flex",
    flexDirection   : "column",
    gap             : "16px",
    padding         : "0 32px",
    marginBottom    : "16px",
  },
  fieldGroup: {
    display         : "flex",
    flexDirection   : "column",
    gap             : "6px",
  },
  label: {
    fontFamily      : "var(--font-display)",
    fontSize        : "11px",
    fontWeight      : "600",
    letterSpacing   : "0.08em",
    textTransform   : "uppercase",
    color           : "var(--text-muted)",
  },
  inputWrap: {
    position        : "relative",
    display         : "flex",
    alignItems      : "center",
  },
  inputIcon: {
    position        : "absolute",
    left            : "13px",
    fontSize        : "14px",
    color           : "var(--text-muted)",
    pointerEvents   : "none",
    zIndex          : 1,
  },
  input: {
    width           : "100%",
    padding         : "11px 14px",
    background      : "var(--surface-2)",
    border          : "1px solid var(--border)",
    borderRadius    : "var(--r-md)",
    color           : "var(--text-primary)",
    fontFamily      : "var(--font-body)",
    fontSize        : "14px",
    outline         : "none",
    transition      : "border-color 0.15s, box-shadow 0.15s",
  },
  eyeBtn: {
    position        : "absolute",
    right           : "12px",
    background      : "none",
    border          : "none",
    color           : "var(--text-muted)",
    cursor          : "pointer",
    fontSize        : "13px",
    padding         : "4px",
    display         : "flex",
    alignItems      : "center",
    justifyContent  : "center",
    lineHeight      : 1,
  },

  /* Error */
  errorBox: {
    display         : "flex",
    alignItems      : "center",
    gap             : "8px",
    margin          : "0 32px 14px",
    padding         : "11px 14px",
    background      : "var(--danger-dim)",
    border          : "1px solid var(--danger-border)",
    borderRadius    : "var(--r-md)",
    color           : "var(--danger)",
    fontSize        : "13px",
    fontWeight      : "500",
  },
  errorIcon: {
    fontSize        : "14px",
    flexShrink      : 0,
  },

  /* Submit button */
  submitBtn: {
    display         : "flex",
    alignItems      : "center",
    justifyContent  : "center",
    gap             : "8px",
    width           : "calc(100% - 64px)",
    margin          : "0 32px",
    padding         : "13px",
    background      : "var(--accent)",
    color           : "#050D1C",
    border          : "none",
    borderRadius    : "var(--r-md)",
    fontFamily      : "var(--font-body)",
    fontSize        : "15px",
    fontWeight      : "700",
    cursor          : "pointer",
    transition      : "all 0.18s",
    letterSpacing   : "0.01em",
    boxShadow       : "0 4px 16px rgba(0,212,168,0.22)",
  },

  /* Inline spinner */
  spinner: {
    width           : "16px",
    height          : "16px",
    border          : "2px solid rgba(5,13,28,0.25)",
    borderTop       : "2px solid #050D1C",
    borderRadius    : "50%",
    animation       : "spin 0.65s linear infinite",
    display         : "inline-block",
    flexShrink      : 0,
  },

  /* Footer */
  footerNote: {
    textAlign       : "center",
    fontSize        : "11px",
    color           : "var(--text-muted)",
    fontFamily      : "var(--font-mono)",
    margin          : "20px 32px 0",
    paddingTop      : "16px",
    borderTop       : "1px solid var(--border)",
  },
};

/* ── Focus ring on inputs (injected once) ── */
if (typeof document !== "undefined" && !document.getElementById("login-input-style")) {
  const el = document.createElement("style");
  el.id = "login-input-style";
  el.textContent = `
    input:focus {
      border-color: var(--accent) !important;
      box-shadow: 0 0 0 3px var(--accent-dim) !important;
    }
    button[style*="background: var(--accent)"]:hover:not(:disabled) {
      background: var(--accent-hover) !important;
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(0,212,168,0.30) !important;
    }
  `;
  document.head.appendChild(el);
}
