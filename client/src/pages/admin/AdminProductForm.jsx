import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ImagePlus } from "lucide-react";
import Button from "../../components/common/Button";
import FormField from "../../components/common/FormField";
import Loader from "../../components/common/Loader";
import {
  createAdminProduct,
  getAdminCategories,
  getAdminProduct,
  updateAdminProduct,
} from "../../services/adminService";

const initialForm = {
  name: "",
  slug: "",
  description: "",
  price: "",
  mrp: "",
  category: "",
  stock: "0",
  isActive: true,
};

const slugify = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const AdminProductForm = () => {
  const { productId } = useParams();
  const isEditing = Boolean(productId);
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState([]);
  const [currentImages, setCurrentImages] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      getAdminCategories({ status: "all", limit: 50, page: 1 }),
      isEditing ? getAdminProduct(productId) : Promise.resolve(null),
    ])
      .then(([categoryResponse, productResponse]) => {
        if (!active) return;
        const availableCategories = categoryResponse.data.categories || [];
        setCategories(availableCategories);
        if (productResponse) {
          const product = productResponse.data.product;
          setForm({
            name: product.name || "",
            slug: product.slug || "",
            description: product.description || "",
            price: String(product.price ?? ""),
            mrp: String(product.mrp ?? product.price ?? ""),
            category: product.category?._id || "",
            stock: String(product.stock ?? 0),
            isActive: Boolean(product.isActive),
          });
          setCurrentImages(product.images || []);
        }
      })
      .catch((requestError) => {
        if (active)
          setError(
            requestError.message || "Product form data could not be loaded.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isEditing, productId]);

  const previews = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files],
  );
  useEffect(
    () => () => previews.forEach((url) => URL.revokeObjectURL(url)),
    [previews],
  );

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "name" && !isEditing ? { slug: slugify(value) } : {}),
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    const numericPrice = Number(form.price);
    const numericMrp = Number(form.mrp);
    if (form.mrp !== "" && numericMrp < numericPrice) {
      setError("MRP must be greater than or equal to the selling price.");
      return;
    }
    if (!isEditing && files.length === 0) {
      setError("Choose at least one product image before saving.");
      return;
    }

    const payload = new FormData();
    for (const [key, value] of Object.entries(form)) {
      if (isEditing && key === "stock") continue;
      payload.append(key, String(value));
    }
    files.forEach((file) => payload.append("images", file));

    setSaving(true);
    try {
      if (isEditing) await updateAdminProduct(productId, payload);
      else await createAdminProduct(payload);
      navigate("/admin/products", { replace: true });
    } catch (requestError) {
      setError(requestError.message || "Product could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex min-h-56 items-center justify-center">
        <Loader label="Loading product form" />
      </div>
    );

  return (
    <section className="mx-auto max-w-4xl space-y-5">
      <Link
        to="/admin/products"
        className="inline-flex items-center gap-2 text-sm font-semibold text-ink-secondary hover:text-rarewolf-primary"
      >
        <ArrowLeft size={17} /> Products
      </Link>
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-rarewolf-primary">
          Catalogue
        </p>
        <h1 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">
          {isEditing ? "Edit product" : "Add product"}
        </h1>
      </header>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-danger/30 bg-white p-3 text-sm text-danger"
        >
          {error}
        </p>
      )}

      <form
        onSubmit={submit}
        className="space-y-6 rounded-2xl border border-line bg-white p-5 shadow-card sm:p-7"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="name"
            label="Product name"
            value={form.name}
            onChange={updateField}
            required
            maxLength={160}
          />
          <FormField
            id="slug"
            label="URL slug"
            value={form.slug}
            onChange={updateField}
            required
            maxLength={180}
          />
          <label className="sm:col-span-2">
            <span className="mb-1 block text-sm font-medium text-ink">
              Description
            </span>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={updateField}
              required
              minLength={10}
              maxLength={5000}
              rows={5}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-rarewolf-primary focus:ring-2 focus:ring-rarewolf-primary/10"
            />
          </label>
          <FormField
            id="price"
            label="Selling price (₹)"
            type="number"
            value={form.price}
            onChange={updateField}
            required
            min="0"
            step="0.01"
          />
          <FormField
            id="mrp"
            label="MRP (₹)"
            type="number"
            value={form.mrp}
            onChange={updateField}
            required
            min="0"
            step="0.01"
          />
          <label>
            <span className="mb-1 block text-sm font-medium text-ink">
              Category
            </span>
            <select
              id="category"
              name="category"
              value={form.category}
              onChange={updateField}
              required
              className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-rarewolf-primary focus:ring-2 focus:ring-rarewolf-primary/10"
            >
              <option value="">Choose a category</option>
              {categories.map((category) => (
                <option
                  key={category._id}
                  value={category._id}
                  disabled={
                    !category.isActive && category._id !== form.category
                  }
                >
                  {category.name}
                  {category.isActive ? "" : " (inactive)"}
                </option>
              ))}
            </select>
          </label>
          {isEditing ? (
            <div>
              <FormField
                id="stock"
                label="Available stock"
                type="number"
                value={form.stock}
                disabled
              />
              <p className="mt-1 text-xs text-ink-muted">
                Stock changes use the inventory controls in the next admin
                phase.
              </p>
            </div>
          ) : (
            <FormField
              id="stock"
              label="Starting stock"
              type="number"
              value={form.stock}
              onChange={updateField}
              required
              min="0"
              step="1"
            />
          )}
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-ink">
            Product images
          </legend>
          <p className="text-xs text-ink-muted">
            JPEG, PNG or WebP, up to 5 images and 5 MB each.{" "}
            {isEditing && "Selecting images replaces the current gallery."}
          </p>
          {currentImages.length > 0 && files.length === 0 && (
            <div className="flex flex-wrap gap-3">
              {currentImages.map((image, index) => (
                <img
                  key={`${image.url}-${index}`}
                  src={image.url}
                  alt={image.alt || `Product image ${index + 1}`}
                  className="h-20 w-20 rounded-lg border border-line bg-soft object-contain"
                />
              ))}
            </div>
          )}
          {previews.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {previews.map((src, index) => (
                <img
                  key={src}
                  src={src}
                  alt={`Selected product image ${index + 1}`}
                  className="h-20 w-20 rounded-lg border border-line bg-soft object-contain"
                />
              ))}
            </div>
          )}
          <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-line px-3 text-sm font-semibold text-ink-secondary hover:border-rarewolf-primary hover:text-rarewolf-primary">
            <ImagePlus size={18} />
            Choose images
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              max="5"
              className="sr-only"
              onChange={(event) =>
                setFiles(Array.from(event.target.files || []).slice(0, 5))
              }
            />
          </label>
        </fieldset>

        <label className="flex items-center gap-3 text-sm font-medium text-ink">
          <input
            type="checkbox"
            name="isActive"
            checked={form.isActive}
            onChange={updateField}
            className="h-4 w-4 accent-rarewolf-primary"
          />
          Visible in the store
        </label>
        <div className="flex flex-wrap gap-3 border-t border-line pt-5">
          <Button type="submit" loading={saving}>
            {isEditing ? "Save changes" : "Create product"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/admin/products")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </section>
  );
};

export default AdminProductForm;
