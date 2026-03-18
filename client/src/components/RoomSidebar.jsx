import { useState } from "react";

const RoomSidebar = ({ roomId, roomName, participants, isAdmin, onKick, onDismiss, currentUserId }) => {
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filtered = participants.filter((p) =>
    p.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside style={{
      width: 260,
      height: "100%",
      display: "flex",
      flexDirection: "column",
      background: "var(--bg-secondary)",
      borderLeft: "1px solid var(--border)",
      flexShrink: 0,
    }}>
      {/* Room info */}
      <div style={{ padding: "16px 14px 12px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{roomName}</div>
        <div style={{
          fontSize: 12, color: "var(--muted)",
          display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap",
        }}>
          <code style={{ background: "var(--border)", padding: "2px 6px", borderRadius: 6 }}>{roomId}</code>
          <button
            className="button ghost"
            style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6 }}
            onClick={copyRoomId}
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* Participants header */}
      <div style={{ padding: "10px 14px 6px" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)", marginBottom: 6 }}>
          {participants.length} Online
        </div>
        <input
          className="input"
          placeholder="Search participants..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ borderRadius: 10, fontSize: 12, padding: "6px 10px" }}
        />
      </div>

      {/* Participant list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
        {filtered.map((participant) => {
          const isCurrentUser = participant.userId === currentUserId;
          const isParticipantAdmin = participant.role === "admin";

          return (
            <div
              key={participant.userId}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "7px 6px",
                borderRadius: 10,
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--border)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                {/* Avatar */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "var(--accent-soft)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 600, color: "var(--text)",
                  }}>
                    {participant.avatar ? (
                      <img src={participant.avatar} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      participant.username?.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <span className="online-dot" style={{
                    position: "absolute", bottom: 0, right: 0,
                    border: "2px solid var(--bg-secondary)",
                  }} />
                </div>

                {/* Name */}
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 500,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    color: isParticipantAdmin ? "var(--warning)" : "var(--text)",
                  }}>
                    {isParticipantAdmin && "⭐ "}{participant.username}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>
                    {isCurrentUser ? "you" : isParticipantAdmin ? "admin" : "member"}
                  </div>
                </div>
              </div>

              {/* Kick button — only admin can see, not for self */}
              {isAdmin && !isCurrentUser && (
                <button
                  className="button danger"
                  style={{ padding: "3px 10px", fontSize: 11, borderRadius: 8 }}
                  onClick={() => onKick(participant.socketId)}
                >
                  Kick
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Admin controls */}
      {isAdmin && (
        <div style={{ padding: 12, borderTop: "1px solid var(--border)" }}>
          <button
            className="button danger"
            style={{ width: "100%", padding: 10, fontSize: 13 }}
            onClick={() => window.confirm("Dismiss room? This cannot be undone.") && onDismiss()}
          >
            Dismiss Room
          </button>
        </div>
      )}
    </aside>
  );
};

export default RoomSidebar;
