import axios from "./axiosInstance";

export const getElectriciansByService = ({ service, sortBy, lat, lng, area, city, pincode }) => {
  const params = {};

  if (service) params.service = service;
  if (sortBy) params.sortBy = sortBy;
  if (typeof lat === "number") params.lat = lat;
  if (typeof lng === "number") params.lng = lng;
  if (area) params.area = area;
  if (city) params.city = city;
  if (pincode) params.pincode = pincode;

  return axios.get("/services", { params });
};

export const getMyElectricianProfile = () => axios.get("/services/me");
export const createElectricianProfile = (payload) => axios.post("/services/create", payload);
export const updateMyElectricianProfile = (payload) => axios.put("/services/me", payload);
export const getAllServices = () => axios.get("/services/admin/all");
export const createAdminService = (payload) => axios.post("/services/admin/create", payload);
export const updateServiceByAdmin = (id, payload) => axios.put(`/services/${id}`, payload);
export const deleteServiceByAdmin = (id) => axios.delete(`/services/${id}`);
