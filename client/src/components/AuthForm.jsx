import { useState } from "react";

const AuthForm = ({ mode, onSubmit, loading, error }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!username.trim()) errs.username = "Username is required";
    else if (username.length < 3) errs.username = "At least 3 characters";
    else if (!/^[a-zA-Z0-9_]+$/.test(username)) errs.username = "Letters, numbers, underscores only";

    if (!password) errs.password = "Password is required";
    else if (mode === "register" && password.length < 6) errs.password = "At least 6 characters";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handle = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ username: username.trim(), password });
  };

  return (
    <form onSubmit={handle} className="card" style={{ maxWidth: 380, width: "100%", padding: 28 }}>
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: "var(--accent-soft)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 26, margin: "0 auto 10px",
        }}>💬</div>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--text)" }}>
          {mode === "login" ? "Welcome back" : "Create account"}
        </h2>
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
          {mode === "login" ? "Sign in to continue" : "Join Chit-Chat today"}
        </p>
      </div>

      {/* API error */}
      {error && (
        <div style={{
          background: "var(--danger-soft)", color: "var(--danger)",
          border: "1px solid var(--danger)", borderRadius: 10,
          padding: "9px 12px", fontSize: 13, marginBottom: 14,
        }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Username */}
        <div>
          <label style={{ fontSize: 12, color: "var(--muted)", marginBottom: 5, display: "block", fontWeight: 500 }}>
            Username
          </label>
          <input
            className={`input ${errors.username ? "input-error" : ""}`}
            placeholder="e.g. john_doe"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setErrors((p) => ({ ...p, username: "" })); }}
            autoComplete="username"
            disabled={loading}
            maxLength={30}
          />
          {errors.username && <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 4 }}>{errors.username}</div>}
        </div>

        {/* Password */}
        <div>
          <label style={{ fontSize: 12, color: "var(--muted)", marginBottom: 5, display: "block", fontWeight: 500 }}>
            Password
          </label>
          <input
            className={`input ${errors.password ? "input-error" : ""}`}
            type="password"
            placeholder={mode === "register" ? "Min. 6 characters" : "Your password"}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: "" })); }}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            disabled={loading}
          />
          {errors.password && <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 4 }}>{errors.password}</div>}
        </div>

        <button
          className="button"
          type="submit"
          disabled={loading}
          style={{ width: "100%", justifyContent: "center", marginTop: 2, padding: 12 }}
        >
          {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </div>
    </form>
  );
};

export default AuthForm;
