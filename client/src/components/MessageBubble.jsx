import { useState } from "react";

const formatTime = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const ReadReceipt = ({ readBy, totalParticipants }) => {
  const count = readBy?.length || 0;
  if (count === 0) return <span style={{ fontSize: 11, opacity: 0.6 }}>✓</span>;
  if (count < totalParticipants) return <span style={{ fontSize: 11, opacity: 0.8 }}>✓✓</span>;
  return <span style={{ fontSize: 11, color: "#60a5fa" }}>✓✓</span>;
};

const MessageBubble = ({
  msg,
  isOwn,
  totalParticipants = 1,
  onReact,
  onEdit,
  onDelete,
  onReply,
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

  if (msg.isDeleted) {
    return (
      <div className={`message-row ${isOwn ? "self" : ""}`}>
        <div className="message-bubble" style={{
          opacity: 0.5,
          fontStyle: "italic",
          fontSize: 13,
          background: "transparent",
          border: "1px dashed var(--border-strong)",
          color: "var(--muted)",
        }}>
          🗑 Message deleted
        </div>
      </div>
    );
  }

  return (
    <div
      className={`message-row msg-animate ${isOwn ? "self" : ""}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowReactions(false); }}
      style={{ position: "relative", alignItems: "flex-end", gap: 6 }}
    >
      {/* Avatar for others */}
      {!isOwn && (
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "var(--accent-soft)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 600, flexShrink: 0, marginBottom: 2,
          color: "var(--text)",
        }}>
          {msg.sender?.slice(0, 2).toUpperCase()}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", alignItems: isOwn ? "flex-end" : "flex-start", maxWidth: "68%" }}>

        {/* Reply preview */}
        {msg.replyTo && (
          <div style={{
            fontSize: 12, color: "var(--muted)",
            background: "var(--border)", borderRadius: "8px 8px 0 0",
            padding: "4px 10px", borderLeft: "3px solid var(--accent)",
            maxWidth: "100%", overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            ↩ {msg.replyTo.text?.slice(0, 40) || "Media"}
          </div>
        )}

        <div
          className={`message-bubble ${isOwn ? "self" : ""}`}
          style={{ borderRadius: msg.replyTo ? "0 12px 12px 12px" : undefined }}
        >
          {/* Sender name */}
          {!isOwn && (
            <div className="username-label" style={{
              color: msg.isAdmin ? "var(--warning)" : "var(--accent)",
            }}>
              {msg.isAdmin && "⭐ "}{msg.sender}
            </div>
          )}

          {/* Media content */}
          {msg.type === "image" && msg.media?.url && (
            <img
              src={msg.media.url}
              alt={msg.media.name || "image"}
              style={{ maxWidth: "100%", borderRadius: 8, marginBottom: msg.text ? 6 : 0, display: "block" }}
              onClick={() => window.open(msg.media.url, "_blank")}
            />
          )}
          {msg.type === "video" && msg.media?.url && (
            <video
              src={msg.media.url}
              controls
              style={{ maxWidth: "100%", borderRadius: 8, marginBottom: msg.text ? 6 : 0 }}
            />
          )}
          {msg.type === "file" && msg.media?.url && (
            <a
              href={msg.media.url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "flex", alignItems: "center", gap: 8,
                color: isOwn ? "rgba(255,255,255,0.9)" : "var(--accent)",
                textDecoration: "none", marginBottom: msg.text ? 6 : 0,
                fontSize: 13,
              }}
            >
              <span>📄</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {msg.media.name}
              </span>
              {msg.media.size && <span style={{ opacity: 0.6, fontSize: 11 }}>({formatSize(msg.media.size)})</span>}
            </a>
          )}

          {/* Text */}
          {msg.text && (
            <div style={{ fontSize: 14, lineHeight: 1.5 }}>
              {msg.text.split(/(@\w+)/g).map((part, i) =>
                part.startsWith("@") ? (
                  <span key={i} style={{ color: isOwn ? "#c4b5fd" : "var(--accent)", fontWeight: 600 }}>{part}</span>
                ) : part
              )}
            </div>
          )}

          {/* Meta */}
          <div className="message-meta">
            {msg.isEdited && <span style={{ fontSize: 10, opacity: 0.6 }}>edited</span>}
            <span>{formatTime(msg.timestamp)}</span>
            {isOwn && <ReadReceipt readBy={msg.readBy} totalParticipants={totalParticipants} />}
          </div>
        </div>

        {/* Reactions display */}
        {msg.reactions?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
            {msg.reactions.map((r) => (
              r.users?.length > 0 && (
                <button
                  key={r.emoji}
                  onClick={() => onReact?.(msg._id, r.emoji)}
                  style={{
                    background: "var(--card)", border: "1px solid var(--border)",
                    borderRadius: 999, padding: "2px 7px", cursor: "pointer",
                    fontSize: 13, display: "flex", alignItems: "center", gap: 3,
                    color: "var(--text)",
                  }}
                >
                  {r.emoji}
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>{r.users.length}</span>
                </button>
              )
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      {showActions && (
        <div style={{
          display: "flex", gap: 2,
          position: "absolute",
          [isOwn ? "left" : "right"]: "calc(100% - 30px)",
          bottom: 24,
          zIndex: 10,
        }}>
          {/* Quick reactions */}
          <div style={{ position: "relative" }}>
            <button
              className="button ghost icon"
              style={{ fontSize: 14, padding: "4px 6px", borderRadius: 8 }}
              onClick={() => setShowReactions((v) => !v)}
            >
              😊
            </button>
            {showReactions && (
              <div style={{
                position: "absolute", bottom: "110%",
                [isOwn ? "right" : "left"]: 0,
                background: "var(--card)", border: "1px solid var(--border)",
                borderRadius: 12, padding: "6px 8px",
                display: "flex", gap: 4, zIndex: 20,
                boxShadow: "var(--shadow)",
              }}>
                {QUICK_REACTIONS.map((e) => (
                  <button
                    key={e}
                    onClick={() => { onReact?.(msg._id, e); setShowReactions(false); }}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, padding: 2, borderRadius: 6 }}
                    onMouseEnter={(ev) => ev.target.style.background = "var(--border)"}
                    onMouseLeave={(ev) => ev.target.style.background = "none"}
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            className="button ghost icon"
            style={{ fontSize: 12, padding: "4px 6px" }}
            onClick={() => onReply?.(msg)}
            title="Reply"
          >↩</button>

          {isOwn && (
            <>
              <button
                className="button ghost icon"
                style={{ fontSize: 12, padding: "4px 6px" }}
                onClick={() => onEdit?.(msg)}
                title="Edit"
              >✏️</button>
              <button
                className="button ghost icon"
                style={{ fontSize: 12, padding: "4px 6px", color: "var(--danger)" }}
                onClick={() => onDelete?.(msg._id)}
                title="Delete"
              >🗑</button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
