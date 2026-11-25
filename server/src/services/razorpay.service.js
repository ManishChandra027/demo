import { createHmac, timingSafeEqual } from "node:crypto";
import ApiError from "../utils/ApiError.js";

const getCredentials = () => {
    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
    if (!keyId || !keySecret) {
        throw new ApiError(503, "Online payment is not configured. Please choose Cash on Delivery.");
    }
    return { keyId, keySecret };
};

const razorpayRequest = async (path, { method = "GET", body } = {}) => {
    const { keyId, keySecret } = getCredentials();
    let response;
    try {
        response = await fetch(`https://api.razorpay.com/v1${path}`, {
            method,
            headers: {
                Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
                ...(body ? { "Content-Type": "application/json" } : {}),
            },
            ...(body ? { body: JSON.stringify(body) } : {}),
            signal: AbortSignal.timeout(15000),
        });
    } catch {
        throw new ApiError(502, "Could not connect to Razorpay. Please try again.");
    }

    let result;
    try {
        result = await response.json();
    } catch {
        throw new ApiError(502, "Razorpay returned an invalid response. Please try again.");
    }
    if (!response.ok) {
        throw new ApiError(502, "Razorpay could not process the payment request. Please try again.");
    }
    return result;
};

const createRazorpayOrder = async (order) => {
    const gatewayOrder = await razorpayRequest("/orders", {
        method: "POST",
        body: {
            amount: Math.round(order.totalAmount * 100),
            currency: "INR",
            receipt: `rw_${order._id}`,
            notes: { rarewolfOrderId: order._id.toString() },
        },
    });
    return {
        id: gatewayOrder.id,
        amount: gatewayOrder.amount,
        currency: gatewayOrder.currency,
    };
};

const getRazorpayPayment = (paymentId) =>
    razorpayRequest(`/payments/${encodeURIComponent(paymentId)}`);

const getRazorpayOrderPayments = (orderId) =>
    razorpayRequest(`/orders/${encodeURIComponent(orderId)}/payments`);

const captureRazorpayPayment = (paymentId, amount) =>
    razorpayRequest(`/payments/${encodeURIComponent(paymentId)}/capture`, {
        method: "POST",
        body: { amount, currency: "INR" },
    });

const verifyRazorpaySignature = (orderId, paymentId, signature) => {
    const { keySecret } = getCredentials();
    const expected = createHmac("sha256", keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest();
    const received = Buffer.from(signature, "hex");
    return received.length === expected.length && timingSafeEqual(received, expected);
};

const getRazorpayKeyId = () => getCredentials().keyId;

export {
    captureRazorpayPayment,
    createRazorpayOrder,
    getRazorpayKeyId,
    getRazorpayOrderPayments,
    getRazorpayPayment,
    verifyRazorpaySignature,
};
