import { Router } from "express";
import {
    getCurrentUser,
    updateAccountDetails,
} from "../controllers/user.controller.js";
import { verifyJwt } from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { updateAccountDetailsSchema } from "../validations/user.validation.js";

const router = Router();

router.get("/me", verifyJwt, getCurrentUser);

router.patch(
    "/me",
    verifyJwt,
    validate(updateAccountDetailsSchema),
    updateAccountDetails
);

export default router;