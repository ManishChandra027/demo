
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import LoginForm from "../components/auth/LoginForm";
import { getCurrentUser } from "../services/userService";
import { loginUser } from "../services/authService";
import { login } from "../features/auth/authSlice";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (loginData) => {
    setLoading(true);
    setError("");

    try {
      const response = await loginUser(loginData);

      let userData = response?.data?.user ?? response?.user;

      if (!userData) {
        const currentResponse = await getCurrentUser();
        userData =
          currentResponse?.data?.user ?? currentResponse?.user;
      }

      if (!userData) {
        throw new Error(
          "Login successful, but account information could not be loaded."
        );
      }

      dispatch(login(userData));
      toast.success("Logged in successfully!");
      const returnTo = location.state?.from;
      navigate(
        typeof returnTo === "string" && returnTo.startsWith("/") && !returnTo.startsWith("//")
          ? returnTo
          : "/",
        { replace: true },
      );
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Login failed. Please check your credentials.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginForm
      onSubmit={handleLogin}
      loading={loading}
      formError={error}
    />
  );
};

export default Login;
