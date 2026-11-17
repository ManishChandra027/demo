import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MailCheck, ShieldCheck, UserRound } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import Button from "../../components/common/Button";
import FormField from "../../components/common/FormField";
import Loader from "../../components/common/Loader";
import {
  selectIsAuthenticated,
  selectUser,
} from "../../features/auth/authSelector";
import { updateUser } from "../../features/auth/authSlice";
import {
  getCurrentUser,
  updateAccountDetails,
} from "../../services/userService";

const MyProfile = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [loading, setLoading] = useState(isAuthenticated);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [emailNeedsVerification, setEmailNeedsVerification] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm({
    mode: "onBlur",
    defaultValues: { fullName: "", email: "" },
  });

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let isMounted = true;
    getCurrentUser()
      .then((response) => {
        if (!isMounted) return;
        const account = response?.data?.user;
        if (!account)
          throw new Error("Your profile details could not be loaded.");
        dispatch(
          updateUser({
            ...account,
            defaultAddress: response?.data?.defaultAddress || null,
          }),
        );
        reset({ fullName: account.fullName || "", email: account.email || "" });
        setLoadError("");
      })
      .catch((error) => {
        if (isMounted)
          setLoadError(
            error.message || "Your profile details could not be loaded.",
          );
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [dispatch, isAuthenticated, reset]);

  const saveProfile = async (values) => {
    const updates = {};
    if (dirtyFields.fullName) updates.fullName = values.fullName.trim();
    if (dirtyFields.email) updates.email = values.email.trim().toLowerCase();
    if (Object.keys(updates).length === 0) {
      toast.info("There are no profile changes to save.");
      return;
    }

    setSaving(true);
    try {
      const response = await updateAccountDetails(updates);
      const updatedAccount = response?.data;
      if (!updatedAccount)
        throw new Error("The updated profile could not be loaded.");

      dispatch(updateUser(updatedAccount));
      reset({
        fullName: updatedAccount.fullName || "",
        email: updatedAccount.email || "",
      });
      const changedEmail = Boolean(
        updates.email && updates.email !== user?.email?.toLowerCase(),
      );
      setEmailNeedsVerification(changedEmail);
      toast.success(
        changedEmail
          ? "Profile saved. Verify your new email address."
          : "Profile saved.",
      );
    } catch (error) {
      toast.error(error.message || "Unable to save your profile.");
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <section className="rounded-2xl border border-line bg-white p-8 text-center">
        <h1 className="text-xl font-bold text-ink">
          Sign in to view your profile
        </h1>
        <Link
          to="/login"
          state={{ from: "/account" }}
          className="mt-4 inline-block text-sm font-semibold text-rarewolf-primary"
        >
          Sign in
        </Link>
      </section>
    );
  }

  if (loading)
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader label="Loading profile" />
      </div>
    );
  if (loadError) {
    return (
      <section
        role="alert"
        className="rounded-2xl border border-line bg-white p-8 text-center"
      >
        <p className="text-sm text-danger">{loadError}</p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Reload profile
        </Button>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wider text-rarewolf-primary">
          Your account
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          My Profile
        </h1>
        <p className="mt-2 text-sm text-ink-secondary">
          Review and update the details saved to your account.
        </p>
      </header>

      <section className="rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-redwood-primary/10 text-redwood-primary">
            <UserRound size={28} strokeWidth={1.8} />
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-ink">
              {user?.fullName || "Your account"}
            </h2>

            <p className="truncate text-sm text-ink-secondary">
              {user?.email || "No email address"}
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(saveProfile)}
          noValidate
          className="mt-6 space-y-4 border-t border-line pt-5"
        >
          <FormField
            id="fullName"
            label="Full name"
            autoComplete="name"
            maxLength={80}
            required
            register={register}
            error={errors.fullName}
            validation={{
              required: "Full name is required.",
              minLength: {
                value: 2,
                message: "Name must be at least 2 characters.",
              },
              maxLength: {
                value: 80,
                message: "Name must be 80 characters or fewer.",
              },
            }}
          />
          <FormField
            id="email"
            label="Email address"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
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

          <dl className="grid gap-4 rounded-xl bg-soft p-4 sm:grid-cols-2">
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-medium text-ink-secondary">
                <MailCheck size={14} /> Email verification
              </dt>
              <dd className="mt-1 text-sm font-semibold text-ink">
                {user?.isVerified ? "Verified" : "Not verified"}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-medium text-ink-secondary">
                <ShieldCheck size={14} /> Phone number
              </dt>
              <dd className="mt-1 text-sm font-semibold text-ink">
                {user?.phone || "Not added"}
                {user?.phone && (
                  <span className="ml-2 text-xs font-normal text-ink-muted">
                    {user?.isPhoneVerified ? "Verified" : "Not verified"}
                  </span>
                )}
              </dd>
            </div>
          </dl>

          {(emailNeedsVerification || !user?.isVerified) && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              {emailNeedsVerification
                ? "We sent a verification code to your new email. Verify it to finish changing your sign-in email."
                : "Verify your email address to keep your account details current."}
              <Link
                to="/account/verify-email"
                className="ml-1 inline-flex items-center gap-1 font-semibold underline"
              >
                Verify email <ArrowRight size={13} />
              </Link>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button type="submit" loading={saving} disabled={saving}>
              Save changes
            </Button>
            <Link
              to="/account/settings"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-rarewolf-primary hover:bg-rarewolf-primary-light"
            >
              Manage account settings <ArrowRight size={15} />
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
};

export default MyProfile;
