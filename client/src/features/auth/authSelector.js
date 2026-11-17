export const selectAuth = (state) => state.auth;

export const selectUser = (state) => state.auth.userData;

export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;

export const selectAuthStatus = (state) => state.auth.status;

export const selectAuthError = (state) => state.auth.error;
export const selectAuthInitialized = (state) =>
  state.auth.initialized;
