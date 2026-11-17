import { createSlice } from "@reduxjs/toolkit";

const cartSlice = createSlice({
  name: "cart",
  initialState: { cart: null },
  reducers: {
    setCart: (state, action) => {
      state.cart = action.payload;
    },
    clearCart: (state) => {
      state.cart = null;
    },
  },
});

export const { clearCart, setCart } = cartSlice.actions;
export const selectCart = (state) => state.cart.cart;
export const selectCartCount = (state) =>
  state.cart.cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0;

export default cartSlice.reducer;
