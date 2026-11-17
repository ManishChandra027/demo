import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Pencil, Plus, ToggleLeft, ToggleRight, X } from "lucide-react";
import Button from "../../components/common/Button";
import FormField from "../../components/common/FormField";
import Loader from "../../components/common/Loader";
import {
  createAdminCategory,
  deactivateAdminCategory,
  getAdminCategories,
  updateAdminCategory,
} from "../../services/adminService";

const emptyCategory = {
  name: "",
  slug: "",
  image: "",
  imageFile: null,
  removeImage: false,
  isActive: true,
};
const slugify = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({});
  const [query, setQuery] = useState({ search: "", status: "all", page: 1 });
  const [searchDraft, setSearchDraft] = useState("");
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingId, setPendingId] = useState("");
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [imagePreview, setImagePreview] = useState("");
  const imagePreviewUrl = useRef("");

  useEffect(() => {
    return () => {
      if (imagePreviewUrl.current) URL.revokeObjectURL(imagePreviewUrl.current);
    };
  }, []);

  const updateImagePreview = (file) => {
    if (imagePreviewUrl.current) URL.revokeObjectURL(imagePreviewUrl.current);
    imagePreviewUrl.current = file ? URL.createObjectURL(file) : "";
    setImagePreview(imagePreviewUrl.current);
  };

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getAdminCategories({ ...query, limit: 12 });
      setCategories(response.data.categories || []);
      setPagination(response.data.pagination || {});
    } catch (requestError) {
      setError(requestError.message || "Categories could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    let active = true;
    getAdminCategories({ ...query, limit: 12 })
      .then((response) => {
        if (!active) return;
        setCategories(response.data.categories || []);
        setPagination(response.data.pagination || {});
        setError("");
      })
      .catch((requestError) => {
        if (active)
          setError(requestError.message || "Categories could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [query, retryKey]);

  const beginEdit = (category) => {
    updateImagePreview(null);
    setEditingId(category._id);
    setForm({
      name: category.name,
      slug: category.slug,
      image: category.image || "",
      imageFile: null,
      removeImage: false,
      isActive: category.isActive,
    });
    setError("");
  };

  const saveCategory = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = new FormData();
      payload.append("name", form.name);
      payload.append("slug", form.slug);
      payload.append("isActive", String(form.isActive));
      if (form.imageFile) payload.append("image", form.imageFile);
      if (form.removeImage) payload.append("removeImage", "true");

      if (!editingId && !form.imageFile) {
        setError("Choose an image for the new category.");
        setSaving(false);
        return;
      }

      if (editingId) await updateAdminCategory(editingId, payload);
      else await createAdminCategory(payload);
      updateImagePreview(null);
      setForm(null);
      setEditingId("");
      await loadCategories();
    } catch (requestError) {
      setError(requestError.message || "Category could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = async (category) => {
    if (
      category.isActive &&
      !window.confirm(
        `Deactivate “${category.name}”? Its products will no longer appear in the store.`,
      )
    )
      return;
    setPendingId(category._id);
    setError("");
    try {
      if (category.isActive) await deactivateAdminCategory(category._id);
      else await updateAdminCategory(category._id, { isActive: true });
      await loadCategories();
    } catch (requestError) {
      setError(requestError.message || "Category status could not be changed.");
    } finally {
      setPendingId("");
    }
  };

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-rarewolf-primary">
            Catalogue
          </p>
          <h1 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">
            Categories
          </h1>
        </div>
        <Button
          onClick={() => {
            updateImagePreview(null);
            setEditingId("");
            setForm({ ...emptyCategory });
            setError("");
          }}
        >
          <Plus size={17} /> Add category
        </Button>
      </header>

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/30 bg-white p-4 text-sm text-danger"
        >
          <span>{error}</span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setLoading(true);
              setRetryKey((key) => key + 1);
            }}
          >
            Retry list
          </Button>
        </div>
      )}

      {form && (
        <form
          onSubmit={saveCategory}
          className="space-y-4 rounded-xl border border-line bg-white p-5 shadow-card"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-ink">
              {editingId ? "Edit category" : "New category"}
            </h2>
            <button
              type="button"
              aria-label="Close category form"
              onClick={() => {
                updateImagePreview(null);
                setForm(null);
                setEditingId("");
              }}
              className="rounded-md p-2 text-ink-muted hover:bg-soft"
            >
              <X size={18} />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="name"
              label="Category name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                  ...(!editingId ? { slug: slugify(event.target.value) } : {}),
                }))
              }
              required
              maxLength={80}
            />
            <FormField
              id="slug"
              label="URL slug"
              value={form.slug}
              onChange={(event) =>
                setForm((current) => ({ ...current, slug: event.target.value }))
              }
              required
              maxLength={180}
            />
            <div className="sm:col-span-2">
              <label htmlFor="category-image" className="mb-1 block text-sm font-medium text-ink">
                Category image {!editingId && <span className="text-danger">*</span>}
              </label>
              <input
                id="category-image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required={!editingId && !form.imageFile}
                onChange={(event) =>
                  {
                    const file = event.target.files?.[0] || null;
                    if (file && file.size > 5 * 1024 * 1024) {
                      setError("Category image must not exceed 5 MB.");
                      event.target.value = "";
                      return;
                    }
                    setError("");
                    updateImagePreview(file);
                    setForm((current) => ({
                      ...current,
                      imageFile: file,
                      removeImage: false,
                    }));
                  }
                }
                className="block min-h-11 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-rarewolf-primary-light file:px-3 file:py-2 file:text-sm file:font-semibold file:text-rarewolf-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rarewolf-primary"
              />
              <p className="mt-1 text-xs text-ink-muted">JPEG, PNG or WebP, up to 5 MB. The image is stored in Cloudinary.</p>
              {(imagePreview || (form.image && !form.removeImage)) && (
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={imagePreview || form.image}
                    alt={`${form.name || "Category"} preview`}
                    className="h-16 w-16 rounded-lg border border-line bg-soft object-cover"
                  />
                  {editingId && !form.removeImage && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        {
                          updateImagePreview(null);
                          setForm((current) => ({
                            ...current,
                            imageFile: null,
                            removeImage: true,
                          }));
                        }
                      }
                    >
                      <X size={15} /> Remove current image
                    </Button>
                  )}
                </div>
              )}
              {form.removeImage && (
                <p className="mt-2 text-sm text-ink-secondary">
                  Current image will be removed when you save. Choose a file to replace it.
                  <button
                    type="button"
                    className="ml-1 font-semibold text-rarewolf-primary underline"
                    onClick={() => setForm((current) => ({ ...current, removeImage: false }))}
                  >
                    Undo
                  </button>
                </p>
              )}
            </div>
            <label className="flex items-center gap-3 text-sm font-medium text-ink">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
                className="h-4 w-4 accent-rarewolf-primary"
              />
              Active in storefront
            </label>
          </div>
          <div className="flex gap-2 border-t border-line pt-4">
            <Button type="submit" loading={saving}>
              <Check size={16} />
              {editingId ? "Save changes" : "Create category"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                updateImagePreview(null);
                setForm(null);
                setEditingId("");
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          setLoading(true);
          setQuery((current) => ({
            ...current,
            search: searchDraft.trim(),
            page: 1,
          }));
        }}
        className="flex flex-col gap-3 rounded-xl border border-line bg-white p-4 shadow-card sm:flex-row"
      >
        <label className="min-w-0 flex-1">
          <span className="sr-only">Search categories</span>
          <input
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Search category name or slug"
            className="h-10 w-full rounded-lg border border-line px-3 text-sm outline-none focus:border-rarewolf-primary"
          />
        </label>
        <label>
          <span className="sr-only">Filter category status</span>
          <select
            value={query.status}
            onChange={(event) => {
              setLoading(true);
              setQuery((current) => ({
                ...current,
                status: event.target.value,
                page: 1,
              }));
            }}
            className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm sm:w-40"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <Button type="submit" size="sm">
          Search
        </Button>
      </form>

      <div className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
        {loading ? (
          <div className="flex min-h-48 items-center justify-center">
            <Loader label="Loading categories" />
          </div>
        ) : categories.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <h2 className="font-bold text-ink">No categories found</h2>
            <p className="mt-1 text-sm text-ink-secondary">
              Create a category or try another search.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="bg-soft text-xs uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Slug</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {categories.map((category) => (
                    <tr key={category._id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {category.image ? (
                            <img
                              src={category.image}
                              alt=""
                              className="h-10 w-10 rounded-lg bg-soft object-cover"
                            />
                          ) : (
                            <span className="h-10 w-10 rounded-lg bg-soft" />
                          )}
                          <span className="font-semibold text-ink">
                            {category.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-secondary">
                        /{category.slug}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${category.isActive ? "bg-green-50 text-green-700" : "bg-soft text-ink-muted"}`}
                        >
                          {category.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Edit ${category.name}`}
                            title="Edit category"
                            onClick={() => beginEdit(category)}
                          >
                            <Pencil size={17} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            loading={pendingId === category._id}
                            aria-label={`${category.isActive ? "Deactivate" : "Activate"} ${category.name}`}
                            title={
                              category.isActive
                                ? "Deactivate category"
                                : "Activate category"
                            }
                            onClick={() => toggleCategory(category)}
                          >
                            {category.isActive ? (
                              <ToggleRight size={19} />
                            ) : (
                              <ToggleLeft size={19} />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm text-ink-secondary">
              <span>
                {pagination.total || 0} categories · Page {pagination.page || 1}{" "}
                of {Math.max(pagination.pages || 0, 1)}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!pagination.hasPreviousPage || loading}
                  onClick={() => {
                    setLoading(true);
                    setQuery((current) => ({
                      ...current,
                      page: current.page - 1,
                    }));
                  }}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!pagination.hasNextPage || loading}
                  onClick={() => {
                    setLoading(true);
                    setQuery((current) => ({
                      ...current,
                      page: current.page + 1,
                    }));
                  }}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default AdminCategories;
