import { NavLink, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectUser } from "../features/auth/authSelector";
import { logout } from "../features/auth/authSlice";
import { logoutUser } from "../services/authService";
import { toast } from "sonner";
import { useDispatch } from "react-redux";

import {
  UserRound,
  Package,
  MapPin,
  Heart,
  CreditCard,
  Bell,
  Settings,
  Headset,
  LogOut,
} from "lucide-react";

const tabs = [
  {
    key: "profile",
    label: "My Profile",
    path: "/account",
    icon: UserRound,
    end: true,
  },
  { key: "orders", label: "My Orders", path: "/account/orders", icon: Package },
  {
    key: "addresses",
    label: "Addresses",
    path: "/account/addresses",
    icon: MapPin,
  },
  {
    key: "wishlist",
    label: "Wishlist",
    path: "/account/wishlist",
    icon: Heart,
  },
  {
    key: "cards",
    label: "Saved Cards",
    path: "/account/cards",
    icon: CreditCard,
  },
  {
    key: "notifications",
    label: "Notifications",
    path: "/account/notifications",
    icon: Bell,
  },
  {
    key: "settings",
    label: "Settings",
    path: "/account/settings",
    icon: Settings,
  },
  {
    key: "help",
    label: "Help & Support",
    path: "/account/help",
    icon: Headset,
  },
];

const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const AccountLayout = () => {
  const user = useSelector(selectUser);

  const name = user?.fullName || user?.name || "Your Name";
  const email = user?.email || "you@example.com";
  const dispatch = useDispatch();

  const onLogout = async () => {
    try {
      await logoutUser();
      dispatch(logout());

      toast.success("Logged out successfully!");
      window.location.assign("/");
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to log out. Please try again.",
      );
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-line bg-white p-4 shadow-card">
          <div className="flex items-center gap-3 rounded-xl bg-soft p-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rarewolf-primary text-lg font-bold text-white">
              {initials(name)}
            </span>

            <div className="min-w-0">
              <p className="truncate font-bold text-ink">{name}</p>
              <p className="truncate text-sm text-ink-muted">{email}</p>
            </div>
          </div>

          <nav aria-label="Account navigation" className="mt-4">
            <ul className="space-y-0.5">
              {tabs.map(({ key, label, path, icon: Icon, end }) => (
                <li key={key}>
                  <NavLink
                    to={path}
                    end={end}
                    className={({ isActive }) =>
                      `flex min-h-[44px] items-center gap-3 rounded-lg border-l-4 px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? "border-rarewolf-primary bg-rarewolf-primary-light font-semibold text-rarewolf-primary"
                          : "border-transparent text-ink-secondary hover:bg-soft hover:text-ink"
                      }`
                    }
                  >
                    <Icon size={19} strokeWidth={1.8} />
                    <span>{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="mt-3 border-t border-line pt-2">
              <button
                type="button"
                onClick={onLogout}
                className="flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-rarewolf-primary transition-colors hover:bg-rarewolf-primary-light"
              >
                <LogOut size={19} />
                Logout
              </button>
            </div>
          </nav>
        </aside>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AccountLayout;
