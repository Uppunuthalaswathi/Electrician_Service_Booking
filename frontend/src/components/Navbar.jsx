import { NavLink, useNavigate } from "react-router-dom";

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

export default function Navbar({ title, subtitle }) {
  const navigate = useNavigate();
  const user = getStoredUser();
  const roles = Array.isArray(user?.roles) ? user.roles : [];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <header className="topbar shell">
      <div>
        <p className="eyebrow">Electrician Service Booking</p>
        <h1>{title}</h1>
        {subtitle ? <p className="muted">{subtitle}</p> : null}
      </div>
      <div className="topbar-actions">
        <nav className="nav-links">
          {roles.includes("user") && <NavLink to="/user" className={({ isActive }) => (isActive ? "nav-pill active" : "nav-pill")}>User Dashboard</NavLink>}
          {roles.includes("user") && <NavLink to="/electricians?mode=book" className={({ isActive }) => (isActive ? "nav-pill active" : "nav-pill")}>Book Electrician</NavLink>}
          {roles.includes("electrician") && <NavLink to="/electrician" className={({ isActive }) => (isActive ? "nav-pill active" : "nav-pill")}>Electrician Dashboard</NavLink>}
          {roles.includes("admin") && <NavLink to="/admin" className={({ isActive }) => (isActive ? "nav-pill active" : "nav-pill")}>Admin Dashboard</NavLink>}
        </nav>
        <div className="user-chip">
          <span>{user?.name || "Guest"}</span>
          <button type="button" className="ghost-btn" onClick={() => navigate("/change-password")}>Change Password</button>
          <button type="button" className="secondary-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </header>
  );
}
