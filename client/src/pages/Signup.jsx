
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import SignupForm from "../components/auth/SignupForm";
import { signupUser } from "../services/authService";
import { getCurrentUser } from "../services/userService";
import { login } from "../features/auth/authSlice";

const Signup = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (signupData) => {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      await signupUser(signupData);

      const response = await getCurrentUser();
      const userData =
        response?.data?.user ?? response?.user;

      if (!userData) {
        throw new Error(
          "Account created, but user information could not be loaded."
        );
      }

      dispatch(login(userData));
      toast.success("Account created. Verify your email to secure your account.");
      navigate("/account/verify-email", { replace: true });
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to create your account. Please try again.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SignupForm
      onSubmit={handleSignup}
      loading={loading}
      formError={error}
    />
  );
};

export default Signup;
