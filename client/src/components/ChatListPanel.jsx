import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient.js";
import { useNotifications } from "../context/NotificationContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const formatTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return "now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};

const ChatListPanel = ({ currentRoomId, onSelectRoom }) => {
  const { user } = useAuth();
  const { unreadCounts, clearUnread } = useNotifications();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await axiosClient.get("/rooms/my-rooms");
        setRooms(res.data.rooms || []);
      } catch (err) {
        console.error("Failed to fetch rooms:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  const filtered = rooms.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      width: 280,
      height: "100%",
      display: "flex",
      flexDirection: "column",
      background: "var(--bg-secondary)",
      borderRight: "1px solid var(--border)",
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{ padding: "16px 16px 10px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>My Rooms</div>
        <input
          className="input"
          placeholder="Search rooms..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ borderRadius: 10, fontSize: 13 }}
        />
      </div>

      {/* Room list */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <div style={{ padding: 20, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
            Loading rooms...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
            {search ? "No rooms found" : "No rooms yet"}
          </div>
        ) : (
          filtered.map((room) => {
            const isActive = room.roomId === currentRoomId;
            const unread = unreadCounts[room.roomId] || 0;

            return (
              <div
                key={room._id}
                onClick={() => {
                  onSelectRoom(room);
                  clearUnread(room.roomId);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  cursor: "pointer",
                  background: isActive ? "var(--border)" : "transparent",
                  borderLeft: isActive ? "3px solid var(--accent)" : "3px solid transparent",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--border)"; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                {/* Room avatar */}
                <div style={{
                  width: 42, height: 42, borderRadius: "50%",
                  background: "var(--accent-soft)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 600, flexShrink: 0,
                  color: "var(--text)",
                  position: "relative",
                }}>
                  {room.avatar ? (
                    <img src={room.avatar} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    room.name.slice(0, 2).toUpperCase()
                  )}
                  {/* Online indicator */}
                  <span className="online-dot" style={{
                    position: "absolute", bottom: 1, right: 1,
                    border: "2px solid var(--bg-secondary)",
                  }} />
                </div>

                {/* Room info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {room.name}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--muted)", flexShrink: 0, marginLeft: 4 }}>
                      {formatTime(room.lastMessage?.sentAt)}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
                    <span style={{
                      fontSize: 12, color: "var(--muted)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
                    }}>
                      {room.lastMessage?.senderName
                        ? `${room.lastMessage.senderName}: ${room.lastMessage.text}`
                        : "No messages yet"}
                    </span>
                    {unread > 0 && (
                      <span className="badge" style={{ marginLeft: 6, flexShrink: 0 }}>
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatListPanel;
