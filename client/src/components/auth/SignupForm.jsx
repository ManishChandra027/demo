import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { Eye, EyeOff, UserRound } from "lucide-react";

import Button from "../common/Button";
import FormField from "../common/FormField";

const SignupForm = ({
  onSubmit,
  onGoogle,
  loading = false,
  formError = "",
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = useWatch({ control, name: "password" });
  const isLoading = loading || isSubmitting;

  const submitForm = (formData) => {
    const signupData = { ...formData };
    delete signupData.confirmPassword;

    return onSubmit({
      ...signupData,
      fullName: signupData.fullName.trim(),
      email: signupData.email.trim().toLowerCase(),
    });
  };

  return (
    <section className="mx-auto w-full max-w-lg rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5 lg:p-6">
      <div className="mb-4">
        <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-rarewolf-primary-light text-rarewolf-primary">
          <UserRound size={20} />
        </span>

        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Create your account
        </h1>

        <p className="mt-1 text-sm leading-5 text-ink-secondary">
          Join RareWolf for a more thoughtful way to shop.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(submitForm)}
        noValidate
        className="space-y-2.5"
      >
        <FormField
          id="fullName"
          label="Full name"
          placeholder="Enter your full name"
          autoComplete="name"
          register={register}
          error={errors.fullName}
          validation={{
            required: "Full name is required.",
            validate: (value) =>
              value.trim().length >= 2 ||
              "Name must contain at least 2 characters.",
          }}
        />

        <FormField
          id="email"
          label="Email address"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          register={register}
          error={errors.email}
          validation={{
            required: "Email is required.",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Enter a valid email address.",
            },
          }}
        />

        <FormField
          id="password"
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="Create a password"
          autoComplete="new-password"
          register={register}
          error={errors.password}
          validation={{
            required: "Password is required.",
            minLength: {
              value: 8,
              message: "Password must be at least 8 characters.",
            },
          }}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute right-1 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </Button>
        </FormField>

        <FormField
          id="confirmPassword"
          label="Confirm password"
          type={showPassword ? "text" : "password"}
          placeholder="Enter your password again"
          autoComplete="new-password"
          register={register}
          error={errors.confirmPassword}
          validation={{
            required: "Please confirm your password.",
            validate: (value) =>
              value === password || "Passwords do not match.",
          }}
        />

        {formError && (
          <p
            role="alert"
            className="rounded-lg border border-danger/20 bg-rarewolf-primary-light px-3 py-2 text-sm text-danger"
          >
            {formError}
          </p>
        )}

        <Button
          type="submit"
          fullWidth
          loading={isLoading}
          disabled={isLoading}
          className="shadow-cta"
        >
          Create account
        </Button>
      </form>

      {onGoogle && (
        <>
          <div className="my-3 flex items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="text-xs text-ink-muted">OR</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <Button
            type="button"
            variant="secondary"
            fullWidth
            disabled={isLoading}
            onClick={onGoogle}
          >
            <span className="text-base font-bold text-[#4285F4]">G</span>
            Continue with Google
          </Button>
        </>
      )}

      <p className="mt-4 border-t border-line pt-3 text-center text-sm text-ink-secondary">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-semibold text-rarewolf-primary hover:underline"
        >
          Log in
        </Link>
      </p>
    </section>
  );
};

export default SignupForm;
