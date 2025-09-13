// import mongoose, {Schema} from "mongoose";
// import jwt from "jsonwebtoken"
// import bcrypt from "bcrypt"

// const userSchema = new Schema(
//     {
//         username: {
//             type: String,
//             required: true,
//             unique: true,
//             lowercase: true,
//             trim: true, 
//             index: true
//         },
//         email: {
//             type: String,
//             required: true,
//             unique: true,
//             lowecase: true,
//             trim: true, 
//         },
//         fullName: {
//             type: String,
//             required: true,
//             trim: true, 
//             index: true
//         },
//         avatar: {
//             type: String, // cloudinary url
//             required: true,
//         },
//         coverImage: {
//             type: String, // cloudinary url
//         },
//         watchHistory: [
//             {
//                 type: Schema.Types.ObjectId,
//                 ref: "Video"
//             }
//         ],
//         password: {
//             type: String,
//             required: [true, 'Password is required']
//         },
//         refreshToken: {
//             type: String
//         }

//     },
//     {
//         timestamps: true
//     }
// )

// userSchema.pre("save", async function (next) {
//     if(!this.isModified("password")) return next();

//     this.password = await bcrypt.hash(this.password, 10)
//     next()
// })

// userSchema.methods.isPasswordCorrect = async function(password){
//     return await bcrypt.compare(password, this.password)
// }

// userSchema.methods.generateAccessToken = function(){
//     return jwt.sign(
//         {
//             _id: this._id,
//             email: this.email,
//             username: this.username,
//             fullName: this.fullName
//         },
//         process.env.ACCESS_TOKEN_SECRET,
//         {
//             expiresIn: process.env.ACCESS_TOKEN_EXPIRY
//         }
//     )
// }
// userSchema.methods.generateRefreshToken = function(){
//     return jwt.sign(
//         {
//             _id: this._id,

//         },
//         process.env.REFRESH_TOKEN_SECRET,
//         {
//             expiresIn: process.env.REFRESH_TOKEN_EXPIRY
//         }
//     )
// }

// export const User = mongoose.model("User", userSchema)






















import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";// ✅ Required for reset password token generation

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true, // fixed typo "lowecase"
            trim: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        avatar: {
            type: String, // cloudinary url
            required: true,
        },
        coverImage: {
            type: String, // cloudinary url
        },
        // watchHistory: [
        //     {
        //         type: Schema.Types.ObjectId,
        //         ref: "Video",
        //     },
        // ],
        password: {
            type: String,
            required: [true, "Password is required"],
            select: false , // 🔒 ensure password is not returned by default
        },
        refreshToken: {
            type: String,
        },

        // 🔑 New field for RBAC
        role: {
            type: String,
            enum: ["student", "counsellor", "admin"],
            default: "student",
        },
        isApproved: {
            type: Boolean,

            default: function () {
                return this.role === "student"; // ✅ students auto-approved
            }
        },
        institution: { type: String },
        createdAt: { type: Date, default: Date.now },
        resetPasswordToken: String,
        resetPasswordExpires: Date,
        status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" }, // 👈 NEW
    },
    {
        timestamps: true,
    }
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName,
            role: this.role, // include role in token
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
};

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            role: this.role,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    );
};

userSchema.methods.getResetPasswordToken = function() {
  // create token
  const resetToken = crypto.randomBytes(20).toString('hex');
  // hash token and set expire
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  return resetToken;
};


/* ==========================================
   GENERATE RESET PASSWORD TOKEN
========================================== */
userSchema.methods.getResetPasswordToken = function () {
  // Generate random token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hash token before storing in DB for security
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Token expires in 1 hour
  this.resetPasswordExpires = Date.now() + 60 * 60 * 1000;

  return resetToken; // plain token for sending via email
};

export const User = mongoose.model("User", userSchema);
