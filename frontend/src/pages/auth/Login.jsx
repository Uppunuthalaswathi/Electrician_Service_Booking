import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { loginUser } from "../../api/authApi";

const roleContent = {
  user: {
    title: "User Login",
    helper: "Sign in to compare electricians, book services, and track booking history.",
  },
  electrician: {
    title: "Electrician Login",
    helper: "Sign in to manage services, update availability, and respond to bookings.",
  },
  admin: {
    title: "Admin Login",
    helper: "Sign in to monitor all users, services, and bookings across the platform.",
  },
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useParams();
  const activeRole = location.pathname === "/admin-login" ? "admin" : role === "electrician" || role === "admin" ? role : "user";
  const content = useMemo(() => roleContent[activeRole], [activeRole]);
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getLoginErrorMessage = (err) => {
    const serverMessage = err.response?.data?.message;
    if (serverMessage) return serverMessage;

    const rawMessage = String(err.message || "");
    if (
      err.code === "ERR_NETWORK" ||
      /SSL|tls|Network Error|ECONNREFUSED|Failed to fetch/i.test(rawMessage)
    ) {
      return "Unable to reach the server. If the backend uses MongoDB Atlas, allow this system IP in Atlas Network Access and restart the backend.";
    }

    return "Login failed. Please try again.";
  };

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data } = await loginUser({ ...form, role: activeRole });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate(
        activeRole === "electrician" ? "/electrician" : activeRole === "admin" ? "/admin" : "/user",
        { replace: true }
      );
    } catch (err) {
      setError(getLoginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-layout shell">
      <section className="auth-hero auth-accent-card">
        <p className="eyebrow">Role-Based Access</p>
        <h1>{content.title}</h1>
        <p className="muted">{content.helper}</p>
        {activeRole !== "admin" ? (
          <div className="hero-points">
            <Link to="/login" className="nav-pill">User Login</Link>
            <Link to="/login/electrician" className="nav-pill">Electrician Login</Link>
          </div>
        ) : null}
        {activeRole === "electrician" ? (
          <div className="sample-box">
            <strong>Sample electrician accounts</strong>
            <span>`arjun.electrician@example.com` / `Electric123!`</span>
            <span>`meera.electrician@example.com` / `Electric123!`</span>
          </div>
        ) : activeRole === "admin" ? (
          <div className="sample-box">
            <strong>Admin demo account</strong>
            <span>`admin@example.com` / `Admin123!`</span>
          </div>
        ) : null}
      </section>

      <section className="auth-card">
        <p className="eyebrow">Welcome Back</p>
        <h2>{content.title}</h2>
        {activeRole === "admin" ? (
          <p className="muted">
            This demo admin account is pre-created by the backend seed data, so admin does not register from the website.
          </p>
        ) : null}
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Email
            <input type="email" name="email" value={form.email} onChange={handleChange} required />
          </label>
          <label>
            Password
            <input type="password" name="password" value={form.password} onChange={handleChange} required />
          </label>
          <div className="inline-link-row">
            <Link to="/forgot-password" className="text-link">Forgot Password?</Link>
          </div>
          {error ? <p className="error-text">{error}</p> : null}
          <button type="submit" className="primary-btn full-width" disabled={loading}>
            {loading ? "Signing in..." : `Login as ${activeRole}`}
          </button>
        </form>
        <p className="muted auth-switch">Need an account? <Link to="/register">Register</Link></p>
      </section>
    </main>
  );
}
