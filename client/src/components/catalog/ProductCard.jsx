import { Link } from "react-router-dom";
import { Star } from "lucide-react";

import AddToCartButton from "./AddToCartButton";
import WishlistButton from "./WishlistButton";

const fallbackImage = "/images/product-placeholder.svg";

const ProductCard = ({ product, compact = false }) => (
  <article className="group flex min-w-0 flex-col rounded-xl border border-line bg-white p-3 shadow-card transition-shadow hover:shadow-card-hover">
    <div className="relative aspect-square overflow-hidden rounded-lg bg-soft">
      <Link
        to={`/products/${product.slug}`}
        className="absolute inset-0 block"
        aria-label={`View ${product.name}`}
      >
        {product.discount > 0 && (
          <span className="absolute left-2 top-2 z-10 rounded bg-rarewolf-primary px-1.5 py-0.5 text-[11px] font-bold text-white">
            {product.discount}% OFF
          </span>
        )}
        <img
          src={product.image || fallbackImage}
          alt={product.name}
          loading="lazy"
          onError={(event) => {
            if (!event.currentTarget.src.endsWith(fallbackImage)) {
              event.currentTarget.src = fallbackImage;
            }
          }}
          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </Link>
      <div className="absolute right-2 top-2 z-20">
        <WishlistButton product={product} overlay />
      </div>
    </div>

    <Link to={`/products/${product.slug}`} className="mt-3 min-w-0">
      <h2 className="line-clamp-2 min-h-10 text-sm font-semibold text-ink hover:text-rarewolf-primary">
        {product.name}
      </h2>
    </Link>
    <p className="mt-1 truncate text-xs text-ink-muted">{product.sub}</p>

    <div className="mt-2 flex items-center justify-between gap-2">
      <p className="min-w-0">
        <span className="font-bold text-ink">
          ₹{Number(product.price).toLocaleString("en-IN")}
        </span>
        {product.mrp > product.price && (
          <span className="ml-1 text-xs text-ink-muted line-through">
            ₹{Number(product.mrp).toLocaleString("en-IN")}
          </span>
        )}
      </p>
      <AddToCartButton product={product} compact={compact} />
    </div>

    <p className="mt-2 flex items-center gap-1 text-xs text-ink-secondary">
      <Star size={13} className="fill-rating text-rating" />
      {Number(product.rating || 0).toFixed(1)}
      {product.stock <= 0 && (
        <span className="ml-auto text-danger">Out of stock</span>
      )}
    </p>
  </article>
);

export default ProductCard;
