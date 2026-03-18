import { createContext, useContext, useState, useCallback, useRef } from "react";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [unreadCounts, setUnreadCounts] = useState({});
  const [toasts, setToasts] = useState([]);
  const audioRef = useRef(null);

  const playSound = useCallback(() => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(
          "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAA..."
        );
      }
      audioRef.current.volume = 0.3;
      audioRef.current.play().catch(() => {});
    } catch {}
  }, []);

  const addToast = useCallback((toast) => {
    const id = Date.now();
    setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const incrementUnread = useCallback((roomId) => {
    setUnreadCounts((prev) => ({
      ...prev,
      [roomId]: (prev[roomId] || 0) + 1,
    }));
  }, []);

  const clearUnread = useCallback((roomId) => {
    setUnreadCounts((prev) => ({ ...prev, [roomId]: 0 }));
  }, []);

  const notify = useCallback(({ roomId, sender, text, currentRoomId }) => {
    if (roomId === currentRoomId) return;
    incrementUnread(roomId);
    playSound();
    addToast({ sender, text: text.slice(0, 60), roomId });

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`${sender} in a room`, {
        body: text.slice(0, 100),
        icon: "/favicon.svg",
      });
    }
  }, [incrementUnread, playSound, addToast]);

  const requestPermission = useCallback(async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }, []);

  return (
    <NotificationContext.Provider value={{
      unreadCounts,
      toasts,
      notify,
      clearUnread,
      requestPermission,
      addToast,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
};
