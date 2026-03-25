/**
 * optionalJWT — like verifyJWT but NEVER rejects the request.
 * Sets req.user if a valid token is present; otherwise sets req.user = null
 * and calls next(). Used for routes that work for both guests and logged-in users.
 */
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const optionalJWT = async (req, res, next) => {
    try {
        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            req.user = null;
            return next();
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user    = await User.findById(decoded?._id).select("-password -refreshToken");
        req.user = user || null;
    } catch (err) {
        // Token is expired / invalid — treat as unauthenticated, don't block
        req.user = null;
    }
    next();
};
