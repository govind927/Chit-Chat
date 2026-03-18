import { useState } from "react";
import axiosClient from "../api/axiosClient.js";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import ChatListPanel from "../components/ChatListPanel.jsx";

const LobbyPage = () => {
  const [roomName, setRoomName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [createError, setCreateError] = useState("");
  const [joinError, setJoinError] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(null);

  const navigate = useNavigate();

  const createRoom = async (e) => {
    e.preventDefault();
    setCreateError("");
    if (!roomName.trim()) return setCreateError("Room name is required");
    if (roomName.trim().length < 2 || roomName.trim().length > 50)
      return setCreateError("Room name must be 2–50 characters");

    setCreating(true);
    try {
      const res = await axiosClient.post("/rooms/create", { name: roomName.trim() });
      navigate(`/chat/${res.data.roomId}`, {
        state: { roomName: res.data.name, isAdmin: true },
      });
    } catch (err) {
      setCreateError(err.response?.data?.message || "Failed to create room");
    } finally {
      setCreating(false);
    }
  };

  const joinRoom = async (e) => {
    e.preventDefault();
    setJoinError("");
    if (!roomId.trim()) return setJoinError("Room ID is required");
    if (roomId.trim().length !== 8) return setJoinError("Room ID must be 8 characters");

    setJoining(true);
    try {
      const res = await axiosClient.post("/rooms/join", { roomId: roomId.trim() });
      navigate(`/chat/${res.data.roomId}`, {
        state: { roomName: res.data.name, isAdmin: res.data.isAdmin },
      });
    } catch (err) {
      setJoinError(err.response?.data?.message || "Room not found");
    } finally {
      setJoining(false);
    }
  };

  const handleSelectRoom = (room) => {
    navigate(`/chat/${room.roomId}`, {
      state: { roomName: room.name, isAdmin: false },
    });
  };

  return (
    <div className="app-container">
      <Navbar />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Chat list panel */}
        <ChatListPanel currentRoomId={null} onSelectRoom={handleSelectRoom} />

        {/* Main lobby */}
        <main style={{ flex: 1, padding: 24, overflowY: "auto" }}>
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6, color: "var(--text)" }}>
              Welcome to Chit-Chat 💬
            </h2>
            <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 24 }}>
              Create a new room or join one with a room code.
            </p>

            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {/* Create room */}
              <form onSubmit={createRoom} className="card" style={{ flex: 1, minWidth: 240 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Create a room</h3>
                <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>
                  Start a new group chat and invite friends.
                </p>
                <input
                  className="input"
                  placeholder="Room name..."
                  value={roomName}
                  onChange={(e) => { setRoomName(e.target.value); setCreateError(""); }}
                  maxLength={50}
                  disabled={creating}
                />
                {createError && (
                  <div style={{ color: "var(--danger)", fontSize: 12, marginTop: 6 }}>{createError}</div>
                )}
                <button
                  className="button"
                  style={{ marginTop: 12, width: "100%", justifyContent: "center" }}
                  disabled={creating || !roomName.trim()}
                >
                  {creating ? "Creating…" : "Create room"}
                </button>
              </form>

              {/* Join room */}
              <form onSubmit={joinRoom} className="card" style={{ flex: 1, minWidth: 240 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Join a room</h3>
                <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>
                  Enter an 8-character room code to join.
                </p>
                <input
                  className="input"
                  placeholder="e.g. AB3X9Z2K"
                  value={roomId}
                  onChange={(e) => { setRoomId(e.target.value.toUpperCase()); setJoinError(""); }}
                  maxLength={8}
                  disabled={joining}
                  style={{ letterSpacing: "0.1em", fontFamily: "monospace" }}
                />
                {joinError && (
                  <div style={{ color: "var(--danger)", fontSize: 12, marginTop: 6 }}>{joinError}</div>
                )}
                <button
                  className="button"
                  style={{ marginTop: 12, width: "100%", justifyContent: "center" }}
                  disabled={joining || roomId.trim().length !== 8}
                >
                  {joining ? "Joining…" : "Join room"}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LobbyPage;
