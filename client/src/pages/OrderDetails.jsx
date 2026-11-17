import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { CheckCircle2, MapPin, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { useSelector } from "react-redux";

import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import { selectIsAuthenticated } from "../features/auth/authSelector";
import { cancelOrder, getOrder } from "../services/orderService";

const OrderDetails = ({ confirmation = false }) => {
  const { orderId } = useParams();
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [orderResult, setOrderResult] = useState(() => ({
    orderId: location.state?.order?._id || null,
    order: location.state?.order || null,
    error: "",
  }));
  const [cancelling, setCancelling] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let isMounted = true;
    getOrder(orderId)
      .then((response) => {
        if (isMounted) {
          setOrderResult({ orderId, order: response?.data?.order || null, error: "" });
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setOrderResult({
            orderId,
            order: null,
            error: requestError.message || "Order details could not be loaded.",
          });
        }
      });
    return () => { isMounted = false; };
  }, [isAuthenticated, orderId, retryKey]);

  const currentResult = orderResult.orderId === orderId ? orderResult : null;
  const order = currentResult?.order || null;
  const error = currentResult?.error || "";
  const loading = !currentResult;

  const handleCancel = async () => {
    if (!window.confirm("Cancel this order? Reserved stock will be returned to the catalogue.")) return;
    setCancelling(true);
    try {
      const response = await cancelOrder(orderId);
      setOrderResult({ orderId, order: response?.data?.order || null, error: "" });
      toast.success("Your order has been cancelled.");
    } catch (requestError) {
      toast.error(requestError.message || "Unable to cancel this order.");
    } finally {
      setCancelling(false);
    }
  };

  if (!isAuthenticated) {
    return <section className="rounded-2xl border border-line bg-white p-8 text-center"><h1 className="font-bold text-ink">Sign in to view this order</h1><Link to="/login" state={{ from: location.pathname }} className="mt-4 inline-block text-sm font-semibold text-rarewolf-primary">Sign in</Link></section>;
  }
  if (loading) return <div className="flex min-h-64 items-center justify-center"><Loader label="Loading order" /></div>;
  if (error && !order) {
    return <section role="alert" className="rounded-2xl border border-line bg-white p-8 text-center"><p className="text-sm text-danger">{error}</p><Button type="button" size="sm" variant="secondary" className="mt-4" onClick={() => { setOrderResult({ orderId: null, order: null, error: "" }); setRetryKey((current) => current + 1); }}>Try again</Button><Link to="/orders" className="ml-3 text-sm font-semibold text-rarewolf-primary">Order history</Link></section>;
  }
  if (!order) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {confirmation && order.status !== "cancelled" && (
        <section className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center sm:p-8">
          <CheckCircle2 size={42} className="mx-auto text-success" />
          <p className="mt-3 text-sm font-semibold uppercase tracking-wider text-success">Order placed</p>
          <h1 className="mt-1 text-2xl font-bold text-ink">Thank you for your order!</h1>
          <p className="mt-2 text-sm text-ink-secondary">Order #{order._id.slice(-8).toUpperCase()} · Payment: Cash on Delivery</p>
        </section>
      )}

      <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
          <div><h1 className="text-xl font-bold text-ink">Order details</h1><p className="mt-1 text-sm text-ink-muted">Placed {new Date(order.createdAt).toLocaleString("en-IN")}</p></div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${order.status === "cancelled" ? "bg-red-50 text-danger" : "bg-green-50 text-success"}`}>{order.status}</span>
        </div>

        <ul className="divide-y divide-line">
          {order.items?.map((item, index) => (
            <li key={`${item.slug}-${index}`} className="flex items-center gap-3 py-4">
              <img src={item.image || "/images/product-placeholder.svg"} alt="" className="h-16 w-16 rounded-lg bg-soft object-contain" />
              <div className="min-w-0 flex-1"><p className="font-semibold text-ink">{item.name}</p><p className="mt-1 text-xs text-ink-secondary">Qty {item.quantity} × ₹{Number(item.unitPrice).toLocaleString("en-IN")}</p></div>
              <p className="shrink-0 text-sm font-semibold text-ink">₹{Number(item.lineTotal).toLocaleString("en-IN")}</p>
            </li>
          ))}
        </ul>

        <div className="grid gap-5 border-t border-line pt-5 sm:grid-cols-2">
          <div><h2 className="flex items-center gap-2 font-semibold text-ink"><MapPin size={16} /> Delivery address</h2><address className="mt-2 text-sm not-italic leading-6 text-ink-secondary">{order.deliveryAddress.fullName}<br />{order.deliveryAddress.addressLine1}<br />{order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.pinCode}<br />{order.deliveryAddress.phone}<br />{order.deliveryAddress.country}</address></div>
          <div><h2 className="flex items-center gap-2 font-semibold text-ink"><PackageCheck size={16} /> Payment and total</h2><p className="mt-2 text-sm text-ink-secondary">Cash on Delivery · Payment {order.paymentStatus}</p><p className="mt-2 text-lg font-bold text-ink">₹{Number(order.totalAmount).toLocaleString("en-IN")}</p></div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 border-t border-line pt-5">
          <Link to="/orders" className="inline-flex h-10 items-center rounded-lg border border-line px-4 text-sm font-semibold text-ink hover:bg-soft">All orders</Link>
          {order.status === "placed" && <Button type="button" variant="danger" size="sm" loading={cancelling} disabled={cancelling} onClick={handleCancel}>Cancel order</Button>}
          <Link to="/products" className="inline-flex h-10 items-center rounded-lg px-3 text-sm font-semibold text-rarewolf-primary hover:underline">Continue shopping</Link>
        </div>
      </section>
    </div>
  );
};

export default OrderDetails;
