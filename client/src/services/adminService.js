import api from "../lib/axios.js";
import { apiHandler } from "../lib/apiHandler.js";

export const getAdminDashboard = () =>
  apiHandler(() => api.get("/admin/dashboard"));

export const getAdminCustomers = (params = {}) =>
  apiHandler(() => api.get("/admin/customers", { params }));

export const getAdminCustomerOrders = (customerId, params = {}) =>
  apiHandler(() => api.get(`/admin/customers/${customerId}/orders`, { params }));

export const getAdminProducts = (params = {}) =>
  apiHandler(() => api.get("/admin/products", { params }));

export const getAdminProduct = (productId) =>
  apiHandler(() => api.get(`/admin/products/${productId}`));

export const createAdminProduct = (formData) =>
  apiHandler(() =>
    api.post("/admin/products", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  );

export const updateAdminProduct = (productId, formData) =>
  apiHandler(() =>
    api.patch(`/admin/products/${productId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  );

export const setAdminProductActive = (productId, isActive) =>
  apiHandler(() => api.patch(`/admin/products/${productId}`, { isActive }));

export const adjustAdminStock = (productId, adjustment) =>
  apiHandler(() => api.patch(`/admin/products/${productId}/stock`, { adjustment }));

export const getLowStockProducts = (params = {}) =>
  apiHandler(() => api.get("/admin/inventory/low-stock", { params }));

export const getAdminOrders = (params = {}) =>
  apiHandler(() => api.get("/admin/orders", { params }));

export const getAdminOrder = (orderId) =>
  apiHandler(() => api.get(`/admin/orders/${orderId}`));

export const updateAdminOrderStatus = (orderId, status) =>
  apiHandler(() => api.patch(`/admin/orders/${orderId}/status`, { status }));

export const deactivateAdminProduct = (productId) =>
  apiHandler(() => api.delete(`/admin/products/${productId}`));

export const getAdminCategories = (params = {}) =>
  apiHandler(() => api.get("/admin/categories", { params }));

export const getAdminCategory = (categoryId) =>
  apiHandler(() => api.get(`/admin/categories/${categoryId}`));

export const createAdminCategory = (data) =>
  apiHandler(() =>
    api.post("/admin/categories", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  );

export const updateAdminCategory = (categoryId, data) =>
  apiHandler(() =>
    api.patch(`/admin/categories/${categoryId}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  );

export const deactivateAdminCategory = (categoryId) =>
  apiHandler(() => api.delete(`/admin/categories/${categoryId}`));
