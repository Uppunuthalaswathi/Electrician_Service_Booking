import { useEffect, useMemo, useState } from "react";
import { getAllUsers, toggleUserBlock } from "../../api/authApi";
import { getAllBookings } from "../../api/bookingApi";
import {
  createAdminService,
  deleteServiceByAdmin,
  getAllServices,
} from "../../api/servicesApi";
import Navbar from "../../components/Navbar";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    services: "",
    price: 450,
    rating: 4.6,
    experience: 3,
    phone: "",
    lat: 17.4435,
    lng: 78.3772,
  });

  useEffect(() => {
    loadAdminData();
  }, []);

  const stats = useMemo(
    () => ({
      totalUsers: users.length,
      totalBookings: bookings.length,
      totalServices: services.length,
      electricians: users.filter((user) => Array.isArray(user.roles) && user.roles.includes("electrician")).length,
    }),
    [users, bookings, services]
  );

  const loadAdminData = async () => {
    setLoading(true);
    setError("");

    try {
      const [usersResponse, bookingsResponse, servicesResponse] = await Promise.all([
        getAllUsers(),
        getAllBookings(),
        getAllServices(),
      ]);

      setUsers(Array.isArray(usersResponse.data) ? usersResponse.data : []);
      setBookings(Array.isArray(bookingsResponse.data) ? bookingsResponse.data : []);
      setServices(Array.isArray(servicesResponse.data?.services) ? servicesResponse.data.services : []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load admin data.");
      setUsers([]);
      setBookings([]);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    setServiceForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleCreateService = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      await createAdminService({
        name: serviceForm.name,
        description: serviceForm.description,
        services: serviceForm.services.split(",").map((item) => item.trim()).filter(Boolean),
        price: Number(serviceForm.price),
        rating: Number(serviceForm.rating),
        experience: Number(serviceForm.experience),
        phone: serviceForm.phone,
        location: {
          lat: Number(serviceForm.lat),
          lng: Number(serviceForm.lng),
        },
      });

      setMessage("New electrician service created successfully.");
      setServiceForm({
        name: "",
        description: "",
        services: "",
        price: 450,
        rating: 4.6,
        experience: 3,
        phone: "",
        lat: 17.4435,
        lng: 78.3772,
      });
      await loadAdminData();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create service.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = async (id) => {
    setError("");
    setMessage("");
    try {
      await deleteServiceByAdmin(id);
      setMessage("Service deleted successfully.");
      await loadAdminData();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete service.");
    }
  };

  const handleToggleBlock = async (id) => {
    setError("");
    setMessage("");
    try {
      await toggleUserBlock(id);
      setMessage("User status updated.");
      await loadAdminData();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update user status.");
    }
  };

  return (
    <div className="page-shell">
      <Navbar
        title="Admin Dashboard"
        subtitle="Monitor users, create realistic service listings, and manage all bookings from one place."
      />

      <main className="shell dashboard-grid">
        {message ? <p className="success-text">{message}</p> : null}
        {error ? <p className="error-text">{error}</p> : null}

        <section className="stats-row">
          <article className="panel stat-panel">
            <span>Total Users</span>
            <strong>{stats.totalUsers}</strong>
          </article>
          <article className="panel stat-panel">
            <span>Total Bookings</span>
            <strong>{stats.totalBookings}</strong>
          </article>
          <article className="panel stat-panel">
            <span>Active Services</span>
            <strong>{stats.totalServices}</strong>
          </article>
        </section>

        <section className="content-grid two-column">
          <div className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Users</p>
                <h2>All Registered Users</h2>
              </div>
              <span className="count-chip">{stats.electricians} electricians</span>
            </div>

            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Roles</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5">Loading users...</td>
                    </tr>
                  ) : users.length > 0 ? (
                    users.map((user) => (
                      <tr key={user._id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{Array.isArray(user.roles) ? user.roles.join(", ") : "user"}</td>
                        <td>{user.isBlocked ? "Blocked" : "Active"}</td>
                        <td>
                          {!Array.isArray(user.roles) || !user.roles.includes("admin") ? (
                            <button type="button" className="secondary-btn" onClick={() => handleToggleBlock(user._id)}>
                              {user.isBlocked ? "Unblock" : "Block"}
                            </button>
                          ) : (
                            "Protected"
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5">No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Bookings</p>
                <h2>All Booking Requests</h2>
              </div>
              <span className="count-chip">{stats.totalBookings} total</span>
            </div>

            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Service</th>
                    <th>Electrician</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5">Loading bookings...</td>
                    </tr>
                  ) : bookings.length > 0 ? (
                    bookings.map((booking) => (
                      <tr key={booking._id}>
                        <td>{booking?.user?.name || "Unknown user"}</td>
                        <td>{booking?.serviceName || booking?.service?.name || "Electrician Service"}</td>
                        <td>{booking?.electricianProfile?.name || "Auto-assigned"}</td>
                        <td>{booking?.status || "pending"}</td>
                        <td>
                          {booking?.date
                            ? new Date(booking.date).toLocaleDateString("en-IN")
                            : "Not set"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5">No bookings found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="content-grid admin-lower-grid">
          <div className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Create Service</p>
                <h2>Add a new electrician listing</h2>
              </div>
            </div>

            <form className="form-grid" onSubmit={handleCreateService}>
              <label>
                Electrician or Company Name
                <input name="name" value={serviceForm.name} onChange={handleChange} required />
              </label>

              <label>
                Contact Number
                <input name="phone" value={serviceForm.phone} onChange={handleChange} required />
              </label>

              <label className="full-span">
                Services Offered
                <input
                  name="services"
                  value={serviceForm.services}
                  onChange={handleChange}
                  placeholder="Fan Repair, Wiring, Light Installation"
                  required
                />
              </label>

              <label>
                Starting Price
                <input name="price" type="number" min="0" value={serviceForm.price} onChange={handleChange} required />
              </label>

              <label>
                Rating
                <input name="rating" type="number" step="0.1" min="1" max="5" value={serviceForm.rating} onChange={handleChange} required />
              </label>

              <label>
                Experience
                <input name="experience" type="number" min="0" value={serviceForm.experience} onChange={handleChange} required />
              </label>

              <div className="two-inputs full-span">
                <label>
                  Latitude
                  <input name="lat" type="number" step="0.0001" value={serviceForm.lat} onChange={handleChange} required />
                </label>
                <label>
                  Longitude
                  <input name="lng" type="number" step="0.0001" value={serviceForm.lng} onChange={handleChange} required />
                </label>
              </div>

              <label className="full-span">
                Description
                <textarea name="description" rows="4" value={serviceForm.description} onChange={handleChange} />
              </label>

              <button type="submit" className="primary-btn" disabled={saving}>
                {saving ? "Creating..." : "Create New Service"}
              </button>
            </form>
          </div>

          <div className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Service Inventory</p>
                <h2>All service listings</h2>
              </div>
              <span className="count-chip">{stats.totalServices} listed</span>
            </div>

            {loading ? (
              <div className="spinner-wrap">
                <div className="spinner" />
                <p className="muted">Loading services...</p>
              </div>
            ) : services.length > 0 ? (
              <div className="history-list">
                {services.map((service) => (
                  <article key={service._id} className="history-item">
                    <div className="history-row">
                      <strong>{service.name}</strong>
                      <span className={`status ${service.available ? "accepted" : "rejected"}`}>
                        {service.available ? "available" : "busy"}
                      </span>
                    </div>
                    <p className="muted">{(service.services || []).join(", ")}</p>
                    <p className="muted">
                      Rs. {service.price} | {service.rating}/5 | {service.experience} yrs experience
                    </p>
                    <p className="muted">{service.phone || "Phone not added"}</p>
                    <div className="action-row">
                      <button type="button" className="danger-btn" onClick={() => handleDeleteService(service._id)}>
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <h3>No services yet</h3>
                <p className="muted">Create service entries to make the platform feel populated and realistic.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
