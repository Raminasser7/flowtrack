import React, { useState } from "react";
import "./AuthPage.css";

const API = process.env.REACT_APP_API_URL || "";

export default function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!form.username || !form.password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      // حفظ الـ token في localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.username);
      onLogin(data.token, data.username);
    } catch (err) {
      setError("Network error. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-icon">◈</span>
          <span className="auth-logo-text">FlowTrack</span>
        </div>

        <p className="auth-subtitle">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </p>

        <div className="auth-toggle">
          <button
            className={`auth-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => { setMode("login"); setError(""); }}
          >
            Login
          </button>
          <button
            className={`auth-tab ${mode === "register" ? "active" : ""}`}
            onClick={() => { setMode("register"); setError(""); }}
          >
            Register
          </button>
        </div>

        <div className="auth-fields">
          <div className="auth-field">
            <label className="auth-label">Username</label>
            <input
              className="auth-input"
              type="text"
              placeholder="e.g. rami123"
              value={form.username}
              onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))}
              onKeyDown={handleKey}
              autoFocus
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input
              className="auth-input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
              onKeyDown={handleKey}
            />
          </div>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button className="auth-submit" onClick={handleSubmit} disabled={loading}>
          {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
        </button>

        {mode === "register" && (
          <p className="auth-hint">
            Username: letters and numbers only (min 3 chars) · Password: min 6 chars
          </p>
        )}
      </div>
    </div>
  );
}
