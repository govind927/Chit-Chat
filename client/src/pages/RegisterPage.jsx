import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthForm from "../components/AuthForm.jsx";
import axiosClient from "../api/axiosClient.js";
import { useAuth } from "../context/AuthContext.jsx";

const RegisterPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (values) => {
    setError("");
    setLoading(true);
    try {
      const res = await axiosClient.post("/auth/register", values);
      login(res.data.user, res.data.token);
      navigate("/lobby");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ justifyContent: "center", alignItems: "center" }}>
      <AuthForm mode="register" onSubmit={handleRegister} loading={loading} error={error} />
      <div style={{ marginTop: 16, fontSize: 13, color: "var(--muted)" }}>
        Already have an account?{" "}
        <Link to="/login" style={{ color: "var(--accent)" }}>Sign in</Link>
      </div>
    </div>
  );
};

export default RegisterPage;
