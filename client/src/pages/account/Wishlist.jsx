import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import ProductCard from "../../components/catalog/ProductCard";
import { selectIsAuthenticated } from "../../features/auth/authSelector";
import { selectWishlist, setWishlist } from "../../features/wishlist/wishlistSlice";
import { getWishlist } from "../../services/catalogService";

const Wishlist = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const products = useSelector(selectWishlist);
  const [loading, setLoading] = useState(isAuthenticated);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let isMounted = true;
    getWishlist()
      .then((response) => {
        if (isMounted) {
          dispatch(setWishlist(response?.data?.products || []));
          setError("");
        }
      })
      .catch((requestError) => {
        if (isMounted) setError(requestError.message || "Saved products could not be loaded.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [dispatch, isAuthenticated, retryKey]);

  if (!isAuthenticated) {
    return <section className="rounded-2xl border border-line bg-white p-8 text-center"><h1 className="text-xl font-bold text-ink">Sign in to view saved products</h1><Link to="/login" state={{ from: "/account/wishlist" }} className="mt-4 inline-block text-sm font-semibold text-rarewolf-primary">Sign in</Link></section>;
  }

  return (
    <div className="space-y-5">
      <header><p className="text-sm font-semibold uppercase tracking-wider text-rarewolf-primary">Your account</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">Saved products</h1><p className="mt-2 text-sm text-ink-secondary">Keep the things you love close by.</p></header>
      {loading ? (
        <div className="flex min-h-56 items-center justify-center"><Loader label="Loading saved products" /></div>
      ) : error ? (
        <section role="alert" className="rounded-2xl border border-line bg-white p-8 text-center"><p className="text-sm text-danger">{error}</p><Button type="button" variant="secondary" size="sm" className="mt-4" onClick={() => { setLoading(true); setRetryKey((current) => current + 1); }}>Try again</Button></section>
      ) : products.length === 0 ? (
        <section className="rounded-2xl border border-line bg-white px-5 py-12 text-center shadow-card"><Heart size={34} className="mx-auto text-ink-muted" /><h2 className="mt-3 text-lg font-bold text-ink">Nothing saved yet</h2><p className="mt-1 text-sm text-ink-secondary">Tap the heart on a product to save it here.</p><Link to="/products" className="mt-4 inline-block text-sm font-semibold text-rarewolf-primary">Explore products</Link></section>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>
      )}
    </div>
  );
};

export default Wishlist;
