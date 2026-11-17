import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import Button from "../../components/common/Button";
import FormField from "../../components/common/FormField";
import { selectUser } from "../../features/auth/authSelector";
import { updateUser } from "../../features/auth/authSlice";
import {
  requestEmailVerification,
  verifyEmail,
} from "../../services/authService";

export default function VerifyEmail() {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: "onBlur", defaultValues: { otp: "" } });

  const sendCode = async () => {
    setSending(true);
    try {
      await requestEmailVerification();
      setCodeSent(true);
      toast.success("Verification code sent to your email.");
    } catch (error) {
      toast.error(error.message || "Unable to send verification code.");
    } finally {
      setSending(false);
    }
  };

  if (user?.isVerified) {
    return (
      <section className="mx-auto max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-card">
        <h1 className="text-2xl font-bold text-ink">Email already verified</h1>
        <p className="mt-2 text-sm text-ink-secondary">{user.email} is verified and ready to use.</p>
        <Button type="button" className="mt-5" onClick={() => navigate("/account/settings")}>Back to account settings</Button>
      </section>
    );
  }

  const submit = async ({ otp }) => {
    setChecking(true);
    try {
      await verifyEmail({ email: user?.email, otp });
      dispatch(updateUser({ isVerified: true }));
      navigate("/account/settings");
      toast.success("Email verified successfully.");
    } catch (error) {
      toast.error(error.message || "Unable to verify email.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <section className="mx-auto max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-card">
      <h1 className="text-2xl font-bold text-ink">Verify email</h1>
      <p className="mt-2 text-sm text-ink-secondary">
        Enter the 6-digit code sent to {user?.email || "your account email"}.
      </p>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        loading={sending}
        disabled={checking}
        onClick={sendCode}
        className="mt-5"
      >
        Send verification code
      </Button>
      {codeSent && <p role="status" className="mt-2 text-xs text-success">A new code was sent. It expires in 10 minutes.</p>}
      <form
        onSubmit={handleSubmit(submit)}
        noValidate
        className="mt-5 space-y-4"
      >
        <FormField
          id="otp"
          label="6-digit verification code"
          inputMode="numeric"
          maxLength={6}
          placeholder="Enter the code from your email"
          register={register}
          error={errors.otp}
          validation={{
            required: "Verification code is required.",
            pattern: {
              value: /^\d{6}$/,
              message: "Enter the 6-digit verification code.",
            },
          }}
        />
        <Button type="submit" loading={checking} disabled={sending}>
          Verify email
        </Button>
      </form>
    </section>
  );
}
