import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PackageCheck } from "lucide-react";
import { useSelector } from "react-redux";

import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import { selectIsAuthenticated } from "../features/auth/authSelector";
import { getOrders } from "../services/orderService";

const Orders = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(isAuthenticated);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let isMounted = true;
    getOrders()
      .then((response) => {
        if (isMounted) {
          setOrders(response?.data?.orders || []);
          setError("");
        }
      })
      .catch((requestError) => {
        if (isMounted) setError(requestError.message || "Your orders could not be loaded.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [isAuthenticated, retryKey]);

  if (!isAuthenticated) {
    return (
      <section className="rounded-2xl border border-line bg-white p-8 text-center">
        <h1 className="text-xl font-bold text-ink">Sign in to view your orders</h1>
        <Link to="/login" state={{ from: "/orders" }} className="mt-4 inline-block text-sm font-semibold text-rarewolf-primary">Sign in</Link>
      </section>
    );
  }
  if (loading) return <div className="flex min-h-64 items-center justify-center"><Loader label="Loading your orders" /></div>;
  if (error) {
    return (
      <section role="alert" className="rounded-2xl border border-line bg-white p-8 text-center">
        <p className="text-sm text-danger">{error}</p>
        <Button type="button" variant="secondary" size="sm" className="mt-4" onClick={() => { setLoading(true); setRetryKey((current) => current + 1); }}>Try again</Button>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <header><p className="text-sm font-semibold uppercase tracking-wider text-rarewolf-primary">Your account</p><h1 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">Your orders</h1></header>
      {orders.length === 0 ? (
        <section className="rounded-2xl border border-line bg-white p-10 text-center shadow-card">
          <PackageCheck size={34} className="mx-auto text-ink-muted" />
          <h2 className="mt-3 text-lg font-bold text-ink">No orders yet</h2>
          <p className="mt-1 text-sm text-ink-secondary">Your orders will appear here after checkout.</p>
          <Link to="/products" className="mt-4 inline-block text-sm font-semibold text-rarewolf-primary">Browse products</Link>
        </section>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order._id} className="rounded-2xl border border-line bg-white p-4 shadow-card sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
                <div><p className="text-xs text-ink-muted">Order placed {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p><p className="mt-1 text-xs text-ink-secondary">Order #{order._id.slice(-8).toUpperCase()}</p></div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${order.status === "cancelled" ? "bg-red-50 text-danger" : order.status === "payment_pending" ? "bg-amber-50 text-amber-700" : "bg-green-50 text-success"}`}>{order.status.replace("_", " ")}</span>
              </div>
              <div className="flex items-center justify-between gap-4 pt-4">
                <div className="flex min-w-0 items-center gap-3">
                  {order.items?.slice(0, 3).map((item, index) => (
                    <img key={`${item.slug}-${index}`} src={item.image || "/images/product-placeholder.svg"} alt="" className="h-12 w-12 rounded-lg bg-soft object-contain" />
                  ))}
                  <p className="text-sm text-ink-secondary">{order.items?.length || 0} product{order.items?.length === 1 ? "" : "s"}</p>
                </div>
                <div className="shrink-0 text-right"><p className="font-bold text-ink">₹{Number(order.totalAmount).toLocaleString("en-IN")}</p><Link to={`/orders/${order._id}`} className="mt-1 inline-block text-xs font-semibold text-rarewolf-primary hover:underline">View details</Link></div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Orders;
