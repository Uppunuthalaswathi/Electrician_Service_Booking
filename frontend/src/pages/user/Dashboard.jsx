import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyBookings, getTrackableBookings } from "../../api/bookingApi";
import Navbar from "../../components/Navbar";

const SERVICE_CATEGORIES = [
  "Fan Repair",
  "Wiring",
  "Switch Repair",
  "Light Installation",
  "Full House Check",
  "Doorbell Repair",
];

export default function UserDashboard() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const [historyResponse, trackResponse] = await Promise.all([
          getMyBookings(),
          getTrackableBookings(),
        ]);
        setBookings(historyResponse.data?.bookings || []);
        setActiveBookings(trackResponse.data?.bookings || []);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load booking history.");
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, []);

  return (
    <div className="page-shell">
      <Navbar title="User Dashboard" subtitle="Select a service, compare electricians, and confirm your booking." />
      <main className="shell dashboard-grid">
        <section className="panel split-hero">
          <div>
            <p className="eyebrow">Choose Your Service</p>
            <h2>Find the right electrician for the exact job.</h2>
            <p className="muted">Each category opens a live list of electricians from the backend with sorting and emergency support.</p>
            <div className="toolbar-actions dashboard-cta-row">
              <button type="button" className="primary-btn" onClick={() => navigate("/electricians?mode=book")}>
                Book Electrician
              </button>
              <button type="button" className="secondary-btn" onClick={() => navigate("/change-password")}>
                Change Password
              </button>
              <button type="button" className="ghost-btn" onClick={() => navigate("/electricians?mode=browse")}>
                Explore All Services
              </button>
            </div>
          </div>
          <div className="category-strip">
            {SERVICE_CATEGORIES.map((category) => (
              <button key={category} type="button" className="category-btn" onClick={() => navigate(`/electricians?service=${encodeURIComponent(category)}`)}>
                {category}
              </button>
            ))}
          </div>
        </section>

        {error ? <p className="error-text">{error}</p> : null}

        {activeBookings.length > 0 ? (
          <section className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Live Requests</p>
                <h2>Track your ongoing services</h2>
              </div>
            </div>

            <div className="cards-grid">
              {activeBookings.map((booking) => (
                <article key={booking._id} className="card">
                  <div className="card-head">
                    <div>
                      <p className="eyebrow">Active Booking</p>
                      <h3>{booking.serviceName}</h3>
                    </div>
                    <span className={`status ${booking.status}`}>{booking.status.replaceAll("_", " ")}</span>
                  </div>
                  <p className="muted">{booking?.electricianProfile?.name || "Assigned electrician"}</p>
                  <p className="muted">ETA: {booking.estimatedArrival}</p>
                  <button type="button" className="primary-btn full-width" onClick={() => navigate(`/bookings/${booking._id}`)}>
                    Track Live
                  </button>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="content-grid">
          <div className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Booking Flow</p>
                <h2>How the platform works</h2>
              </div>
            </div>
            <div className="steps-grid">
              <article className="step-card"><strong>1. Select service</strong><p className="muted">Pick the electrical task you need help with.</p></article>
              <article className="step-card"><strong>2. Compare electricians</strong><p className="muted">Sort by price, rating, or distance.</p></article>
              <article className="step-card"><strong>3. Confirm booking</strong><p className="muted">Choose your date, time slot, and address.</p></article>
              <article className="step-card"><strong>4. Track history</strong><p className="muted">Review accepted, completed, and rejected bookings anytime.</p></article>
            </div>
          </div>

          <aside className="panel history-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Booking History</p>
                <h2>Recent requests</h2>
              </div>
            </div>

            {loading ? (
              <div className="spinner-wrap"><div className="spinner" /><p className="muted">Loading history...</p></div>
            ) : bookings.length > 0 ? (
              <div className="history-list">
                {bookings.map((booking) => (
                  <article key={booking._id} className="history-item">
                    <div className="history-row">
                      <strong>{booking.serviceName}</strong>
                      <span className={`status ${booking.status}`}>{booking.status}</span>
                    </div>
                    <p className="muted">Electrician: {booking?.electricianProfile?.name || "Auto assigned"}</p>
                    <p className="muted">{new Date(booking.date).toLocaleDateString("en-IN")} • {booking.timeSlot}</p>
                    <p className="muted">{booking.address}</p>
                    <div className="action-row">
                      <button type="button" className="secondary-btn" onClick={() => navigate(`/bookings/${booking._id}`)}>
                        Open Details
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <h3>No bookings yet</h3>
                <p className="muted">Your confirmed and completed bookings will appear here.</p>
              </div>
            )}
          </aside>
        </section>
      </main>
    </div>
  );
}
