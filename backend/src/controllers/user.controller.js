import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import sendMail from "../utils/mail.js";

const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken  = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken  = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens");
    }
};

const maskGovtId = (aadhar, pan) => {
    const result = {};
    if (aadhar) result.aadharMasked = "XXXX-XXXX-" + aadhar.slice(-4);
    if (pan)    result.panMasked    = pan.slice(0, 3) + "**" + pan.slice(5);
    return result;
};

// ─────────────────────────────────────────────────────────────
//  REGISTER USER
// ─────────────────────────────────────────────────────────────
const registerUser = asyncHandler(async (req, res) => {
    const {
        fullName, email, username, password,
        role, institution,
        phone, dob,
        aadharNumber, panNumber,
    } = req.body;

    if ([fullName, email, username, password].some((f) => !f?.trim())) {
        throw new ApiError(400, "Full name, email, username and password are required");
    }

    // Phone — optional, validate if provided
    if (phone) {
        const cleaned = String(phone).replace(/[\s\-().]/g, "");
        if (!/^\d{10}$/.test(cleaned) && !/^\+91\d{10}$/.test(cleaned) && !/^91\d{10}$/.test(cleaned)) {
            throw new ApiError(400, "Invalid phone number. Provide a 10-digit Indian mobile number.");
        }
        const phoneExists = await User.findOne({ phone: cleaned });
        if (phoneExists) throw new ApiError(409, "This phone number is already registered.");
    }

    // DOB — optional, validate if provided
    if (dob) {
        const dobDate  = new Date(dob);
        if (isNaN(dobDate.getTime())) throw new ApiError(400, "Invalid date of birth. Use YYYY-MM-DD.");
        const ageYears = new Date().getFullYear() - dobDate.getFullYear();
        if (ageYears < 5 || ageYears > 100) throw new ApiError(400, "Age must be between 5 and 100 years.");
    }

    // Govt IDs — optional, validate format if provided
    if (aadharNumber && !/^\d{12}$/.test(aadharNumber.trim()))
        throw new ApiError(400, "Aadhar number must be exactly 12 digits");
    if (panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber.trim().toUpperCase()))
        throw new ApiError(400, "PAN must be in the format ABCDE1234F");

    // Duplicate check
    const existedUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existedUser) throw new ApiError(409, "User with this email or username already exists");

    // Avatar upload
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    if (!avatarLocalPath) throw new ApiError(400, "Avatar file is required");

    const avatar     = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;
    if (!avatar) throw new ApiError(400, "Avatar upload failed. Please try again.");

    // Role-based approval logic
    // NOTE: admin is NOT available in the public signup form.
    // The first admin is created by directly hitting the API (Postman / seed script).
    const assignedRole = role || "student";
    let isApproved = false;

    if (assignedRole === "student") {
        isApproved = true;
    } else if (assignedRole === "admin") {
        const adminExists = await User.findOne({ role: "admin" });
        if (adminExists) {
            return res.status(403).json({ success: false, message: "Admin already exists. Contact the existing admin." });
        }
        isApproved = true; // first-ever admin auto-approved
    } else if (assignedRole === "counsellor") {
        isApproved = false; // needs admin approval
    }

    const status = assignedRole === "student" ? "approved" : "pending";

    // Govt ID subdocument
    const govtIdData = {};
    if (aadharNumber?.trim()) govtIdData.aadharNumber = aadharNumber.trim();
    if (panNumber?.trim())    govtIdData.panNumber    = panNumber.trim().toUpperCase();

    const user = await User.create({
        fullName,
        avatar:      avatar.url,
        coverImage:  coverImage?.url || "",
        email,
        password,
        username:    username.toLowerCase(),
        role:        assignedRole,
        institution: institution || "",
        isApproved,
        status,
        ...(phone && { phone: String(phone).replace(/[\s\-().]/g, "") }),
        ...(dob   && { dob: new Date(dob) }),
        ...(Object.keys(govtIdData).length > 0 && { govtId: govtIdData }),
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken -govtId.aadharNumber -govtId.panNumber"
    );
    if (!createdUser) throw new ApiError(500, "Something went wrong while registering the user");

    const responseData = createdUser.toObject();
    if (Object.keys(govtIdData).length > 0) {
        responseData.govtId = {
            ...responseData.govtId,
            ...maskGovtId(govtIdData.aadharNumber, govtIdData.panNumber),
            isVerified: false,
        };
    }

    return res.status(201).json(new ApiResponse(201, responseData, "User registered successfully"));
});

// ─────────────────────────────────────────────────────────────
//  LOGIN
// ─────────────────────────────────────────────────────────────
const loginUser = async (req, res) => {
    try {
        const { email, username, password } = req.body;
        if ((!email && !username) || !password) {
            return res.status(400).json({ message: "Email/Username and password are required" });
        }

        const user = await User.findOne(email ? { email } : { username }).select("+password");
        if (!user) return res.status(401).json({ message: "Invalid credentials" });

        const isPasswordValid = await user.isPasswordCorrect(password);
        if (!isPasswordValid) return res.status(401).json({ message: "Invalid credentials" });

        const accessToken  = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        return res.status(200).json({
            success: true,
            token: accessToken,
            refreshToken,
            user: {
                isApproved: user.isApproved,
                id:         user._id,
                fullName:   user.fullName,
                email:      user.email,
                username:   user.username,
                avatar:     user.avatar,
                role:       user.role,
            },
        });
    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

// ─────────────────────────────────────────────────────────────
//  MISC AUTH
// ─────────────────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
    res.json(new ApiResponse(200, { user: req.user }, "User details fetched"));
});

const approveUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user   = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.isApproved = true;
    user.status     = "approved";
    await user.save();
    return res.status(200).json({ message: `${user.role} approved successfully` });
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } }, { new: true });
    const opts = { httpOnly: true, secure: true };
    return res
        .status(200)
        .clearCookie("accessToken", opts)
        .clearCookie("refreshToken", opts)
        .json(new ApiResponse(200, {}, "User logged out"));
});

const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, "No user found with this email");
    const resetToken = jwt.sign({ id: user._id }, process.env.RESET_PASSWORD_SECRET, { expiresIn: "15m" });
    const resetUrl   = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await sendMail({ to: email, subject: "Password Reset Request",
        html: `<p>Click to reset your password:</p><a href="${resetUrl}">${resetUrl}</a>` });
    return res.status(200).json(new ApiResponse(200, {}, "Password reset link sent to email"));
});

const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;
    try {
        const decoded = jwt.verify(token, process.env.RESET_PASSWORD_SECRET);
        const user    = await User.findById(decoded.id);
        if (!user) throw new ApiError(404, "Invalid token or user does not exist");
        user.password = newPassword;
        await user.save({ validateBeforeSave: false });
        return res.status(200).json(new ApiResponse(200, {}, "Password reset successful"));
    } catch {
        throw new ApiError(400, "Invalid or expired token");
    }
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) throw new ApiError(401, "Unauthorized request");
    try {
        const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user    = await User.findById(decoded?._id);
        if (!user) throw new ApiError(401, "Invalid refresh token");
        if (incomingRefreshToken !== user?.refreshToken)
            throw new ApiError(401, "Refresh token is expired or used");
        const opts = { httpOnly: true, secure: true };
        const { accessToken, newRefreshToken } = await generateAccessAndRefereshTokens(user._id);
        return res
            .status(200)
            .cookie("accessToken", accessToken, opts)
            .cookie("refreshToken", newRefreshToken, opts)
            .json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access token refreshed"));
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

// ─────────────────────────────────────────────────────────────
//  ACCOUNT UPDATES
// ─────────────────────────────────────────────────────────────
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id);
    if (!(await user.isPasswordCorrect(oldPassword))) throw new ApiError(400, "Invalid old password");
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "User fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;
    if (!fullName || !email) throw new ApiError(400, "Full name and email are required");
    const user = await User.findByIdAndUpdate(req.user?._id, { $set: { fullName, email } }, { new: true }).select("-password");
    return res.status(200).json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) throw new ApiError(400, "Avatar file is missing");
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar.url) throw new ApiError(400, "Error while uploading avatar");
    const user = await User.findByIdAndUpdate(req.user?._id, { $set: { avatar: avatar.url } }, { new: true }).select("-password");
    return res.status(200).json(new ApiResponse(200, user, "Avatar updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) throw new ApiError(400, "Cover image file is missing");
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImage.url) throw new ApiError(400, "Error while uploading cover image");
    const user = await User.findByIdAndUpdate(req.user?._id, { $set: { coverImage: coverImage.url } }, { new: true }).select("-password");
    return res.status(200).json(new ApiResponse(200, user, "Cover image updated successfully"));
});

// ─────────────────────────────────────────────────────────────
//  GOVT ID
// ─────────────────────────────────────────────────────────────
const updateGovtId = asyncHandler(async (req, res) => {
    const { aadharNumber, panNumber } = req.body;
    if (!aadharNumber && !panNumber)
        throw new ApiError(400, "Provide at least one government ID (Aadhar or PAN)");
    if (aadharNumber && !/^\d{12}$/.test(aadharNumber.trim()))
        throw new ApiError(400, "Aadhar number must be exactly 12 digits");
    if (panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber.trim().toUpperCase()))
        throw new ApiError(400, "PAN must be in format ABCDE1234F");

    const updateFields = {};
    if (aadharNumber?.trim()) updateFields["govtId.aadharNumber"] = aadharNumber.trim();
    if (panNumber?.trim())    updateFields["govtId.panNumber"]    = panNumber.trim().toUpperCase();
    updateFields["govtId.isVerified"] = false;
    updateFields["govtId.verifiedAt"] = undefined;

    await User.findByIdAndUpdate(req.user._id, { $set: updateFields }, { new: true, runValidators: true });
    return res.status(200).json(
        new ApiResponse(200, { govtId: maskGovtId(aadharNumber?.trim(), panNumber?.trim()?.toUpperCase()) },
        "Government ID updated successfully")
    );
});

const getGovtId = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select(
        "+govtId.aadharNumber +govtId.panNumber govtId.isVerified govtId.verifiedAt govtId.phoneVerified"
    );
    if (!user) throw new ApiError(404, "User not found");
    const masked = maskGovtId(user.govtId?.aadharNumber, user.govtId?.panNumber);
    return res.status(200).json(
        new ApiResponse(200, {
            govtId: {
                ...masked,
                isVerified:    user.govtId?.isVerified    ?? false,
                phoneVerified: user.govtId?.phoneVerified ?? false,
                verifiedAt:    user.govtId?.verifiedAt    ?? null,
                hasAadhar:     !!user.govtId?.aadharNumber,
                hasPan:        !!user.govtId?.panNumber,
            },
        }, "Government ID fetched successfully")
    );
});

const verifyGovtId = asyncHandler(async (req, res) => {
    if (req.user.role !== "admin") throw new ApiError(403, "Only admins can verify government IDs");
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");
    if (!user.govtId?.aadharNumber && !user.govtId?.panNumber)
        throw new ApiError(400, "This user has not submitted any government ID");
    user.govtId.isVerified = true;
    user.govtId.verifiedAt = new Date();
    await user.save({ validateBeforeSave: false });
    return res.status(200).json(
        new ApiResponse(200, { isVerified: true, verifiedAt: user.govtId.verifiedAt }, "Government ID verified")
    );
});

export {
    registerUser, loginUser, logoutUser, refreshAccessToken,
    changeCurrentPassword, getCurrentUser, updateAccountDetails,
    updateUserAvatar, updateUserCoverImage,
    approveUser, forgotPassword, resetPassword, getMe,
    updateGovtId, getGovtId, verifyGovtId,
};
