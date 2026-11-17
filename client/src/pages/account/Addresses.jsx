import { useCallback, useEffect, useState } from "react";
import { MapPin, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";

import Button from "../../components/common/Button";
import FormField from "../../components/common/FormField";
import Loader from "../../components/common/Loader";
import { updateUser } from "../../features/auth/authSlice";
import {
  createAddress,
  deleteAddress,
  getAddresses,
  updateAddress,
} from "../../services/addressService";

const emptyForm = {
  fullName: "",
  phone: "",
  addressLine1: "",
  city: "",
  state: "",
  pinCode: "",
  country: "India",
  isDefault: false,
};

const Addresses = () => {
  const dispatch = useDispatch();
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingId, setPendingId] = useState(null);
  const [loadError, setLoadError] = useState("");

  const loadAddresses = useCallback(async () => {
    try {
      const response = await getAddresses();
      const data = response?.data || {};
      setLoadError("");
      setAddresses(data.addresses || []);
      dispatch(updateUser({ defaultAddress: data.defaultAddress || null }));
    } catch (error) {
      setLoadError(error.message || "Unable to load your addresses.");
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    let isMounted = true;

    getAddresses()
      .then((response) => {
        if (!isMounted) return;
        const data = response?.data || {};
        setAddresses(data.addresses || []);
        dispatch(updateUser({ defaultAddress: data.defaultAddress || null }));
      })
      .catch((error) => {
        if (isMounted) {
          setLoadError(error.message || "Unable to load your addresses.");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const startEditing = (address) => {
    setEditingId(address._id);
    setForm({
      fullName: address.fullName || "",
      phone: address.phone || "",
      addressLine1: address.addressLine1 || "",
      city: address.city || "",
      state: address.state || "",
      pinCode: address.pinCode || "",
      country: address.country || "India",
      isDefault: false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    const { isDefault, ...addressFields } = form;
    try {
      if (editingId) {
        const response = await updateAddress(editingId, addressFields);
        setAddresses((current) =>
          current.map((address) =>
            address._id === editingId ? response?.data?.address : address,
          ),
        );
        toast.success("Address updated.");
      } else {
        const response = await createAddress({ ...addressFields, isDefault });
        const createdAddress = response?.data?.address;
        setAddresses((current) => [
          ...(createdAddress?.isDefault
            ? current.map((address) => ({ ...address, isDefault: false }))
            : current),
          createdAddress,
        ]);
        if (createdAddress?.isDefault) {
          dispatch(updateUser({ defaultAddress: createdAddress }));
        }
        toast.success("Address added.");
      }

      resetForm();
      await loadAddresses();
    } catch (error) {
      toast.error(error.message || "Unable to save this address.");
    } finally {
      setSaving(false);
    }
  };

  const handleMakeDefault = async (addressId) => {
    setPendingId(addressId);
    try {
      const response = await updateAddress(addressId, { isDefault: true });
      const selectedAddress = response?.data?.address;
      setAddresses((current) =>
        current.map((address) => ({
          ...address,
          isDefault: address._id === addressId,
        })),
      );
      dispatch(updateUser({ defaultAddress: selectedAddress }));
      toast.success("Default delivery address updated.");
    } catch (error) {
      toast.error(error.message || "Unable to change the default address.");
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (address) => {
    const confirmed = window.confirm(
      `Delete the address for ${address.city}, ${address.pinCode}?`,
    );
    if (!confirmed) return;

    setPendingId(address._id);
    try {
      await deleteAddress(address._id);
      toast.success("Address deleted.");
      await loadAddresses();
    } catch (error) {
      toast.error(error.message || "Unable to delete this address.");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wider text-rarewolf-primary">
          Your account
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Your addresses
        </h1>
        <p className="mt-2 text-sm text-ink-secondary">
          Choose where your orders should be delivered.
        </p>
      </header>

      <section className="rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6">
        <div className="mb-5 flex items-center gap-2">
          {editingId ? <Pencil size={19} /> : <Plus size={20} />}
          <h2 className="text-lg font-bold text-ink">
            {editingId ? "Edit address" : "Add a new address"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="fullName"
              label="Full name"
              autoComplete="name"
              required
              maxLength={80}
              value={form.fullName}
              onChange={handleChange}
            />
            <FormField
              id="phone"
              label="Mobile number"
              type="tel"
              autoComplete="tel"
              inputMode="numeric"
              maxLength={10}
              required
              placeholder="10-digit mobile number"
              value={form.phone}
              onChange={handleChange}
            />
          </div>

          <FormField
            id="addressLine1"
            label="House, street and area"
            autoComplete="street-address"
            maxLength={200}
            required
            value={form.addressLine1}
            onChange={handleChange}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="city"
              label="City"
              autoComplete="address-level2"
              maxLength={100}
              required
              value={form.city}
              onChange={handleChange}
            />
            <FormField
              id="state"
              label="State"
              autoComplete="address-level1"
              maxLength={100}
              required
              value={form.state}
              onChange={handleChange}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="pinCode"
              label="PIN code"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={6}
              required
              value={form.pinCode}
              onChange={handleChange}
            />
            <FormField
              id="country"
              label="Country"
              autoComplete="country-name"
              maxLength={80}
              required
              value={form.country}
              onChange={handleChange}
            />
          </div>

          {!editingId && (
            <label className="flex min-h-10 items-center gap-2 text-sm text-ink-secondary">
              <input
                type="checkbox"
                name="isDefault"
                checked={form.isDefault}
                onChange={handleChange}
                className="h-4 w-4 accent-rarewolf-primary"
              />
              Make this my default delivery address
            </label>
          )}

          <div className="flex flex-wrap gap-3 pt-1">
            <Button type="submit" loading={saving} disabled={saving}>
              {editingId ? "Save changes" : "Add address"}
            </Button>
            {editingId && (
              <Button type="button" variant="secondary" onClick={resetForm}>
                <X size={16} />
                Cancel
              </Button>
            )}
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6">
        <div className="mb-5 flex items-center gap-2">
          <MapPin size={20} className="text-rarewolf-primary" />
          <h2 className="text-lg font-bold text-ink">Saved addresses</h2>
          {!loading && (
            <span className="text-sm text-ink-muted">({addresses.length})</span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader label="Loading saved addresses" />
          </div>
        ) : loadError ? (
          <div
            role="alert"
            className="rounded-lg bg-danger/5 p-4 text-sm text-danger"
          >
            <p>{loadError}</p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => {
                setLoading(true);
                setLoadError("");
                loadAddresses();
              }}
            >
              Try again
            </Button>
          </div>
        ) : addresses.length === 0 ? (
          <p className="rounded-xl bg-soft px-4 py-8 text-center text-sm text-ink-secondary">
            You have not saved a delivery address yet. Add one above to see it
            here.
          </p>
        ) : (
          <ul className="grid gap-4 xl:grid-cols-2">
            {addresses.map((address) => (
              <li
                key={address._id}
                className={`rounded-xl border p-4 ${
                  address.isDefault
                    ? "border-rarewolf-primary/40 bg-rarewolf-primary-light/30"
                    : "border-line bg-white"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-ink">{address.fullName}</h3>
                      {address.isDefault && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rarewolf-primary-light px-2.5 py-1 text-xs font-semibold text-rarewolf-primary">
                          <Star size={13} fill="currentColor" />
                          Default
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-ink-secondary">
                      {address.phone}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(address)}
                      aria-label={`Edit address for ${address.city}`}
                    >
                      <Pencil size={15} />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="icon"
                      disabled={address.isDefault || pendingId === address._id}
                      onClick={() => handleDelete(address)}
                      aria-label={
                        address.isDefault
                          ? "Set another address as default before deleting this address"
                          : `Delete address for ${address.city}`
                      }
                      title={
                        address.isDefault
                          ? "Set another address as default before deleting this address"
                          : "Delete address"
                      }
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>

                <address className="mt-3 not-italic text-sm leading-6 text-ink-secondary">
                  {address.addressLine1}
                  <br />
                  {address.city}, {address.state} {address.pinCode}
                  <br />
                  {address.country}
                </address>

                {!address.isDefault && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="mt-4"
                    loading={pendingId === address._id}
                    disabled={pendingId !== null}
                    onClick={() => handleMakeDefault(address._id)}
                  >
                    <Star size={15} />
                    Make default
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default Addresses;
