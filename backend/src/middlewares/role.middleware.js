// middlewares/role.middleware.js
import { ApiError } from "../utils/ApiError.js";

export const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    throw new ApiError("Access denied: Admins only", 403);
  }
  next();
};
