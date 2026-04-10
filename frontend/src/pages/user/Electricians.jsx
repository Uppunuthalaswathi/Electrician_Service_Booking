import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createBooking } from "../../api/bookingApi";
import { getElectriciansByService } from "../../api/servicesApi";
import BookingModal from "../../components/BookingModal";
import ElectricianCard from "../../components/ElectricianCard";
import Navbar from "../../components/Navbar";

const SERVICE_CATEGORIES = [
  "Fan Repair",
  "Wiring",
  "Switch Repair",
  "Light Installation",
  "Full House Check",
  "Doorbell Repair",
];

const SORT_OPTIONS = [
  { value: "distance", label: "Nearest first" },
  { value: "rating", label: "Highest rating" },
  { value: "price", label: "Lowest price" },
];

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

export default function ElectriciansPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = getStoredUser();
  const serviceName = searchParams.get("service") || "";
  const mode = searchParams.get("mode") || (serviceName ? "service" : "browse");
  const [electricians, setElectricians] = useState([]);
  const [sortBy, setSortBy] = useState("distance");
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedElectrician, setSelectedElectrician] = useState(null);
  const [bookingPriority, setBookingPriority] = useState("normal");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadElectricians = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await getElectriciansByService({
          service: serviceName || undefined,
          sortBy,
          lat: user?.location?.lat,
          lng: user?.location?.lng,
          area: user?.locationMeta?.area,
          city: user?.locationMeta?.city,
          pincode: user?.locationMeta?.pincode,
        });
        setElectricians(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load electricians.");
      } finally {
        setLoading(false);
      }
    };

    loadElectricians();
  }, [
    serviceName,
    sortBy,
    user?.location?.lat,
    user?.location?.lng,
    user?.locationMeta?.area,
    user?.locationMeta?.city,
    user?.locationMeta?.pincode,
  ]);

  const nearestElectrician = useMemo(() => electricians[0] || null, [electricians]);

  const handleBookingConfirm = async (payload) => {
    setBookingLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await createBooking(payload);
      setMessage(response.data?.message || "Booking created successfully.");
      setSelectedElectrician(null);
      setBookingPriority("normal");
      if (response.data?.booking?._id) {
        navigate(`/bookings/${response.data.booking._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Booking failed.");
    } finally {
      setBookingLoading(false);
    }
  };

  const openNormalBooking = (electrician) => {
    setBookingPriority("normal");
    setSelectedElectrician({
      ...electrician,
      selectedServiceName: serviceName || electrician?.services?.[0] || "General Electrical Service",
    });
  };

  const openEmergencyBooking = () => {
    if (!nearestElectrician) {
      setError("No electrician is available for emergency booking right now.");
      return;
    }
    setBookingPriority("emergency");
    setSelectedElectrician({
      ...nearestElectrician,
      selectedServiceName: serviceName || nearestElectrician?.services?.[0] || "Emergency Service",
    });
  };

  return (
    <div className="page-shell">
      <Navbar
        title={mode === "browse" ? "Explore Electrical Services" : "Electrician Listing"}
        subtitle={
          mode === "browse"
            ? "Browse all available electricians, then narrow down by service, rating, price, and distance."
            : "Live backend results filtered by service, rating, price, and distance."
        }
      />
      <main className="shell dashboard-grid">
        <section className="panel listing-toolbar">
          <div>
            <p className="eyebrow">{mode === "browse" ? "Browse Mode" : "Selected Service"}</p>
            <h2>{serviceName || "All Services"}</h2>
            <p className="muted">
              {mode === "browse"
                ? "Explore every available service category and pick the electrician who best matches your need."
                : "Choose a professional manually or trigger emergency assignment for the nearest available electrician."}
            </p>
          </div>
          <div className="toolbar-actions">
            <button type="button" className="secondary-btn" onClick={() => navigate("/user")}>Back</button>
            <button type="button" className="danger-btn" onClick={openEmergencyBooking}>Emergency Booking</button>
          </div>
        </section>

        <section className="panel service-browser-panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Service Categories</p>
              <h2>{mode === "browse" ? "Explore all services" : "Switch service quickly"}</h2>
            </div>
          </div>

          <div className="category-strip">
            <button
              type="button"
              className={`category-btn ${!serviceName ? "active" : ""}`}
              onClick={() => navigate("/electricians?mode=browse")}
            >
              All Services
            </button>
            {SERVICE_CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                className={`category-btn ${serviceName === category ? "active" : ""}`}
                onClick={() => navigate(`/electricians?service=${encodeURIComponent(category)}`)}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        {message ? <p className="success-text">{message}</p> : null}
        {error ? <p className="error-text">{error}</p> : null}

        <section className="panel">
          <div className="section-head filter-bar">
            <div>
              <p className="eyebrow">Available Electricians</p>
              <h2>{electricians.length} result(s)</h2>
            </div>
            <label className="filter-control">
              Sort By
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>

          {loading ? (
            <div className="spinner-wrap tall-state"><div className="spinner" /><p className="muted">Fetching electricians...</p></div>
          ) : electricians.length > 0 ? (
            <div className="cards-grid">
              {electricians.map((electrician) => (
                <ElectricianCard key={electrician._id} electrician={electrician} selectedCategory={serviceName} onBookNow={openNormalBooking} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>No electricians found</h3>
              <p className="muted">Try another service category or update the sample electrician data.</p>
            </div>
          )}
        </section>
      </main>

      <BookingModal open={Boolean(selectedElectrician)} electrician={selectedElectrician} selectedCategory={selectedElectrician?.selectedServiceName || serviceName} priority={bookingPriority} onClose={() => setSelectedElectrician(null)} onConfirm={handleBookingConfirm} loading={bookingLoading} />
    </div>
  );
}
