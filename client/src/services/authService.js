import api from "../lib/axios.js";
import { apiHandler } from "../lib/apiHandler.js";

export const signupUser = (signupData) =>
    apiHandler(() => api.post("/auth/register", signupData));
// export const refreshToken = () =>
//     apiHandler(() => api.post("/auth/refresh-token"));

// export const getCurrentUser = () => apiHandler(() => api.get("/auth/me"));

export const loginUser = (loginData) =>
    apiHandler(() => api.post("/auth/login", loginData));

// export const forgotPassword = (emailData) =>
//     apiHandler(() => api.post("/auth/forgot-password", emailData));

// export const resetPassword = (token, passwordData) =>
//     apiHandler(() => api.post(`/auth/reset-password/${token}`, passwordData));

// export const verifyEmail = (token) =>
//     apiHandler(() => api.post(`/auth/verify-email/${token}`));

export const logoutUser = () => apiHandler(() => api.post("/auth/logout"));

export const changePassword = (passwordData) =>
    apiHandler(() => api.patch("/auth/change-password", passwordData));

export const requestEmailVerification = () =>
    apiHandler(() => api.post("/auth/request-email-verification"));

export const verifyEmail = (verificationData) =>
    apiHandler(() => api.post("/auth/verify-email", verificationData));

export const forgotPassword = (emailData) =>
    apiHandler(() => api.post("/auth/forgot-password", emailData));

export const verifyPasswordResetOtp = (otpData) =>
    apiHandler(() => api.post("/auth/verify-reset-otp", otpData));

export const resetPassword = (passwordData) =>
    apiHandler(() => api.post("/auth/reset-password", passwordData));

// export const refreshAccessToken = () =>
//     apiHandler(() => api.post("/auth/refresh-token"));

// export const changePassword = (passwordData) =>
//     apiHandler(() => api.post("/auth/change-password", passwordData));

// export const requestEmailVerification = () =>
//     apiHandler(() => api.post("/auth/request-email-verification"));

// export const changeEmailRequest = (emailData) =>
//     apiHandler(() => api.post("/auth/change-email-request", emailData));
