import { Router } from "express";

import {
    cancelMyOrder,
    createOrder,
    createRazorpayPayment,
    getMyOrder,
    getMyOrders,
    verifyRazorpayPayment,
} from "../controllers/order.controller.js";
import { verifyJwt } from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
    createOrderSchema,
    orderParamsSchema,
    verifyRazorpayPaymentSchema,
} from "../validations/order.validation.js";

const router = Router();

router.use(verifyJwt);
router.post("/", validate(createOrderSchema), createOrder);
router.get("/", getMyOrders);
router.post(
    "/:orderId/razorpay",
    validate(orderParamsSchema, "params"),
    createRazorpayPayment
);
router.post(
    "/:orderId/razorpay/verify",
    validate(orderParamsSchema, "params"),
    validate(verifyRazorpayPaymentSchema),
    verifyRazorpayPayment
);
router.get("/:orderId", validate(orderParamsSchema, "params"), getMyOrder);
router.post("/:orderId/cancel", validate(orderParamsSchema, "params"), cancelMyOrder);

export default router;
