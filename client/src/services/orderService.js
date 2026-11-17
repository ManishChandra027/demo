import api from "../lib/axios.js";
import { apiHandler } from "../lib/apiHandler.js";

export const createOrder = (addressId) =>
  apiHandler(() => api.post("/orders", { addressId, paymentMethod: "cod" }));

export const getOrders = () => apiHandler(() => api.get("/orders"));

export const getOrder = (orderId) =>
  apiHandler(() => api.get(`/orders/${orderId}`));

export const cancelOrder = (orderId) =>
  apiHandler(() => api.post(`/orders/${orderId}/cancel`));
