import { Address } from "../models/address.model.js";
import Cart from "../models/cart.model.js";
import Category from "../models/category.model.js";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import ApiError from "../utils/ApiError.js";
import {
    captureRazorpayPayment,
    createRazorpayOrder,
    getRazorpayKeyId,
    getRazorpayOrderPayments,
    getRazorpayPayment,
    verifyRazorpaySignature,
} from "./razorpay.service.js";

const toMoney = (amount) => Math.round((amount + Number.EPSILON) * 100) / 100;

const reserveStock = async (product, quantity) => {
    const updated = await Product.findOneAndUpdate(
        {
            _id: product._id,
            isActive: true,
            price: product.price,
            stock: { $gte: quantity },
        },
        { $inc: { stock: -quantity } },
        { new: true }
    );
    if (!updated) {
        throw new ApiError(
            409,
            `${product.name} is no longer available in the requested quantity or price.`
        );
    }
};

const restoreReservations = async (reservations) => {
    const restored = [];
    try {
        for (const reservation of reservations) {
            await Product.updateOne(
                { _id: reservation.productId },
                { $inc: { stock: reservation.quantity } }
            );
            restored.push(reservation);
        }
    } catch (error) {
        for (const reservation of restored.reverse()) {
            await Product.updateOne(
                { _id: reservation.productId },
                { $inc: { stock: -reservation.quantity } }
            );
        }
        throw error;
    }
};

const createOrderFromCartWithPayment = async (userId, addressId, paymentMethod) => {
    const [cart, address] = await Promise.all([
        Cart.findOne({ user: userId }).populate({
            path: "items.product",
            select: "name slug price images stock isActive category",
        }),
        Address.findOne({ _id: addressId, user: userId }),
    ]);

    if (!address)
        throw new ApiError(404, "Choose one of your saved delivery addresses.");
    if (!cart?.items?.length) throw new ApiError(400, "Your cart is empty.");

    const orderItems = [];
    const reservations = [];
    let order;
    let payment = null;
    let subtotal = 0;

    try {
        for (const cartItem of cart.items) {
            const product = cartItem.product;
            if (!product || !product.isActive) {
                throw new ApiError(
                    409,
                    "A product in your cart is no longer available. Remove it and try again."
                );
            }

            const categoryIsActive = await Category.exists({
                _id: product.category,
                isActive: true,
            });

            if (!categoryIsActive) {
                throw new ApiError(
                    409,
                    `${product.name} is no longer available.`
                );
            }

            await reserveStock(product, cartItem.quantity);
            reservations.push({
                productId: product._id,
                quantity: cartItem.quantity,
            });

            const unitPrice = toMoney(product.price);
            const lineTotal = toMoney(unitPrice * cartItem.quantity);
            subtotal = toMoney(subtotal + lineTotal);
            orderItems.push({
                product: product._id,
                name: product.name,
                slug: product.slug,
                image: product.images?.[0]?.url || "",
                quantity: cartItem.quantity,
                unitPrice,
                lineTotal,
            });
        }

        const deliveryAddress = {
            fullName: address.fullName,
            phone: address.phone,
            addressLine1: address.addressLine1,
            city: address.city,
            state: address.state,
            pinCode: address.pinCode,
            country: address.country,
        };

        order = await Order.create({
            user: userId,
            items: orderItems,
            deliveryAddress,
            subtotal,
            shippingAmount: 0,
            totalAmount: subtotal,
            paymentMethod,
            paymentStatus: "pending",
            status: paymentMethod === "razorpay" ? "payment_pending" : "placed",
        });

        if (paymentMethod === "razorpay") {
            payment = await createRazorpayOrder(order);
            order.razorpayOrderId = payment.id;
            await order.save();
        }

        const deletedCart = await Cart.findOneAndDelete({
            _id: cart._id,
            user: userId,
            updatedAt: cart.updatedAt,
            items: cart.items.map((item) => ({
                product: item.product._id,
                quantity: item.quantity,
            })),
        });
        if (!deletedCart) {
            await Order.deleteOne({ _id: order._id, user: userId });
            order = null;
            throw new ApiError(
                409,
                "Your cart changed during checkout. Review it and place your order again."
            );
        }

        return { order, payment };
    } catch (error) {
        if (order) await Order.deleteOne({ _id: order._id, user: userId });
        if (reservations.length) await restoreReservations(reservations);
        throw error;
    }
};

const createOrderFromCart = async (userId, addressId) => {
    const { order } = await createOrderFromCartWithPayment(userId, addressId, "cod");
    return order;
};

const createRazorpayOrderFromCart = async (userId, addressId) => {
    const result = await createOrderFromCartWithPayment(userId, addressId, "razorpay");
    return { ...result, keyId: getRazorpayKeyId() };
};

const createRazorpayPaymentForOrder = async (userId, orderId) => {
    const order = await Order.findOne({
        _id: orderId,
        user: userId,
        paymentMethod: "razorpay",
        paymentStatus: "pending",
        status: "payment_pending",
    });
    if (!order) throw new ApiError(409, "This order is not awaiting an online payment.");

    if (order.razorpayOrderId) {
        const gatewayPayments = await getRazorpayOrderPayments(order.razorpayOrderId);
        const capturedPayment = gatewayPayments.items?.find((payment) =>
            payment.status === "captured" &&
            payment.amount === Math.round(order.totalAmount * 100) &&
            payment.currency === "INR"
        );
        if (capturedPayment) {
            const paidOrder = await Order.findOneAndUpdate(
                {
                    _id: order._id,
                    user: userId,
                    status: "payment_pending",
                    paymentStatus: "pending",
                    razorpayOrderId: order.razorpayOrderId,
                },
                {
                    $set: {
                        status: "placed",
                        paymentStatus: "paid",
                        razorpayPaymentId: capturedPayment.id,
                    },
                },
                { new: true, runValidators: true },
            );
            if (paidOrder) return { order: paidOrder, payment: null, keyId: getRazorpayKeyId(), alreadyPaid: true };
            const latestOrder = await Order.findOne({ _id: order._id, user: userId });
            if (latestOrder?.paymentStatus === "paid") {
                return { order: latestOrder, payment: null, keyId: getRazorpayKeyId(), alreadyPaid: true };
            }
            throw new ApiError(409, "This order changed while payment was being checked.");
        }
    }

    const payment = order.razorpayOrderId
        ? {
            id: order.razorpayOrderId,
            amount: Math.round(order.totalAmount * 100),
            currency: "INR",
        }
        : await createRazorpayOrder(order);
    if (!order.razorpayOrderId) {
        order.razorpayOrderId = payment.id;
        await order.save();
    }
    return { order, payment, keyId: getRazorpayKeyId() };
};

const verifyRazorpayPaymentForOrder = async (userId, orderId, details) => {
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order || order.paymentMethod !== "razorpay") {
        throw new ApiError(404, "Online payment order not found.");
    }

    if (
        details.razorpay_order_id !== order.razorpayOrderId ||
        !verifyRazorpaySignature(
            details.razorpay_order_id,
            details.razorpay_payment_id,
            details.razorpay_signature,
        )
    ) {
        throw new ApiError(400, "Razorpay payment verification failed.");
    }

    if (order.paymentStatus === "paid") {
        if (order.razorpayPaymentId !== details.razorpay_payment_id) {
            throw new ApiError(409, "A different payment is already recorded for this order.");
        }
        return order;
    }
    if (order.status !== "payment_pending") {
        throw new ApiError(409, "This order is no longer awaiting payment.");
    }

    const expectedAmount = Math.round(order.totalAmount * 100);
    let payment = await getRazorpayPayment(details.razorpay_payment_id);
    if (
        payment.order_id !== order.razorpayOrderId ||
        payment.amount !== expectedAmount ||
        payment.currency !== "INR"
    ) {
        throw new ApiError(400, "The Razorpay payment details do not match this order.");
    }
    if (payment.status === "authorized") {
        payment = await captureRazorpayPayment(details.razorpay_payment_id, expectedAmount);
    }
    if (payment.status !== "captured") {
        throw new ApiError(409, "Payment has not been captured yet. Please retry or contact support.");
    }

    const updatedOrder = await Order.findOneAndUpdate(
        {
            _id: order._id,
            user: userId,
            status: "payment_pending",
            paymentStatus: "pending",
            razorpayOrderId: details.razorpay_order_id,
        },
        {
            $set: {
                status: "placed",
                paymentStatus: "paid",
                razorpayPaymentId: details.razorpay_payment_id,
            },
        },
        { new: true, runValidators: true },
    );
    if (!updatedOrder) {
        const latestOrder = await Order.findOne({ _id: order._id, user: userId });
        if (
            latestOrder?.paymentStatus === "paid" &&
            latestOrder.razorpayPaymentId === details.razorpay_payment_id
        ) return latestOrder;
        throw new ApiError(409, "This order changed while payment was being verified.");
    }
    return updatedOrder;
};

const getUserOrders = async (userId) =>
    Order.find({ user: userId }).sort({ createdAt: -1 }).limit(100).lean();

const getUserOrder = async (userId, orderId) => {
    const order = await Order.findOne({ _id: orderId, user: userId }).lean();
    if (!order) throw new ApiError(404, "Order not found.");
    return order;
};

const cancelPlacedOrder = async ({ orderId, userId }) => {
    const ownerFilter = userId ? { user: userId } : {};
    let order = await Order.findOneAndUpdate(
        {
            _id: orderId,
            ...ownerFilter,
            status: "payment_pending",
            paymentMethod: "razorpay",
            paymentStatus: "pending",
        },
        { $set: { status: "cancelled", cancelledAt: new Date() } },
        { new: true }
    );
    if (!order) {
        order = await Order.findOneAndUpdate(
            {
                _id: orderId,
                ...ownerFilter,
                status: "placed",
                $or: [{ paymentMethod: "cod" }, { paymentStatus: { $ne: "paid" } }],
            },
            { $set: { status: "cancelled", cancelledAt: new Date() } },
            { new: true }
        );
    }
    if (!order) {
        const existingFilter = { _id: orderId };
        if (userId) existingFilter.user = userId;
        const existing = await Order.exists(existingFilter);
        if (!existing) throw new ApiError(404, "Order not found.");
        throw new ApiError(409, "This order can no longer be cancelled. Paid Razorpay orders require a refund.");
    }

    try {
        await restoreReservations(
            order.items
                .filter((item) => item.product)
                .map((item) => ({
                    productId: item.product,
                    quantity: item.quantity,
                }))
        );
    } catch (error) {
        const rollbackFilter = { _id: order._id, status: "cancelled" };
        if (userId) rollbackFilter.user = userId;
        await Order.updateOne(rollbackFilter, {
            $set: { status: "placed", cancelledAt: null },
        });
        throw error;
    }

    return order;
};

const cancelUserOrder = async (userId, orderId) =>
    cancelPlacedOrder({ userId, orderId });

const cancelAdminOrder = async (orderId) => cancelPlacedOrder({ orderId });

export {
    cancelAdminOrder,
    cancelUserOrder,
    createRazorpayOrderFromCart,
    createRazorpayPaymentForOrder,
    createOrderFromCart,
    getUserOrder,
    getUserOrders,
    verifyRazorpayPaymentForOrder,
};
