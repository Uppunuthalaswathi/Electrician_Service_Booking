import { useEffect, useState } from "react";
import { CITY_OPTIONS, detectBrowserLocation } from "../utils/locationHelpers";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);

const getInitialForm = (basePrice = 0, priority = "normal") => ({
  date: priority === "emergency" ? new Date().toISOString().split("T")[0] : "",
  timeSlot: priority === "emergency" ? "ASAP" : "10 AM - 12 PM",
  address: "",
  problemDescription: "",
  price: basePrice,
  locationMode: "manual",
  area: "",
  city: "Hyderabad",
  pincode: "",
  lat: null,
  lng: null,
});

export default function BookingModal({ open, electrician, selectedCategory, priority, onClose, onConfirm, loading }) {
  const [form, setForm] = useState(getInitialForm(electrician?.price, priority));
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (open && electrician) {
      setForm(getInitialForm(electrician?.price, priority));
    }
  }, [open, electrician, priority]);

  if (!open || !electrician) return null;

  const useCurrentLocation = async () => {
    setLocating(true);
    try {
      const coordinates = await detectBrowserLocation();
      setForm((prev) => ({
        ...prev,
        locationMode: "auto",
        lat: coordinates.lat,
        lng: coordinates.lng,
      }));
    } catch {
      setForm((prev) => ({ ...prev, locationMode: "manual", lat: null, lng: null }));
    } finally {
      setLocating(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onConfirm({
      serviceId: electrician._id,
      serviceName: selectedCategory,
      date: form.date,
      timeSlot: form.timeSlot,
      address: form.address,
      problemDescription: form.problemDescription,
      price: form.price,
      priority,
      locationMode: form.locationMode,
      area: form.area,
      city: form.city,
      pincode: form.pincode,
      userLocation:
        typeof form.lat === "number" && typeof form.lng === "number"
          ? { lat: form.lat, lng: form.lng }
          : undefined,
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className="card-head">
          <div>
            <p className="eyebrow">{priority === "emergency" ? "Emergency Booking" : "Booking Confirmation"}</p>
            <h3>{electrician.name}</h3>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>x</button>
        </div>

        <div className="modal-summary">
          <p><strong>Service:</strong> {selectedCategory}</p>
          <p><strong>Estimated Price:</strong> {formatCurrency(form.price)}</p>
          <p><strong>Distance:</strong> {electrician.distanceKm} km</p>
          <p><strong>ETA:</strong> {electrician.etaMinutes || electrician.estimatedArrival || "25 mins"}</p>
          <p><strong>Area:</strong> {electrician.areaName || electrician?.locationMeta?.addressLabel || "Nearby"}</p>
        </div>

        <div className="booking-note">
          A service request will be created immediately after confirmation, and you can track it in Booking History.
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Preferred Date
            <input type="date" value={form.date} min={new Date().toISOString().split("T")[0]} onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))} required />
          </label>

          <label>
            Time Slot
            <select value={form.timeSlot} onChange={(event) => setForm((prev) => ({ ...prev, timeSlot: event.target.value }))} required>
              <option value="ASAP">ASAP</option>
              <option value="10 AM - 12 PM">10 AM - 12 PM</option>
              <option value="12 PM - 2 PM">12 PM - 2 PM</option>
              <option value="2 PM - 4 PM">2 PM - 4 PM</option>
              <option value="4 PM - 6 PM">4 PM - 6 PM</option>
            </select>
          </label>

          <label className="full-span">
            Address
            <textarea rows="3" value={form.address} onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))} required />
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
                Enter Area Manually
              </button>
            </div>
            <p className="muted">
              {form.locationMode === "auto" && typeof form.lat === "number"
                ? "Current location captured from browser."
                : "If GPS is not available, area/city/pincode will be used."}
            </p>
          </div>

          <label>
            Area
            <input value={form.area} onChange={(event) => setForm((prev) => ({ ...prev, area: event.target.value }))} placeholder="Madhapur" />
          </label>
          <label>
            City
            <select value={form.city} onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}>
              {CITY_OPTIONS.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </label>
          <label>
            Pincode
            <input value={form.pincode} onChange={(event) => setForm((prev) => ({ ...prev, pincode: event.target.value }))} placeholder="500081" />
          </label>

          <label className="full-span">
            Problem Description
            <textarea rows="4" value={form.problemDescription} onChange={(event) => setForm((prev) => ({ ...prev, problemDescription: event.target.value }))} placeholder="Describe the issue" />
          </label>

          <div className="modal-actions full-span">
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? "Confirming..." : priority === "emergency" ? "Confirm Emergency" : "Confirm Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

