// LoginPage.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthForm from "../components/AuthForm.jsx";
import axiosClient from "../api/axiosClient.js";
import { useAuth } from "../context/AuthContext.jsx";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values) => {
    setError("");
    setLoading(true);
    try {
      const res = await axiosClient.post("/auth/login", values);
      login(res.data.user, res.data.token);
      navigate("/lobby");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ justifyContent: "center", alignItems: "center" }}>
      <AuthForm mode="login" onSubmit={handleLogin} loading={loading} error={error} />
      <div style={{ marginTop: 16, fontSize: 13, color: "var(--muted)" }}>
        New here?{" "}
        <Link to="/register" style={{ color: "var(--accent)" }}>Create account</Link>
      </div>
    </div>
  );
};

export default LoginPage;
