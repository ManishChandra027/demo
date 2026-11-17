import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import Button from "../../components/common/Button";
import FormField from "../../components/common/FormField";
import { logout } from "../../features/auth/authSlice";
import { changePassword } from "../../services/authService";

export default function ChangePassword() {
  const [saving, setSaving] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      currentPassword: "",
      updatedPassword: "",
      confirmPassword: "",
    },
  });
  const currentPassword = useWatch({ control, name: "currentPassword" });
  const updatedPassword = useWatch({ control, name: "updatedPassword" });

  const submit = async ({ currentPassword, updatedPassword }) => {
    setSaving(true);
    try {
      await changePassword({ currentPassword, updatedPassword });
      dispatch(logout());
      toast.success("Password changed. Please log in again.");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(error.message || "Unable to change password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mx-auto max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-card">
      <h1 className="text-2xl font-bold text-ink">Change password</h1>
      <p className="mt-2 text-sm text-ink-secondary">
        Choose a new password for your account.
      </p>
      <form
        onSubmit={handleSubmit(submit)}
        noValidate
        className="mt-6 space-y-4"
      >
        <FormField
          id="currentPassword"
          label="Current password"
          type="password"
          autoComplete="current-password"
          maxLength={128}
          register={register}
          error={errors.currentPassword}
          validation={{ required: "Current password is required." }}
        />
        <FormField
          id="updatedPassword"
          label="New password"
          type="password"
          autoComplete="new-password"
          maxLength={128}
          register={register}
          error={errors.updatedPassword}
          validation={{
            required: "New password is required.",
            minLength: {
              value: 8,
              message: "Password must be at least 8 characters.",
            },
            validate: (value) =>
              value !== currentPassword ||
              "New password must differ from the current password.",
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
              value === updatedPassword || "Passwords do not match.",
          }}
        />
        <Button type="submit" loading={saving} disabled={saving}>
          Update password
        </Button>
      </form>
    </section>
  );
}
