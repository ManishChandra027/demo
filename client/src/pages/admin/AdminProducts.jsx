import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Plus, Search, ToggleLeft, ToggleRight } from "lucide-react";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import {
  deactivateAdminProduct,
  getAdminProducts,
  setAdminProductActive,
} from "../../services/adminService";

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({});
  const [searchDraft, setSearchDraft] = useState("");
  const [query, setQuery] = useState({ search: "", status: "all", page: 1 });
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState("");
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    getAdminProducts({ ...query, limit: 12 })
      .then((response) => {
        if (!active) return;
        setProducts(response.data.products || []);
        setPagination(response.data.pagination || {});
        setError("");
      })
      .catch((requestError) => {
        if (active)
          setError(requestError.message || "Products could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [query, retryKey]);

  const submitSearch = (event) => {
    event.preventDefault();
    setLoading(true);
    setQuery((current) => ({
      ...current,
      search: searchDraft.trim(),
      page: 1,
    }));
  };

  const toggleProduct = async (product) => {
    if (product.isActive) {
      const confirmed = window.confirm(
        `Deactivate “${product.name}”? It will no longer appear in the store.`,
      );
      if (!confirmed) return;
    }
    setPendingId(product._id);
    setLoading(true);
    setError("");
    try {
      if (product.isActive) await deactivateAdminProduct(product._id);
      else await setAdminProductActive(product._id, true);
      const response = await getAdminProducts({ ...query, limit: 12 });
      setProducts(response.data.products || []);
      setPagination(response.data.pagination || {});
    } catch (requestError) {
      setError(requestError.message || "Product status could not be changed.");
    } finally {
      setPendingId("");
      setLoading(false);
    }
  };

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-rarewolf-primary">
            Catalogue
          </p>
          <h1 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">
            Products
          </h1>
        </div>
        <Link
          to="/admin/products/new"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-rarewolf-primary px-4 text-sm font-semibold text-white hover:bg-rarewolf-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rarewolf-primary focus-visible:ring-offset-2"
        >
          <Plus size={17} /> Add product
        </Link>
      </header>

      <form
        onSubmit={submitSearch}
        className="flex flex-col gap-3 rounded-xl border border-line bg-white p-4 shadow-card sm:flex-row"
      >
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search products</span>
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
          />
          <input
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Search name, slug or description"
            className="h-10 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-sm outline-none focus:border-rarewolf-primary focus:ring-2 focus:ring-rarewolf-primary/10"
          />
        </label>
        <label>
          <span className="sr-only">Filter by product status</span>
          <select
            value={query.status}
            onChange={(event) => {
              setLoading(true);
              setQuery((current) => ({
                ...current,
                status: event.target.value,
                page: 1,
              }));
            }}
            className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-rarewolf-primary sm:w-40"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <Button type="submit" size="sm">
          Search
        </Button>
      </form>

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/30 bg-white p-4 text-sm text-danger"
        >
          <span>{error}</span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setLoading(true);
              setRetryKey((key) => key + 1);
            }}
          >
            Retry
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
        {loading ? (
          <div className="flex min-h-48 items-center justify-center">
            <Loader label="Loading products" />
          </div>
        ) : products.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <h2 className="font-bold text-ink">No products found</h2>
            <p className="mt-1 text-sm text-ink-secondary">
              Try another search or add the first product.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-190 text-left text-sm">
                <thead className="bg-soft text-xs uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {products.map((product) => (
                    <tr key={product._id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              product.images?.[0]?.url ||
                              "/images/product-placeholder.svg"
                            }
                            alt=""
                            className="h-12 w-12 rounded-lg bg-soft object-contain"
                          />
                          <div className="min-w-0">
                            <p className="max-w-60 truncate font-semibold text-ink">
                              {product.name}
                            </p>
                            <p className="text-xs text-ink-muted">
                              /{product.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-secondary">
                        {product.category?.name || "—"}
                      </td>
                      <td className="px-4 py-3 font-semibold text-ink">
                        ₹{Number(product.price).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-ink-secondary">
                        {product.stock}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${product.isActive ? "bg-green-50 text-green-700" : "bg-soft text-ink-muted"}`}
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Link
                            aria-label={`Edit ${product.name}`}
                            title="Edit product"
                            to={`/admin/products/${product._id}/edit`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-secondary hover:bg-soft hover:text-rarewolf-primary"
                          >
                            <Pencil size={17} />
                          </Link>
                          <Button
                            aria-label={`${product.isActive ? "Deactivate" : "Reactivate"} ${product.name}`}
                            title={
                              product.isActive
                                ? "Deactivate product"
                                : "Reactivate product"
                            }
                            variant="ghost"
                            size="icon"
                            loading={pendingId === product._id}
                            onClick={() => toggleProduct(product)}
                          >
                            {product.isActive ? (
                              <ToggleRight size={19} />
                            ) : (
                              <ToggleLeft size={19} />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm text-ink-secondary">
              <span>
                {pagination.total || 0} products · Page {pagination.page || 1}{" "}
                of {Math.max(pagination.pages || 0, 1)}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!pagination.hasPreviousPage || loading}
                  onClick={() => {
                    setLoading(true);
                    setQuery((current) => ({
                      ...current,
                      page: current.page - 1,
                    }));
                  }}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!pagination.hasNextPage || loading}
                  onClick={() => {
                    setLoading(true);
                    setQuery((current) => ({
                      ...current,
                      page: current.page + 1,
                    }));
                  }}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default AdminProducts;
