import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";

import {
    createRazorpayOrder,
    verifyRazorpaySignature,
} from "../src/services/razorpay.service.js";

test("Razorpay order creation sends the server-calculated amount in paise", async () => {
    const originalKeyId = process.env.RAZORPAY_KEY_ID;
    const originalKeySecret = process.env.RAZORPAY_KEY_SECRET;
    const originalFetch = globalThis.fetch;
    let requestUrl;
    let requestOptions;
    process.env.RAZORPAY_KEY_ID = "rzp_test_example";
    process.env.RAZORPAY_KEY_SECRET = "razorpay-test-secret";
    globalThis.fetch = async (url, options) => {
        requestUrl = url;
        requestOptions = options;
        return {
            ok: true,
            json: async () => ({ id: "order_test_123", amount: 1299, currency: "INR" }),
        };
    };

    try {
        const order = await createRazorpayOrder({ _id: "internal-order", totalAmount: 12.99 });
        assert.deepEqual(order, { id: "order_test_123", amount: 1299, currency: "INR" });
        assert.equal(requestUrl, "https://api.razorpay.com/v1/orders");
        assert.deepEqual(JSON.parse(requestOptions.body), {
            amount: 1299,
            currency: "INR",
            receipt: "rw_internal-order",
            notes: { rarewolfOrderId: "internal-order" },
        });
        assert.equal(
            requestOptions.headers.Authorization,
            `Basic ${Buffer.from("rzp_test_example:razorpay-test-secret").toString("base64")}`,
        );
    } finally {
        globalThis.fetch = originalFetch;
        if (originalKeyId === undefined) delete process.env.RAZORPAY_KEY_ID;
        else process.env.RAZORPAY_KEY_ID = originalKeyId;
        if (originalKeySecret === undefined) delete process.env.RAZORPAY_KEY_SECRET;
        else process.env.RAZORPAY_KEY_SECRET = originalKeySecret;
    }
});

test("Razorpay signature verification accepts the expected HMAC and rejects altered details", () => {
    const originalKeyId = process.env.RAZORPAY_KEY_ID;
    const originalKeySecret = process.env.RAZORPAY_KEY_SECRET;
    const keySecret = "razorpay-test-secret";
    const orderId = "order_test_123";
    const paymentId = "pay_test_456";
    const signature = createHmac("sha256", keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

    process.env.RAZORPAY_KEY_ID = "rzp_test_example";
    process.env.RAZORPAY_KEY_SECRET = keySecret;
    try {
        assert.equal(verifyRazorpaySignature(orderId, paymentId, signature), true);
        assert.equal(verifyRazorpaySignature(orderId, "pay_test_other", signature), false);
        assert.equal(verifyRazorpaySignature(orderId, paymentId, "ab"), false);
    } finally {
        if (originalKeyId === undefined) delete process.env.RAZORPAY_KEY_ID;
        else process.env.RAZORPAY_KEY_ID = originalKeyId;
        if (originalKeySecret === undefined) delete process.env.RAZORPAY_KEY_SECRET;
        else process.env.RAZORPAY_KEY_SECRET = originalKeySecret;
    }
});
