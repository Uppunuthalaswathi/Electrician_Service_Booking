import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { resetPassword } from "../../api/authApi";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const { data } = await resetPassword(token, form);
      setMessage(data.message || "Password updated successfully");
      setTimeout(() => navigate("/login", { replace: true }), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to reset password right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-layout shell">
      <section className="auth-hero auth-accent-card">
        <p className="eyebrow">New Password</p>
        <h1>Create a secure replacement password.</h1>
        <p className="muted">This reset link is time-limited. Choose a password with at least 8 characters.</p>
      </section>

      <section className="auth-card">
        <p className="eyebrow">Reset Password</p>
        <h2>Choose New Password</h2>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            New Password
            <input type="password" name="password" value={form.password} onChange={handleChange} minLength="8" required />
          </label>
          <label>
            Confirm Password
            <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} minLength="8" required />
          </label>
          {message ? <p className="success-text">{message}</p> : null}
          {error ? <p className="error-text">{error}</p> : null}
          <button type="submit" className="primary-btn full-width" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
        <p className="muted auth-switch">Back to <Link to="/login">login</Link></p>
      </section>
    </main>
  );
}
