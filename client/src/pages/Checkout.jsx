import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Check, MapPin, Plus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import Button from "../components/common/Button";
import FormField from "../components/common/FormField";
import Loader from "../components/common/Loader";
import { selectIsAuthenticated } from "../features/auth/authSelector";
import { setCart } from "../features/cart/cartSlice";
import { getAddresses, createAddress } from "../services/addressService";
import { getCurrentCart } from "../services/catalogService";
import { createOrder, verifyRazorpayPayment } from "../services/orderService";
import { openRazorpayCheckout } from "../lib/razorpay";
import { toast } from "sonner";

const blankAddress = {
  fullName: "",
  phone: "",
  addressLine1: "",
  city: "",
  state: "",
  pinCode: "",
  country: "India",
};

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [addresses, setAddresses] = useState([]);
  const [cart, setLocalCart] = useState(null);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [addingAddress, setAddingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState(blankAddress);
  const [loading, setLoading] = useState(isAuthenticated);
  const [loadError, setLoadError] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let isMounted = true;

    Promise.all([getAddresses(), getCurrentCart()])
      .then(([addressResponse, cartResponse]) => {
        if (!isMounted) return;
        const addressData = addressResponse?.data || {};
        const fetchedAddresses = addressData.addresses || [];
        setAddresses(fetchedAddresses);
        setSelectedAddressId(addressData.defaultAddress?._id || fetchedAddresses[0]?._id || "");
        setLocalCart(cartResponse?.data?.cart || null);
        dispatch(setCart(cartResponse?.data?.cart || null));
        setLoadError("");
      })
      .catch((error) => {
        if (isMounted) setLoadError(error.message || "Checkout details could not be loaded.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [dispatch, isAuthenticated]);

  const items = cart?.items?.filter((item) => item.product) || [];
  const subtotal = items.reduce(
    (total, item) => total + Number(item.product.price) * item.quantity,
    0,
  );

  const handleAddressChange = (event) => {
    const { name, value } = event.target;
    setAddressForm((current) => ({ ...current, [name]: value }));
  };

  const handleAddAddress = async (event) => {
    event.preventDefault();
    setSavingAddress(true);
    try {
      const response = await createAddress(addressForm);
      const address = response?.data?.address;
      if (!address?._id) throw new Error("The new address could not be saved.");
      setAddresses((current) => [...current, address]);
      setSelectedAddressId(address._id);
      setAddressForm(blankAddress);
      setAddingAddress(false);
      toast.success("Delivery address saved.");
    } catch (error) {
      toast.error(error.message || "Unable to save this delivery address.");
    } finally {
      setSavingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId || placingOrder) return;
    setPlacingOrder(true);
    let order;
    let confirmedOrder;
    try {
      const response = await createOrder(selectedAddressId, paymentMethod);
      order = response?.data?.order;
      if (!order?._id) throw new Error("Order confirmation could not be loaded.");

      if (paymentMethod === "cod") {
        dispatch(setCart(null));
        navigate(`/orders/${order._id}/confirmation`, { state: { order }, replace: true });
        return;
      }

      dispatch(setCart(null));
      const payment = {
        keyId: response.data.keyId,
        payment: response.data.payment,
      };
      const completed = await openRazorpayCheckout({
        order,
        payment,
        onSuccess: async (paymentDetails) => {
          const verification = await verifyRazorpayPayment(order._id, paymentDetails);
          confirmedOrder = verification?.data?.order;
          if (!confirmedOrder?._id) throw new Error("Payment confirmation could not be loaded.");
        },
      });
      if (completed) {
        navigate(`/orders/${order._id}/confirmation`, { state: { order: confirmedOrder }, replace: true });
      } else {
        navigate(`/orders/${order._id}`, { state: { order }, replace: true });
        toast.info("Payment was not completed. You can retry it from your order.");
      }
    } catch (error) {
      if (order?._id) {
        dispatch(setCart(null));
        navigate(`/orders/${order._id}`, { state: { order }, replace: true });
      }
      toast.error(error.message || "Unable to place your order.");
    } finally {
      setPlacingOrder(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <section className="mx-auto max-w-xl rounded-2xl border border-line bg-white p-8 text-center shadow-card">
        <h1 className="text-2xl font-bold text-ink">Sign in to continue to checkout</h1>
        <Link to="/login" state={{ from: `${location.pathname}${location.search}` }} className="mt-5 inline-flex h-11 items-center rounded-lg bg-rarewolf-primary px-5 text-sm font-semibold text-white">Sign in</Link>
      </section>
    );
  }

  if (loading) return <div className="flex min-h-72 items-center justify-center"><Loader label="Loading checkout" /></div>;
  if (loadError) {
    return (
      <section role="alert" className="rounded-2xl border border-line bg-white p-8 text-center">
        <h1 className="font-bold text-ink">Checkout could not be loaded</h1>
        <p className="mt-2 text-sm text-danger">{loadError}</p>
        <Link to="/cart" className="mt-4 inline-block text-sm font-semibold text-rarewolf-primary">Return to cart</Link>
      </section>
    );
  }
  if (items.length === 0) {
    return (
      <section className="rounded-2xl border border-line bg-white p-10 text-center">
        <h1 className="text-xl font-bold text-ink">Your cart is empty</h1>
        <Link to="/products" className="mt-4 inline-block text-sm font-semibold text-rarewolf-primary">Browse products</Link>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wider text-rarewolf-primary">Almost there</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">Checkout</h1>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2"><MapPin size={19} className="text-rarewolf-primary" /><h2 className="text-lg font-bold text-ink">Delivery address</h2></div>
              {!addingAddress && <Button type="button" size="sm" variant="secondary" onClick={() => setAddingAddress(true)}><Plus size={15} /> Add new</Button>}
            </div>

            {addresses.length > 0 && !addingAddress && (
              <fieldset className="mt-4 space-y-3">
                <legend className="sr-only">Choose a saved delivery address</legend>
                {addresses.map((address) => (
                  <label key={address._id} className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors ${selectedAddressId === address._id ? "border-rarewolf-primary bg-rarewolf-primary-light/30" : "border-line hover:bg-soft"}`}>
                    <input type="radio" name="deliveryAddress" value={address._id} checked={selectedAddressId === address._id} onChange={() => setSelectedAddressId(address._id)} className="mt-1 accent-rarewolf-primary" />
                    <span className="min-w-0 text-sm text-ink-secondary">
                      <span className="flex flex-wrap items-center gap-2 font-semibold text-ink">{address.fullName}{address.isDefault && <span className="rounded-full bg-rarewolf-primary-light px-2 py-0.5 text-[10px] uppercase text-rarewolf-primary">Default</span>}</span>
                      <span className="mt-1 block">{address.addressLine1}, {address.city}, {address.state} {address.pinCode}</span>
                      <span className="mt-1 block">{address.phone} · {address.country}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
            )}

            {addresses.length === 0 && !addingAddress && (
              <p className="mt-4 text-sm text-ink-secondary">Add a delivery address to place your order.</p>
            )}

            {addingAddress && (
              <form onSubmit={handleAddAddress} className="mt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField id="fullName" label="Full name" autoComplete="name" required value={addressForm.fullName} onChange={handleAddressChange} />
                  <FormField id="phone" label="Mobile number" type="tel" inputMode="numeric" autoComplete="tel" maxLength={10} required value={addressForm.phone} onChange={handleAddressChange} />
                </div>
                <FormField id="addressLine1" label="House, street and area" autoComplete="street-address" required value={addressForm.addressLine1} onChange={handleAddressChange} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField id="city" label="City" autoComplete="address-level2" required value={addressForm.city} onChange={handleAddressChange} />
                  <FormField id="state" label="State" autoComplete="address-level1" required value={addressForm.state} onChange={handleAddressChange} />
                  <FormField id="pinCode" label="PIN code" inputMode="numeric" autoComplete="postal-code" maxLength={6} required value={addressForm.pinCode} onChange={handleAddressChange} />
                  <FormField id="country" label="Country" autoComplete="country-name" required value={addressForm.country} onChange={handleAddressChange} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" size="sm" loading={savingAddress} disabled={savingAddress}><Check size={15} /> Save address</Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setAddingAddress(false)}>Cancel</Button>
                </div>
              </form>
            )}
          </section>

          <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
            <h2 className="text-lg font-bold text-ink">Payment method</h2>
            <fieldset className="mt-4 space-y-3">
              <legend className="sr-only">Choose a payment method</legend>
              <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${paymentMethod === "cod" ? "border-rarewolf-primary bg-rarewolf-primary-light/30" : "border-line hover:bg-soft"}`}>
                <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} className="mt-1 accent-rarewolf-primary" />
                <span><span className="font-semibold text-ink">Cash on Delivery (COD)</span><span className="mt-1 block text-sm text-ink-secondary">Pay when your order arrives.</span></span>
              </label>
              <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${paymentMethod === "razorpay" ? "border-rarewolf-primary bg-rarewolf-primary-light/30" : "border-line hover:bg-soft"}`}>
                <input type="radio" name="paymentMethod" value="razorpay" checked={paymentMethod === "razorpay"} onChange={() => setPaymentMethod("razorpay")} className="mt-1 accent-rarewolf-primary" />
                <span><span className="font-semibold text-ink">Pay online with Razorpay</span><span className="mt-1 block text-sm text-ink-secondary">UPI, cards, net banking and supported wallets.</span></span>
              </label>
            </fieldset>
          </section>
        </div>

        <aside className="rounded-2xl border border-line bg-white p-5 shadow-card lg:sticky lg:top-24">
          <h2 className="text-lg font-bold text-ink">Order summary</h2>
          <ul className="mt-4 max-h-60 space-y-3 overflow-y-auto border-b border-line pb-4">
            {items.map(({ product, quantity }) => (
              <li key={product._id} className="flex justify-between gap-3 text-sm">
                <span className="min-w-0 text-ink-secondary"><span className="line-clamp-2 text-ink">{product.name}</span><span>Qty {quantity}</span></span>
                <span className="shrink-0 font-medium text-ink">₹{(Number(product.price) * quantity).toLocaleString("en-IN")}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-3 text-sm">
            <p className="flex justify-between text-ink-secondary"><span>Subtotal</span><span className="font-semibold text-ink">₹{subtotal.toLocaleString("en-IN")}</span></p>
            <p className="flex justify-between text-ink-secondary"><span>Delivery</span><span className="font-semibold text-ink">₹0</span></p>
            <p className="flex justify-between border-t border-line pt-3 text-base font-bold text-ink"><span>Total</span><span>₹{subtotal.toLocaleString("en-IN")}</span></p>
          </div>
          <Button type="button" fullWidth className="mt-5" loading={placingOrder} disabled={placingOrder || !selectedAddressId || addingAddress} onClick={handlePlaceOrder}>{paymentMethod === "cod" ? "Place COD order" : "Pay securely with Razorpay"}</Button>
          <Link to="/cart" className="mt-4 block text-center text-sm font-semibold text-rarewolf-primary hover:underline">Back to cart</Link>
        </aside>
      </div>
    </div>
  );
};

export default Checkout;
