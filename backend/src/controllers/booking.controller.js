// // controllers/booking.controller.js
// import { asyncHandler } from "../utils/asyncHandler.js";
// import { ApiError } from "../utils/ApiError.js";
// import { ApiResponse } from "../utils/ApiResponse.js";
// import { Booking } from "../models/booking.model.js";
// import { User } from "../models/user.model.js";
// import sendMail from "../utils/mail.js";

// // Create a new booking
// const createBooking = asyncHandler(async (req, res) => {
//   const { counselorId, date, timeSlot, mode, reason, notes } = req.body;
//   const studentId = req.user._id;

//   // Validate required fields
//   if (!counselorId || !date || !timeSlot || !mode || !reason) {
//     throw new ApiError(400, "All required fields must be provided");
//   }

//   // Check if counselor exists and is approved
//   const counselor = await User.findOne({ 
//     _id: counselorId, 
//     role: "counsellor", 
//     isApproved: true 
//   });

//   if (!counselor) {
//     throw new ApiError(404, "Counselor not found or not approved");
//   }

//   // Check if slot is available
//   const existingBooking = await Booking.findOne({
//     counselor: counselorId,
//     date: new Date(date),
//     timeSlot,
//     status: { $in: ["pending", "confirmed"] }
//   });

//   if (existingBooking) {
//     throw new ApiError(409, "Time slot is already booked");
//   }

//   // Check if student already has a booking on the same day
//   const studentBooking = await Booking.findOne({
//     student: studentId,
//     date: new Date(date),
//     status: { $in: ["pending", "confirmed"] }
//   });

//   if (studentBooking) {
//     throw new ApiError(409, "You already have a booking on this date");
//   }

//   // Create booking
//   const booking = await Booking.create({
//     student: studentId,
//     counselor: counselorId,
//     date: new Date(date),
//     timeSlot,
//     mode,
//     reason,
//     notes: notes || ""
//   });

//   const populatedBooking = await Booking.findById(booking._id)
//     .populate("student", "fullName email username")
//     .populate("counselor", "fullName email");

//   // Send email notifications
//   try {
//     // Email to student
//     await sendMail({
//       to: req.user.email,
//       subject: "Booking Confirmation - Mental Health Support",
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <h2 style="color: #2563eb;">Booking Request Submitted</h2>
//           <p>Dear ${req.user.fullName},</p>
//           <p>Your counseling session booking request has been submitted successfully.</p>
          
//           <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
//             <h3 style="margin-top: 0;">Booking Details:</h3>
//             <p><strong>Counselor:</strong> ${counselor.fullName}</p>
//             <p><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</p>
//             <p><strong>Time:</strong> ${timeSlot}</p>
//             <p><strong>Mode:</strong> ${mode}</p>
//             <p><strong>Status:</strong> Pending Approval</p>
//           </div>
          
//           <p>You will receive a confirmation email once your booking is approved by the counselor.</p>
//           <p>All sessions are completely confidential.</p>
          
//           <p style="color: #6b7280; font-size: 14px;">
//             If you need immediate support, please contact the crisis helpline: 1-800-XXX-XXXX
//           </p>
//         </div>
//       `
//     });

//     // Email to counselor
//     await sendMail({
//       to: counselor.email,
//       subject: "New Booking Request - Mental Health Support",
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <h2 style="color: #dc2626;">New Booking Request</h2>
//           <p>Dear ${counselor.fullName},</p>
//           <p>You have received a new counseling session booking request.</p>
          
//           <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
//             <h3 style="margin-top: 0;">Booking Details:</h3>
//             <p><strong>Student:</strong> ${req.user.fullName}</p>
//             <p><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</p>
//             <p><strong>Time:</strong> ${timeSlot}</p>
//             <p><strong>Mode:</strong> ${mode}</p>
//             <p><strong>Reason:</strong> ${reason}</p>
//             ${notes ? `<p><strong>Additional Notes:</strong> ${notes}</p>` : ''}
//           </div>
          
//           <p>Please log in to your dashboard to approve or decline this request.</p>
//           <a href="${process.env.FRONTEND_URL}/dashboard" 
//              style="background-color: #2563eb; color: white; padding: 10px 20px; 
//                     text-decoration: none; border-radius: 5px; display: inline-block;">
//             View Dashboard
//           </a>
//         </div>
//       `
//     });
//   } catch (emailError) {
//     console.error("Email sending failed:", emailError);
//     // Don't throw error - booking was created successfully
//   }

//   return res.status(201).json(
//     new ApiResponse(201, populatedBooking, "Booking created successfully")
//   );
// });

// // Get all bookings for a user (student or counselor)
// const getUserBookings = asyncHandler(async (req, res) => {
//   const userId = req.user._id;
//   const { status, page = 1, limit = 10 } = req.query;

//   let query = {};
  
//   // Determine if user is student or counselor
//   if (req.user.role === "student") {
//     query.student = userId;
//   } else if (req.user.role === "counsellor") {
//     query.counselor = userId;
//   } else {
//     throw new ApiError(403, "Access denied");
//   }

//   // Add status filter if provided
//   if (status) {
//     query.status = status;
//   }

//   const skip = (page - 1) * limit;

//   const bookings = await Booking.find(query)
//     .populate("student", "fullName email username")
//     .populate("counselor", "fullName email")
//     .sort({ createdAt: -1 })
//     .skip(skip)
//     .limit(parseInt(limit));

//   const total = await Booking.countDocuments(query);

//   return res.status(200).json(
//     new ApiResponse(200, {
//       bookings,
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         total,
//         totalPages: Math.ceil(total / limit)
//       }
//     }, "Bookings fetched successfully")
//   );
// });

// // Update booking status (approve/decline/cancel)
// const updateBookingStatus = asyncHandler(async (req, res) => {
//   const { bookingId } = req.params;
//   const { status, cancellationReason, meetingLink } = req.body;

//   const booking = await Booking.findById(bookingId)
//     .populate("student", "fullName email")
//     .populate("counselor", "fullName email");

//   if (!booking) {
//     throw new ApiError(404, "Booking not found");
//   }

//   // Check permissions
//   const isOwner = booking.student._id.toString() === req.user._id.toString() ||
//                   booking.counselor._id.toString() === req.user._id.toString();
  
//   if (!isOwner && req.user.role !== "admin") {
//     throw new ApiError(403, "Access denied");
//   }

//   // Validate status transitions
//   const validTransitions = {
//     "pending": ["confirmed", "cancelled"],
//     "confirmed": ["cancelled", "completed"],
//     "cancelled": [], // Can't change from cancelled
//     "completed": [] // Can't change from completed
//   };

//   if (!validTransitions[booking.status].includes(status)) {
//     throw new ApiError(400, `Cannot change status from ${booking.status} to ${status}`);
//   }

//   // Update booking
//   booking.status = status;
//   if (cancellationReason) booking.cancellationReason = cancellationReason;
//   if (meetingLink && status === "confirmed") booking.meetingLink = meetingLink;

//   await booking.save();

//   // Send notification emails
//   try {
//     let emailSubject, emailContent;
    
//     switch (status) {
//       case "confirmed":
//         emailSubject = "Booking Confirmed - Mental Health Support";
//         emailContent = `
//           <h2 style="color: #059669;">Booking Confirmed!</h2>
//           <p>Your counseling session has been confirmed.</p>
//           <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
//             <p><strong>Counselor:</strong> ${booking.counselor.fullName}</p>
//             <p><strong>Date:</strong> ${booking.date.toLocaleDateString()}</p>
//             <p><strong>Time:</strong> ${booking.timeSlot}</p>
//             <p><strong>Mode:</strong> ${booking.mode}</p>
//             ${booking.meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${booking.meetingLink}">${booking.meetingLink}</a></p>` : ''}
//           </div>
//         `;
//         break;
        
//       case "cancelled":
//         emailSubject = "Booking Cancelled - Mental Health Support";
//         emailContent = `
//           <h2 style="color: #dc2626;">Booking Cancelled</h2>
//           <p>Your counseling session has been cancelled.</p>
//           ${cancellationReason ? `<p><strong>Reason:</strong> ${cancellationReason}</p>` : ''}
//           <p>You can book another session at your convenience.</p>
//         `;
//         break;
        
//       case "completed":
//         emailSubject = "Session Completed - Mental Health Support";
//         emailContent = `
//           <h2 style="color: #2563eb;">Session Completed</h2>
//           <p>Thank you for attending your counseling session.</p>
//           <p>Your well-being is important to us. Feel free to book another session if needed.</p>
//         `;
//         break;
//     }

//     // Send to student
//     await sendMail({
//       to: booking.student.email,
//       subject: emailSubject,
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           ${emailContent}
//         </div>
//       `
//     });

//   } catch (emailError) {
//     console.error("Notification email failed:", emailError);
//   }

//   return res.status(200).json(
//     new ApiResponse(200, booking, `Booking ${status} successfully`)
//   );
// });

// // Get available time slots for a counselor on a specific date
// const getAvailableSlots = asyncHandler(async (req, res) => {
//   const { counselorId, date } = req.params;

//   const counselor = await User.findOne({ 
//     _id: counselorId, 
//     role: "counsellor", 
//     isApproved: true 
//   });

//   if (!counselor) {
//     throw new ApiError(404, "Counselor not found");
//   }

//   // All possible time slots
//   const allSlots = [
//     "09:00-10:00",
//     "10:00-11:00", 
//     "11:00-12:00",
//     "14:00-15:00",
//     "15:00-16:00",
//     "16:00-17:00"
//   ];

//   // Get booked slots for the date
//   const bookedSlots = await Booking.find({
//     counselor: counselorId,
//     date: new Date(date),
//     status: { $in: ["pending", "confirmed"] }
//   }).select("timeSlot");

//   const bookedTimeSlots = bookedSlots.map(booking => booking.timeSlot);
//   const availableSlots = allSlots.filter(slot => !bookedTimeSlots.includes(slot));

//   return res.status(200).json(
//     new ApiResponse(200, { availableSlots }, "Available slots fetched successfully")
//   );
// });

// // Get all approved counselors
// const getAvailableCounselors = asyncHandler(async (req, res) => {
//   const counselors = await User.find({ 
//     role: "counsellour", 
//     isApproved: true 
//   }).select("fullName email avatar specialization");

//   return res.status(200).json(
//     new ApiResponse(200, counselors, "Available counselors fetched successfully")
//   );
// });

// export {
//   createBooking,
//   getUserBookings,
//   updateBookingStatus,
//   getAvailableSlots,
//   getAvailableCounselors
// };

/// controllers/booking.controller.js - Enhanced Version 11 working
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Booking } from "../models/booking.model.js";
import { User } from "../models/user.model.js";
import sendMail from "../utils/mail.js";
import mongoose from "mongoose";

// Create a new booking
const createBooking = asyncHandler(async (req, res) => {
  const { counselorId, date, timeSlot, mode, reason, notes } = req.body;
  const studentId = req.user._id;

  // Validate required fields
  if (!counselorId || !date || !timeSlot || !mode || !reason) {
    throw new ApiError(400, "All required fields must be provided");
  }

  // Validate ObjectId format
  if (!mongoose.isValidObjectId(counselorId)) {
    throw new ApiError(400, "Invalid counselor ID format");
  }

  // Check if counselor exists and is approved
  const counselor = await User.findOne({ 
    _id: counselorId, 
    role: "counsellor", 
    isApproved: true 
  });

  if (!counselor) {
    throw new ApiError(404, "Counselor not found or not approved");
  }

  // Validate date (not in past, not more than 30 days ahead)
  const bookingDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (bookingDate < today) {
    throw new ApiError(400, "Cannot book appointments in the past");
  }

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  if (bookingDate > maxDate) {
    throw new ApiError(400, "Cannot book more than 30 days in advance");
  }

  // Check if slot is available
  const existingBooking = await Booking.findOne({
    counselor: counselorId,
    date: bookingDate,
    timeSlot,
    status: { $in: ["pending", "confirmed"] }
  });

  if (existingBooking) {
    throw new ApiError(409, "Time slot is already booked");
  }

  // Check if student already has a booking on the same day
  const studentBooking = await Booking.findOne({
    student: studentId,
    date: bookingDate,
    status: { $in: ["pending", "confirmed"] }
  });

  if (studentBooking) {
    throw new ApiError(409, "You already have a booking on this date");
  }

  // Create booking
  const booking = await Booking.create({
    student: studentId,
    counselor: counselorId,
    date: bookingDate,
    timeSlot,
    mode,
    reason,
    notes: notes || ""
  });

  const populatedBooking = await Booking.findById(booking._id)
    .populate("student", "fullName email username")
    .populate("counselor", "fullName email");

  // Send email notifications
  try {
    // Email to student
    await sendMail({
      to: req.user.email,
      subject: "Booking Confirmation - Mental Health Support",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">Mental Health Support</h1>
            <div style="height: 3px; background: linear-gradient(90deg, #2563eb, #1d4ed8); margin: 0 auto; width: 100px;"></div>
          </div>
          
          <h2 style="color: #1f2937; margin-bottom: 20px;">Booking Request Submitted</h2>
          <p style="color: #374151; line-height: 1.6;">Dear ${req.user.fullName},</p>
          <p style="color: #374151; line-height: 1.6;">Your counseling session booking request has been submitted successfully.</p>
          
          <div style="background: linear-gradient(135deg, #f3f4f6, #e5e7eb); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 5px solid #2563eb;">
            <h3 style="margin-top: 0; color: #1f2937;">📅 Booking Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #374151;"><strong>Counselor:</strong></td><td style="color: #1f2937;">${counselor.fullName}</td></tr>
              <tr><td style="padding: 8px 0; color: #374151;"><strong>Date:</strong></td><td style="color: #1f2937;">${bookingDate.toLocaleDateString()}</td></tr>
              <tr><td style="padding: 8px 0; color: #374151;"><strong>Time:</strong></td><td style="color: #1f2937;">${timeSlot}</td></tr>
              <tr><td style="padding: 8px 0; color: #374151;"><strong>Mode:</strong></td><td style="color: #1f2937; text-transform: capitalize;">${mode}</td></tr>
              <tr><td style="padding: 8px 0; color: #374151;"><strong>Status:</strong></td><td style="color: #f59e0b; font-weight: bold;">⏳ Pending Approval</td></tr>
            </table>
          </div>
          
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e;">📧 You will receive a confirmation email once your booking is approved by the counselor.</p>
          </div>
          
          <p style="color: #374151; line-height: 1.6;">🔒 All sessions are completely confidential and designed to provide you with a safe space for support.</p>
          
          <div style="background-color: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <p style="color: #991b1b; margin: 0; font-size: 14px;">
              <strong>Crisis Support:</strong> If you need immediate support, please contact the crisis helpline: <strong>1-800-XXX-XXXX</strong>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Thank you for prioritizing your mental health 💙
            </p>
          </div>
        </div>
      `
    });

    // Email to counselor
    await sendMail({
      to: counselor.email,
      subject: "New Booking Request - Mental Health Support",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; margin-bottom: 10px;">Mental Health Support</h1>
            <div style="height: 3px; background: linear-gradient(90deg, #dc2626, #b91c1c); margin: 0 auto; width: 100px;"></div>
          </div>
          
          <h2 style="color: #1f2937; margin-bottom: 20px;">🔔 New Booking Request</h2>
          <p style="color: #374151; line-height: 1.6;">Dear ${counselor.fullName},</p>
          <p style="color: #374151; line-height: 1.6;">You have received a new counseling session booking request.</p>
          
          <div style="background: linear-gradient(135deg, #fef2f2, #fee2e2); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 5px solid #dc2626;">
            <h3 style="margin-top: 0; color: #1f2937;">👤 Student Details:</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr><td style="padding: 8px 0; color: #374151;"><strong>Name:</strong></td><td style="color: #1f2937;">${req.user.fullName}</td></tr>
              <tr><td style="padding: 8px 0; color: #374151;"><strong>Email:</strong></td><td style="color: #1f2937;">${req.user.email}</td></tr>
              <tr><td style="padding: 8px 0; color: #374151;"><strong>Username:</strong></td><td style="color: #1f2937;">${req.user.username}</td></tr>
            </table>
            
            <h3 style="color: #1f2937;">📅 Session Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #374151;"><strong>Date:</strong></td><td style="color: #1f2937;">${bookingDate.toLocaleDateString()}</td></tr>
              <tr><td style="padding: 8px 0; color: #374151;"><strong>Time:</strong></td><td style="color: #1f2937;">${timeSlot}</td></tr>
              <tr><td style="padding: 8px 0; color: #374151;"><strong>Mode:</strong></td><td style="color: #1f2937; text-transform: capitalize;">${mode}</td></tr>
              <tr><td style="padding: 8px 0; color: #374151;"><strong>Reason:</strong></td><td style="color: #1f2937;">${reason}</td></tr>
              ${notes ? `<tr><td style="padding: 8px 0; color: #374151;"><strong>Notes:</strong></td><td style="color: #1f2937;">${notes}</td></tr>` : ''}
            </table>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #374151; margin-bottom: 20px;">Please log in to your dashboard to approve or decline this request.</p>
            <a href="${process.env.FRONTEND_URL}/dashboard" 
               style="background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;
                      box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2); transition: all 0.3s ease;">
              📋 View Dashboard
            </a>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Thank you for supporting student mental health 🙏
            </p>
          </div>
        </div>
      `
    });
  } catch (emailError) {
    console.error("Email sending failed:", emailError);
    // Don't throw error - booking was created successfully
  }

  return res.status(201).json(
    new ApiResponse(201, populatedBooking, "Booking created successfully")
  );
});

// Get all bookings for a user (student or counselor)
const getUserBookings = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  let query = {};
  
  // Determine if user is student or counselor
  if (req.user.role === "student") {
    query.student = userId;
  } else if (req.user.role === "counsellor") {
    query.counselor = userId;
  } else if (req.user.role === "admin") {
    // Admin can see all bookings
    // No additional filter needed
  } else {
    throw new ApiError(403, "Access denied");
  }

  // Add status filter if provided
  if (status && ['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
    query.status = status;
  }

  const skip = (page - 1) * limit;
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const bookings = await Booking.find(query)
    .populate("student", "fullName email username avatar")
    .populate("counselor", "fullName email avatar specialization")
    .sort(sortOptions)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Booking.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(200, {
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    }, "Bookings fetched successfully")
  );
});

// Get single booking by ID
const getBookingById = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  if (!mongoose.isValidObjectId(bookingId)) {
    throw new ApiError(400, "Invalid booking ID format");
  }

  const booking = await Booking.findById(bookingId)
    .populate("student", "fullName email username avatar")
    .populate("counselor", "fullName email avatar specialization");

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  // Check permissions
  const isOwner = booking.student._id.toString() === req.user._id.toString() ||
                  booking.counselor._id.toString() === req.user._id.toString();
  
  if (!isOwner && req.user.role !== "admin") {
    throw new ApiError(403, "Access denied");
  }

  return res.status(200).json(
    new ApiResponse(200, booking, "Booking fetched successfully")
  );
});

// Update booking status (approve/decline/cancel)
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { status, cancellationReason, meetingLink, sessionNotes } = req.body;

  if (!mongoose.isValidObjectId(bookingId)) {
    throw new ApiError(400, "Invalid booking ID format");
  }

  const booking = await Booking.findById(bookingId)
    .populate("student", "fullName email")
    .populate("counselor", "fullName email");

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  // Check permissions
  const isOwner = booking.student._id.toString() === req.user._id.toString() ||
                  booking.counselor._id.toString() === req.user._id.toString();
  
  if (!isOwner && req.user.role !== "admin") {
    throw new ApiError(403, "Access denied");
  }

  // Validate status transitions
  const validTransitions = {
    "pending": ["confirmed", "cancelled"],
    "confirmed": ["cancelled", "completed"],
    "cancelled": [], // Can't change from cancelled
    "completed": [] // Can't change from completed
  };

  if (!validTransitions[booking.status]?.includes(status)) {
    throw new ApiError(400, `Cannot change status from ${booking.status} to ${status}`);
  }

  // Prevent cancellation within 2 hours of session (for confirmed bookings)
  if (status === "cancelled" && booking.status === "confirmed") {
    const sessionDateTime = new Date(booking.date);
    const [startTime] = booking.timeSlot.split('-');
    const [hours, minutes] = startTime.split(':');
    sessionDateTime.setHours(parseInt(hours), parseInt(minutes));
    
    const twoHoursBefore = new Date(sessionDateTime.getTime() - 2 * 60 * 60 * 1000);
    if (new Date() > twoHoursBefore) {
      throw new ApiError(400, "Cannot cancel booking within 2 hours of session time");
    }
  }

  // Update booking
  booking.status = status;
  if (cancellationReason) booking.cancellationReason = cancellationReason;
  if (meetingLink && status === "confirmed") booking.meetingLink = meetingLink;
  if (sessionNotes && status === "completed") booking.sessionNotes = sessionNotes;

  await booking.save();

  // Send notification emails
  try {
    let emailSubject, emailContent;
    const recipientEmail = booking.student.email;
    
    switch (status) {
      case "confirmed":
        emailSubject = "✅ Booking Confirmed - Mental Health Support";
        emailContent = `
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #059669; margin-bottom: 10px;">Mental Health Support</h1>
            <div style="height: 3px; background: linear-gradient(90deg, #059669, #047857); margin: 0 auto; width: 100px;"></div>
          </div>
          
          <h2 style="color: #065f46;">🎉 Booking Confirmed!</h2>
          <p>Dear ${booking.student.fullName},</p>
          <p>Great news! Your counseling session has been confirmed by ${booking.counselor.fullName}.</p>
          
          <div style="background: linear-gradient(135deg, #ecfdf5, #d1fae5); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 5px solid #059669;">
            <h3 style="margin-top: 0; color: #065f46;">📅 Session Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #047857;"><strong>Counselor:</strong></td><td style="color: #065f46;">${booking.counselor.fullName}</td></tr>
              <tr><td style="padding: 8px 0; color: #047857;"><strong>Date:</strong></td><td style="color: #065f46;">${booking.date.toLocaleDateString()}</td></tr>
              <tr><td style="padding: 8px 0; color: #047857;"><strong>Time:</strong></td><td style="color: #065f46;">${booking.timeSlot}</td></tr>
              <tr><td style="padding: 8px 0; color: #047857;"><strong>Mode:</strong></td><td style="color: #065f46; text-transform: capitalize;">${booking.mode}</td></tr>
              ${booking.meetingLink ? `<tr><td style="padding: 8px 0; color: #047857;"><strong>Meeting Link:</strong></td><td><a href="${booking.meetingLink}" style="color: #2563eb; text-decoration: none;">${booking.meetingLink}</a></td></tr>` : ''}
            </table>
          </div>
          
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;">💡 <strong>Reminder:</strong> Please join the session 5 minutes early and ensure you have a stable internet connection for online sessions.</p>
          </div>
        `;
        break;
        
      case "cancelled":
        emailSubject = "❌ Booking Cancelled - Mental Health Support";
        emailContent = `
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; margin-bottom: 10px;">Mental Health Support</h1>
            <div style="height: 3px; background: linear-gradient(90deg, #dc2626, #b91c1c); margin: 0 auto; width: 100px;"></div>
          </div>
          
          <h2 style="color: #991b1b;">📅 Booking Cancelled</h2>
          <p>Dear ${booking.student.fullName},</p>
          <p>Unfortunately, your counseling session scheduled for ${booking.date.toLocaleDateString()} at ${booking.timeSlot} has been cancelled.</p>
          
          ${cancellationReason ? `
          <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <p style="margin: 0; color: #991b1b;"><strong>Reason:</strong> ${cancellationReason}</p>
          </div>` : ''}
          
          <div style="background-color: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #0277bd;">💙 Don't worry - you can book another session at your convenience. Your mental health journey is important to us.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/book-session" 
               style="background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
              📝 Book New Session
            </a>
          </div>
        `;
        break;
        
      case "completed":
        emailSubject = "✨ Session Completed - Mental Health Support";
        emailContent = `
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">Mental Health Support</h1>
            <div style="height: 3px; background: linear-gradient(90deg, #2563eb, #1d4ed8); margin: 0 auto; width: 100px;"></div>
          </div>
          
          <h2 style="color: #1e40af;">🌟 Session Completed</h2>
          <p>Dear ${booking.student.fullName},</p>
          <p>Thank you for attending your counseling session with ${booking.counselor.fullName}.</p>
          
          <div style="background: linear-gradient(135deg, #eff6ff, #dbeafe); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 5px solid #2563eb;">
            <p style="margin: 0; color: #1e40af;">🎯 Your well-being is important to us. We hope this session was helpful for your mental health journey.</p>
          </div>
          
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #166534;">💚 <strong>Next Steps:</strong> Feel free to book another session whenever you need support. We're here for you every step of the way.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/book-session" 
               style="background: linear-gradient(135deg, #059669, #047857); color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
              📅 Book Another Session
            </a>
          </div>
        `;
        break;
    }

    // Send to student
    await sendMail({
      to: recipientEmail,
      subject: emailSubject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${emailContent}
          
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Questions? Contact us at support@mentalhealthsupport.com
            </p>
          </div>
        </div>
      `
    });

  } catch (emailError) {
    console.error("Notification email failed:", emailError);
  }

  return res.status(200).json(
    new ApiResponse(200, booking, `Booking ${status} successfully`)
  );
});

// Quick approve booking (for counselors)
const approveBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { meetingLink } = req.body;

  const booking = await Booking.findById(bookingId)
    .populate("student", "fullName email")
    .populate("counselor", "fullName email");

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  // Only counselor can approve their own bookings
  if (booking.counselor._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    throw new ApiError(403, "Only the assigned counselor can approve this booking");
  }

  if (booking.status !== "pending") {
    throw new ApiError(400, "Only pending bookings can be approved");
  }

  booking.status = "confirmed";
  if (meetingLink) booking.meetingLink = meetingLink;
  await booking.save();

  // Send approval email (similar to updateBookingStatus)
  try {
    await sendMail({
      to: booking.student.email,
      subject: "Booking Approved - Mental Health Support",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #059669;">Booking Approved!</h2>
          <p>Dear ${booking.student.fullName},</p>
          <p>Your counseling session has been approved by ${booking.counselor.fullName}.</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Date:</strong> ${booking.date.toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${booking.timeSlot}</p>
            <p><strong>Mode:</strong> ${booking.mode}</p>
            ${booking.meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${booking.meetingLink}">${booking.meetingLink}</a></p>` : ''}
          </div>
        </div>
      `
    });
  } catch (emailError) {
    console.error("Approval email failed:", emailError);
  }

  return res.status(200).json(
    new ApiResponse(200, booking, "Booking approved successfully")
  );
});

// Quick cancel booking
const cancelBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { cancellationReason } = req.body;

  const booking = await Booking.findById(bookingId)
    .populate("student", "fullName email")
    .populate("counselor", "fullName email");

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  // Check permissions
  const isOwner = booking.student._id.toString() === req.user._id.toString() ||
                  booking.counselor._id.toString() === req.user._id.toString();
  
  if (!isOwner && req.user.role !== "admin") {
    throw new ApiError(403, "Access denied");
  }

  if (!["pending", "confirmed"].includes(booking.status)) {
    throw new ApiError(400, "Cannot cancel this booking");
  }

  booking.status = "cancelled";
  if (cancellationReason) booking.cancellationReason = cancellationReason;
  await booking.save();

  return res.status(200).json(
    new ApiResponse(200, booking, "Booking cancelled successfully")
  );
});

// Get available time slots for a counselor on a specific date
const getAvailableSlots = asyncHandler(async (req, res) => {
  const { counselorId, date } = req.params;

  if (!mongoose.isValidObjectId(counselorId)) {
    throw new ApiError(400, "Invalid counselor ID format");
  }

  const counselor = await User.findOne({ 
    _id: counselorId, 
    role: "counsellor", 
    isApproved: true 
  });

  if (!counselor) {
    throw new ApiError(404, "Counselor not found");
  }

  // Validate date
  const requestedDate = new Date(date);
  if (isNaN(requestedDate.getTime())) {
    throw new ApiError(400, "Invalid date format");
  }

  // All possible time slots
  const allSlots = [
    "09:00-10:00",
    "10:00-11:00", 
    "11:00-12:00",
    "14:00-15:00",
    "15:00-16:00",
    "16:00-17:00"
  ];

  // Get booked slots for the date
  const bookedSlots = await Booking.find({
    counselor: counselorId,
    date: requestedDate,
    status: { $in: ["pending", "confirmed"] }
  }).select("timeSlot");

  const bookedTimeSlots = bookedSlots.map(booking => booking.timeSlot);
  const availableSlots = allSlots.filter(slot => !bookedTimeSlots.includes(slot));

  return res.status(200).json(
    new ApiResponse(200, { 
      date: requestedDate.toISOString().split('T')[0],
      counselor: {
        id: counselor._id,
        name: counselor.fullName,
        specialization: counselor.specialization
      },
      availableSlots,
      totalSlots: allSlots.length,
      bookedSlots: bookedTimeSlots.length
    }, "Available slots fetched successfully")
  );
});

// Get all approved counselors
const getAvailableCounselors = asyncHandler(async (req, res) => {
  const { specialization, limit = 50 } = req.query;

  let query = { 
    role: "counsellor", 
    isApproved: true 
  };

  if (specialization) {
    query.specialization = { $regex: specialization, $options: 'i' };
  }

  const counselors = await User.find(query)
    .select("fullName email avatar specialization institution createdAt")
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, counselors, "Available counselors fetched successfully")
  );
});

// Get booking statistics (for admin dashboard)
const getBookingStats = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") {
    throw new ApiError(403, "Admin access required");
  }

  const stats = await Booking.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    }
  ]);

  const monthlyStats = await Booking.aggregate([
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { "_id.year": -1, "_id.month": -1 } },
    { $limit: 6 }
  ]);

  const modeStats = await Booking.aggregate([
    {
      $group: {
        _id: "$mode",
        count: { $sum: 1 }
      }
    }
  ]);

  // Get upcoming sessions (next 7 days)
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  const upcomingSessions = await Booking.find({
    status: "confirmed",
    date: { $gte: new Date(), $lte: nextWeek }
  })
  .populate("student", "fullName")
  .populate("counselor", "fullName")
  .sort({ date: 1 })
  .limit(10);

  return res.status(200).json(
    new ApiResponse(200, {
      statusStats: stats,
      monthlyStats,
      modeStats,
      upcomingSessions,
      totalBookings: await Booking.countDocuments()
    }, "Booking statistics fetched successfully")
  );
});

// Search bookings (for admin)
const searchBookings = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") {
    throw new ApiError(403, "Admin access required");
  }

  const { 
    query: searchQuery, 
    status, 
    mode, 
    dateFrom, 
    dateTo,
    page = 1, 
    limit = 20 
  } = req.query;

  let aggregateQuery = [];

  // Match stage
  let matchStage = {};
  
  if (status) matchStage.status = status;
  if (mode) matchStage.mode = mode;
  
  if (dateFrom || dateTo) {
    matchStage.date = {};
    if (dateFrom) matchStage.date.$gte = new Date(dateFrom);
    if (dateTo) matchStage.date.$lte = new Date(dateTo);
  }

  aggregateQuery.push({ $match: matchStage });

  // Populate user data
  aggregateQuery.push(
    {
      $lookup: {
        from: "users",
        localField: "student",
        foreignField: "_id",
        as: "student"
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "counselor",
        foreignField: "_id",
        as: "counselor"
      }
    }
  );

  // Unwind arrays
  aggregateQuery.push(
    { $unwind: "$student" },
    { $unwind: "$counselor" }
  );

  // Text search if query provided
  if (searchQuery) {
    aggregateQuery.push({
      $match: {
        $or: [
          { "student.fullName": { $regex: searchQuery, $options: 'i' } },
          { "student.email": { $regex: searchQuery, $options: 'i' } },
          { "counselor.fullName": { $regex: searchQuery, $options: 'i' } },
          { "counselor.email": { $regex: searchQuery, $options: 'i' } },
          { "reason": { $regex: searchQuery, $options: 'i' } }
        ]
      }
    });
  }

  // Sort and paginate
  const skip = (page - 1) * limit;
  aggregateQuery.push(
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: parseInt(limit) }
  );

  // Project only necessary fields
  aggregateQuery.push({
    $project: {
      _id: 1,
      date: 1,
      timeSlot: 1,
      mode: 1,
      status: 1,
      reason: 1,
      createdAt: 1,
      "student.fullName": 1,
      "student.email": 1,
      "counselor.fullName": 1,
      "counselor.email": 1
    }
  });

  const bookings = await Booking.aggregate(aggregateQuery);
  
  // Get total count for pagination
  const totalQuery = [...aggregateQuery.slice(0, -3)]; // Remove sort, skip, limit
  totalQuery.push({ $count: "total" });
  const totalResult = await Booking.aggregate(totalQuery);
  const total = totalResult[0]?.total || 0;

  return res.status(200).json(
    new ApiResponse(200, {
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, "Search results fetched successfully")
  );
});

export {
  createBooking,
  getUserBookings,
  getBookingById,
  updateBookingStatus,
  approveBooking,
  cancelBooking,
  getAvailableSlots,
  getAvailableCounselors,
  getBookingStats,
  searchBookings
};