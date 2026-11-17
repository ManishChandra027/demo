import Category from "../models/category.model.js";
import Product from "../models/product.model.js";
import ApiError from "../utils/ApiError.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudenary.js";
import { logServiceError } from "../utils/logger.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const paginationFor = (total, page, limit) => {
    const pages = Math.ceil(total / limit);
    return {
        total,
        page,
        limit,
        pages,
        hasNextPage: page < pages,
        hasPreviousPage: page > 1,
    };
};

const getStatusFilter = (status) => {
    if (status === "active") return true;
    if (status === "inactive") return false;
    return { $in: [true, false] };
};

const listAdminProducts = async ({ search = "", category, status = "all", page = 1, limit = 12 }) => {
    const filter = { isActive: getStatusFilter(status) };
    if (category) filter.category = category;
    if (search) {
        const pattern = new RegExp(escapeRegex(search), "i");
        filter.$or = [{ name: pattern }, { slug: pattern }, { description: pattern }];
    }

    const [products, total] = await Promise.all([
        Product.find(filter)
            .populate("category", "name slug image isActive")
            .sort({ createdAt: -1, _id: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Product.countDocuments(filter),
    ]);
    return { products, pagination: paginationFor(total, page, limit) };
};

const getAdminProduct = async (productId) => {
    const product = await Product.findById(productId)
        .populate("category", "name slug image isActive")
        .lean();
    if (!product) throw new ApiError(404, "Product not found.");
    return product;
};

const assertActiveCategory = async (categoryId) => {
    const category = await Category.findOne({ _id: categoryId, isActive: true }).select("_id");
    if (!category) throw new ApiError(400, "Choose an existing active category.");
};

const uploadImages = async (files) => {
    const uploaded = [];
    try {
        for (const file of files) {
            const image = await uploadOnCloudinary(file.path, {
                mimeType: file.mimetype,
                folder: "RareWolf/products",
            });
            uploaded.push({ url: image.url, public_id: image.public_id, alt: "" });
        }
        return uploaded;
    } catch (error) {
        await deleteUploadedImages(uploaded);
        throw error;
    }
};

const deleteUploadedImages = async (images) => {
    await Promise.all(images.map(async (image) => {
        if (!image.public_id) return;
        try {
            await deleteFromCloudinary(image.public_id);
        } catch (error) {
            logServiceError("admin.product_image_cleanup_failed", error);
        }
    }));
};

const createAdminProduct = async ({ data, files = [] }) => {
    await assertActiveCategory(data.category);
    if (!files.length) throw new ApiError(400, "Upload at least one product image.");
    const images = await uploadImages(files);
    let product;
    try {
        product = await Product.create({ ...data, images });
    } catch (error) {
        await deleteUploadedImages(images);
        throw error;
    }
    return getAdminProduct(product._id);
};

const updateAdminProduct = async ({ productId, data, files = [] }) => {
    const product = await Product.findById(productId);
    if (!product) throw new ApiError(404, "Product not found.");

    if (data.category && data.category.toString() !== product.category.toString()) {
        await assertActiveCategory(data.category);
    }
    const nextValues = { ...data };
    const mergedPrice = nextValues.price ?? product.price;
    const mergedMrp = nextValues.mrp ?? product.mrp;
    if (mergedMrp !== undefined && mergedMrp < mergedPrice) {
        throw new ApiError(400, "MRP must be greater than or equal to price.");
    }

    const uploadedImages = files.length ? await uploadImages(files) : [];
    const oldImages = product.images;
    try {
        Object.assign(product, nextValues);
        if (uploadedImages.length) product.images = uploadedImages;
        await product.save();
    } catch (error) {
        await deleteUploadedImages(uploadedImages);
        throw error;
    }

    if (uploadedImages.length) await deleteUploadedImages(oldImages);
    return getAdminProduct(productId);
};

const deactivateAdminProduct = async (productId) => {
    const product = await Product.findByIdAndUpdate(
        productId,
        { $set: { isActive: false } },
        { new: true, runValidators: true },
    );
    if (!product) throw new ApiError(404, "Product not found.");
    return getAdminProduct(productId);
};

const listAdminCategories = async ({ search = "", status = "all", page = 1, limit = 20 }) => {
    const filter = { isActive: getStatusFilter(status) };
    if (search) {
        const pattern = new RegExp(escapeRegex(search), "i");
        filter.$or = [{ name: pattern }, { slug: pattern }];
    }
    const [categories, total] = await Promise.all([
        Category.find(filter).sort({ name: 1, _id: 1 }).skip((page - 1) * limit).limit(limit).lean(),
        Category.countDocuments(filter),
    ]);
    return { categories, pagination: paginationFor(total, page, limit) };
};

const getAdminCategory = async (categoryId) => {
    const category = await Category.findById(categoryId).lean();
    if (!category) throw new ApiError(404, "Category not found.");
    return category;
};

const uploadCategoryImage = async (file) => {
    if (!file) throw new ApiError(400, "Upload a category image.");
    return uploadOnCloudinary(file.path, {
        mimeType: file.mimetype,
        folder: "RareWolf/categories",
    });
};

const toAdminCategoryResponse = (category) => {
    const result = category.toObject();
    delete result.imagePublicId;
    return result;
};

const deleteCategoryImage = async (publicId) => {
    if (!publicId) return;
    try {
        await deleteFromCloudinary(publicId);
    } catch (error) {
        logServiceError("admin.category_image_cleanup_failed", error);
    }
};

const createAdminCategory = async ({ data, file }) => {
    const uploadedImage = await uploadCategoryImage(file);
    try {
        const category = await Category.create({
            ...data,
            image: uploadedImage.url,
            imagePublicId: uploadedImage.public_id,
        });
        return toAdminCategoryResponse(category);
    } catch (error) {
        await deleteCategoryImage(uploadedImage.public_id);
        throw error;
    }
};

const updateAdminCategory = async ({ categoryId, data, file }) => {
    const category = await Category.findById(categoryId).select("+imagePublicId");
    if (!category) throw new ApiError(404, "Category not found.");

    const { removeImage, ...fieldsToUpdate } = data;
    const oldImagePublicId = category.imagePublicId;
    let uploadedImage;
    if (file) uploadedImage = await uploadCategoryImage(file);

    try {
        Object.assign(category, fieldsToUpdate);
        if (uploadedImage) {
            category.image = uploadedImage.url;
            category.imagePublicId = uploadedImage.public_id;
        } else if (removeImage) {
            category.image = "";
            category.imagePublicId = "";
        }
        await category.save();
    } catch (error) {
        if (uploadedImage) await deleteCategoryImage(uploadedImage.public_id);
        throw error;
    }

    if (uploadedImage || removeImage) await deleteCategoryImage(oldImagePublicId);
    return toAdminCategoryResponse(category);
};

const deactivateAdminCategory = async (categoryId) =>
    updateAdminCategory({ categoryId, data: { isActive: false } });

export {
    createAdminCategory,
    createAdminProduct,
    deactivateAdminCategory,
    deactivateAdminProduct,
    getAdminCategory,
    getAdminProduct,
    listAdminCategories,
    listAdminProducts,
    updateAdminCategory,
    updateAdminProduct,
};
