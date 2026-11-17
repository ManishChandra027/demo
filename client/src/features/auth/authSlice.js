import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isAuthenticated: false,
  userData: null,
  status: "idle", // "idle", "loading", "succeeded" , "failed"
  error: null,
  initialized: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action) => {
      state.isAuthenticated = true;
      state.userData = action.payload;
      state.status = "succeeded";
      state.error = null;
    },

    updateUser: (state, action) => {
      state.userData = { ...state.userData, ...action.payload };
    },

    logout: (state) => {
      state.isAuthenticated = false;
      state.userData = null;
      state.status = "idle";
      state.error = null;
    },

    setInitialized: (state, action) => {
      state.initialized = action.payload;
    },
  },
});

export const { login, logout, setInitialized, updateUser } = authSlice.actions;

export default authSlice.reducer;
