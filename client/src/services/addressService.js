import api from "../lib/axios.js";
import { apiHandler } from "../lib/apiHandler.js";

export const getAddresses = () =>
  apiHandler(() => api.get("/addresses"));

export const createAddress = (addressData) =>
  apiHandler(() => api.post("/addresses", addressData));

export const updateAddress = (addressId, addressData) =>
  apiHandler(() => api.patch(`/addresses/${addressId}`, addressData));

export const deleteAddress = (addressId) =>
  apiHandler(() => api.delete(`/addresses/${addressId}`));
