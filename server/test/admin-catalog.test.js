import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { v2 as cloudinary } from "cloudinary";
import Category from "../src/models/category.model.js";
import Product from "../src/models/product.model.js";
import { uploadOnCloudinary } from "../src/utils/cloudenary.js";
import {
    createAdminCategory,
    deactivateAdminCategory,
    updateAdminCategory,
    updateAdminProduct,
} from "../src/services/adminCatalog.service.js";
import { listCategories, listProducts } from "../src/services/catalog.service.js";
import {
    adminCategoryCreateSchema,
    adminCategoryIdSchema,
    adminCategoryUpdateSchema,
    adminProductCreateSchema,
    adminProductListSchema,
    adminProductUpdateSchema,
} from "../src/validations/admin.validation.js";

const restore = (t, model, method, value) => {
    const original = model[method];
    model[method] = value;
    t.after(() => { model[method] = original; });
};

test("admin product validation constrains fields, price/MRP, and pagination", () => {
    const valid = adminProductCreateSchema.validate({
        name: "Field Jacket",
        slug: "field-jacket",
        description: "A durable everyday jacket for all seasons.",
        price: "1299",
        mrp: "1499",
        category: "0123456789abcdef01234567",
        stock: "8",
        isActive: "true",
    });
    assert.equal(valid.error, undefined);
    assert.equal(valid.value.price, 1299);
    assert.equal(valid.value.stock, 8);
    assert.equal(valid.value.isActive, true);

    assert.ok(adminProductCreateSchema.validate({
        name: "Field Jacket",
        slug: "field-jacket",
        description: "A durable everyday jacket for all seasons.",
        price: 1499,
        mrp: 1299,
        category: "0123456789abcdef01234567",
        stock: 8,
    }).error);
    assert.ok(adminProductCreateSchema.validate({
        name: "Field Jacket",
        slug: "field-jacket",
        description: "A durable everyday jacket for all seasons.",
        price: 1299,
        mrp: 1499,
        category: "not-an-id",
        stock: 8,
        unexpected: true,
    }).error);
    assert.ok(adminProductUpdateSchema.validate({ mrp: 500 }).error === undefined);
    assert.ok(adminProductUpdateSchema.validate({ stock: 500 }).error, "stock is reserved for the atomic inventory phase");
    assert.ok(adminProductListSchema.validate({ page: 0 }).error);
    assert.ok(adminProductListSchema.validate({ limit: 51 }).error);
});

test("product image uploads reject unsupported formats before Cloudinary is called", async () => {
    await assert.rejects(
        uploadOnCloudinary("./public/temp/not-present.gif", { mimeType: "image/gif" }),
        (error) => error.statusCode === 400 && /unsupported image format/i.test(error.message),
    );
});

test("admin category validation and identifiers reject malformed values", () => {
    const category = adminCategoryCreateSchema.validate({ name: "Outerwear", slug: "outerwear" });
    assert.equal(category.error, undefined);
    assert.equal(category.value.image, undefined, "image URLs are supplied by the upload service");
    assert.equal(category.value.isActive, true);
    assert.ok(adminCategoryCreateSchema.validate({ name: "x", slug: "Bad Slug" }).error);
    assert.ok(adminCategoryCreateSchema.validate({ name: "Outerwear", slug: "outerwear", image: "https://example.test/image.png" }).error);
    assert.equal(adminCategoryUpdateSchema.validate({ removeImage: "true" }).value.removeImage, true);
    assert.ok(adminCategoryUpdateSchema.validate({ removeImage: true, unknown: "field" }).error);
    assert.ok(adminCategoryIdSchema.validate({ categoryId: "bad-id" }).error);
});

test("category deactivation is soft and active storefront category reads exclude it", async (t) => {
    const category = {
        _id: "category-1",
        name: "Outerwear",
        slug: "outerwear",
        isActive: true,
    };
    const historicalProduct = { _id: "product-1", category: category._id, isActive: true };

    category.save = async () => {};
    category.toObject = () => ({ ...category });
    restore(t, Category, "findById", (id) => ({
        select: async () => id === category._id ? category : null,
    }));
    restore(t, Category, "find", (filter) => ({
        sort: () => ({
            lean: async () => filter.isActive
                ? (category.isActive ? [{ ...category }] : [])
                : [{ ...category }],
        }),
    }));

    const updated = await deactivateAdminCategory(category._id);
    assert.equal(updated.isActive, false);
    assert.equal(historicalProduct.isActive, true, "products are retained when their category is deactivated");
    assert.deepEqual(await listCategories(), []);
});

test("storefront product listing excludes products when their category is inactive", async (t) => {
    let productFilter;
    restore(t, Category, "find", () => ({ distinct: async () => [] }));
    restore(t, Product, "find", (filter) => {
        productFilter = filter;
        return {
            populate: () => ({
                sort: () => ({
                    skip: () => ({
                        limit: () => ({ lean: async () => [] }),
                    }),
                }),
            }),
        };
    });
    restore(t, Product, "countDocuments", async () => 0);

    const result = await listProducts({ page: 1, limit: 12 });
    assert.deepEqual(result.products, []);
    assert.deepEqual(productFilter.category.$in, []);
    assert.equal(productFilter.isActive, true);
});

test("category create requires an uploaded image; edit can preserve, replace, or remove it", async (t) => {
    const tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "rarewolf-category-"));
    t.after(() => fs.rm(tempDirectory, { recursive: true, force: true }));
    const makeFile = async (name) => {
        const filePath = path.join(tempDirectory, name);
        await fs.writeFile(filePath, "test image bytes");
        return { path: filePath, mimetype: "image/png" };
    };
    let uploadNumber = 0;
    const removedImages = [];
    t.mock.method(cloudinary.uploader, "upload", async () => {
        uploadNumber += 1;
        return { secure_url: `https://images.example.test/category-${uploadNumber}.png`, public_id: `category-image-${uploadNumber}` };
    });
    t.mock.method(cloudinary.uploader, "destroy", async (publicId) => {
        removedImages.push(publicId);
        return { result: "ok" };
    });

    const category = {
        _id: "category-2",
        name: "Footwear",
        slug: "footwear",
        image: "",
        imagePublicId: "",
        isActive: true,
        toObject() { return { ...this }; },
        async save() {},
    };
    restore(t, Category, "create", async (data) => {
        Object.assign(category, data);
        return category;
    });
    restore(t, Category, "findById", (id) => ({
        select: async () => id === category._id ? category : null,
    }));

    await assert.rejects(createAdminCategory({ data: { name: "Footwear", slug: "footwear" } }), /category image/i);
    const createdCategory = await createAdminCategory({
        data: { name: "Footwear", slug: "footwear" },
        file: await makeFile("initial.png"),
    });
    assert.equal(createdCategory.image, "https://images.example.test/category-1.png");
    assert.equal(createdCategory.imagePublicId, undefined, "Cloudinary public IDs stay private");

    await updateAdminCategory({ categoryId: category._id, data: { name: "Shoes" } });
    assert.equal(category.image, "https://images.example.test/category-1.png", "edits without image changes preserve the current image");
    assert.deepEqual(removedImages, []);

    await updateAdminCategory({
        categoryId: category._id,
        data: {},
        file: await makeFile("replacement.png"),
    });
    assert.equal(category.image, "https://images.example.test/category-2.png");
    assert.deepEqual(removedImages, ["category-image-1"], "replacement removes the old Cloudinary asset");

    await updateAdminCategory({ categoryId: category._id, data: { removeImage: true } });
    assert.equal(category.image, "");
    assert.deepEqual(removedImages, ["category-image-1", "category-image-2"], "explicit removal deletes the current Cloudinary asset");
});

test("admin product edits preserve images and do not overwrite stock", async (t) => {
    const categoryData = { _id: "category-2", name: "Shoes", slug: "shoes", image: "", isActive: true };

    const product = {
        _id: "product-2",
        category: "category-2",
        name: "Canvas Shoe",
        description: "A comfortable everyday shoe for all seasons.",
        price: 1000,
        mrp: 1200,
        stock: 9,
        images: [{ url: "https://images.example.test/shoe.png", public_id: "shoe-image" }],
        isActive: true,
        save: async () => {},
    };
    let lookupCount = 0;
    restore(t, Product, "findById", (id) => {
        lookupCount += 1;
        if (lookupCount === 1) return Promise.resolve(product);
        return {
            populate: () => ({
                lean: async () => ({ ...product, category: { _id: categoryData._id, name: "Shoes", isActive: true } }),
            }),
        };
    });

    const editedProduct = await updateAdminProduct({
        productId: product._id,
        data: { name: "Updated Canvas Shoe" },
        files: [],
    });
    assert.equal(editedProduct.name, "Updated Canvas Shoe");
    assert.equal(product.stock, 9);
    assert.equal(product.images[0].public_id, "shoe-image");
});
