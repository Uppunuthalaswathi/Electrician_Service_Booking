import axiosInstance from "./axiosInstance";

export const registerUser = (data) => axiosInstance.post("/users/register", data);
export const loginUser = (data) => axiosInstance.post("/users/login", data);
export const forgotPassword = (data) => axiosInstance.post("/users/forgot-password", data);
export const resetPassword = (token, data) => axiosInstance.post(`/users/reset-password/${token}`, data);
export const changePassword = (data) => axiosInstance.post("/users/change-password", data);
export const getProfile = () => axiosInstance.get("/users/profile");
export const updateProfile = (data) => axiosInstance.put("/users/profile", data);
export const getAllUsers = () => axiosInstance.get("/users/all");
export const toggleUserBlock = (id) => axiosInstance.put(`/users/block/${id}`);
