import { createSlice } from "@reduxjs/toolkit";

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState: { products: [] },
  reducers: {
    setWishlist: (state, action) => {
      state.products = action.payload || [];
    },
    clearWishlist: (state) => {
      state.products = [];
    },
  },
});

export const { clearWishlist, setWishlist } = wishlistSlice.actions;
export const selectWishlist = (state) => state.wishlist.products;
export const selectWishlistCount = (state) => state.wishlist.products.length;

export default wishlistSlice.reducer;
