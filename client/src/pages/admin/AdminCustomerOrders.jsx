import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ClipboardList } from "lucide-react";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import { getAdminCustomerOrders } from "../../services/adminService";

const currency = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const AdminCustomerOrders = () => {
  const { customerId } = useParams();
  const [result, setResult] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    getAdminCustomerOrders(customerId, { page, limit: 20 })
      .then((response) => {
        if (active) { setResult(response.data); setError(""); }
      })
      .catch((requestError) => { if (active) setError(requestError.message || "Customer orders could not be loaded."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [customerId, page, retryKey]);

  return (
    <section className="space-y-5">
      <Link to="/admin/customers" className="inline-flex items-center gap-2 text-sm font-semibold text-rarewolf-primary hover:underline"><ArrowLeft size={16} />Back to customers</Link>
      {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-danger/30 bg-white p-4 text-sm text-danger">{error}<Button size="sm" variant="secondary" onClick={() => { setLoading(true); setRetryKey((key) => key + 1); }}>Retry</Button></div>}
      {loading ? <div className="flex min-h-56 items-center justify-center rounded-xl border border-line bg-white"><Loader label="Loading customer orders" /></div> : result && <>
        <header className="rounded-xl border border-line bg-white p-5 shadow-card"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-rarewolf-primary">Customer</p><h1 className="mt-1 text-2xl font-bold text-ink">{result.customer.fullName}</h1><p className="mt-1 text-sm text-ink-secondary">{result.customer.email} · {result.customer.phone || "No phone saved"}</p><p className="mt-2 text-xs text-ink-muted">Email {result.customer.isVerified ? "verified" : "unverified"} · Phone {result.customer.isPhoneVerified ? "verified" : "unverified"}</p></header>
        <section className="overflow-hidden rounded-xl border border-line bg-white shadow-card"><div className="flex items-center justify-between border-b border-line px-5 py-4"><div><h2 className="font-bold text-ink">Order history</h2><p className="mt-1 text-xs text-ink-muted">Orders belonging to this customer</p></div><ClipboardList size={19} className="text-rarewolf-primary" /></div>{result.orders?.length ? <><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-soft text-xs uppercase tracking-wide text-ink-muted"><tr><th className="px-4 py-3">Order</th><th className="px-4 py-3">Items</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Details</th></tr></thead><tbody className="divide-y divide-line">{result.orders.map((order) => <tr key={order._id}><td className="px-4 py-4"><p className="font-semibold text-ink">#{order._id.slice(-8).toUpperCase()}</p><p className="text-xs text-ink-muted">{new Date(order.createdAt).toLocaleDateString("en-IN")}</p></td><td className="px-4 py-4 text-ink-secondary">{order.itemCount}</td><td className="px-4 py-4 font-semibold text-ink">{currency(order.totalAmount)}</td><td className="px-4 py-4"><span className="capitalize text-ink-secondary">{order.status}</span></td><td className="px-4 py-4 text-right"><Link to={`/admin/orders/${order._id}`} className="font-semibold text-rarewolf-primary hover:underline">Open</Link></td></tr>)}</tbody></table></div><div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm text-ink-secondary"><span>{result.pagination.total} orders · Page {result.pagination.page} of {Math.max(result.pagination.pages, 1)}</span><div className="flex gap-2"><Button size="sm" variant="secondary" disabled={!result.pagination.hasPreviousPage || loading} onClick={() => { setLoading(true); setPage((current) => current - 1); }}>Previous</Button><Button size="sm" variant="secondary" disabled={!result.pagination.hasNextPage || loading} onClick={() => { setLoading(true); setPage((current) => current + 1); }}>Next</Button></div></div></> : <p className="px-5 py-12 text-center text-sm text-ink-secondary">This customer has not placed any orders.</p>}</section>
      </>}
    </section>
  );
};

export default AdminCustomerOrders;
