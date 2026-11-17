import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

import Button from "../common/Button";
import FormField from "../common/FormField";

const LoginForm = ({ onSubmit, onGoogle, loading = false, formError = "" }) => {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const submitForm = (formData) =>
    onSubmit({
      identifier: formData.identifier.trim(),
      password: formData.password,
    });

  const isLoading = loading || isSubmitting;

  return (
    <section className="mx-auto w-full max-w-md rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5 lg:p-6">
      <div className="mb-4">
        <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-rarewolf-primary-light text-rarewolf-primary">
          <ShieldCheck size={30} />
        </span>

        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Welcome back
        </h1>

        <p className="mt-1 text-sm leading-5 text-ink-secondary">
          Log in to your RareWolf account and continue shopping.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(submitForm)}
        noValidate
        className="space-y-3"
      >
        <FormField
          id="identifier"
          label="Email or phone number"
          placeholder="you@example.com or 9876543210"
          autoComplete="username"
          register={register}
          error={errors.identifier}
          validation={{
            required: "Email or phone number is required.",
            validate: (value) => {
              const identifier = value.trim();
              const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
              const isPhone = /^[6-9]\d{9}$/.test(identifier);

              return (
                isEmail ||
                isPhone ||
                "Enter a valid email or 10-digit phone number."
              );
            },
          }}
        />

        <div>
          <FormField
            id="password"
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            autoComplete="current-password"
            register={register}
            error={errors.password}
            validation={{
              required: "Password is required.",
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

          <div className="mt-1.5 text-right">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-rarewolf-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rarewolf-primary"
            >
              Forgot password?
            </Link>
          </div>
        </div>

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
          Log in
        </Button>
      </form>

      {onGoogle && (
        <>
          <div className="my-3 flex items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="text-xs text-ink-muted">OR CONTINUE WITH</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            fullWidth
            onClick={onGoogle}
            disabled={isLoading}
          >
            <span className="text-base font-bold text-[#4285F4]">G</span>
            Continue with Google
          </Button>
        </>
      )}

      <p className="mt-4 border-t border-line pt-3 text-center text-sm text-ink-secondary">
        Don't have an account?{" "}
        <Link
          to="/signup"
          className="font-semibold text-rarewolf-primary hover:underline"
        >
          Create account
        </Link>
      </p>
    </section>
  );
};

export default LoginForm;
