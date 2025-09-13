// import mongoose from "mongoose"
// import {Video} from "../models/video.model.js"
// import {Subscription} from "../models/subscription.model.js"
// import {Like} from "../models/like.model.js"
// import {ApiError} from "../utils/ApiError.js"
// import {ApiResponse} from "../utils/ApiResponse.js"
// import {asyncHandler} from "../utils/asyncHandler.js"

// const getChannelStats = asyncHandler(async (req, res) => {
//     // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
// })

// const getChannelVideos = asyncHandler(async (req, res) => {
//     // TODO: Get all the videos uploaded by the channel
// })

// export {
//     getChannelStats, 
//     getChannelVideos
//     }




// controllers/dashboard.controller.js
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js";
import { Screening } from "../models/screening.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getDashboardStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalComments = await Comment.countDocuments();
  const totalScreenings = await Screening.countDocuments();

  // Mock for now (until Booking model exists)
  const totalBookings = 0;

  // Mock chart data
  const chartData = [
    { month: "Jan", users: 5, bookings: 2 },
    { month: "Feb", users: 8, bookings: 4 },
    { month: "Mar", users: 12, bookings: 6 },
  ];

  const recentComments = await Comment.find()
    .populate("owner", "fullName")
    .sort({ createdAt: -1 })
    .limit(5);

  res.json({
    success: true,
    data: {
      totalUsers,
      totalComments,
      totalBookings,
      totalScreenings,
      chartData,
      recentComments: recentComments.map(c => ({
        _id: c._id,
        text: c.content,
        user: c.owner ? { fullName: c.owner.fullName } : null,
      })),
    },
  });
});
