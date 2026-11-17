
import { Link } from "react-router-dom";
import {
  Truck,
  ShieldCheck,
  RotateCcw,
  Headphones,
} from "lucide-react";

import Logo from "../logo/RareWolfLogo";

const benefits = [
  { icon: Truck, label: "Delivery details at checkout" },
  { icon: ShieldCheck, label: "Cash on Delivery" },
  { icon: RotateCcw, label: "See returns policy" },
  { icon: Headphones, label: "Customer Support" },
];

const columns = [
  {
    title: "Shop",
    links: [
      { label: "All Categories", to: "/products" },
      { label: "Today's Deals", to: "/products?tag=deals" },
      { label: "Fashion", to: "/products?category=fashion" },
      { label: "Electronics", to: "/products?category=electronics" },
      { label: "Home & Kitchen", to: "/products?category=home-kitchen" },
      { label: "Beauty", to: "/products?category=beauty" },
    ],
  },
  {
    title: "Customer Service",
    links: [
      { label: "Track Your Order", to: "/account" },
      { label: "My Account", to: "/account" },
      { label: "Help & Support", to: "/help" },
      { label: "Contact Us", to: "/contact" },
    ],
  },
  {
    title: "About RareWolf",
    links: [
      { label: "Our Story", to: "/about" },
      { label: "Privacy Policy", to: "/privacy-policy" },
      { label: "Terms of Use", to: "/terms" },
    ],
  },
];

const Footer = ({
  onSubscribe,
  email = "",
  onEmailChange,
}) => {
  const handleSubscribe = (event) => {
    if (!onSubscribe) {
      event.preventDefault();
      return;
    }

    onSubscribe(event);
  };

  return (
    <footer className="mt-12 border-t border-line bg-white">
      {/* Benefits */}
      <div className="border-b border-line">
        <ul className="mx-auto grid max-w-[1400px] grid-cols-2 gap-5 px-4 py-6 sm:px-6 md:grid-cols-4">
          {benefits.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rarewolf-primary-light text-rarewolf-primary">
                <Icon size={19} />
              </span>
              <span className="text-sm font-semibold text-ink">
                {label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Main footer */}
      <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-9 sm:px-6 md:grid-cols-2 lg:grid-cols-5 lg:gap-10 lg:py-12">
        <div className="lg:col-span-2">
          <Logo />

          <p className="mt-2 text-sm text-ink-secondary">
            Everything worth finding.
          </p>

          <form onSubmit={handleSubscribe} className="mt-6 max-w-sm">
            <label
              htmlFor="newsletter"
              className="text-sm font-semibold text-ink"
            >
              Stay in the loop
            </label>

            <p className="mt-1 text-xs leading-5 text-ink-muted">
              Get updates about new products and special offers.
            </p>

            <div className="mt-3 flex gap-2">
              <input
                id="newsletter"
                name="email"
                type="email"
                value={email}
                onChange={(event) =>
                  onEmailChange?.(event.target.value)
                }
                placeholder="Enter your email"
                autoComplete="email"
                className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-soft px-3 text-sm outline-none transition-colors placeholder:text-ink-muted focus:border-rarewolf-primary focus:bg-white focus:ring-2 focus:ring-rarewolf-primary/10"
              />

              <button
                type="submit"
                disabled={!onSubscribe}
                className="h-11 rounded-lg bg-rarewolf-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-rarewolf-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rarewolf-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Subscribe
              </button>
            </div>
          </form>
        </div>

        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="text-sm font-bold text-ink">
              {column.title}
            </h2>

            <ul className="mt-4 space-y-3">
              {column.links.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="text-sm text-ink-secondary transition-colors hover:text-rarewolf-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rarewolf-primary"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="bg-footer text-xs text-white/75">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-3 px-4 py-4 text-center sm:flex-row sm:px-6 sm:text-left">
          <p>© {new Date().getFullYear()} RareWolf. Everything worth finding.</p>

          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/privacy-policy" className="hover:text-white">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-white">
              Terms of Use
            </Link>
            <Link to="/help" className="hover:text-white">
              Help
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
