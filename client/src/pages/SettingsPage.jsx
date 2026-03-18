import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import axiosClient from "../api/axiosClient.js";

const Section = ({ title, children }) => (
  <div className="card" style={{ marginBottom: 16 }}>
    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid var(--border)" }}>
      {title}
    </h3>
    {children}
  </div>
);

const SettingsPage = () => {
  const { user, updateUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [bio, setBio] = useState(user?.bio || "");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [notifications, setNotifications] = useState(
    user?.notifications || { sound: true, push: true, mentions: true }
  );
  const avatarInputRef = useRef(null);

  const saveProfile = async () => {
    setSaving(true);
    setSavedMsg("");
    try {
      const res = await axiosClient.put("/users/me", { bio, notifications });
      updateUser(res.data);
      setSavedMsg("Saved!");
      setTimeout(() => setSavedMsg(""), 2500);
    } catch {
      setSavedMsg("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("avatar", file);
    try {
      const res = await axiosClient.post("/users/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      updateUser({ avatar: res.data.avatar });
    } catch {
      alert("Avatar upload failed");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="app-container">
      <Navbar />
      <main style={{ flex: 1, overflowY: "auto", padding: "24px 16px" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <button
              className="button ghost"
              onClick={() => navigate(-1)}
              style={{ fontSize: 18, padding: "4px 8px" }}
            >←</button>
            <h2 style={{ fontSize: 20, fontWeight: 600 }}>Settings</h2>
          </div>

          {/* Profile */}
          <Section title="Profile">
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
              {/* Avatar */}
              <div
                style={{ position: "relative", cursor: "pointer" }}
                onClick={() => avatarInputRef.current?.click()}
              >
                <div style={{
                  width: 72, height: 72, borderRadius: "50%",
                  background: "var(--accent-soft)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24, fontWeight: 600, overflow: "hidden",
                  border: "2px solid var(--border-strong)",
                  color: "var(--text)",
                }}>
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    user?.username?.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div style={{
                  position: "absolute", bottom: 0, right: 0,
                  width: 22, height: 22, borderRadius: "50%",
                  background: "var(--accent)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, border: "2px solid var(--bg)",
                }}>
                  ✏️
                </div>
              </div>
              <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />

              <div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{user?.username}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Click avatar to change photo</div>
              </div>
            </div>

            {/* Bio */}
            <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 5, fontWeight: 500 }}>Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={150}
              placeholder="Tell others about yourself..."
              style={{
                width: "100%", borderRadius: 12,
                border: "1.5px solid var(--border)",
                background: "var(--input-bg)",
                color: "var(--text)",
                padding: "10px 12px", fontSize: 14,
                fontFamily: "inherit", resize: "vertical",
                minHeight: 72, outline: "none",
              }}
              onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
              onBlur={(e) => e.target.style.borderColor = "var(--border)"}
            />
            <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "right", marginTop: 2 }}>{bio.length}/150</div>
          </Section>

          {/* Appearance */}
          <Section title="Appearance">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>Theme</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>Currently: {theme} mode</div>
              </div>
              <button className="button secondary" onClick={toggleTheme} style={{ gap: 6 }}>
                {theme === "dark" ? "☀️ Light mode" : "🌙 Dark mode"}
              </button>
            </div>
          </Section>

          {/* Notifications */}
          <Section title="Notifications">
            {[
              { key: "sound", label: "Sound alerts", desc: "Play a sound for new messages" },
              { key: "push", label: "Push notifications", desc: "Notify when app is in background" },
              { key: "mentions", label: "Mention alerts", desc: "Alert when someone @mentions you" },
            ].map(({ key, label, desc }) => (
              <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{label}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{desc}</div>
                </div>
                <div
                  onClick={() => setNotifications((p) => ({ ...p, [key]: !p[key] }))}
                  style={{
                    width: 44, height: 24, borderRadius: 999,
                    background: notifications[key] ? "var(--accent)" : "var(--border-strong)",
                    cursor: "pointer", position: "relative", transition: "background 0.2s",
                    flexShrink: 0,
                  }}
                >
                  <div style={{
                    position: "absolute", top: 3, left: notifications[key] ? 23 : 3,
                    width: 18, height: 18, borderRadius: "50%",
                    background: "white", transition: "left 0.2s",
                  }} />
                </div>
              </div>
            ))}
          </Section>

          {/* Save + Logout */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="button"
              onClick={saveProfile}
              disabled={saving}
              style={{ flex: 1, justifyContent: "center", padding: 12 }}
            >
              {saving ? "Saving…" : savedMsg || "Save changes"}
            </button>
            <button
              className="button danger"
              onClick={handleLogout}
              style={{ padding: "12px 20px" }}
            >
              Logout
            </button>
          </div>

        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
