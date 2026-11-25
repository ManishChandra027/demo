import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import { getAdminOrders } from "../../services/adminService";

const statusOptions = ["all", "payment_pending", "placed", "processing", "shipped", "delivered", "cancelled"];

const AdminOrders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({});
  const [status, setStatus] = useState(() => statusOptions.includes(searchParams.get("status")) ? searchParams.get("status") : "all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    getAdminOrders({ status, page, limit: 20 })
      .then((response) => {
        if (!active) return;
        setOrders(response.data.orders || []);
        setPagination(response.data.pagination || {});
        setError("");
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "Orders could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [status, page, retryKey]);

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-rarewolf-primary">Operations</p><h1 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">Orders</h1></div><label><span className="sr-only">Filter orders by status</span><select value={status} onChange={(event) => { const value = event.target.value; setLoading(true); setPage(1); setStatus(value); setSearchParams(value === "all" ? {} : { status: value }); }} className="h-10 rounded-lg border border-line bg-white px-3 text-sm"><option value="all">All statuses</option>{statusOptions.slice(1).map((value) => <option key={value} value={value}>{value.replace("_", " ").replace(/^\w/, (letter) => letter.toUpperCase())}</option>)}</select></label></header>

      {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-danger/30 bg-white p-4 text-sm text-danger">{error}<Button size="sm" variant="secondary" onClick={() => { setLoading(true); setRetryKey((key) => key + 1); }}>Retry</Button></div>}

      <div className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
        {loading ? <div className="flex min-h-48 items-center justify-center"><Loader label="Loading orders" /></div> : orders.length === 0 ? <div className="px-5 py-14 text-center"><ClipboardList size={30} className="mx-auto text-ink-muted" /><h2 className="mt-3 font-bold text-ink">No orders found</h2><p className="mt-1 text-sm text-ink-secondary">Orders matching this filter will appear here.</p></div> : <>
          <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-soft text-xs uppercase tracking-wide text-ink-muted"><tr><th className="px-4 py-3">Order</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Items</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Details</th></tr></thead><tbody className="divide-y divide-line">{orders.map((order) => <tr key={order._id}><td className="px-4 py-4"><p className="font-semibold text-ink">#{order._id.slice(-8).toUpperCase()}</p><p className="text-xs text-ink-muted">{new Date(order.createdAt).toLocaleDateString("en-IN")}</p></td><td className="px-4 py-4"><p className="font-medium text-ink">{order.user?.fullName || "Customer"}</p><p className="text-xs text-ink-muted">{order.user?.email || "—"}</p></td><td className="px-4 py-4 text-ink-secondary">{order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}</td><td className="px-4 py-4 font-semibold text-ink">₹{Number(order.totalAmount).toLocaleString("en-IN")}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${order.status === "cancelled" ? "bg-red-50 text-danger" : order.status === "payment_pending" ? "bg-amber-50 text-amber-700" : "bg-soft text-ink-secondary"}`}>{order.status.replace("_", " ")}</span></td><td className="px-4 py-4 text-right"><Link to={`/admin/orders/${order._id}`} className="text-sm font-semibold text-rarewolf-primary hover:underline">View</Link></td></tr>)}</tbody></table></div>
          <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm text-ink-secondary"><span>{pagination.total || 0} orders · Page {pagination.page || 1} of {Math.max(pagination.pages || 0, 1)}</span><div className="flex gap-2"><Button size="sm" variant="secondary" disabled={!pagination.hasPreviousPage || loading} onClick={() => { setLoading(true); setPage((current) => current - 1); }}>Previous</Button><Button size="sm" variant="secondary" disabled={!pagination.hasNextPage || loading} onClick={() => { setLoading(true); setPage((current) => current + 1); }}>Next</Button></div></div>
        </>}
      </div>
    </section>
  );
};

export default AdminOrders;
