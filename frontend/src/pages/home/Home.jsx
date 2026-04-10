import { Link } from "react-router-dom";

export default function Home() {
  return (
    <main className="landing-shell">
      <section className="landing-hero shell">
        <div className="landing-copy">
          <p className="eyebrow">Electrician Service Booking</p>
          <h1>Book trusted electricians in minutes for planned jobs and urgent repairs.</h1>
          <p className="muted intro-copy">
            Compare verified professionals by rating, price, and distance, confirm bookings,
            and track service history from one clean dashboard.
          </p>
          <div className="hero-actions">
            <Link to="/login" className="primary-btn hero-btn">Login as User</Link>
            <Link to="/login/electrician" className="secondary-btn hero-btn">Login as Electrician</Link>
            <Link to="/register" className="ghost-btn hero-btn">Register</Link>
          </div>
          <p className="muted admin-link-row">
            Admin access:
            {" "}
            <Link to="/admin-login" className="small-admin-link">Admin Login</Link>
          </p>
          <div className="hero-points">
            <span>Emergency auto-assignment</span>
            <span>Live sorting and service filtering</span>
            <span>Electrician work management</span>
          </div>
        </div>
        <div className="showcase-card">
          <div className="showcase-grid">
            <article className="showcase-metric warm"><strong>20-30 mins</strong><span>Fastest arrival</span></article>
            <article className="showcase-metric dark"><strong>4.8/5</strong><span>Average rating</span></article>
            <article className="showcase-panel">
              <p className="eyebrow">What you can do</p>
              <ul>
                <li>Search electricians by service</li>
                <li>Book normal or emergency visits</li>
                <li>Manage electrician availability and jobs</li>
                <li>Admin control for services and bookings</li>
              </ul>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
