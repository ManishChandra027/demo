import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import { getAdminOrder, updateAdminOrderStatus } from "../../services/adminService";

const currency = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const AdminOrderDetails = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingStatus, setPendingStatus] = useState("");
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  const loadOrder = useCallback(async () => {
    const response = await getAdminOrder(orderId);
    setOrder(response.data.order);
    setError("");
  }, [orderId]);

  useEffect(() => {
    let active = true;
    Promise.resolve()
      .then(() => {
        if (active) setLoading(true);
        return getAdminOrder(orderId);
      })
      .then((response) => {
        if (active) {
          setOrder(response.data.order);
          setError("");
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "Order could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [orderId, retryKey]);

  const changeStatus = async (status) => {
    if (status === "cancelled" && !window.confirm("Cancel this order? Reserved stock will be returned.")) return;
    setPendingStatus(status);
    try {
      await updateAdminOrderStatus(orderId, status);
      await loadOrder();
      toast.success(status === "cancelled" ? "Order cancelled and stock restored." : `Order marked ${status}.`);
    } catch (requestError) {
      toast.error(requestError.message || "Order status could not be updated.");
    } finally {
      setPendingStatus("");
    }
  };

  if (loading) return <div className="flex min-h-64 items-center justify-center"><Loader label="Loading order" /></div>;
  if (error || !order) return <section className="space-y-4"><Link to="/admin/orders" className="inline-flex items-center gap-2 text-sm font-semibold text-rarewolf-primary"><ArrowLeft size={16} />Back to orders</Link><div role="alert" className="rounded-xl border border-danger/30 bg-white p-5 text-sm text-danger">{error || "Order not found."} <Button size="sm" variant="secondary" className="ml-3" onClick={() => { setLoading(true); setRetryKey((key) => key + 1); }}>Retry</Button></div></section>;

  const actions = order.status === "placed"
    ? [{ status: "processing", label: "Process order", variant: "primary" }, { status: "cancelled", label: "Cancel order", variant: "danger" }]
    : order.status === "processing"
      ? [{ status: "shipped", label: "Mark shipped", variant: "primary" }]
      : order.status === "shipped"
        ? [{ status: "delivered", label: "Mark delivered", variant: "primary" }]
        : [];
  const address = order.deliveryAddress || {};

  return (
    <section className="space-y-5">
      <Link to="/admin/orders" className="inline-flex items-center gap-2 text-sm font-semibold text-rarewolf-primary hover:underline"><ArrowLeft size={16} />Back to orders</Link>
      <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-rarewolf-primary">Order operations</p><h1 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">Order #{order._id.slice(-8).toUpperCase()}</h1><p className="mt-1 text-sm text-ink-secondary">Placed {new Date(order.createdAt).toLocaleString("en-IN")}</p></div><div className="flex flex-wrap gap-2">{actions.map((action) => <Button key={action.status} variant={action.variant} loading={pendingStatus === action.status} disabled={Boolean(pendingStatus)} onClick={() => changeStatus(action.status)}>{action.label}</Button>)}</div></header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <section className="overflow-hidden rounded-xl border border-line bg-white shadow-card"><div className="flex items-center gap-2 border-b border-line px-5 py-4"><PackageCheck size={18} className="text-rarewolf-primary" /><h2 className="font-bold text-ink">Items</h2></div><div className="divide-y divide-line">{order.items?.map((item, index) => <div key={`${item.slug}-${index}`} className="flex items-center gap-4 p-4"><img src={item.image || "/images/product-placeholder.svg"} alt="" className="h-16 w-16 rounded-lg bg-soft object-contain" /><div className="min-w-0 flex-1"><p className="font-semibold text-ink">{item.name}</p><p className="text-sm text-ink-secondary">{currency(item.unitPrice)} × {item.quantity}</p></div><p className="font-semibold text-ink">{currency(item.lineTotal)}</p></div>)}</div><div className="space-y-2 border-t border-line bg-soft/50 px-5 py-4 text-sm"><div className="flex justify-between text-ink-secondary"><span>Subtotal</span><span>{currency(order.subtotal)}</span></div><div className="flex justify-between text-ink-secondary"><span>Shipping</span><span>{currency(order.shippingAmount)}</span></div><div className="flex justify-between border-t border-line pt-2 text-base font-bold text-ink"><span>Total</span><span>{currency(order.totalAmount)}</span></div></div></section>
          <section className="rounded-xl border border-line bg-white p-5 shadow-card"><h2 className="font-bold text-ink">Delivery address snapshot</h2><p className="mt-3 font-semibold text-ink">{address.fullName}</p><p className="mt-1 text-sm leading-6 text-ink-secondary">{address.addressLine1}<br />{[address.city, address.state, address.pinCode].filter(Boolean).join(", ")}<br />{address.country}</p><p className="mt-2 text-sm text-ink-secondary">{address.phone}</p></section>
        </div>

        <aside className="space-y-5"><section className="rounded-xl border border-line bg-white p-5 shadow-card"><h2 className="font-bold text-ink">Customer</h2><p className="mt-3 font-medium text-ink">{order.user?.fullName || "Customer"}</p><p className="mt-1 break-all text-sm text-ink-secondary">{order.user?.email || "—"}</p></section><section className="rounded-xl border border-line bg-white p-5 shadow-card"><h2 className="font-bold text-ink">Status and payment</h2><dl className="mt-3 space-y-3 text-sm"><div className="flex justify-between gap-3"><dt className="text-ink-secondary">Order status</dt><dd className="font-semibold capitalize text-ink">{order.status}</dd></div><div className="flex justify-between gap-3"><dt className="text-ink-secondary">Payment method</dt><dd className="font-semibold uppercase text-ink">{order.paymentMethod}</dd></div><div className="flex justify-between gap-3"><dt className="text-ink-secondary">Payment status</dt><dd className="font-semibold capitalize text-ink">{order.paymentStatus}</dd></div></dl><p className="mt-4 border-t border-line pt-3 text-xs leading-5 text-ink-muted">Payment status is read-only. COD payment remains pending until payment is verified through a separate payment process.</p></section></aside>
      </div>
    </section>
  );
};

export default AdminOrderDetails;
