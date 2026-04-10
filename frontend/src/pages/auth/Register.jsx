import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../api/authApi";
import { CITY_OPTIONS, detectBrowserLocation } from "../../utils/locationHelpers";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "user",
    locationMode: "manual",
    area: "",
    city: "Hyderabad",
    pincode: "",
    lat: null,
    lng: null,
  });
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const useCurrentLocation = async () => {
    setLocating(true);
    setError("");
    try {
      const coordinates = await detectBrowserLocation();
      setForm((prev) => ({
        ...prev,
        locationMode: "auto",
        lat: coordinates.lat,
        lng: coordinates.lng,
      }));
    } catch {
      setError("Unable to fetch current location. You can continue with area/city instead.");
    } finally {
      setLocating(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        role: form.role,
        locationMode: form.locationMode,
        area: form.area,
        city: form.city,
        pincode: form.pincode,
        location:
          typeof form.lat === "number" && typeof form.lng === "number"
            ? { lat: form.lat, lng: form.lng }
            : undefined,
      };

      const { data } = await registerUser(payload);
      setSuccess(data?.message || "Registration successful");
      setTimeout(() => navigate(`/login/${form.role}`), 900);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-layout shell">
      <section className="auth-hero">
        <p className="eyebrow">Create Account</p>
        <h1>Join as a customer or electrician and start using the platform immediately.</h1>
        <p className="muted">You can auto-detect location or select your area and city manually.</p>
      </section>

      <section className="auth-card">
        <h2>Register</h2>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Full Name
            <input type="text" name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label>
            Email
            <input type="email" name="email" value={form.email} onChange={handleChange} required />
          </label>
          <label>
            Phone
            <input type="text" name="phone" value={form.phone} onChange={handleChange} required />
          </label>
          <label>
            Password
            <input type="password" name="password" value={form.password} onChange={handleChange} required />
          </label>
          <label>
            Role
            <select name="role" value={form.role} onChange={handleChange}>
              <option value="user">User</option>
              <option value="electrician">Electrician</option>
            </select>
          </label>

          <div className="full-span">
            <p className="eyebrow">Location</p>
            <div className="action-row">
              <button type="button" className="secondary-btn" onClick={useCurrentLocation} disabled={locating}>
                {locating ? "Detecting..." : "Use Current Location"}
              </button>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setForm((prev) => ({ ...prev, locationMode: "manual", lat: null, lng: null }))}
              >
                Select Area Manually
              </button>
            </div>
            <p className="muted">
              {form.locationMode === "auto" && typeof form.lat === "number"
                ? "Location detected from browser."
                : "Choose area/city if GPS is unavailable."}
            </p>
          </div>

          <label>
            Area
            <input type="text" name="area" value={form.area} onChange={handleChange} placeholder="Madhapur" />
          </label>
          <label>
            City
            <select name="city" value={form.city} onChange={handleChange}>
              {CITY_OPTIONS.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </label>
          <label>
            Pincode
            <input type="text" name="pincode" value={form.pincode} onChange={handleChange} placeholder="500081" />
          </label>

          {error ? <p className="error-text">{error}</p> : null}
          {success ? <p className="success-text">{success}</p> : null}
          <button type="submit" className="primary-btn full-width" disabled={loading}>
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>
        <p className="muted auth-switch">Already have an account? <Link to="/">Go home</Link></p>
      </section>
    </main>
  );
}

