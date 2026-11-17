
import { Link } from "react-router-dom";
import { ArrowLeft, Home, Search } from "lucide-react";

const NotFound = () => (
  <main className="flex min-h-[75vh] items-center justify-center bg-canvas px-4 py-12">
    <section className="w-full max-w-lg text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-rarewolf-primary-light text-rarewolf-primary">
        <Search size={34} strokeWidth={1.7} />
      </div>

      <p className="mt-7 text-sm font-semibold uppercase tracking-[0.2em] text-rarewolf-primary">
        Error 404
      </p>

      <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        This page wandered off.
      </h1>

      <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-ink-secondary sm:text-base">
        We couldn't find what you were looking for. Let's get you back to
        discovering things worth finding.
      </p>

      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          to="/"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-rarewolf-primary px-6 text-sm font-semibold text-white shadow-cta transition-colors hover:bg-rarewolf-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rarewolf-primary focus-visible:ring-offset-2"
        >
          <Home size={17} />
          Back to Home
        </Link>

        <Link
          to="/products"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-line bg-white px-6 text-sm font-semibold text-ink transition-colors hover:bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rarewolf-primary focus-visible:ring-offset-2"
        >
          <ArrowLeft size={16} />
          Explore Products
        </Link>
      </div>

      <p className="mt-10 text-xs text-ink-muted">
        RareWolf · Everything worth finding.
      </p>
    </section>
  </main>
);

export default NotFound;
