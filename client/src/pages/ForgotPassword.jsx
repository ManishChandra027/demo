import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import Button from "../components/common/Button";
import FormField from "../components/common/FormField";
import {
  forgotPassword,
  resetPassword,
  verifyPasswordResetOtp,
} from "../services/authService";

const stepCopy = [
  "Enter your account email to receive a reset code.",
  "Enter the 6-digit reset code from your email.",
  "Choose a new password.",
];

const buttonLabels = ["Send reset code", "Verify code", "Set new password"];

export default function ForgotPassword() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    control,
    getValues,
    formState: { errors },
  } = useForm({
    mode: "onBlur",
    defaultValues: { email: "", otp: "", newPassword: "", confirmPassword: "" },
  });
  const newPassword = useWatch({ control, name: "newPassword" });

  const resendCode = async () => {
    setResending(true);
    try {
      await forgotPassword({ email: getValues("email").trim().toLowerCase() });
      toast.success("If this email belongs to an account, a new reset code has been sent.");
    } catch (error) {
      toast.error(error.message || "Unable to resend the reset code.");
    } finally {
      setResending(false);
    }
  };

  const submit = async (values) => {
    setLoading(true);
    try {
      if (step === 0) {
        await forgotPassword({ email: values.email.trim().toLowerCase() });
        toast.success(
          "If this email belongs to an account, a reset code has been sent.",
        );
        setStep(1);
      } else if (step === 1) {
        await verifyPasswordResetOtp({
          email: values.email.trim().toLowerCase(),
          otp: values.otp,
        });
        setStep(2);
      } else {
        await resetPassword({ newPassword: values.newPassword });
        toast.success("Password reset. Please log in with your new password.");
        navigate("/login", { replace: true });
      }
    } catch (error) {
      toast.error(error.message || "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto mt-10 max-w-md rounded-2xl border border-line bg-surface p-6 shadow-card">
      <h1 className="text-2xl font-bold text-ink">Reset your password</h1>
      <p className="mt-2 text-sm text-ink-secondary">{stepCopy[step]}</p>
      <p className="mt-2 text-xs font-medium text-ink-muted">Step {step + 1} of 3</p>
      {step === 1 && (
        <div className="mt-4 rounded-lg bg-soft p-3 text-sm text-ink-secondary">
          Enter the code for <span className="font-medium text-ink">{getValues("email")}</span>.
          <Button type="button" variant="ghost" size="sm" onClick={() => setStep(0)} className="ml-1 h-auto px-1 py-0 text-xs">Change email</Button>
        </div>
      )}
      <form
        onSubmit={handleSubmit(submit)}
        noValidate
        className="mt-6 space-y-4"
      >
        {step === 0 && (
          <FormField
            id="email"
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            register={register}
            error={errors.email}
            validation={{
              required: "Email address is required.",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Enter a valid email address.",
              },
            }}
          />
        )}
        {step === 1 && (
          <FormField
            id="otp"
            label="6-digit reset code"
            inputMode="numeric"
            maxLength={6}
            placeholder="Enter the code from your email"
            register={register}
            error={errors.otp}
            validation={{
              required: "Reset code is required.",
              pattern: {
                value: /^\d{6}$/,
                message: "Enter the 6-digit reset code.",
              },
            }}
          />
        )}
        {step === 2 && (
          <>
            <FormField
              id="newPassword"
              label="New password"
              type="password"
              autoComplete="new-password"
              maxLength={128}
              register={register}
              error={errors.newPassword}
              validation={{
                required: "New password is required.",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters.",
                },
              }}
            />
            <FormField
              id="confirmPassword"
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              maxLength={128}
              register={register}
              error={errors.confirmPassword}
              validation={{
                required: "Please confirm your new password.",
                validate: (value) =>
                  value === newPassword || "Passwords do not match.",
              }}
            />
          </>
        )}
        <Button type="submit" fullWidth loading={loading}>
          {buttonLabels[step]}
        </Button>
      {step === 1 && (
        <Button type="button" variant="ghost" fullWidth className="mt-2" loading={resending} disabled={loading || resending} onClick={resendCode}>
          Resend reset code
        </Button>
      )}
      {step === 2 && (
        <Button type="button" variant="ghost" fullWidth className="mt-2" disabled={loading} onClick={() => setStep(0)}>
          Start over
        </Button>
      )}
      </form>
      <Link
        to="/login"
        className="mt-5 block text-center text-sm font-semibold text-rarewolf-primary hover:underline"
      >
        Back to login
      </Link>
    </section>
  );
}
