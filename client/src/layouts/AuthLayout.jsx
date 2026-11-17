import { Link, Outlet, useLocation } from "react-router-dom";
import Logo from "../components/logo/RareWolfLogo";
import authBackground from "/images/auth/auth-bg.png";
const AuthLayout = ({
  eyebrow = "RareWolf · Shop with intention",
  heading = "Good things start here.",
  subtext = "A thoughtful assortment of everyday essentials and extraordinary finds.",
  footnote = "Find your next everyday favourite.",
  topLinks = [
    { label: "Sign in", to: "/login" },
    { label: "Signup", to: "/signup" },
    { label: "Help", to: "#" },
  ],
}) => {
  const { pathname } = useLocation();
  const isSignup = pathname === "/signup";

  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden bg-canvas lg:h-dvh lg:overflow-hidden">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-white px-4 sm:px-8">
        <Logo />

        <nav
          aria-label="Authentication"
          className="flex items-center gap-4 text-sm text-ink-secondary sm:gap-6"
        >
          {topLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="transition hover:text-rarewolf-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      <div className="grid flex-1 lg:min-h-0 lg:grid-cols-[minmax(0,5fr)_minmax(0,8fr)]">
        {/* Brand panel */}
        <aside className="relative hidden min-h-0 overflow-hidden bg-footer lg:block">
          <img
            src={authBackground}
            alt="login background"
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-60"
          />

          <div className="absolute inset-0 bg-linear-to-b from-footer/70 via-footer/30 to-footer/90" />

          <div className="relative flex h-full flex-col justify-between p-8 text-white xl:p-10">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-200">
                {eyebrow}
              </p>

              <h2 className="mt-4 max-w-xs text-3xl font-bold leading-tight xl:text-4xl">
                {heading}
              </h2>

              <p className="mt-3 max-w-xs text-sm leading-6 text-white/80">
                {subtext}
              </p>
            </div>

            <p className="text-sm text-white/90">{footnote}</p>
          </div>
        </aside>

        {/* Form panel */}
        <main className="flex min-w-0 items-start justify-center px-4 py-3 sm:px-6 lg:min-h-0 lg:items-center lg:overflow-y-auto lg:px-8 lg:py-3">
          <div className={`w-full ${isSignup ? "max-w-md" : "max-w-sm"}`}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AuthLayout;
