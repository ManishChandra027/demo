import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRightLeft, Boxes } from "lucide-react";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import {
  adjustAdminStock,
  getAdminProducts,
  getLowStockProducts,
} from "../../services/adminService";

const AdminInventory = () => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({});
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [threshold, setThreshold] = useState(5);
  const [page, setPage] = useState(1);
  const [adjustments, setAdjustments] = useState({});
  const [pendingId, setPendingId] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    const params = { page, limit: 20 };
    const request = lowStockOnly
      ? getLowStockProducts({ ...params, threshold })
      : getAdminProducts({ ...params, status: "all" });

    request
      .then((response) => {
        if (!active) return;
        setProducts(response.data.products || []);
        setPagination(response.data.pagination || {});
        setErrors({});
      })
      .catch((requestError) => {
        if (active) setErrors({ page: requestError.message || "Inventory could not be loaded." });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [lowStockOnly, threshold, page, refreshKey]);

  const saveAdjustment = async (event, product) => {
    event.preventDefault();
    const adjustment = Number(adjustments[product._id] ?? 1);
    if (!Number.isInteger(adjustment) || adjustment === 0 || Math.abs(adjustment) > 10000) {
      setErrors((current) => ({ ...current, [product._id]: "Enter a non-zero whole number between -10,000 and 10,000." }));
      return;
    }
    if (adjustment < 0 && Math.abs(adjustment) > product.stock) {
      setErrors((current) => ({ ...current, [product._id]: "Adjustment cannot reduce stock below zero." }));
      return;
    }

    setPendingId(product._id);
    setErrors((current) => ({ ...current, [product._id]: "" }));
    try {
      await adjustAdminStock(product._id, adjustment);
      setLoading(true);
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      setErrors((current) => ({ ...current, [product._id]: requestError.message || "Stock could not be adjusted." }));
    } finally {
      setPendingId("");
    }
  };

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-rarewolf-primary">Operations</p>
          <h1 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">Inventory</h1>
          <p className="mt-2 text-sm text-ink-secondary">Enter a positive number to add units or a negative number to remove them. Updates are applied atomically.</p>
        </div>
        <Link to="/admin/products" className="inline-flex items-center gap-2 text-sm font-semibold text-rarewolf-primary hover:underline">Manage products <ArrowRightLeft size={16} /></Link>
      </header>

      <form onSubmit={(event) => { event.preventDefault(); setLoading(true); setPage(1); setRefreshKey((key) => key + 1); }} className="flex flex-col gap-3 rounded-xl border border-line bg-white p-4 shadow-card sm:flex-row sm:items-end">
        <label className="min-w-48"><span className="mb-1 block text-xs font-semibold text-ink-secondary">Inventory view</span><select value={lowStockOnly ? "low" : "all"} onChange={(event) => { setLoading(true); setPage(1); setLowStockOnly(event.target.value === "low"); }} className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm"><option value="all">All products</option><option value="low">Low stock only</option></select></label>
        {lowStockOnly && <label><span className="mb-1 block text-xs font-semibold text-ink-secondary">Low-stock threshold</span><input type="number" min="0" max="10000" step="1" value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} className="h-10 w-36 rounded-lg border border-line px-3 text-sm" /></label>}
        <div className="flex items-center gap-2 text-xs text-ink-muted"><Boxes size={16} />Use positive values to add stock and negative values to remove it.</div>
      </form>

      {errors.page && <div role="alert" className="rounded-lg border border-danger/30 bg-white p-3 text-sm text-danger">{errors.page}<Button size="sm" variant="secondary" className="ml-3" onClick={() => { setLoading(true); setRefreshKey((key) => key + 1); }}>Retry</Button></div>}

      <div className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
        {loading ? <div className="flex min-h-48 items-center justify-center"><Loader label="Loading inventory" /></div> : products.length === 0 ? <div className="px-5 py-14 text-center"><Boxes size={30} className="mx-auto text-ink-muted" /><h2 className="mt-3 font-bold text-ink">No products in this view</h2><p className="mt-1 text-sm text-ink-secondary">Try another threshold or add catalogue products.</p></div> : <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-soft text-xs uppercase tracking-wide text-ink-muted"><tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Current stock</th><th className="px-4 py-3">Adjust quantity</th></tr></thead>
              <tbody className="divide-y divide-line">
                {products.map((product) => <tr key={product._id}>
                  <td className="px-4 py-4"><div className="flex items-center gap-3"><img src={product.images?.[0]?.url || "/images/product-placeholder.svg"} alt="" className="h-12 w-12 rounded-lg bg-soft object-contain" /><div><p className="font-semibold text-ink">{product.name}</p><p className="text-xs text-ink-muted">{product.isActive ? "Active" : "Inactive"}</p></div></div></td>
                  <td className="px-4 py-4 text-ink-secondary">{product.category?.name || "—"}</td>
                  <td className="px-4 py-4"><span className={`inline-flex items-center gap-1.5 font-semibold ${product.stock <= threshold ? "text-danger" : "text-ink"}`}>{product.stock <= threshold && <AlertTriangle size={15} />}{product.stock}</span>{product.stock <= threshold && <span className="ml-2 rounded-full bg-red-50 px-2 py-1 text-[11px] font-semibold text-danger">Low</span>}</td>
                  <td className="px-4 py-4"><form onSubmit={(event) => saveAdjustment(event, product)} className="flex flex-wrap items-center gap-2"><label><span className="sr-only">Quantity adjustment for {product.name}</span><input aria-label={`Quantity adjustment for ${product.name}`} type="number" min="-10000" max="10000" step="1" value={adjustments[product._id] ?? 1} onChange={(event) => setAdjustments((current) => ({ ...current, [product._id]: event.target.value }))} className="h-9 w-28 rounded-lg border border-line px-2 text-sm outline-none focus:border-rarewolf-primary" /></label><Button type="submit" size="sm" loading={pendingId === product._id}>Apply</Button>{errors[product._id] && <p role="alert" className="w-full text-xs text-danger">{errors[product._id]}</p>}</form></td>
                </tr>)}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm text-ink-secondary"><span>{pagination.total || 0} products · Page {pagination.page || 1} of {Math.max(pagination.pages || 0, 1)}</span><div className="flex gap-2"><Button size="sm" variant="secondary" disabled={!pagination.hasPreviousPage || loading} onClick={() => { setLoading(true); setPage((current) => current - 1); }}>Previous</Button><Button size="sm" variant="secondary" disabled={!pagination.hasNextPage || loading} onClick={() => { setLoading(true); setPage((current) => current + 1); }}>Next</Button></div></div>
        </>}
      </div>
    </section>
  );
};

export default AdminInventory;
