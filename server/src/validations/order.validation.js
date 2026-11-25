import Joi from "joi";

export const createOrderSchema = Joi.object({
    addressId: Joi.string().hex().length(24).required(),
    paymentMethod: Joi.string().valid("cod", "razorpay").default("cod"),
}).unknown(false);

export const verifyRazorpayPaymentSchema = Joi.object({
    razorpay_order_id: Joi.string().trim().min(1).max(100).required(),
    razorpay_payment_id: Joi.string().trim().min(1).max(100).required(),
    razorpay_signature: Joi.string().hex().length(64).required(),
}).unknown(false);

export const orderParamsSchema = Joi.object({
    orderId: Joi.string().hex().length(24).required(),
}).unknown(false);
