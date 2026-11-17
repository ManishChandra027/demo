import { useEffect, useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import ProductCard from "../components/catalog/ProductCard";
import { getCategories, getProducts } from "../services/catalogService";

const Products = () => {
  const { slug: routeCategorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  const queryString = searchParams.toString();
  const requestKey = `${routeCategorySlug || ""}?${queryString}`;
  const requestParams = useMemo(() => {
    const params = Object.fromEntries(new URLSearchParams(queryString));
    if (routeCategorySlug) params.category = routeCategorySlug;
    return params;
  }, [queryString, routeCategorySlug]);

  useEffect(() => {
    let isMounted = true;

    Promise.all([getProducts(requestParams), getCategories()])
      .then(([productResponse, categoryResponse]) => {
        if (!isMounted) return;
        setResult({
          key: requestKey,
          products: productResponse?.data?.products || [],
          pagination: productResponse?.data?.pagination || {},
          categories: categoryResponse?.data?.categories || [],
        });
        setError(null);
      })
      .catch((requestError) => {
        if (isMounted) {
          setError({
            key: requestKey,
            message: requestError.message || "Products could not be loaded.",
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [requestKey, requestParams, retryKey]);

  const currentResult = result?.key === requestKey ? result : null;
  const currentError = error?.key === requestKey ? error : null;
  const isLoading = !currentResult && !currentError;
  const products = currentResult?.products || [];
  const categories = currentResult?.categories || [];
  const categorySlug = routeCategorySlug || searchParams.get("category") || "";
  const selectedCategory = categories.find(
    (category) => category.slug === categorySlug,
  );
  const heading =
    selectedCategory?.name ||
    (categorySlug
      ? categorySlug
          .split("-")
          .map((word) => word[0]?.toUpperCase() + word.slice(1))
          .join(" ")
      : "All products");
  const pagination = currentResult?.pagination || {};

  const applyFilters = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextCategory = String(formData.get("category") || "");
    const nextParams = {};

    for (const key of ["search", "minPrice", "maxPrice", "sort"]) {
      const value = String(formData.get(key) || "").trim();
      if (value) nextParams[key] = value;
    }

    if (routeCategorySlug && nextCategory !== routeCategorySlug) {
      navigate(nextCategory ? `/categories/${nextCategory}` : "/products");
      return;
    }

    if (!routeCategorySlug && nextCategory) {
      nextParams.category = nextCategory;
    }

    setSearchParams(nextParams);
  };

  const changePage = (page) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("page", String(page));
    setSearchParams(nextParams);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFilters = () => {
    if (routeCategorySlug) navigate("/products");
    else setSearchParams({});
  };

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
        <Link to="/" className="hover:text-rarewolf-primary">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink-secondary">{heading}</span>
      </nav>

      <header>
        <p className="text-sm font-semibold uppercase tracking-wider text-rarewolf-primary">
          RareWolf catalogue
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {heading}
        </h1>
      </header>

      <form
        key={`${routeCategorySlug || "products"}:${queryString}`}
        onSubmit={applyFilters}
        className="grid gap-3 rounded-2xl border border-line bg-white p-4 shadow-card sm:grid-cols-2 lg:grid-cols-6"
        aria-label="Filter products"
      >
        <label className="sm:col-span-2 lg:col-span-2">
          <span className="mb-1 block text-xs font-semibold text-ink-secondary">
            Search
          </span>
          <input
            type="search"
            name="search"
            defaultValue={searchParams.get("search") || ""}
            placeholder="Search products"
            className="h-10 w-full rounded-lg border border-line bg-soft px-3 text-sm outline-none focus:border-rarewolf-primary focus:bg-white focus:ring-2 focus:ring-rarewolf-primary/10"
          />
        </label>

        <label>
          <span className="mb-1 block text-xs font-semibold text-ink-secondary">
            Category
          </span>
          <select
            name="category"
            defaultValue={categorySlug}
            className="h-10 w-full rounded-lg border border-line bg-soft px-3 text-sm outline-none focus:border-rarewolf-primary focus:ring-2 focus:ring-rarewolf-primary/10"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-1 block text-xs font-semibold text-ink-secondary">
            Min price
          </span>
          <input
            type="number"
            name="minPrice"
            min="0"
            defaultValue={searchParams.get("minPrice") || ""}
            placeholder="₹ Min"
            className="h-10 w-full rounded-lg border border-line bg-soft px-3 text-sm outline-none focus:border-rarewolf-primary focus:ring-2 focus:ring-rarewolf-primary/10"
          />
        </label>

        <label>
          <span className="mb-1 block text-xs font-semibold text-ink-secondary">
            Max price
          </span>
          <input
            type="number"
            name="maxPrice"
            min="0"
            defaultValue={searchParams.get("maxPrice") || ""}
            placeholder="₹ Max"
            className="h-10 w-full rounded-lg border border-line bg-soft px-3 text-sm outline-none focus:border-rarewolf-primary focus:ring-2 focus:ring-rarewolf-primary/10"
          />
        </label>

        <label>
          <span className="mb-1 block text-xs font-semibold text-ink-secondary">
            Sort by
          </span>
          <select
            name="sort"
            defaultValue={searchParams.get("sort") || "newest"}
            className="h-10 w-full rounded-lg border border-line bg-soft px-3 text-sm outline-none focus:border-rarewolf-primary focus:ring-2 focus:ring-rarewolf-primary/10"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="rating-desc">Top rated</option>
            <option value="name-asc">Name: A to Z</option>
          </select>
        </label>

        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-6">
          <Button type="submit" size="sm">
            Apply filters
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFilters}
          >
            Clear
          </Button>
        </div>
      </form>

      {isLoading ? (
        <div className="flex min-h-56 items-center justify-center">
          <Loader label="Loading products" />
        </div>
      ) : currentError ? (
        <div
          role="alert"
          className="rounded-2xl border border-line bg-white p-8 text-center"
        >
          <p className="text-sm text-danger">{currentError.message}</p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={() => {
              setError(null);
              setRetryKey((current) => current + 1);
            }}
          >
            Try again
          </Button>
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white px-5 py-12 text-center">
          <h2 className="text-lg font-bold text-ink">No products found</h2>
          <p className="mt-2 text-sm text-ink-secondary">
            Try changing your search or filters.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={clearFilters}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-sm text-ink-secondary">
            <p>
              {pagination.total} product{pagination.total === 1 ? "" : "s"}
            </p>
            <p>
              Page {pagination.page} of {Math.max(pagination.pages, 1)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {(pagination.hasPreviousPage || pagination.hasNextPage) && (
            <nav
              aria-label="Product pages"
              className="flex items-center justify-center gap-3 pt-2"
            >
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!pagination.hasPreviousPage}
                onClick={() => changePage(pagination.page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-ink-secondary">
                {pagination.page} / {pagination.pages}
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!pagination.hasNextPage}
                onClick={() => changePage(pagination.page + 1)}
              >
                Next
              </Button>
            </nav>
          )}
        </>
      )}
    </div>
  );
};

export default Products;
