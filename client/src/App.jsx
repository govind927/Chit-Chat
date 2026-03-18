import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import LobbyPage from "./pages/LobbyPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import NotificationToast from "./components/NotificationToast.jsx";
import { useNavigate } from "react-router-dom";

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <Navigate to="/lobby" replace /> : children;
};

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

const ToastWrapper = () => {
  const navigate = useNavigate();
  return <NotificationToast onClickRoom={(roomId) => navigate(`/chat/${roomId}`)} />;
};

const App = () => {
  return (
    <BrowserRouter>
      <ToastWrapper />
      <Routes>
        <Route path="/" element={<Navigate to="/lobby" replace />} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/lobby" element={<PrivateRoute><LobbyPage /></PrivateRoute>} />
        <Route path="/chat/:roomId" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/lobby" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
