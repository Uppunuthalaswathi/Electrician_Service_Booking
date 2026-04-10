const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);

export default function ElectricianCard({ electrician, selectedCategory, onBookNow }) {
  return (
    <article className="card electrician-card">
      <div className="card-head">
        <div>
          <p className="eyebrow">Verified Electrician</p>
          <h3>{electrician?.name}</h3>
        </div>
        <span className="badge">{electrician?.available ? "Available" : "Busy"}</span>
      </div>

      <p className="muted card-copy">{electrician?.description || "Trusted electrical support for homes and offices."}</p>

      <div className="stat-grid">
        <div className="stat-box"><span>Rating</span><strong>{electrician?.rating || 0} / 5</strong></div>
        <div className="stat-box"><span>Price</span><strong>{formatCurrency(electrician?.price)}</strong></div>
        <div className="stat-box"><span>Distance</span><strong>{electrician?.distanceKm || 0} km</strong></div>
        <div className="stat-box"><span>ETA</span><strong>{electrician?.etaMinutes ? `${electrician.etaMinutes} mins` : electrician?.estimatedArrival || "30 mins"}</strong></div>
        <div className="stat-box"><span>Area</span><strong>{electrician?.areaName || electrician?.locationMeta?.addressLabel || "Nearby"}</strong></div>
      </div>

      <div className="service-tags">
        <span className="tag active-tag">{selectedCategory}</span>
        {(electrician?.services || []).map((service) => (
          <span key={`${electrician?._id}-${service}`} className="tag">{service}</span>
        ))}
      </div>

      <button type="button" className="primary-btn full-width" onClick={() => onBookNow(electrician)}>
        Book Now
      </button>
    </article>
  );
}
