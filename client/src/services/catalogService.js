import api from "../lib/axios.js";
import { apiHandler } from "../lib/apiHandler.js";

export const getCategories = () =>
  apiHandler(() => api.get("/categories"));

export const getCategory = (slug) =>
  apiHandler(() => api.get(`/categories/${slug}`));

export const getProducts = (params = {}) =>
  apiHandler(() => api.get("/products", { params }));

export const getProduct = (slug) =>
  apiHandler(() => api.get(`/products/${slug}`));

export const getCurrentCart = () =>
  apiHandler(() => api.get("/cart"));

export const addCartItem = (productId, quantity = 1) =>
  apiHandler(() => api.post("/cart/items", { productId, quantity }));

export const updateCartItem = (productId, quantity) =>
  apiHandler(() => api.patch(`/cart/items/${productId}`, { quantity }));

export const removeCartItem = (productId) =>
  apiHandler(() => api.delete(`/cart/items/${productId}`));

export const getWishlist = () => apiHandler(() => api.get("/wishlist"));

export const addWishlistProduct = (productId) =>
  apiHandler(() => api.post("/wishlist/items", { productId }));

export const removeWishlistProduct = (productId) =>
  apiHandler(() => api.delete(`/wishlist/items/${productId}`));
