import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import * as orderService from "../services/order.service.js";

const createOrder = asyncHandler(async (req, res) => {
    if (req.body.paymentMethod === "razorpay") {
        const result = await orderService.createRazorpayOrderFromCart(
            req.user._id,
            req.body.addressId
        );
        return res.status(201).json(
            new ApiResponse(201, result, "Continue to Razorpay to complete your payment.")
        );
    }

    const order = await orderService.createOrderFromCart(req.user._id, req.body.addressId);
    return res.status(201).json(new ApiResponse(201, { order }, "Order placed successfully."));
});

const createRazorpayPayment = asyncHandler(async (req, res) => {
    const result = await orderService.createRazorpayPaymentForOrder(
        req.user._id,
        req.params.orderId
    );
    res.status(201).json(new ApiResponse(201, result, "Razorpay payment is ready."));
});

const verifyRazorpayPayment = asyncHandler(async (req, res) => {
    const order = await orderService.verifyRazorpayPaymentForOrder(
        req.user._id,
        req.params.orderId,
        req.body
    );
    res.status(200).json(new ApiResponse(200, { order }, "Payment verified successfully."));
});

const getMyOrders = asyncHandler(async (req, res) => {
    const orders = await orderService.getUserOrders(req.user._id);
    res.status(200).json(new ApiResponse(200, { orders }, "Orders fetched successfully."));
});

const getMyOrder = asyncHandler(async (req, res) => {
    const order = await orderService.getUserOrder(req.user._id, req.params.orderId);
    res.status(200).json(new ApiResponse(200, { order }, "Order fetched successfully."));
});

const cancelMyOrder = asyncHandler(async (req, res) => {
    const order = await orderService.cancelUserOrder(req.user._id, req.params.orderId);
    res.status(200).json(new ApiResponse(200, { order }, "Order cancelled successfully."));
});

export {
    cancelMyOrder,
    createOrder,
    createRazorpayPayment,
    getMyOrder,
    getMyOrders,
    verifyRazorpayPayment,
};
