// controllers/adminController.js
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";


// export const getPendingUsers = asyncHandler(async (req, res) => {
//   const users = await User.find({ status: "pending" });
//   res.json(new ApiResponse(200, { users }, "Pending users fetched"));
// });

// export const approveUser = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const user = await User.findByIdAndUpdate(
//     id,
//     { status: "approved" },
//     { new: true }
//   );
//   if (!user) throw new ApiError(404, "User not found");
//   res.json(new ApiResponse(200, { user }, "User approved successfully"));
// });


// controllers/adminController.js

export const getPendingUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: "counsellor",isApproved: false });
  res.json(new ApiResponse(200, { users }, "Pending counsellor fetched"));
});

export const approveUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findByIdAndUpdate(
    id,
    { isApproved: true },
    { new: true }
  );
  if (!user) throw new ApiError(404, "User not found");
  res.json(new ApiResponse(200, { user }, "User approved successfully"));
});
