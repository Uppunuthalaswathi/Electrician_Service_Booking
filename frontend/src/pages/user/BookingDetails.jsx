import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  cancelBooking,
  getBookingDetails,
  makePayment,
  submitReview,
} from "../../api/bookingApi";
import { getMessages, sendMessage } from "../../api/messagesApi";
import Navbar from "../../components/Navbar";

const PAYMENT_OPTIONS = ["UPI", "Card", "Cash"];
const TRACK_STEPS = ["pending", "accepted", "on_the_way", "arrived", "completed"];

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);

export default function BookingDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [reviewForm, setReviewForm] = useState({ rating: 5, feedback: "" });
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const canCancel = useMemo(
    () => ["pending", "assigned", "accepted", "on_the_way"].includes(booking?.status),
    [booking?.status]
  );

  const loadDetails = async () => {
    try {
      const [bookingResponse, messagesResponse] = await Promise.all([
        getBookingDetails(id),
        getMessages(id),
      ]);
      setBooking(bookingResponse.data?.booking || null);
      setMessages(messagesResponse.data?.messages || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load booking details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
    const timer = setInterval(loadDetails, 5000);
    return () => clearInterval(timer);
  }, [id]);

  const handleCancel = async () => {
    try {
      setFeedback("");
      setError("");
      await cancelBooking(id);
      await loadDetails();
      setFeedback("Booking cancelled successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to cancel booking.");
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!messageText.trim()) return;

    try {
      await sendMessage(id, messageText);
      setMessageText("");
      await loadDetails();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send message.");
    }
  };

  const handlePayment = async () => {
    try {
      await makePayment(id, paymentMethod);
      await loadDetails();
      setFeedback("Payment recorded successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to make payment.");
    }
  };

  const handleReview = async (event) => {
    event.preventDefault();
    try {
      await submitReview(id, reviewForm);
      await loadDetails();
      setFeedback("Thank you for rating the service.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to submit review.");
    }
  };

  return (
    <div className="page-shell">
      <Navbar title="Booking Tracker" subtitle="Track live progress, chat with the electrician, complete payment, and rate the service." />

      <main className="shell dashboard-grid">
        {feedback ? <p className="success-text">{feedback}</p> : null}
        {error ? <p className="error-text">{error}</p> : null}

        {loading ? (
          <div className="spinner-wrap tall-state">
            <div className="spinner" />
            <p className="muted">Loading booking...</p>
          </div>
        ) : booking ? (
          <>
            <section className="content-grid two-column">
              <div className="panel">
                <div className="section-head">
                  <div>
                    <p className="eyebrow">Service Summary</p>
                    <h2>{booking.serviceName}</h2>
                  </div>
                  <span className={`status ${booking.status}`}>{booking.status.replaceAll("_", " ")}</span>
                </div>

                <div className="history-list compact-list">
                  <div className="history-item">
                    <strong>Electrician</strong>
                    <p className="muted">{booking?.electricianProfile?.name || "Assigning..."}</p>
                  </div>
                  <div className="history-item">
                    <strong>Price</strong>
                    <p className="muted">{formatCurrency(booking.price)}</p>
                  </div>
                  <div className="history-item">
                    <strong>ETA</strong>
                    <p className="muted">{booking.estimatedArrivalMinutes ? `${booking.estimatedArrivalMinutes} mins` : booking.estimatedArrival}</p>
                  </div>
                  <div className="history-item">
                    <strong>Address</strong>
                    <p className="muted">{booking.address}</p>
                  </div>
                </div>

                <div className="timeline-track">
                  {TRACK_STEPS.map((step, index) => {
                    const activeIndex = TRACK_STEPS.indexOf(booking.status);
                    return (
                      <div key={step} className={`timeline-step ${index <= activeIndex ? "active" : ""}`}>
                        <span>{index + 1}</span>
                        <strong>{step.replaceAll("_", " ")}</strong>
                      </div>
                    );
                  })}
                </div>

                {canCancel ? (
                  <div className="action-row">
                    <button type="button" className="danger-btn" onClick={handleCancel}>
                      Cancel Booking
                    </button>
                    <button type="button" className="secondary-btn" onClick={() => navigate("/user")}>
                      Back to Dashboard
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="panel">
                <div className="section-head">
                  <div>
                    <p className="eyebrow">Live Tracking</p>
                    <h2>Location and ETA</h2>
                  </div>
                </div>

                <div className="map-surface">
                  <div className="map-marker user-marker">
                    <span>User</span>
                    <strong>{booking?.userLocationMeta?.addressLabel || "Customer area"}</strong>
                  </div>
                  <div className="map-path" />
                  <div className="map-marker pro-marker">
                    <span>Electrician</span>
                    <strong>{booking?.electricianLocationMeta?.addressLabel || "Electrician area"}</strong>
                  </div>
                </div>

                <div className="stats-row">
                  <div className="stat-panel card">
                    <span>Distance</span>
                    <strong>{booking.distanceKm} km</strong>
                  </div>
                  <div className="stat-panel card">
                    <span>Arrival</span>
                    <strong>{booking.estimatedArrivalMinutes ? `${booking.estimatedArrivalMinutes} mins` : booking.estimatedArrival}</strong>
                  </div>
                  <div className="stat-panel card">
                    <span>Updated</span>
                    <strong>
                      {booking?.electricianLocation?.updatedAt
                        ? new Date(booking.electricianLocation.updatedAt).toLocaleTimeString("en-IN")
                        : "Waiting"}
                    </strong>
                  </div>
                </div>
              </div>
            </section>

            <section className="content-grid two-column">
              <div className="panel">
                <div className="section-head">
                  <div>
                    <p className="eyebrow">Chat</p>
                    <h2>Talk to the electrician</h2>
                  </div>
                </div>

                <div className="chat-feed">
                  {messages.length > 0 ? (
                    messages.map((message) => (
                      <article key={message._id} className="chat-bubble">
                        <strong>{message?.sender?.name || "User"}</strong>
                        <p>{message.message}</p>
                        <span>{new Date(message.createdAt).toLocaleString("en-IN")}</span>
                      </article>
                    ))
                  ) : (
                    <div className="empty-state">
                      <h3>No messages yet</h3>
                      <p className="muted">Start the conversation about access, directions, or service details.</p>
                    </div>
                  )}
                </div>

                <form className="chat-composer" onSubmit={handleSendMessage}>
                  <textarea
                    rows="3"
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    placeholder="Type a message..."
                  />
                  <button type="submit" className="primary-btn">Send</button>
                </form>
              </div>

              <div className="panel">
                <div className="section-head">
                  <div>
                    <p className="eyebrow">Payment & Review</p>
                    <h2>Complete the service journey</h2>
                  </div>
                </div>

                <div className="history-list compact-list">
                  <div className="history-item">
                    <strong>Payment Status</strong>
                    <p className="muted">{booking?.payment?.status || "unpaid"}</p>
                  </div>
                  <div className="history-item">
                    <strong>Bill Number</strong>
                    <p className="muted">{booking?.payment?.billNumber || "Generated after completion"}</p>
                  </div>
                </div>

                {booking.status === "completed" && booking.payment?.status !== "paid" ? (
                  <div className="form-grid">
                    <label>
                      Choose Payment Method
                      <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                        {PAYMENT_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </label>
                    <button type="button" className="primary-btn" onClick={handlePayment}>
                      Pay {formatCurrency(booking.price)}
                    </button>
                  </div>
                ) : null}

                {booking.status === "completed" && !booking.review?.rating ? (
                  <form className="form-grid" onSubmit={handleReview}>
                    <label>
                      Rating
                      <select
                        value={reviewForm.rating}
                        onChange={(event) => setReviewForm((prev) => ({ ...prev, rating: Number(event.target.value) }))}
                      >
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <option key={rating} value={rating}>{rating} star</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Feedback
                      <textarea
                        rows="4"
                        value={reviewForm.feedback}
                        onChange={(event) => setReviewForm((prev) => ({ ...prev, feedback: event.target.value }))}
                        placeholder="Share your experience"
                      />
                    </label>
                    <button type="submit" className="secondary-btn">Submit Rating</button>
                  </form>
                ) : booking.review?.rating ? (
                  <div className="history-item">
                    <strong>Your Rating</strong>
                    <p className="muted">{booking.review.rating}/5 - {booking.review.feedback || "No feedback added"}</p>
                  </div>
                ) : null}
              </div>
            </section>
          </>
        ) : (
          <div className="empty-state">
            <h3>Booking not found</h3>
            <p className="muted">The selected booking could not be loaded.</p>
          </div>
        )}
      </main>
    </div>
  );
}
