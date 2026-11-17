import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  selectIsAuthenticated,
  selectUser,
} from "../features/auth/authSelector";

const RequireAdmin = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: `${location.pathname}${location.search}${location.hash}`,
        }}
      />
    );
  }

  if (user?.role !== "admin") {
    return (
      <main className="flex min-h-[70vh] items-center justify-center px-4 py-12">
        <section className="w-full max-w-md rounded-2xl border border-line bg-white p-8 text-center shadow-card">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-rarewolf-primary">
            Admin access required
          </p>
          <h1 className="mt-3 text-2xl font-bold text-ink">
            You can’t access this area
          </h1>
          <p className="mt-2 text-sm leading-6 text-ink-secondary">
            This workspace is available to authorized RareWolf administrators.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-rarewolf-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-rarewolf-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rarewolf-primary focus-visible:ring-offset-2"
          >
            Return to store
          </Link>
        </section>
      </main>
    );
  }

  return <Outlet />;
};

export default RequireAdmin;
