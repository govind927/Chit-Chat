import { useEffect, useState, useRef, useCallback } from "react";
import { useSocket } from "../context/SocketContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotifications } from "../context/NotificationContext.jsx";
import MessageBubble from "./MessageBubble.jsx";
import EmojiPicker from "./EmojiPicker.jsx";
import FileUpload from "./FileUpload.jsx";
import MentionInput from "./MentionInput.jsx";
import axiosClient from "../api/axiosClient.js";

const ChatRoom = ({ roomId, isAdmin, onLeave, onDismiss, onParticipantsChange, participants }) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const { notify, clearUnread } = useNotifications();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [roomClosed, setRoomClosed] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showFile, setShowFile] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messagesTopRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // Clear unread when viewing this room
  useEffect(() => {
    clearUnread(roomId);
  }, [roomId, clearUnread]);

  // Load message history
  useEffect(() => {
    if (!roomId) return;
    const fetch = async () => {
      try {
        const res = await axiosClient.get(`/rooms/${roomId}/messages?page=1&limit=50`);
        setMessages(res.data.messages.map(normalizeMessage));
        setHasMore(res.data.hasMore);
      } catch (err) {
        console.error("History fetch failed:", err);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetch();
  }, [roomId]);

  // Join room
  useEffect(() => {
    if (!socket || !roomId) return;
    socket.emit("join-room", { roomId });
  }, [socket, roomId]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const onChatMessage = (msg) => {
      setMessages((prev) => {
        if (prev.find((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      if (msg.userId !== user?._id && msg.userId !== user?.id) {
        notify({ roomId, sender: msg.sender, text: msg.text || "Sent a file", currentRoomId: roomId });
      }
    };

    const onSystemMessage = (msg) => {
      setMessages((prev) => [...prev, { ...msg, system: true, _id: Date.now() }]);
    };

    const onRoomDismissed = () => {
      setRoomClosed(true);
      setTimeout(() => onLeave(), 2000);
    };

    const onKicked = () => { alert("You were removed by admin."); onLeave(); };

    const onRoomUpdate = ({ users }) => {
      onParticipantsChange?.(Object.values(users));
    };

    const onTyping = ({ username }) => {
      setTypingUsers((prev) => prev.includes(username) ? prev : [...prev, username]);
    };

    const onStopTyping = ({ username }) => {
      setTypingUsers((prev) => prev.filter((u) => u !== username));
    };

    const onMessageEdited = ({ messageId, text, editedAt }) => {
      setMessages((prev) => prev.map((m) =>
        m._id === messageId ? { ...m, text, isEdited: true, editedAt } : m
      ));
    };

    const onMessageDeleted = ({ messageId }) => {
      setMessages((prev) => prev.map((m) =>
        m._id === messageId ? { ...m, isDeleted: true, text: "" } : m
      ));
    };

    const onMessageReaction = ({ messageId, reactions }) => {
      setMessages((prev) => prev.map((m) =>
        m._id === messageId ? { ...m, reactions } : m
      ));
    };

    const onMessageRead = ({ messageId, userId }) => {
      setMessages((prev) => prev.map((m) =>
        m._id === messageId
          ? { ...m, readBy: [...(m.readBy || []), userId] }
          : m
      ));
    };

    socket.on("chatMessage", onChatMessage);
    socket.on("systemMessage", onSystemMessage);
    socket.on("room-dismissed", onRoomDismissed);
    socket.on("kicked", onKicked);
    socket.on("room-update", onRoomUpdate);
    socket.on("typing", onTyping);
    socket.on("stop-typing", onStopTyping);
    socket.on("message-edited", onMessageEdited);
    socket.on("message-deleted", onMessageDeleted);
    socket.on("message-reaction", onMessageReaction);
    socket.on("message-read", onMessageRead);

    return () => {
      socket.off("chatMessage", onChatMessage);
      socket.off("systemMessage", onSystemMessage);
      socket.off("room-dismissed", onRoomDismissed);
      socket.off("kicked", onKicked);
      socket.off("room-update", onRoomUpdate);
      socket.off("typing", onTyping);
      socket.off("stop-typing", onStopTyping);
      socket.off("message-edited", onMessageEdited);
      socket.off("message-deleted", onMessageDeleted);
      socket.off("message-reaction", onMessageReaction);
      socket.off("message-read", onMessageRead);
    };
  }, [socket, onLeave, onParticipantsChange, user, roomId, notify]);

  const normalizeMessage = (m) => ({
    _id: m._id,
    text: m.text,
    sender: m.sender?.username || m.sender,
    userId: m.sender?._id || m.userId,
    timestamp: m.createdAt || m.timestamp,
    type: m.type || "text",
    media: m.media,
    reactions: m.reactions || [],
    readBy: m.readBy || [],
    isEdited: m.isEdited || false,
    isDeleted: m.isDeleted || false,
    replyTo: m.replyTo,
  });

  const handleTextChange = (val) => {
    setText(val);
    if (!socket || roomClosed) return;
    socket.emit("typing", { roomId });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop-typing", { roomId });
    }, 2000);
  };

  const sendMessage = (e) => {
    e?.preventDefault();
    const trimmed = text.trim();
    if ((!trimmed && !editingMsg) || !socket || roomClosed) return;

    if (editingMsg) {
      socket.emit("edit-message", { roomId, messageId: editingMsg._id, text: trimmed });
      setEditingMsg(null);
    } else {
      socket.emit("chatMessage", {
        roomId,
        text: trimmed,
        replyTo: replyTo?._id || null,
      });
      setReplyTo(null);
    }

    setText("");
    clearTimeout(typingTimeoutRef.current);
    socket.emit("stop-typing", { roomId });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
    if (e.key === "Escape") {
      setReplyTo(null);
      setEditingMsg(null);
      setText("");
    }
  };

  const handleReact = (messageId, emoji) => {
    socket?.emit("react-message", { roomId, messageId, emoji });
  };

  const handleDelete = (messageId) => {
    if (!window.confirm("Delete this message?")) return;
    socket?.emit("delete-message", { roomId, messageId });
  };

  const handleEdit = (msg) => {
    setEditingMsg(msg);
    setText(msg.text);
    setReplyTo(null);
  };

  const handleReply = (msg) => {
    setReplyTo(msg);
    setEditingMsg(null);
  };

  const handleFileUpload = (fileData) => {
    socket?.emit("mediaMessage", { roomId, ...fileData });
    setShowFile(false);
  };

  const loadMore = async () => {
    try {
      const nextPage = page + 1;
      const res = await axiosClient.get(`/rooms/${roomId}/messages?page=${nextPage}&limit=50`);
      setMessages((prev) => [...res.data.messages.map(normalizeMessage), ...prev]);
      setHasMore(res.data.hasMore);
      setPage(nextPage);
    } catch {}
  };

  if (roomClosed) {
    return (
      <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🚫</div>
        <div style={{ fontSize: 16, fontWeight: 500, color: "var(--danger)" }}>Room closed by admin</div>
        <button className="button" onClick={onLeave} style={{ marginTop: 16 }}>Return to Lobby</button>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", minWidth: 0 }}>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 2 }}>

        {/* Load more */}
        {hasMore && (
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <button className="button secondary" style={{ fontSize: 12, padding: "5px 14px" }} onClick={loadMore}>
              Load earlier messages
            </button>
          </div>
        )}

        {loadingHistory ? (
          <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 13, marginTop: 40 }}>
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 13, marginTop: 60 }}>
            No messages yet. Say hello! 👋
          </div>
        ) : (
          messages.map((msg) =>
            msg.system ? (
              <div key={msg._id} style={{
                alignSelf: "center", textAlign: "center",
                fontSize: 12, color: "var(--system-msg-color)",
                background: "var(--system-msg-bg)",
                padding: "4px 12px", borderRadius: 12, maxWidth: "80%", margin: "4px 0",
              }}>
                {msg.text}
              </div>
            ) : (
              <MessageBubble
                key={msg._id}
                msg={msg}
                isOwn={msg.userId === user?._id || msg.userId === user?.id}
                totalParticipants={participants?.length || 1}
                onReact={handleReact}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onReply={handleReply}
              />
            )
          )
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic", padding: "4px 8px" }}>
            {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply / edit bar */}
      {(replyTo || editingMsg) && (
        <div style={{
          padding: "8px 16px",
          background: "var(--border)",
          borderTop: "1px solid var(--border-strong)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          fontSize: 12, color: "var(--muted)",
        }}>
          <span>
            {replyTo ? `↩ Replying to: ${replyTo.text?.slice(0, 40)}` : `✏️ Editing message`}
          </span>
          <button
            className="button ghost"
            style={{ fontSize: 11, padding: "2px 8px" }}
            onClick={() => { setReplyTo(null); setEditingMsg(null); setText(""); }}
          >
            ✕ Cancel
          </button>
        </div>
      )}

      {/* Input bar */}
      <div style={{
        padding: "10px 14px",
        borderTop: "1px solid var(--border)",
        display: "flex",
        gap: 8,
        alignItems: "center",
        position: "relative",
        background: "var(--card)",
      }}>
        {/* Emoji picker */}
        <div style={{ position: "relative" }}>
          <button
            className="button ghost icon"
            onClick={() => { setShowEmoji((v) => !v); setShowFile(false); }}
            title="Emoji"
          >
            😊
          </button>
          {showEmoji && (
            <EmojiPicker
              onSelect={(e) => { setText((t) => t + e); setShowEmoji(false); }}
              onClose={() => setShowEmoji(false)}
            />
          )}
        </div>

        {/* File upload */}
        <div style={{ position: "relative" }}>
          <button
            className="button ghost icon"
            onClick={() => { setShowFile((v) => !v); setShowEmoji(false); }}
            title="Attach file"
          >
            📎
          </button>
          {showFile && (
            <FileUpload onUpload={handleFileUpload} onClose={() => setShowFile(false)} />
          )}
        </div>

        {/* Message input */}
        <MentionInput
          value={text}
          onChange={handleTextChange}
          participants={participants}
          onKeyDown={handleKeyDown}
          disabled={roomClosed}
          placeholder={editingMsg ? "Edit message..." : "Type a message... (@mention)"}
        />

        {/* Send */}
        <button
          className="button"
          onClick={sendMessage}
          disabled={!text.trim() || roomClosed}
          style={{ padding: "10px 16px", flexShrink: 0 }}
        >
          {editingMsg ? "Save" : "Send"}
        </button>

        {/* Leave / Dismiss */}
        <button className="button secondary" onClick={onLeave} style={{ flexShrink: 0, padding: "10px 12px" }}>
          Leave
        </button>
        {isAdmin && (
          <button className="button danger" onClick={onDismiss} style={{ flexShrink: 0, padding: "10px 12px" }}>
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatRoom;
