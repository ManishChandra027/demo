import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import * as authService from "./auth.service.js";
import { getDefaultAddressForUser } from "./address.service.js";
import { logServiceError } from "../utils/logger.js";

const getCurrentUser = async ({ userId }) => {
    const user = await User.findById(userId).select(
        "fullName email phone role isVerified isPhoneVerified"
    );

    if (!user) {
        throw new ApiError(404, "User not found.");
    }

    const defaultAddress = await getDefaultAddressForUser(userId);

    return { user, defaultAddress };
};

const updateAccountDetails = async ({ userId, body }) => {
    const { email, fullName, phone } = body;

    if (email === undefined && fullName === undefined && phone === undefined) {
        throw new ApiError(400, "At least one field is required for update.");
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found.");
    }

    let emailChanged = false;

    // FULL NAME
    if (fullName !== undefined) {
        const normalizedName = fullName.trim();

        if (!normalizedName) {
            throw new ApiError(400, "Full name cannot be empty.");
        }

        if (normalizedName === user.fullName) {
            throw new ApiError(
                400,
                "New full name must be different from the current one."
            );
        }

        user.fullName = normalizedName;
    }

    // EMAIL
    if (email !== undefined) {
        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail) {
            throw new ApiError(400, "Email cannot be empty.");
        }

        if (normalizedEmail !== user.email.toLowerCase()) {
            const existingUser = await User.findOne({
                email: normalizedEmail,
                _id: { $ne: user._id },
            });

            if (existingUser) {
                throw new ApiError(
                    409,
                    "An account with this email already exists."
                );
            }

            user.email = normalizedEmail;
            user.isVerified = false;

            // Invalidate verification OTP for the previous email.
            user.emailVerificationOtp = undefined;
            user.emailVerificationExpires = undefined;

            emailChanged = true;
        }
    }

    // PHONE
    if (phone !== undefined) {
        const normalizedPhone = phone.trim();

        if (!normalizedPhone) {
            throw new ApiError(400, "Phone number cannot be empty.");
        }

        if (normalizedPhone !== user.phone) {
            const existingUser = await User.findOne({
                phone: normalizedPhone,
                _id: { $ne: user._id },
            });

            if (existingUser) {
                throw new ApiError(
                    409,
                    "An account with this phone number already exists."
                );
            }

            user.phone = normalizedPhone;
            user.isPhoneVerified = false;
        }
    }

    await user.save();

    // Request verification for the new email.
    // If email delivery fails, the email remains unverified and can be retried.
    if (emailChanged) {
        try {
            await authService.requestEmailVerification(user._id);
        } catch (error) {
            logServiceError("user.email_verification_request_failed", error);
        }
    }

    // Return only safe account fields.
    const updatedUser = await User.findById(user._id).select(
        "fullName email phone role isVerified isPhoneVerified"
    );

    return updatedUser;
};

export { getCurrentUser, updateAccountDetails };
