import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Check, ChevronRight, Star } from "lucide-react";

import AddToCartButton from "../components/catalog/AddToCartButton";
import WishlistButton from "../components/catalog/WishlistButton";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import { getProduct } from "../services/catalogService";

const fallbackImage = "/images/product-placeholder.svg";

const ProductDetails = () => {
  const { slug } = useParams();
  const [result, setResult] = useState({ slug: null, product: null, error: "" });
  const [selectedImage, setSelectedImage] = useState(0);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    getProduct(slug)
      .then((response) => {
        if (!isMounted) return;
        setResult({ slug, product: response?.data?.product || null, error: "" });
        setSelectedImage(0);
      })
      .catch((requestError) => {
        if (isMounted) {
          setResult({
            slug,
            product: null,
            error: requestError.message || "Product could not be loaded.",
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [slug, retryKey]);

  const loading = result.slug !== slug;
  const product = loading ? null : result.product;
  const error = loading ? "" : result.error;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader label="Loading product details" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <section className="rounded-2xl border border-line bg-white px-5 py-12 text-center">
        <h1 className="text-xl font-bold text-ink">
          {error.includes("not found") ? "Product not found" : "Unable to load product"}
        </h1>
        <p role="alert" className="mt-2 text-sm text-ink-secondary">
          {error || "This product is currently unavailable."}
        </p>
        {error && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={() => {
              setResult({ slug: null, product: null, error: "" });
              setRetryKey((current) => current + 1);
            }}
          >
            Try again
          </Button>
        )}
        <div>
          <Link to="/products" className="mt-4 inline-block text-sm font-semibold text-rarewolf-primary hover:underline">
            Browse products
          </Link>
        </div>
      </section>
    );
  }

  const images = product.images?.length
    ? product.images
    : [{ url: product.image, alt: product.name }];
  const currentImage = images[selectedImage] || images[0];

  return (
    <div className="space-y-5">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
        <Link to="/" className="hover:text-rarewolf-primary">Home</Link>
        <ChevronRight size={14} />
        {product.category?.slug ? (
          <Link to={`/categories/${product.category.slug}`} className="hover:text-rarewolf-primary">
            {product.category.name}
          </Link>
        ) : (
          <Link to="/products" className="hover:text-rarewolf-primary">Products</Link>
        )}
        <ChevronRight size={14} />
        <span className="max-w-56 truncate text-ink-secondary">{product.name}</span>
      </nav>

      <article className="grid gap-6 rounded-2xl border border-line bg-white p-4 shadow-card sm:p-6 lg:grid-cols-2 lg:gap-10">
        <div className="min-w-0">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-soft">
            {product.discount > 0 && (
              <span className="absolute left-3 top-3 z-10 rounded bg-rarewolf-primary px-2 py-1 text-xs font-bold text-white">
                {product.discount}% OFF
              </span>
            )}
            <img
              src={currentImage?.url || fallbackImage}
              alt={currentImage?.alt || product.name}
              onError={(event) => {
                if (!event.currentTarget.src.endsWith(fallbackImage)) {
                  event.currentTarget.src = fallbackImage;
                }
              }}
              className="h-full w-full object-contain"
            />
          </div>
          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {images.map((image, index) => (
                <button
                  key={`${image.url}-${index}`}
                  type="button"
                  onClick={() => setSelectedImage(index)}
                  aria-label={`Show product image ${index + 1}`}
                  aria-pressed={selectedImage === index}
                  className={`aspect-square overflow-hidden rounded-lg border bg-soft p-1 ${
                    selectedImage === index ? "border-rarewolf-primary" : "border-line"
                  }`}
                >
                  <img src={image.url || fallbackImage} alt="" className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col">
          {product.category?.name && (
            <p className="text-sm font-semibold text-rarewolf-primary">{product.category.name}</p>
          )}
          <div className="mt-2 flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold leading-tight text-ink sm:text-3xl">
              {product.name}
            </h1>
            <WishlistButton product={product} />
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-sm text-ink-secondary">
            <Star size={16} className="fill-rating text-rating" />
            <span>{Number(product.rating || 0).toFixed(1)}</span>
          </div>

          <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-3xl font-bold text-ink">
              ₹{Number(product.price).toLocaleString("en-IN")}
            </span>
            {product.mrp > product.price && (
              <>
                <span className="text-lg text-ink-muted line-through">
                  ₹{Number(product.mrp).toLocaleString("en-IN")}
                </span>
                <span className="text-sm font-semibold text-success">{product.discount}% off</span>
              </>
            )}
          </div>

          <p className={`mt-3 flex items-center gap-2 text-sm font-medium ${product.stock > 0 ? "text-success" : "text-danger"}`}>
            {product.stock > 0 ? <Check size={16} /> : null}
            {product.stock > 0 ? "In stock" : "Currently out of stock"}
            {product.stock > 0 && <span className="font-normal text-ink-muted">({product.stock} available)</span>}
          </p>

          <div className="mt-6 max-w-sm">
            <AddToCartButton product={product} />
          </div>

          <div className="mt-7 border-t border-line pt-5">
            <h2 className="font-semibold text-ink">Product details</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink-secondary">
              {product.description}
            </p>
          </div>
        </div>
      </article>
    </div>
  );
};

export default ProductDetails;
