import { useState } from "react";
import { Heart } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import Button from "../common/Button";
import { selectIsAuthenticated } from "../../features/auth/authSelector";
import { selectWishlist, setWishlist } from "../../features/wishlist/wishlistSlice";
import { addWishlistProduct, removeWishlistProduct } from "../../services/catalogService";

const WishlistButton = ({ product, overlay = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const products = useSelector(selectWishlist);
  const [saving, setSaving] = useState(false);
  const productId = product?._id || product?.id;
  const saved = products.some((item) => (item._id || item.id) === productId);

  const toggleWishlist = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      toast.info("Sign in to save products to your wishlist.");
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    if (!productId || saving) return;

    setSaving(true);
    try {
      const response = saved
        ? await removeWishlistProduct(productId)
        : await addWishlistProduct(productId);
      dispatch(setWishlist(response?.data?.products || []));
      toast.success(saved ? "Removed from saved items." : "Added to saved items.");
    } catch (error) {
      toast.error(error.message || "Unable to update saved items.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      loading={saving}
      disabled={saving}
      onClick={toggleWishlist}
      aria-label={saved ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
      aria-pressed={saved}
      title={saved ? "Remove from saved items" : "Save for later"}
      className={overlay ? "border-white/70 bg-white text-rarewolf-primary shadow-sm hover:bg-white/90" : ""}
    >
      <Heart size={17} className={saved ? "fill-rarewolf-primary text-rarewolf-primary" : ""} />
    </Button>
  );
};

export default WishlistButton;
