
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Search,
  MapPin,
  User,
  Heart,
  ShoppingCart,
  Menu,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import Logo from "../logo/RareWolfLogo";
import Button from "./Button";
import {
  selectIsAuthenticated,
  selectUser,
} from "../../features/auth/authSelector";
import { logout } from "../../features/auth/authSlice";
import { logoutUser } from "../../services/authService";
import { clearCart, selectCartCount, setCart } from "../../features/cart/cartSlice";
import { clearWishlist, selectWishlistCount, setWishlist } from "../../features/wishlist/wishlistSlice";
import { getCurrentUser } from "../../services/userService";
import { updateUser } from "../../features/auth/authSlice";
import { getCurrentCart, getWishlist } from "../../services/catalogService";

const Header = ({
  cartCount,
  wishlistCount,
  deliverTo,
  searchValue = "",
  onSearchChange,
  onSearchSubmit,
  onMobileMenuClick,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const storedCartCount = useSelector(selectCartCount);
  const storedWishlistCount = useSelector(selectWishlistCount);
  const visibleCartCount = cartCount ?? storedCartCount;
  const visibleWishlistCount = wishlistCount ?? storedWishlistCount;

  const [loggingOut, setLoggingOut] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchValue);
  const activeSearchValue = onSearchChange ? searchValue : localSearch;

  const userName = user?.fullName || user?.name || user?.email;
  const defaultAddress = user?.defaultAddress;
  const deliveryLocation =
    deliverTo ??
    (defaultAddress
      ? [defaultAddress.city, defaultAddress.pinCode].filter(Boolean).join(" ")
      : "Add address");

  useEffect(() => {
    if (!isAuthenticated || user?.defaultAddress !== undefined) return;

    let isMounted = true;
    getCurrentUser()
      .then((response) => {
        if (isMounted) {
          dispatch(
            updateUser({
              defaultAddress: response?.data?.defaultAddress || null,
            }),
          );
        }
      })
      .catch(() => {
        if (isMounted) dispatch(updateUser({ defaultAddress: null }));
      });

    return () => {
      isMounted = false;
    };
  }, [dispatch, isAuthenticated, user?.defaultAddress]);

  useEffect(() => {
    if (!isAuthenticated) {
      dispatch(clearCart());
      dispatch(clearWishlist());
      return undefined;
    }

    let isMounted = true;
    getCurrentCart()
      .then((response) => {
        if (isMounted) dispatch(setCart(response?.data?.cart || null));
      })
      .catch(() => {
        if (isMounted) dispatch(setCart(null));
      });

    return () => {
      isMounted = false;
    };
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let isMounted = true;
    getWishlist()
      .then((response) => {
        if (isMounted) dispatch(setWishlist(response?.data?.products || []));
      })
      .catch(() => {
        if (isMounted) dispatch(setWishlist([]));
      });
    return () => {
      isMounted = false;
    };
  }, [dispatch, isAuthenticated]);

  const handleSearch = (event) => {
    event.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit(event);
      return;
    }

    const query = activeSearchValue.trim();
    navigate(query ? `/products?search=${encodeURIComponent(query)}` : "/products");
  };

  const updateSearch = (value) => {
    setLocalSearch(value);
    onSearchChange?.(value);
  };

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await logoutUser();
      dispatch(logout());
      dispatch(clearCart());

      toast.success("Logged out successfully!");
      window.location.assign("/login");
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to log out. Please try again.",
      );
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white">
      {/* Main header */}
      <div className="mx-auto flex min-h-16 max-w-350 items-center gap-3 px-4 py-2 sm:px-6 lg:gap-6">
        <Logo />

        {/* Desktop search */}
        <form
          onSubmit={handleSearch}
          role="search"
          className="mx-auto hidden h-10 min-w-0 max-w-2xl flex-1 items-center overflow-hidden rounded-lg border border-line bg-soft focus-within:border-rarewolf-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-rarewolf-primary/10 md:flex"
        >
          <input
            type="search"
            name="search"
            value={activeSearchValue}
            onChange={(event) => updateSearch(event.target.value)}
            placeholder="Search for products, brands and more..."
            aria-label="Search products"
            className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-ink-muted"
          />

          <button
            type="submit"
            aria-label="Submit search"
            className="flex h-full w-11 shrink-0 items-center justify-center bg-rarewolf-primary text-white transition-colors hover:bg-rarewolf-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
          >
            <Search size={18} />
          </button>
        </form>

        {/* Desktop actions */}
        <div className="ml-auto hidden items-center gap-5 text-sm lg:flex">
          <Link
            to={isAuthenticated ? "/account/addresses" : "/login"}
            aria-label={
              defaultAddress
                ? `Delivery address: ${deliveryLocation}. Manage addresses`
                : "Add a delivery address"
            }
            className="flex items-center gap-2 hover:text-rarewolf-primary"
          >
            <MapPin size={18} className="shrink-0 text-ink-secondary" />
            <div className="leading-tight">
              <p className="text-xs text-ink-muted">Deliver to</p>
              <p className="font-medium text-ink">{deliveryLocation}</p>
            </div>
          </Link>

          <Link
            to={isAuthenticated ? "/account" : "/login"}
            className="flex items-center gap-2 hover:text-rarewolf-primary"
          >
            <User size={18} />
            <span className="max-w-28 truncate font-medium">
              {isAuthenticated ? userName || "My Account" : "Login"}
            </span>
          </Link>

          <Link
            to={isAuthenticated ? "/account/wishlist" : "/login"}
            state={!isAuthenticated ? { from: "/account/wishlist" } : undefined}
            className="flex items-center gap-1.5 font-medium hover:text-rarewolf-primary"
          >
            <Heart size={18} />
            Saved
            {visibleWishlistCount > 0 && (
              <span className="text-xs text-ink-muted">
                ({visibleWishlistCount})
              </span>
            )}
          </Link>

          <Link
            to="/cart"
            className="relative flex items-center gap-1.5 font-medium hover:text-rarewolf-primary"
          >
            <ShoppingCart size={19} />
            Cart
            {visibleCartCount > 0 && (
              <span className="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rarewolf-primary px-1 text-[10px] font-bold text-white">
                {visibleCartCount}
              </span>
            )}
          </Link>

          {isAuthenticated && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              loading={loggingOut}
              disabled={loggingOut}
              aria-label="Log out"
            >
              <LogOut size={16} />
              Logout
            </Button>
          )}
        </div>

        {/* Mobile actions */}
        <div className="ml-auto flex items-center gap-1 lg:hidden">
          <Link
            to="/products"
            aria-label="Search products"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-ink hover:bg-soft md:hidden"
          >
            <Search size={20} />
          </Link>

          <Link
            to="/cart"
            aria-label={`Cart, ${visibleCartCount} items`}
            className="relative flex h-10 w-10 items-center justify-center rounded-lg hover:bg-soft"
          >
            <ShoppingCart size={20} />
            {visibleCartCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rarewolf-primary px-1 text-[10px] font-bold text-white">
                {visibleCartCount}
              </span>
            )}
          </Link>

          <Link
            to={isAuthenticated ? "/account/wishlist" : "/login"}
            state={!isAuthenticated ? { from: "/account/wishlist" } : undefined}
            aria-label={`Saved products, ${visibleWishlistCount} items`}
            className="relative flex h-10 w-10 items-center justify-center rounded-lg hover:bg-soft"
          >
            <Heart size={20} />
            {visibleWishlistCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rarewolf-primary px-1 text-[10px] font-bold text-white">
                {visibleWishlistCount}
              </span>
            )}
          </Link>

          <Link
            to={isAuthenticated ? "/account" : "/login"}
            aria-label={isAuthenticated ? "My account" : "Log in"}
            className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-soft"
          >
            <User size={20} />
          </Link>

          <button
            type="button"
            onClick={onMobileMenuClick}
            aria-label="Open categories menu"
            className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rarewolf-primary"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Category navigation */}
      {/* <nav
        aria-label="Product categories"
        className="border-t border-line bg-white"
      >
        <ul className="mx-auto flex h-10 max-w-[1400px] items-center gap-5 overflow-x-auto px-4 text-xs sm:px-6 sm:text-sm [&::-webkit-scrollbar]:hidden">
          <li className="shrink-0">
            <button
              type="button"
              onClick={onMobileMenuClick}
              className="flex items-center gap-1.5 whitespace-nowrap font-semibold text-rarewolf-primary"
            >
              <Menu size={15} />
              All Categories
            </button>
          </li>

          {categories.map((category) => (
            <li key={category.name} className="shrink-0">
              <NavLink
                to={category.to}
                className={({ isActive }) =>
                  `whitespace-nowrap transition-colors hover:text-rarewolf-primary ${
                    isActive
                      ? "font-semibold text-rarewolf-primary"
                      : "text-ink-secondary"
                  }`
                }
              >
                {category.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav> */}

      {/* Mobile search */}
      <form
        onSubmit={handleSearch}
        role="search"
        className="flex gap-2 border-t border-line bg-white px-4 py-2 md:hidden"
      >
        <input
          type="search"
          name="mobileSearch"
          value={activeSearchValue}
          onChange={(event) => updateSearch(event.target.value)}
          placeholder="Search products and brands..."
          aria-label="Search products"
          className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-soft px-3 text-sm outline-none focus:border-rarewolf-primary focus:bg-white focus:ring-2 focus:ring-rarewolf-primary/10"
        />

        <button
          type="submit"
          aria-label="Submit search"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rarewolf-primary text-white hover:bg-rarewolf-primary-hover"
        >
          <Search size={18} />
        </button>
      </form>
    </header>
  );
};

export default Header;
