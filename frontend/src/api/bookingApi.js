import axios from "./axiosInstance";

export const createBooking = (payload) =>
  axios.post("/bookings/create", {
    ...payload,
    isEmergency: payload.priority === "emergency",
  });

export const getMyBookings = () => axios.get("/bookings/my");
export const getTrackableBookings = () => axios.get("/bookings/track");
export const getBookingDetails = (id) => axios.get(`/bookings/${id}`);
export const getElectricianBookings = () => axios.get("/bookings/electrician");
export const acceptBooking = (id) => axios.put(`/bookings/accept/${id}`);
export const rejectBooking = (id, reason) => axios.put(`/bookings/reject/${id}`, { reason });
export const updateBookingStatus = (id, status) => axios.put(`/bookings/status/${id}`, { status });
export const updateLiveLocation = (id, payload) => axios.put(`/bookings/location/${id}`, payload);
export const cancelBooking = (id) => axios.post(`/bookings/cancel/${id}`);
export const makePayment = (id, method) => axios.post(`/bookings/payment/${id}`, { method });
export const submitReview = (id, payload) => axios.post(`/bookings/review/${id}`, payload);
export const getAllBookings = () => axios.get("/bookings/all");
export const assignElectrician = (id, electricianId) => axios.put(`/bookings/assign/${id}`, { electricianId });
export const deleteBooking = (id) => axios.delete(`/bookings/${id}`);
