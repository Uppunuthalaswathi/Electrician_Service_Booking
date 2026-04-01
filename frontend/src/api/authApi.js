import axiosInstance from "../utils/axiosInstance";

export const registerUser = (data) =>
  axiosInstance.post("/users/register", data);

export const loginUser = (data) =>
  axiosInstance.post("/users/login", data);

// (UI only for now)
export const forgotPassword = (email) =>
  Promise.resolve({ data: { message: "Reset link sent (mock)" } });