import { useState } from "react";
import { Plus, ShoppingCart } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import Button from "../common/Button";
import { selectIsAuthenticated } from "../../features/auth/authSelector";
import { setCart } from "../../features/cart/cartSlice";
import { addCartItem } from "../../services/catalogService";

const AddToCartButton = ({ product, compact = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!isAuthenticated) {
      toast.info("Log in to add items to your cart.");
      navigate("/login");
      return;
    }

    if (!product?.id && !product?._id) {
      toast.error("This product cannot be added right now.");
      return;
    }

    setAdding(true);
    try {
      const response = await addCartItem(product.id || product._id, 1);
      dispatch(setCart(response?.data?.cart || null));
      toast.success(`${product.name} added to your cart.`);
    } catch (error) {
      toast.error(error.message || "Unable to add this product to your cart.");
    } finally {
      setAdding(false);
    }
  };

  if (compact) {
    return (
      <Button
        type="button"
        variant="secondary"
        size="icon"
        onClick={handleAdd}
        loading={adding}
        disabled={adding || product.stock <= 0}
        aria-label={`Add ${product.name} to cart`}
        title={product.stock <= 0 ? "Out of stock" : "Add to cart"}
      >
        <Plus size={16} />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      onClick={handleAdd}
      loading={adding}
      disabled={adding || product.stock <= 0}
      fullWidth
    >
      <ShoppingCart size={17} />
      {product.stock <= 0 ? "Out of stock" : "Add to cart"}
    </Button>
  );
};

export default AddToCartButton;
