import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import ProductCard from "../components/catalog/ProductCard";
import { getCategories, getProducts } from "../services/catalogService";

const promos = [
  {
    title: "Style for every day",
    sub: "Find your next favourite look.",
    cta: "Explore Fashion",
    to: "/categories/fashion",
    tone: "from-rarewolf-primary-dark to-rarewolf-primary",
  },
  {
    title: "Tech for your everyday",
    sub: "Explore electronics and mobiles.",
    cta: "Shop Electronics",
    to: "/categories/electronics",
    tone: "from-slate-900 to-slate-700",
  },
  {
    title: "Make your space feel like home",
    sub: "Everyday finds for your home.",
    cta: "Shop Home & Kitchen",
    to: "/categories/home-kitchen",
    tone: "from-amber-950 to-stone-800",
  },
];

const SectionHeading = ({ title, to, linkLabel }) => (
  <div className="mb-4 flex items-end justify-between gap-4">
    <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
    {to && (
      <Link
        to={to}
        className="flex shrink-0 items-center gap-1 text-sm font-semibold text-rarewolf-primary hover:underline"
      >
        {linkLabel} <ArrowRight size={14} />
      </Link>
    )}
  </div>
);

const ProductSectionState = ({ loading, error, emptyMessage, onRetry }) => {
  if (loading) {
    return (
      <div className="flex justify-center rounded-xl bg-white py-10">
        <Loader label="Loading catalogue" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-line bg-white p-6 text-center"
      >
        <p className="text-sm text-ink-secondary">{error}</p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-3"
          onClick={onRetry}
        >
          Try again
        </Button>
      </div>
    );
  }

  return (
    <p className="rounded-xl bg-white px-4 py-8 text-center text-sm text-ink-secondary">
      {emptyMessage}
    </p>
  );
};

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [deals, setDeals] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [catalogStatus, setCatalogStatus] = useState({
    loading: true,
    error: "",
  });
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      getCategories(),
      getProducts({ limit: 6, sort: "newest" }),
      getProducts({ limit: 6, sort: "rating-desc" }),
    ])
      .then(([categoryResponse, dealResponse, recommendedResponse]) => {
        if (!isMounted) return;
        setCategories(categoryResponse?.data?.categories || []);
        setDeals(dealResponse?.data?.products || []);
        setRecommended(recommendedResponse?.data?.products || []);
        setCatalogStatus({ loading: false, error: "" });
      })
      .catch((error) => {
        if (isMounted) {
          setCatalogStatus({
            loading: false,
            error: error.message || "The catalogue could not be loaded.",
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [retryKey]);

  const retryCatalogue = () => {
    setCatalogStatus({ loading: true, error: "" });
    setRetryKey((current) => current + 1);
  };

  return (
    <div className="space-y-8">
      <section
        aria-label="Featured"
        className="relative max-h-80 min-h-56 overflow-hidden rounded-2xl bg-footer text-white"
      >
        <img
          src="/images/hero/hero-bg.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-r from-footer via-footer/70 to-transparent" />
        <div className="relative px-6 py-12 sm:px-12 sm:py-20 lg:py-24">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-orange-200">
            Explore · Shop · Belong
          </p>
          <h1 className="mt-3 max-w-md text-4xl font-bold leading-tight sm:text-5xl">
            Everything worth finding.
          </h1>
          <p className="mt-3 max-w-sm text-sm text-white/85 sm:text-base">
            From everyday essentials to extraordinary finds, RareWolf brings the
            world to your doorstep.
          </p>

          <Link
            to="/products"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-rarewolf-primary px-6 text-sm font-semibold shadow-cta transition-colors hover:bg-rarewolf-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Shop Now <ArrowRight size={16} />
          </Link>
          
        </div>
        <p className="absolute bottom-4 right-6 hidden text-right text-xs font-medium text-white/80 sm:block">
          A larger world,
          <br />
          closer to home.
        </p>
      </section>

      <section aria-labelledby="categories-heading">
        <SectionHeading
          title="Shop by category"
          to="/products"
          linkLabel="View all"
        />
        {catalogStatus.loading && categories.length === 0 ? (
          <ProductSectionState loading />
        ) : catalogStatus.error && categories.length === 0 ? (
          <ProductSectionState
            error={catalogStatus.error}
            onRetry={retryCatalogue}
          />
        ) : categories.length === 0 ? (
          <ProductSectionState emptyMessage="No categories are available yet." />
        ) : (
          <ul className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  to={`/categories/${category.slug}`}
                  className="flex h-full flex-col items-center gap-2 rounded-xl bg-white p-2 text-center text-xs font-medium shadow-card transition-shadow hover:shadow-card-hover"
                >
                  <img
                    src={category.image || "/images/product-placeholder.svg"}
                    alt=""
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.src =
                        "/images/product-placeholder.svg";
                    }}
                    className="aspect-square w-full rounded-lg bg-soft object-cover"
                  />
                  <span>{category.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Promotions" className="grid gap-4 md:grid-cols-3">
        {promos.map((promo) => (
          <Link
            key={promo.title}
            to={promo.to}
            className={`flex min-h-40 flex-col items-start justify-center rounded-2xl bg-linear-to-r ${promo.tone} p-6 text-white transition-transform hover:-translate-y-0.5`}
          >
            <h2 className="text-xl font-bold leading-tight">{promo.title}</h2>
            <p className="mt-1 text-sm text-white/85">{promo.sub}</p>
            <span className="mt-4 inline-flex h-8 items-center gap-1 rounded-full bg-white px-4 text-xs font-semibold text-rarewolf-primary">
              {promo.cta} <ArrowRight size={12} />
            </span>
          </Link>
        ))}
      </section>

      <section aria-labelledby="deals-heading">
        <SectionHeading
          title="Today's Deals"
          to="/products?sort=price-asc"
          linkLabel="See all"
        />
        {catalogStatus.loading ? (
          <ProductSectionState loading />
        ) : catalogStatus.error ? (
          <ProductSectionState
            error={catalogStatus.error}
            onRetry={retryCatalogue}
          />
        ) : deals.length === 0 ? (
          <ProductSectionState emptyMessage="No products are available yet. Check back soon." />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-6">
            {deals.map((product) => (
              <ProductCard key={product.id} product={product} compact />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="recommended-heading">
        <SectionHeading
          title="Picked for you"
          to="/products?sort=rating-desc"
          linkLabel="See all"
        />
        {catalogStatus.loading ? (
          <ProductSectionState loading />
        ) : catalogStatus.error ? (
          <ProductSectionState
            error={catalogStatus.error}
            onRetry={retryCatalogue}
          />
        ) : recommended.length === 0 ? (
          <ProductSectionState emptyMessage="No recommendations are available yet." />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-6">
            {recommended.map((product) => (
              <ProductCard key={product.id} product={product} compact />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
