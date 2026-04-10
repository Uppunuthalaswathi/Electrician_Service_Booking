import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../api/authApi";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [previewLink, setPreviewLink] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    setPreviewLink("");

    try {
      const { data } = await forgotPassword({ email });
      setMessage(data.previewMessage || data.message || "Reset link sent");
      setPreviewLink(data.resetLink || "");
      setEmail("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send reset link right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-layout shell">
      <section className="auth-hero auth-accent-card">
        <p className="eyebrow">Secure Recovery</p>
        <h1>Reset your password by email.</h1>
        <p className="muted">Enter your registered email address and we will send you a time-limited reset link.</p>
      </section>

      <section className="auth-card">
        <p className="eyebrow">Forgot Password</p>
        <h2>Send Reset Link</h2>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          {message ? <p className="success-text">{message}</p> : null}
          {previewLink ? (
            <div className="success-text">
              <p>Local reset link:</p>
              <a href={previewLink} className="text-link">{previewLink}</a>
            </div>
          ) : null}
          {error ? <p className="error-text">{error}</p> : null}
          <button type="submit" className="primary-btn full-width" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
        <p className="muted auth-switch">Remembered it? <Link to="/login">Back to login</Link></p>
      </section>
    </main>
  );
}
