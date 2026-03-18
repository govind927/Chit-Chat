import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import RoomSidebar from "../components/RoomSidebar.jsx";
import ChatRoom from "../components/ChatRoom.jsx";
import axiosClient from "../api/axiosClient.js";
import { useSocket } from "../context/SocketContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const ChatPage = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { socket, connected } = useSocket();
  const { user } = useAuth();

  const [roomName, setRoomName] = useState(location.state?.roomName || "");
  const [isAdmin, setIsAdmin] = useState(location.state?.isAdmin || false);
  const [participants, setParticipants] = useState([]);
  const [roomReady, setRoomReady] = useState(false);

  // Fetch room info if no state (direct navigation)
  useEffect(() => {
    if (roomName) return;
    const fetchRoom = async () => {
      try {
        const res = await axiosClient.post("/rooms/join", { roomId });
        setRoomName(res.data.name);
        setIsAdmin(res.data.isAdmin);
      } catch {
        navigate("/lobby");
      }
    };
    fetchRoom();
  }, [roomId, roomName, navigate]);

  // Socket: single join + listeners
  useEffect(() => {
    if (!socket || !connected || !roomId) return;

    socket.emit("join-room", { roomId });

    const onRoomJoined = ({ users, isAdmin: adminStatus }) => {
      setParticipants(Object.values(users));
      setIsAdmin((prev) => prev || adminStatus);
      setRoomReady(true);
    };

    const onRoomUpdate = ({ users }) => {
      setParticipants(Object.values(users));
    };

    const onKicked = () => {
      alert("You were removed from the room.");
      navigate("/lobby");
    };

    const onRoomDismissed = () => navigate("/lobby");

    socket.on("room-joined", onRoomJoined);
    socket.on("room-update", onRoomUpdate);
    socket.on("kicked", onKicked);
    socket.on("room-dismissed", onRoomDismissed);

    return () => {
      socket.off("room-joined", onRoomJoined);
      socket.off("room-update", onRoomUpdate);
      socket.off("kicked", onKicked);
      socket.off("room-dismissed", onRoomDismissed);
    };
  }, [socket, connected, roomId, navigate]);

  const handleLeave = async () => {
    try { await axiosClient.post("/rooms/leave", { roomId }); } catch {}
    navigate("/lobby");
  };

  const handleDismiss = async () => {
    if (!confirm("Dismiss room? This cannot be undone.")) return;
    try {
      await axiosClient.post("/rooms/dismiss", { roomId });
      socket?.emit("dismiss-room", { roomId });
    } catch (err) {
      alert("Error dismissing room");
    }
    navigate("/lobby");
  };

  const handleKickUser = (targetSocketId) => {
    if (!socket || !targetSocketId) return;
    socket.emit("kick-user", { roomId, targetSocketId });
  };

  if (!roomReady || !roomName) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "var(--bg)" }}>
        <div style={{ textAlign: "center", color: "var(--muted)" }}>
          <div style={{ fontSize: 18, marginBottom: 8 }}>Joining room...</div>
          <div style={{ fontSize: 13 }}>Room: {roomId}</div>
          <button
            style={{ marginTop: 16, fontSize: 13, color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}
            onClick={() => navigate("/lobby")}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar />
      <div className="chat-layout">
        <ChatRoom
          roomId={roomId}
          isAdmin={isAdmin}
          participants={participants}
          onLeave={handleLeave}
          onDismiss={handleDismiss}
          onParticipantsChange={setParticipants}
        />
        <RoomSidebar
          roomId={roomId}
          roomName={roomName}
          participants={participants}
          isAdmin={isAdmin}
          currentUserId={user?._id || user?.id}
          onDismiss={handleDismiss}
          onKick={handleKickUser}
        />
      </div>
    </div>
  );
};

export default ChatPage;
