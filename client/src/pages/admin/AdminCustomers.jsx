import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Users } from "lucide-react";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import { getAdminCustomers } from "../../services/adminService";

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    getAdminCustomers({ search, page, limit: 20 })
      .then((response) => {
        if (active) {
          setCustomers(response.data.customers || []);
          setPagination(response.data.pagination || {});
          setError("");
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "Customers could not be loaded.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [search, page, retryKey]);

  const submitSearch = (event) => {
    event.preventDefault();
    setLoading(true);
    setPage(1);
    setSearch(searchInput.trim());
  };

  return (
    <section className="space-y-5">
      <header><p className="text-sm font-semibold uppercase tracking-[0.16em] text-rarewolf-primary">Customer overview</p><h1 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">Customers</h1><p className="mt-2 text-sm text-ink-secondary">Search customer profiles and view their order history.</p></header>
      <form onSubmit={submitSearch} className="flex flex-col gap-2 rounded-xl border border-line bg-white p-4 shadow-card sm:flex-row"><label className="relative min-w-0 flex-1"><span className="sr-only">Search name, email or phone</span><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search name, email or phone" className="h-10 w-full rounded-lg border border-line pl-10 pr-3 text-sm outline-none focus:border-rarewolf-primary" /></label><Button type="submit">Search customers</Button></form>
      {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-danger/30 bg-white p-4 text-sm text-danger">{error}<Button size="sm" variant="secondary" onClick={() => { setLoading(true); setRetryKey((key) => key + 1); }}>Retry</Button></div>}
      <section className="overflow-hidden rounded-xl border border-line bg-white shadow-card">{loading ? <div className="flex min-h-48 items-center justify-center"><Loader label="Loading customers" /></div> : customers.length === 0 ? <div className="px-5 py-14 text-center"><Users size={30} className="mx-auto text-ink-muted" /><h2 className="mt-3 font-bold text-ink">No customers found</h2><p className="mt-1 text-sm text-ink-secondary">Try another name, email or phone number.</p></div> : <><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-soft text-xs uppercase tracking-wide text-ink-muted"><tr><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Verification</th><th className="px-4 py-3">Joined</th><th className="px-4 py-3 text-right">Orders</th></tr></thead><tbody className="divide-y divide-line">{customers.map((customer) => <tr key={customer._id}><td className="px-4 py-4"><p className="font-semibold text-ink">{customer.fullName}</p><p className="text-xs text-ink-muted">{customer.email}</p></td><td className="px-4 py-4 text-ink-secondary">{customer.phone || "—"}</td><td className="px-4 py-4 text-xs text-ink-secondary">Email {customer.isVerified ? "verified" : "unverified"}<br />Phone {customer.isPhoneVerified ? "verified" : "unverified"}</td><td className="px-4 py-4 text-ink-secondary">{new Date(customer.createdAt).toLocaleDateString("en-IN")}</td><td className="px-4 py-4 text-right"><Link to={`/admin/customers/${customer._id}`} className="font-semibold text-rarewolf-primary hover:underline">View orders</Link></td></tr>)}</tbody></table></div><div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm text-ink-secondary"><span>{pagination.total || 0} customers · Page {pagination.page || 1} of {Math.max(pagination.pages || 0, 1)}</span><div className="flex gap-2"><Button size="sm" variant="secondary" disabled={!pagination.hasPreviousPage || loading} onClick={() => { setLoading(true); setPage((current) => current - 1); }}>Previous</Button><Button size="sm" variant="secondary" disabled={!pagination.hasNextPage || loading} onClick={() => { setLoading(true); setPage((current) => current + 1); }}>Next</Button></div></div></>}</section>
    </section>
  );
};

export default AdminCustomers;
