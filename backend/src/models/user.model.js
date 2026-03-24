import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: function () { return !this.googleId; },
            unique: true,
            sparse: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        avatar:     { type: String, required: function () { return !this.googleId; } },
        coverImage: { type: String },
        password: {
            type: String,
            required: function () { return !this.googleId; },
            select: false,
        },
        refreshToken: { type: String },

        googleId: {
            type: String,
            unique: true,
            sparse: true,
            select: false,
        },
        authProvider: {
            type: String,
            enum: ["local", "google"],
            default: "local",
        },

        role: {
            type: String,
            enum: ["student", "counsellor", "admin"],
            default: "student",
        },
        isApproved: {
            type: Boolean,
            default: function () { return this.role === "student"; },
        },
        institution:          { type: String },
        resetPasswordToken:   { type: String },
        resetPasswordExpires: { type: Date },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
        specialization: {
            type: String,
            required: function () { return this.role === "counsellor"; },
        },

        // ── Counsellor session fee ─────────────────────────────────────────
        // Stored in RUPEES. Default ₹299.
        sessionFee: {
            type:    Number,
            default: 299,
            min:     [0,    "Session fee cannot be negative"],
            max:     [5000, "Maximum session fee is ₹5000"],
        },

        // ── Counsellor ratings (updated after each review) ────────────────
        avgRating:    { type: Number, default: 0, min: 0, max: 5 },
        totalReviews: { type: Number, default: 0, min: 0 },

        // ── Bank details for payouts (counsellors only) ───────────────────
        // Stored as plain text — in production encrypt these fields.
        // select: false keeps them out of all normal queries.
        bankDetails: {
            accountHolderName: { type: String, trim: true,      select: false },
            accountNumber:     { type: String, trim: true,      select: false },
            ifscCode:          {
                type: String, trim: true, uppercase: true, select: false,
                validate: {
                    validator: (v) => !v || /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v),
                    message: "IFSC must be in format ABCD0123456",
                },
            },
            bankName:          { type: String, trim: true,      select: false },
            accountType: {
                type:    String,
                enum:    ["savings", "current", ""],
                default: "",
                select:  false,
            },
            isVerified:        { type: Boolean, default: false, select: false },
            // When admin verified the bank details
            verifiedAt:        { type: Date,    default: null,  select: false },
            // Whether bank details have been saved at all
            hasDetails:        { type: Boolean, default: false },
        },

        // ── Phone / DOB ───────────────────────────────────────────────────
        phone: {
            type: String,
            trim: true,
            select: false,
            validate: {
                validator: (v) => !v || /^\+?\d{10,15}$/.test(v.replace(/[\s\-().]/g, "")),
                message: "Invalid phone number format",
            },
        },
        dob: {
            type: Date,
            validate: {
                validator: function (v) {
                    if (!v) return true;
                    const now    = new Date();
                    const minAge = new Date(now.getFullYear() - 100, now.getMonth(), now.getDate());
                    const maxAge = new Date(now.getFullYear() - 5,   now.getMonth(), now.getDate());
                    return v >= minAge && v <= maxAge;
                },
                message: "Date of birth must be between 5 and 100 years ago",
            },
        },

        // ── Govt ID ───────────────────────────────────────────────────────
        govtId: {
            aadharNumber: {
                type: String, trim: true, select: false,
                validate: { validator: (v) => !v || /^\d{12}$/.test(v), message: "Aadhar must be 12 digits" },
            },
            panNumber: {
                type: String, trim: true, uppercase: true, select: false,
                validate: { validator: (v) => !v || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v), message: "PAN must be ABCDE1234F" },
            },
            otpHash:       { type: String,  select: false },
            otpExpiry:     { type: Date,    select: false },
            otpAttempts:   { type: Number,  default: 0,     select: false },
            phoneVerified: { type: Boolean, default: false },
            isVerified:    { type: Boolean, default: false },
            verifiedAt:    { type: Date },
        },

        // ── Forum moderation ───────────────────────────────────────────────
        forumWarnings: [
            {
                reason:   { type: String, required: true },
                postId:   { type: Schema.Types.ObjectId, ref: "Post" },
                issuedBy: { type: Schema.Types.ObjectId, ref: "User" },
                issuedAt: { type: Date, default: Date.now },
            },
        ],
        forumWarningCount: { type: Number,  default: false },
        isBannedFromForum: { type: Boolean, default: false },
        bannedAt:          { type: Date },
        bannedBy:          { type: Schema.Types.ObjectId, ref: "User" },
        banReason:         { type: String },
    },
    { timestamps: true }
);

// ── Hooks ─────────────────────────────────────────────────────────────────────
userSchema.pre("save", async function (next) {
    if (!this.isModified("password") || !this.password) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// ── Methods ───────────────────────────────────────────────────────────────────
userSchema.methods.isPasswordCorrect = async function (password) {
    if (!this.password) return false;
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        { _id: this._id, email: this.email, username: this.username, fullName: this.fullName, role: this.role },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
};

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        { _id: this._id, role: this.role },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
};

userSchema.methods.getResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(20).toString("hex");
    this.resetPasswordToken  = crypto.createHash("sha256").update(resetToken).digest("hex");
    this.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
    return resetToken;
};

export const User = mongoose.model("User", userSchema);
