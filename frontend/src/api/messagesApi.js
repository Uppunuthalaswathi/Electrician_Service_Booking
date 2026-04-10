import axios from "./axiosInstance";

export const getMessages = (bookingId) => axios.get(`/messages/${bookingId}`);
export const sendMessage = (bookingId, message) =>
  axios.post(`/messages/${bookingId}`, { message });
