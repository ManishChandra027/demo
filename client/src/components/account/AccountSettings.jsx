import { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { updateUser } from "../../features/auth/authSlice";
import { updateAccountDetails } from "../../services/userService";
import Button from "../common/Button";
import FormField from "../common/FormField";

const Section = ({ title, description, children }) => (
  <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
    <div className="border-b border-line pb-3">
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-ink-secondary">{description}</p>
    </div>
    <div className="pt-5">{children}</div>
  </section>
);

const AccountSettings = ({ user = {} }) => {
  const dispatch = useDispatch();
  const [editing, setEditing] = useState("");
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const name = user.fullName ?? user.name ?? "";
  const emailVerified = Boolean(user.isVerified ?? user.isEmailVerified);

  const beginEdit = (field) => {
    setEditing(field);
    setValue(user[field] || "");
    setFieldError("");
  };

  const cancelEdit = () => {
    setEditing("");
    setValue("");
    setFieldError("");
  };

  const saveField = async (event) => {
    event.preventDefault();
    const normalized =
      editing === "email" ? value.trim().toLowerCase() : value.trim();
    const validationMessage =
      editing === "fullName" && normalized.length < 2
        ? "Name must contain at least 2 characters."
        : editing === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
          ? "Enter a valid email address."
          : editing === "phone" && !/^[6-9]\d{9}$/.test(normalized)
            ? "Enter a valid 10-digit Indian mobile number."
            : "";

    if (validationMessage) {
      setFieldError(validationMessage);
      toast.error(validationMessage);
      return;
    }
    if (normalized === (user[editing] || "")) {
      cancelEdit();
      return;
    }

    setSaving(true);
    try {
      const response = await updateAccountDetails({ [editing]: normalized });
      const updated = response?.data?.data ?? response?.data;
      dispatch(updateUser(updated));
      toast.success(
        editing === "email"
          ? "Email updated. Verify your new address."
          : "Phone number updated.",
      );
      cancelEdit();
    } catch (error) {
      toast.error(error.message || "Unable to update your details.");
    } finally {
      setSaving(false);
    }
  };

  const detail = (field, label) => (
    <div className="min-w-0" key={field}>
      <p className="text-sm text-ink-secondary">{label}</p>
      {editing === field ? (
        <form onSubmit={saveField} className="mt-2 space-y-2">
          <FormField
            id={`edit-${field}`}
            label={label}
            type={
              field === "email" ? "email" : field === "phone" ? "tel" : "text"
            }
            inputMode={field === "phone" ? "numeric" : undefined}
            maxLength={field === "phone" ? 10 : field === "email" ? 254 : 80}
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setFieldError("");
            }}
            autoFocus
            error={fieldError ? { message: fieldError } : undefined}
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" loading={saving}>
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={saving}
              onClick={cancelEdit}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
          <p className="wrap-break-words font-medium text-ink">
            {user[field] || "Not provided"}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => beginEdit(field)}
            className="h-auto px-2 py-1 hover:underline"
          >
            Change
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full min-w-0 space-y-5 py-2 sm:py-4">
      <header className="mb-2">
        <p className="text-sm font-semibold uppercase tracking-wider text-rarewolf-primary">
          Your account
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Account Settings
        </h1>
        <p className="mt-2 text-sm leading-6 text-ink-secondary">
          Manage your personal information and account security.
        </p>
      </header>
      <Section
        title="Profile Information"
        description="Your personal account details."
      >
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rarewolf-primary text-lg font-bold text-white">
            {name
              .trim()
              .split(/\s+/)
              .filter(Boolean)
              .map((word) => word[0])
              .slice(0, 2)
              .join("")
              .toUpperCase() || "U"}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">
              {name || "Your Name"}
            </p>
            <p className="truncate text-sm text-ink-secondary">
              {user.email || "No email address"}
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-5 border-t border-line pt-5 sm:grid-cols-2">
          {detail("fullName", "Full name")}
          {detail("email", "Email address")}
          {detail("phone", "Phone number")}
        </div>
      </Section>
      <Section
        title="Security & Verification"
        description="Manage your password and email verification."
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <ShieldCheck
              className="mt-1 shrink-0 text-rarewolf-primary"
              size={20}
            />
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-ink">Email verification</h3>
              <p className="mt-1 text-sm text-ink-secondary">
                {emailVerified
                  ? "Your email address is verified."
                  : "Verify your email to help secure your account."}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${emailVerified ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}
            >
              {emailVerified ? "Verified" : "Pending"}
            </span>
          </div>
          {!emailVerified && (
            <Link
              to="/account/verify-email"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-rarewolf-primary hover:bg-rarewolf-primary-light"
            >
              Verify email <ArrowRight size={16} />
            </Link>
          )}
          <div className="border-t border-line" />
          <div className="flex items-start gap-3">
            <LockKeyhole
              className="mt-1 shrink-0 text-rarewolf-primary"
              size={20}
            />
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-ink">Password</h3>
              <p className="mt-1 text-sm text-ink-secondary">
                Change your password to keep your account secure.
              </p>
            </div>
          </div>
          <Link
            to="/account/change-password"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-rarewolf-primary hover:bg-rarewolf-primary-light"
          >
            Change password <ArrowRight size={16} />
          </Link>
        </div>
      </Section>
    </div>
  );
};

export default AccountSettings;
