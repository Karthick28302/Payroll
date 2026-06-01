import React, { useState } from "react";

const IconShield = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconAlert = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const Login = ({ onLogin, loading }) => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword]     = useState("");
  const [error, setError]           = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await onLogin({ identifier, password });
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="login-root">
      <div className="login-card">

        {/* Header */}
        <div className="login-header">
          <div className="login-logo-wrap">
            <IconShield />
          </div>
          <h1>Welcome Back</h1>
          <p>Sign in to your employee account</p>
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-error">
            <IconAlert />
            {error}
          </div>
        )}

        {/* Form */}
        <div className="login-form">
          <div className="form-group">
            <label className="form-label">Employee Code or Email</label>
            <input
              type="text"
              placeholder="e.g. EMP1001 or name@company.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button
            className="login-submit"
            onClick={handleSubmit}
            disabled={loading || !identifier || !password}
            type="button"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Login;
