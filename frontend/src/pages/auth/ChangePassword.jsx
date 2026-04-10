import { useState } from "react";
import { Link } from "react-router-dom";
import { changePassword } from "../../api/authApi";

export default function ChangePassword() {
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
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
      const { data } = await changePassword(form);
      setMessage(data.message || "Password updated successfully");
      setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to change password right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-layout shell">
      <section className="auth-hero auth-accent-card">
        <p className="eyebrow">Account Security</p>
        <h1>Update your password anytime.</h1>
        <p className="muted">Confirm your current password first, then save a stronger password for future logins.</p>
      </section>

      <section className="auth-card">
        <p className="eyebrow">Change Password</p>
        <h2>Protect Your Account</h2>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Old Password
            <input type="password" name="oldPassword" value={form.oldPassword} onChange={handleChange} required />
          </label>
          <label>
            New Password
            <input type="password" name="newPassword" value={form.newPassword} onChange={handleChange} minLength="8" required />
          </label>
          <label>
            Confirm Password
            <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} minLength="8" required />
          </label>
          {message ? <p className="success-text">{message}</p> : null}
          {error ? <p className="error-text">{error}</p> : null}
          <button type="submit" className="primary-btn full-width" disabled={loading}>
            {loading ? "Saving..." : "Update Password"}
          </button>
        </form>
        <p className="muted auth-switch"><Link to="/login">Return to login</Link> if you signed out.</p>
      </section>
    </main>
  );
}
