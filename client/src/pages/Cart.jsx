import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import { selectIsAuthenticated } from "../features/auth/authSelector";
import { selectCart, setCart } from "../features/cart/cartSlice";
import {
  getCurrentCart,
  removeCartItem,
  updateCartItem,
} from "../services/catalogService";

const fallbackImage = "/images/product-placeholder.svg";

const Cart = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const cart = useSelector(selectCart);
  const items = cart?.items?.filter((item) => item.product) || [];
  const [loading, setLoading] = useState(isAuthenticated);
  const [loadError, setLoadError] = useState("");
  const [pendingProductId, setPendingProductId] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    let isMounted = true;
    getCurrentCart()
      .then((response) => {
        if (isMounted) {
          dispatch(setCart(response?.data?.cart || null));
          setLoadError("");
        }
      })
      .catch((error) => {
        if (isMounted) setLoadError(error.message || "Your cart could not be loaded.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [dispatch, isAuthenticated]);

  const subtotal = items.reduce(
    (total, item) => total + Number(item.product.price) * item.quantity,
    0,
  );

  const changeQuantity = async (product, quantity) => {
    setPendingProductId(product._id);
    try {
      const response = await updateCartItem(product._id, quantity);
      dispatch(setCart(response?.data?.cart || null));
    } catch (error) {
      toast.error(error.message || "Unable to update this cart item.");
    } finally {
      setPendingProductId(null);
    }
  };

  const handleRemove = async (product) => {
    setPendingProductId(product._id);
    try {
      const response = await removeCartItem(product._id);
      dispatch(setCart(response?.data?.cart || null));
      toast.success(`${product.name} removed from your cart.`);
    } catch (error) {
      toast.error(error.message || "Unable to remove this item.");
    } finally {
      setPendingProductId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <section className="mx-auto flex min-h-80 max-w-xl flex-col items-center justify-center rounded-2xl border border-line bg-white px-6 py-12 text-center shadow-card">
        <ShoppingBag size={36} className="text-rarewolf-primary" />
        <h1 className="mt-4 text-2xl font-bold text-ink">Sign in to view your cart</h1>
        <p className="mt-2 text-sm text-ink-secondary">Your cart is saved to your RareWolf account.</p>
        <Link
          to="/login"
          state={{ from: `${location.pathname}${location.search}` }}
          className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-rarewolf-primary px-5 text-sm font-semibold text-white hover:bg-rarewolf-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rarewolf-primary focus-visible:ring-offset-2"
        >
          Sign in
        </Link>
      </section>
    );
  }

  if (loading) {
    return <div className="flex min-h-72 items-center justify-center"><Loader label="Loading your cart" /></div>;
  }

  if (loadError) {
    return (
      <section role="alert" className="rounded-2xl border border-line bg-white p-8 text-center">
        <h1 className="text-xl font-bold text-ink">Your cart could not be loaded</h1>
        <p className="mt-2 text-sm text-ink-secondary">{loadError}</p>
        <Button type="button" variant="secondary" size="sm" className="mt-4" onClick={() => {
          setLoading(true);
          setLoadError("");
          getCurrentCart()
            .then((response) => dispatch(setCart(response?.data?.cart || null)))
            .catch((error) => setLoadError(error.message || "Your cart could not be loaded."))
            .finally(() => setLoading(false));
        }}>
          Try again
        </Button>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto flex min-h-80 max-w-xl flex-col items-center justify-center rounded-2xl border border-line bg-white px-6 py-12 text-center shadow-card">
        <ShoppingBag size={36} className="text-ink-muted" />
        <h1 className="mt-4 text-2xl font-bold text-ink">Your cart is empty</h1>
        <p className="mt-2 text-sm text-ink-secondary">Find something you love and it will show up here.</p>
        <Link to="/products" className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-rarewolf-primary px-5 text-sm font-semibold text-white hover:bg-rarewolf-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rarewolf-primary focus-visible:ring-offset-2">Explore products</Link>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wider text-rarewolf-primary">Your basket</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Shopping cart <span className="text-lg font-medium text-ink-muted">({items.reduce((count, item) => count + item.quantity, 0)} items)</span>
        </h1>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section aria-label="Cart items" className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white shadow-card">
          {items.map(({ product, quantity }) => {
            const busy = pendingProductId === product._id;
            const image = product.images?.[0]?.url || fallbackImage;
            return (
              <article key={product._id} className="flex gap-3 p-4 sm:gap-5 sm:p-5">
                <Link to={`/products/${product.slug}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-soft sm:h-28 sm:w-28">
                  <img src={image} alt={product.images?.[0]?.alt || product.name} onError={(event) => {
                    if (!event.currentTarget.src.endsWith(fallbackImage)) event.currentTarget.src = fallbackImage;
                  }} className="h-full w-full object-contain" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col sm:flex-row sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <Link to={`/products/${product.slug}`} className="line-clamp-2 font-semibold text-ink hover:text-rarewolf-primary">
                      {product.name}
                    </Link>
                    <p className="mt-1 text-sm font-bold text-ink">₹{Number(product.price).toLocaleString("en-IN")}</p>
                    <p className={`mt-1 text-xs ${product.stock > 0 ? "text-success" : "text-danger"}`}>
                      {product.stock > 0 ? `${product.stock} available` : "Out of stock"}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 sm:mt-0 sm:flex-col sm:items-end sm:justify-between">
                    <div className="flex items-center rounded-lg border border-line">
                      <Button type="button" variant="ghost" size="icon" disabled={busy || quantity <= 1} aria-label={`Decrease ${product.name} quantity`} onClick={() => changeQuantity(product, quantity - 1)}>
                        <Minus size={14} />
                      </Button>
                      <span aria-live="polite" className="min-w-8 text-center text-sm font-semibold">{quantity}</span>
                      <Button type="button" variant="ghost" size="icon" disabled={busy || quantity >= product.stock || quantity >= 99} aria-label={`Increase ${product.name} quantity`} onClick={() => changeQuantity(product, quantity + 1)}>
                        <Plus size={14} />
                      </Button>
                    </div>
                    <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => handleRemove(product)} className="text-danger hover:bg-red-50">
                      <Trash2 size={15} /> Remove
                    </Button>
                    <p className="hidden font-semibold text-ink sm:block">₹{(Number(product.price) * quantity).toLocaleString("en-IN")}</p>
                  </div>
                </div>
                <p className="self-end whitespace-nowrap text-sm font-semibold text-ink sm:hidden">₹{(Number(product.price) * quantity).toLocaleString("en-IN")}</p>
              </article>
            );
          })}
        </section>

        <aside className="rounded-2xl border border-line bg-white p-5 shadow-card lg:sticky lg:top-24">
          <h2 className="text-lg font-bold text-ink">Order summary</h2>
          <div className="mt-4 flex justify-between border-b border-line pb-4 text-sm text-ink-secondary">
            <span>Subtotal</span><span className="font-semibold text-ink">₹{subtotal.toLocaleString("en-IN")}</span>
          </div>
          <p className="mt-3 text-xs leading-5 text-ink-muted">Delivery charges and any applicable taxes are calculated during checkout.</p>
          <Link to="/checkout" className="mt-5 flex h-11 w-full items-center justify-center rounded-lg bg-rarewolf-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-rarewolf-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rarewolf-primary focus-visible:ring-offset-2">
            Continue to checkout
          </Link>
          <Link to="/products" className="mt-4 block text-center text-sm font-semibold text-rarewolf-primary hover:underline">Continue shopping</Link>
        </aside>
      </div>
    </div>
  );
};

export default Cart;
