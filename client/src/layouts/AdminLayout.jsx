import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Boxes, ClipboardList, LayoutDashboard, LogOut, Package, Shapes, Store, Users } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import Button from "../components/common/Button";
import { selectUser } from "../features/auth/authSelector";
import { logout } from "../features/auth/authSlice";
import { logoutUser } from "../services/authService";
import Logo from "../components/logo/RareWolfLogo";

const AdminLayout = () => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutUser();
      dispatch(logout());
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to log out. Please try again.",
      );
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex min-h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rarewolf-primary">
              <Logo />
            </p>
            <p className="text-sm font-bold text-ink ml-13">Admin workspace</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-ink-secondary sm:block">
              {user?.fullName || user?.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              loading={loggingOut}
              onClick={handleLogout}
            >
              <LogOut size={16} />
              Log out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8">
        <aside className="h-fit rounded-2xl border border-line bg-white p-3 shadow-card">
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
            Workspace
          </p>
          <nav aria-label="Admin navigation">
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-rarewolf-primary-light text-rarewolf-primary"
                    : "text-ink-secondary hover:bg-soft hover:text-ink"
                }`
              }
            >
              <LayoutDashboard size={18} />
              Dashboard
            </NavLink>
            <NavLink
              to="/admin/products"
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-rarewolf-primary-light text-rarewolf-primary"
                    : "text-ink-secondary hover:bg-soft hover:text-ink"
                }`
              }
            >
              <Package size={18} />
              Products
            </NavLink>
            <NavLink
              to="/admin/inventory"
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-rarewolf-primary-light text-rarewolf-primary"
                    : "text-ink-secondary hover:bg-soft hover:text-ink"
                }`
              }
            >
              <Boxes size={18} />
              Inventory
            </NavLink>
            <NavLink
              to="/admin/orders"
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-rarewolf-primary-light text-rarewolf-primary"
                    : "text-ink-secondary hover:bg-soft hover:text-ink"
                }`
              }
            >
              <ClipboardList size={18} />
              Orders
            </NavLink>
            <NavLink
              to="/admin/customers"
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-rarewolf-primary-light text-rarewolf-primary"
                    : "text-ink-secondary hover:bg-soft hover:text-ink"
                }`
              }
            >
              <Users size={18} />
              Customers
            </NavLink>
            <NavLink
              to="/admin/categories"
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-rarewolf-primary-light text-rarewolf-primary"
                    : "text-ink-secondary hover:bg-soft hover:text-ink"
                }`
              }
            >
              <Shapes size={18} />
              Categories
            </NavLink>
          </nav>
          <div className="mt-3 border-t border-line pt-3">
            <NavLink
              to="/"
              className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-ink-secondary transition-colors hover:bg-soft hover:text-ink"
            >
              <Store size={18} />
              View store
            </NavLink>
          </div>
        </aside>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
