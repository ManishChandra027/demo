import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Boxes, ClipboardList, Package, Users } from "lucide-react";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import { getAdminDashboard } from "../../services/adminService";
import LogoIcon from "../../components/logo/LogoIcon";

const cards = [
  {
    key: "activeProducts",
    label: "Active products",
    href: "/admin/products",
    Icon: Package,
  },
  {
    key: "customers",
    label: "Customers",
    href: "/admin/customers",
    Icon: Users,
  },
  {
    key: "orders",
    label: "All orders",
    href: "/admin/orders",
    Icon: ClipboardList,
  },
  {
    key: "outstandingOrders",
    label: "Open orders",
    href: "/admin/orders?status=placed",
    Icon: Boxes,
  },
];
const currency = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    getAdminDashboard()
      .then((response) => {
        if (active) {
          setDashboard(response.data);
          setError("");
        }
      })
      .catch((requestError) => {
        if (active)
          setError(requestError.message || "Dashboard could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retryKey]);

  return (
    <section className="space-y-6">
      <header className="flex justify-between align-bottom">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-rarewolf-primary">
            Admin workspace
          </p>
          <h1 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">
            Dashboard
          </h1>

          <p className="mt-2 text-sm text-ink-secondary">
            A current overview of catalogue, customers, orders and stock.
          </p>
        </div>
        <div>
           <LogoIcon/>
        </div>
      </header>
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-4 rounded-xl border border-danger/30 bg-white p-4 text-sm text-danger"
        >
          {error}
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
      {loading ? (
        <div className="flex min-h-48 items-center justify-center rounded-xl border border-line bg-white">
          <Loader label="Loading dashboard" />
        </div>
      ) : (
        dashboard && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {cards.map(({ key, label, href, Icon }) => (
                <Link
                  key={key}
                  to={href}
                  className="rounded-xl border border-line bg-white p-5 shadow-card transition hover:border-rarewolf-primary/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink-secondary">
                      {label}
                    </span>
                    <Icon size={19} className="text-rarewolf-primary" />
                  </div>
                  <p className="mt-3 text-3xl font-bold text-ink">
                    {dashboard.counts?.[key] ?? 0}
                  </p>
                </Link>
              ))}
            </div>
            <div className="grid gap-5 xl:grid-cols-2">
              <section className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
                <div className="flex items-center justify-between border-b border-line px-5 py-4">
                  <h2 className="font-bold text-ink">Recent orders</h2>
                  <Link
                    to="/admin/orders"
                    className="text-sm font-semibold text-rarewolf-primary hover:underline"
                  >
                    All orders
                  </Link>
                </div>
                {dashboard.recentOrders?.length ? (
                  <div className="divide-y divide-line">
                    {dashboard.recentOrders.map((order) => (
                      <Link
                        key={order._id}
                        to={`/admin/orders/${order._id}`}
                        className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-soft/50"
                      >
                        <div>
                          <p className="text-sm font-semibold text-ink">
                            #{order._id.slice(-8).toUpperCase()} ·{" "}
                            {order.user?.fullName || "Customer"}
                          </p>
                          <p className="mt-1 text-xs capitalize text-ink-muted">
                            {order.status} · {order.itemCount} items ·{" "}
                            {new Date(order.createdAt).toLocaleDateString(
                              "en-IN",
                            )}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-bold text-ink">
                          {currency(order.totalAmount)}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="px-5 py-10 text-center text-sm text-ink-secondary">
                    No orders yet.
                  </p>
                )}
              </section>
              <section className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
                <div className="flex items-center justify-between border-b border-line px-5 py-4">
                  <div>
                    <h2 className="font-bold text-ink">Low stock</h2>
                    <p className="mt-1 text-xs text-ink-muted">
                      At or below {dashboard.lowStockThreshold} units
                    </p>
                  </div>
                  <Link
                    to="/admin/inventory"
                    className="text-sm font-semibold text-rarewolf-primary hover:underline"
                  >
                    Inventory
                  </Link>
                </div>
                {dashboard.lowStockProducts?.length ? (
                  <div className="divide-y divide-line">
                    {dashboard.lowStockProducts.map((product) => (
                      <Link
                        key={product._id}
                        to="/admin/inventory"
                        className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-soft/50"
                      >
                        <span className="text-sm font-medium text-ink">
                          {product.name}
                        </span>
                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-danger">
                          {product.stock} left
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="px-5 py-10 text-center text-sm text-ink-secondary">
                    No active products are below the threshold.
                  </p>
                )}
              </section>
              <section className="overflow-hidden rounded-xl border border-line bg-white shadow-card xl:col-span-2">
                <div className="flex items-center justify-between border-b border-line px-5 py-4">
                  <div>
                    <h2 className="font-bold text-ink">Outstanding orders</h2>
                    <p className="mt-1 text-xs text-ink-muted">
                      Placed or processing · COD only, no revenue totals
                    </p>
                  </div>
                  <Link
                    to="/admin/orders"
                    className="text-sm font-semibold text-rarewolf-primary hover:underline"
                  >
                    Manage orders
                  </Link>
                </div>
                {dashboard.outstandingOrders?.length ? (
                  <div className="grid gap-px bg-line sm:grid-cols-2 xl:grid-cols-3">
                    {dashboard.outstandingOrders.map((order) => (
                      <Link
                        key={order._id}
                        to={`/admin/orders/${order._id}`}
                        className="bg-white p-4 hover:bg-soft/50"
                      >
                        <p className="text-sm font-semibold text-ink">
                          #{order._id.slice(-8).toUpperCase()} ·{" "}
                          {order.user?.fullName || "Customer"}
                        </p>
                        <p className="mt-1 text-xs capitalize text-ink-muted">
                          {order.status} · {currency(order.totalAmount)}
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="px-5 py-8 text-sm text-ink-secondary">
                    No outstanding orders.
                  </p>
                )}
              </section>
            </div>
          </>
        )
      )}
    </section>
  );
};

export default AdminDashboard;
