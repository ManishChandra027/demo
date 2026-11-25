import api from "../lib/axios.js";
import { apiHandler } from "../lib/apiHandler.js";

export const createOrder = (addressId, paymentMethod = "cod") =>
  apiHandler(() => api.post("/orders", { addressId, paymentMethod }));

export const createRazorpayPayment = (orderId) =>
  apiHandler(() => api.post(`/orders/${orderId}/razorpay`));

export const verifyRazorpayPayment = (orderId, paymentDetails) =>
  apiHandler(() => api.post(`/orders/${orderId}/razorpay/verify`, paymentDetails));

export const getOrders = () => apiHandler(() => api.get("/orders"));

export const getOrder = (orderId) =>
  apiHandler(() => api.get(`/orders/${orderId}`));

export const cancelOrder = (orderId) =>
  apiHandler(() => api.post(`/orders/${orderId}/cancel`));
