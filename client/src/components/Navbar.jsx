import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header style={{
      height: 64,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 20px",
      borderBottom: "1px solid var(--border)",
      background: "var(--card)",
      position: "sticky",
      top: 0,
      zIndex: 100,
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
        onClick={() => navigate("/lobby")}
      >
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: "var(--accent-soft)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18,
        }}>
          💬
        </div>
        <span style={{ fontSize: 20, fontWeight: 700, color: "var(--text)" }}>Chit-Chat</span>
      </div>

      {/* Right side */}
      {user && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Theme toggle */}
          <button
            className="button ghost icon"
            onClick={toggleTheme}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            style={{ fontSize: 16 }}
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </button>

          {/* Settings */}
          <button
            className="button ghost icon"
            onClick={() => navigate("/settings")}
            title="Settings"
            style={{ fontSize: 16 }}
          >
            ⚙️
          </button>

          {/* User info */}
          <div
            style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "4px 8px", borderRadius: 10 }}
            onClick={() => navigate("/settings")}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--border)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <div style={{ position: "relative" }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "var(--accent-soft)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 600, overflow: "hidden",
                color: "var(--text)",
              }}>
                {user.avatar ? (
                  <img src={user.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  user.username?.slice(0, 2).toUpperCase()
                )}
              </div>
              <span className="online-dot" style={{
                position: "absolute", bottom: 0, right: 0,
                border: "2px solid var(--card)",
              }} />
            </div>
            <span style={{ fontSize: 14, color: "var(--text-secondary)" }} className="hide-mobile">
              {user.username}
            </span>
          </div>

          {/* Logout */}
          <button className="button secondary" onClick={handleLogout} style={{ fontSize: 13, padding: "7px 14px" }}>
            Logout
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;
