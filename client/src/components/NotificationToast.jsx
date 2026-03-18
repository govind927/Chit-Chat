import { useNotifications } from "../context/NotificationContext.jsx";

const NotificationToast = ({ onClickRoom }) => {
  const { toasts } = useNotifications();

  if (!toasts.length) return null;

  return (
    <div style={{
      position: "fixed",
      top: 80,
      right: 20,
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      pointerEvents: "none",
    }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => onClickRoom?.(toast.roomId)}
          style={{
            background: "var(--card)",
            border: "1px solid var(--border-strong)",
            borderRadius: 12,
            padding: "10px 14px",
            minWidth: 240,
            maxWidth: 300,
            boxShadow: "var(--shadow)",
            cursor: "pointer",
            pointerEvents: "all",
            animation: "fadeUp 0.2s ease-out",
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "var(--accent-soft)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 600, flexShrink: 0,
            }}>
              {toast.sender?.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{toast.sender}</div>
              <div style={{
                fontSize: 12, color: "var(--muted)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {toast.text}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;
