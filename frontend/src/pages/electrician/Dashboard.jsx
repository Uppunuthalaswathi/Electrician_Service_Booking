import { useEffect, useMemo, useState } from "react";
import {
  acceptBooking,
  getElectricianBookings,
  rejectBooking,
  updateBookingStatus,
  updateLiveLocation,
} from "../../api/bookingApi";
import { sendMessage } from "../../api/messagesApi";
import {
  createElectricianProfile,
  getMyElectricianProfile,
  updateMyElectricianProfile,
} from "../../api/servicesApi";
import Navbar from "../../components/Navbar";
import { CITY_OPTIONS, detectBrowserLocation, getReadableArea } from "../../utils/locationHelpers";

const emptyProfile = {
  name: "",
  description: "",
  price: 450,
  services: "",
  available: true,
  phone: "",
  area: "",
  city: "Hyderabad",
  pincode: "",
  lat: null,
  lng: null,
  locationMode: "manual",
};

export default function ElectricianDashboard() {
  const [profileForm, setProfileForm] = useState(emptyProfile);
  const [bookings, setBookings] = useState([]);
  const [draftMessages, setDraftMessages] = useState({});
  const [locationDrafts, setLocationDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [hasProfile, setHasProfile] = useState(false);

  const stats = useMemo(
    () => ({
      assigned: bookings.filter((booking) => ["pending", "assigned"].includes(booking.status)).length,
      live: bookings.filter((booking) => ["accepted", "on_the_way", "arrived"].includes(booking.status)).length,
      completed: bookings.filter((booking) => booking.status === "completed").length,
    }),
    [bookings]
  );

  const loadDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const [profileResponse, bookingsResponse] = await Promise.all([
        getMyElectricianProfile(),
        getElectricianBookings(),
      ]);

      const profile = profileResponse.data?.service;
      if (profile) {
        setHasProfile(true);
        setProfileForm({
          name: profile.name || "",
          description: profile.description || "",
          price: profile.price || 450,
          services: (profile.services || []).join(", "),
          available: profile.available !== false,
          phone: profile.phone || "",
          area: profile.locationMeta?.area || "",
          city: profile.locationMeta?.city || "Hyderabad",
          pincode: profile.locationMeta?.pincode || "",
          lat: profile.location?.lat || null,
          lng: profile.location?.lng || null,
          locationMode: profile.locationMeta?.source || "manual",
        });
      }

      const nextBookings = bookingsResponse.data?.bookings || [];
      setBookings(nextBookings);
      setLocationDrafts(
        Object.fromEntries(
          nextBookings.map((booking) => [
            booking._id,
            {
              area: booking?.electricianLocationMeta?.area || "",
              city: booking?.electricianLocationMeta?.city || "Hyderabad",
              pincode: booking?.electricianLocationMeta?.pincode || "",
              lat: null,
              lng: null,
              locationMode: "manual",
            },
          ])
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load electrician dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleProfileChange = (event) => {
    const { name, value, type, checked } = event.target;
    setProfileForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const useCurrentProfileLocation = async () => {
    setError("");
    try {
      const coordinates = await detectBrowserLocation();
      setProfileForm((prev) => ({
        ...prev,
        lat: coordinates.lat,
        lng: coordinates.lng,
        locationMode: "auto",
      }));
      setFeedback("Current location captured for profile.");
    } catch {
      setError("Could not access browser location. You can continue with area/city/pincode.");
    }
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFeedback("");
    setError("");

    const payload = {
      name: profileForm.name,
      description: profileForm.description,
      price: Number(profileForm.price),
      available: profileForm.available,
      phone: profileForm.phone,
      services: profileForm.services.split(",").map((item) => item.trim()).filter(Boolean),
      locationMode: profileForm.locationMode,
      area: profileForm.area,
      city: profileForm.city,
      pincode: profileForm.pincode,
      location:
        typeof profileForm.lat === "number" && typeof profileForm.lng === "number"
          ? { lat: Number(profileForm.lat), lng: Number(profileForm.lng) }
          : undefined,
    };

    try {
      if (hasProfile) {
        await updateMyElectricianProfile(payload);
      } else {
        await createElectricianProfile(payload);
        setHasProfile(true);
      }
      setFeedback("Service profile saved successfully.");
      await loadDashboard();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save service profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleBookingAction = async (bookingId, action) => {
    setFeedback("");
    setError("");
    try {
      if (action === "accept") await acceptBooking(bookingId);
      if (action === "reject") await rejectBooking(bookingId, "Electrician rejected this request.");
      if (action === "on_the_way") await updateBookingStatus(bookingId, "on_the_way");
      if (action === "arrived") await updateBookingStatus(bookingId, "arrived");
      if (action === "completed") await updateBookingStatus(bookingId, "completed");
      await loadDashboard();
    } catch (err) {
      setError(err.response?.data?.message || `Unable to ${action} booking.`);
    }
  };

  const handleLocationDraftChange = (bookingId, field, value) => {
    setLocationDrafts((prev) => ({
      ...prev,
      [bookingId]: {
        ...(prev[bookingId] || {}),
        [field]: value,
      },
    }));
  };

  const captureLiveLocation = async (bookingId) => {
    setError("");
    try {
      const coordinates = await detectBrowserLocation();
      setLocationDrafts((prev) => ({
        ...prev,
        [bookingId]: {
          ...(prev[bookingId] || {}),
          lat: coordinates.lat,
          lng: coordinates.lng,
          locationMode: "auto",
        },
      }));
      setFeedback("Live location detected. Click update to send.");
    } catch {
      setError("Unable to detect live location. Enter area/city/pincode and update.");
    }
  };

  const handleLocationUpdate = async (bookingId) => {
    try {
      const draft = locationDrafts[bookingId] || {};
      await updateLiveLocation(bookingId, {
        locationMode: draft.locationMode || "manual",
        lat: draft.lat,
        lng: draft.lng,
        area: draft.area,
        city: draft.city,
        pincode: draft.pincode,
      });
      setFeedback("Live location updated.");
      await loadDashboard();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update live location.");
    }
  };

  const handleSendMessage = async (bookingId) => {
    try {
      const draft = draftMessages[bookingId];
      if (!draft?.trim()) return;
      await sendMessage(bookingId, draft);
      setDraftMessages((prev) => ({ ...prev, [bookingId]: "" }));
      setFeedback("Message sent to customer.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send message.");
    }
  };

  return (
    <div className="page-shell">
      <Navbar title="Electrician Dashboard" subtitle="Manage availability, assigned work, live location, and service progress like a production dispatch console." />
      <main className="shell dashboard-grid">
        {feedback ? <p className="success-text">{feedback}</p> : null}
        {error ? <p className="error-text">{error}</p> : null}

        <section className="content-grid two-column">
          <div className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">My Service Profile</p>
                <h2>Pricing, availability, and location</h2>
              </div>
            </div>

            <form className="form-grid" onSubmit={handleProfileSubmit}>
              <label>
                Display Name
                <input type="text" name="name" value={profileForm.name} onChange={handleProfileChange} required />
              </label>
              <label>
                Phone
                <input type="text" name="phone" value={profileForm.phone} onChange={handleProfileChange} required />
              </label>
              <label className="full-span">
                Services
                <input type="text" name="services" value={profileForm.services} onChange={handleProfileChange} placeholder="Fan Repair, Wiring, Switch Repair" required />
              </label>
              <label>
                Starting Price
                <input type="number" name="price" value={profileForm.price} onChange={handleProfileChange} min="0" required />
              </label>
              <label className="checkbox-row">
                <input type="checkbox" name="available" checked={profileForm.available} onChange={handleProfileChange} />
                Online and ready to accept bookings
              </label>

              <div className="full-span">
                <p className="eyebrow">Location</p>
                <div className="action-row">
                  <button type="button" className="secondary-btn" onClick={useCurrentProfileLocation}>Use Current Location</button>
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => setProfileForm((prev) => ({ ...prev, locationMode: "manual", lat: null, lng: null }))}
                  >
                    Use Area/City
                  </button>
                </div>
                <p className="muted">
                  {profileForm.locationMode === "auto" && typeof profileForm.lat === "number"
                    ? "GPS location is ready for your profile."
                    : "Manual area/city/pincode will be geocoded automatically."}
                </p>
              </div>

              <label>
                Area
                <input type="text" name="area" value={profileForm.area} onChange={handleProfileChange} placeholder="Madhapur" />
              </label>
              <label>
                City
                <select name="city" value={profileForm.city} onChange={handleProfileChange}>
                  {CITY_OPTIONS.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </label>
              <label>
                Pincode
                <input type="text" name="pincode" value={profileForm.pincode} onChange={handleProfileChange} placeholder="500081" />
              </label>

              <label className="full-span">
                Description
                <textarea rows="4" name="description" value={profileForm.description} onChange={handleProfileChange} />
              </label>
              <button type="submit" className="primary-btn" disabled={saving || loading}>{saving ? "Saving..." : hasProfile ? "Update Profile" : "Create Profile"}</button>
            </form>
          </div>

          <div className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Dispatch Stats</p>
                <h2>Current operations</h2>
              </div>
            </div>
            <div className="stats-row">
              <div className="stat-panel card"><span>Incoming</span><strong>{stats.assigned}</strong></div>
              <div className="stat-panel card"><span>Live Jobs</span><strong>{stats.live}</strong></div>
              <div className="stat-panel card"><span>Completed</span><strong>{stats.completed}</strong></div>
            </div>
            <div className="history-item">
              <strong>Live tracking mode</strong>
              <p className="muted">Use auto-detect for quick updates. If unavailable, area/city/pincode will be used as fallback.</p>
              <div className="action-row dashboard-cta-row">
                <button type="button" className="secondary-btn" onClick={() => window.location.assign("/change-password")}>
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Assigned Work</p>
              <h2>Requests, travel, arrival, and completion</h2>
            </div>
          </div>

          {loading ? (
            <div className="spinner-wrap"><div className="spinner" /><p className="muted">Loading bookings...</p></div>
          ) : bookings.length > 0 ? (
            <div className="cards-grid">
              {bookings.map((booking) => (
                <article key={booking._id} className="card">
                  <div className="card-head">
                    <div>
                      <p className="eyebrow">{booking.serviceName}</p>
                      <h3>{booking?.user?.name || "Customer"}</h3>
                    </div>
                    <span className={`status ${booking.status}`}>{booking.status.replaceAll("_", " ")}</span>
                  </div>

                  <p className="muted">{booking.address}</p>
                  <p className="muted">Area: {booking?.userLocationMeta?.addressLabel || getReadableArea(booking?.userLocationMeta) || "Not shared"}</p>
                  <p className="muted">
                    ETA {booking.estimatedArrivalMinutes ? `${booking.estimatedArrivalMinutes} mins` : booking.estimatedArrival} • Distance {booking.distanceKm} km
                  </p>

                  <div className="action-row">
                    <button type="button" className="primary-btn" onClick={() => handleBookingAction(booking._id, "accept")} disabled={!['pending', 'assigned'].includes(booking.status)}>Accept</button>
                    <button type="button" className="secondary-btn" onClick={() => handleBookingAction(booking._id, "reject")} disabled={['rejected', 'completed', 'cancelled'].includes(booking.status)}>Reject</button>
                    <button type="button" className="ghost-btn" onClick={() => handleBookingAction(booking._id, "on_the_way")} disabled={!['accepted'].includes(booking.status)}>On the Way</button>
                    <button type="button" className="ghost-btn" onClick={() => handleBookingAction(booking._id, "arrived")} disabled={!['on_the_way'].includes(booking.status)}>Arrived</button>
                    <button type="button" className="ghost-btn" onClick={() => handleBookingAction(booking._id, "completed")} disabled={!['arrived'].includes(booking.status)}>Completed</button>
                  </div>

                  <div className="action-row">
                    <button type="button" className="secondary-btn" onClick={() => captureLiveLocation(booking._id)}>
                      Use Current Location
                    </button>
                    <button type="button" className="ghost-btn" onClick={() => handleLocationUpdate(booking._id)}>
                      Update Live Location
                    </button>
                  </div>

                  <div className="two-inputs">
                    <label>
                      Area
                      <input
                        value={locationDrafts[booking._id]?.area ?? ""}
                        onChange={(event) => handleLocationDraftChange(booking._id, "area", event.target.value)}
                      />
                    </label>
                    <label>
                      City
                      <select
                        value={locationDrafts[booking._id]?.city ?? "Hyderabad"}
                        onChange={(event) => handleLocationDraftChange(booking._id, "city", event.target.value)}
                      >
                        {CITY_OPTIONS.map((city) => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label>
                    Pincode
                    <input
                      value={locationDrafts[booking._id]?.pincode ?? ""}
                      onChange={(event) => handleLocationDraftChange(booking._id, "pincode", event.target.value)}
                    />
                  </label>

                  <div className="form-grid">
                    <label>
                      Quick Message
                      <textarea
                        rows="3"
                        value={draftMessages[booking._id] || ""}
                        onChange={(event) => setDraftMessages((prev) => ({ ...prev, [booking._id]: event.target.value }))}
                        placeholder="I will arrive in 15 minutes"
                      />
                    </label>
                    <button type="button" className="primary-btn" onClick={() => handleSendMessage(booking._id)}>
                      Send Message
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>No assigned work yet</h3>
              <p className="muted">New requests will appear here once users start booking your services.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

