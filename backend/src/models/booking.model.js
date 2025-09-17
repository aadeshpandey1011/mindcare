// // models/booking.model.js
// import mongoose, { Schema } from "mongoose";

// const bookingSchema = new Schema(
//   {
//     student: {
//       type: Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     counselor: {
//       type: Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     date: {
//       type: Date,
//       required: true,
//     },
//     timeSlot: {
//       type: String,
//       required: true,
//       enum: [
//         "09:00-10:00",
//         "10:00-11:00", 
//         "11:00-12:00",
//         "14:00-15:00",
//         "15:00-16:00",
//         "16:00-17:00"
//       ]
//     },
//     mode: {
//       type: String,
//       required: true,
//       enum: ["in-person", "online", "phone"],
//       default: "online"
//     },
//     status: {
//       type: String,
//       enum: ["pending", "confirmed", "cancelled", "completed"],
//       default: "pending"
//     },
//     notes: {
//       type: String,
//       maxlength: 500
//     },
//     reason: {
//       type: String,
//       required: true,
//       maxlength: 200
//     },
//     meetingLink: {
//       type: String, // For online sessions
//     },
//     cancellationReason: {
//       type: String,
//       maxlength: 200
//     },
//     isConfidential: {
//       type: Boolean,
//       default: true
//     }
//   },
//   {
//     timestamps: true,
//   }
// );

// // Index for efficient queries
// bookingSchema.index({ student: 1, date: 1 });
// bookingSchema.index({ counselor: 1, date: 1 });

// export const Booking = mongoose.model("Booking", bookingSchema);


// models/booking.model.js
import mongoose, { Schema } from "mongoose";

const bookingSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    counselor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
      validate: {
        validator: function(date) {
          // Ensure booking is not in the past
          return date > new Date();
        },
        message: "Booking date cannot be in the past"
      }
    },
    timeSlot: {
      type: String,
      required: true,
      enum: [
        "09:00-10:00",
        "10:00-11:00", 
        "11:00-12:00",
        "14:00-15:00",
        "15:00-16:00",
        "16:00-17:00"
      ]
    },
    mode: {
      type: String,
      required: true,
      enum: ["in-person", "online", "phone"],
      default: "online"
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending"
    },
    notes: {
      type: String,
      maxlength: 500,
      trim: true
    },
    reason: {
      type: String,
      required: true,
      maxlength: 200,
      trim: true
    },
    meetingLink: {
      type: String, // For online sessions
      validate: {
        validator: function(link) {
          if (!link) return true; // Optional field
          const urlRegex = /^https?:\/\/.+/;
          return urlRegex.test(link);
        },
        message: "Please provide a valid meeting link"
      }
    },
    cancellationReason: {
      type: String,
      maxlength: 200,
      trim: true
    },
    isConfidential: {
      type: Boolean,
      default: true
    },
    reminderSent: {
      type: Boolean,
      default: false
    },
    sessionNotes: {
      type: String,
      maxlength: 1000, // For counselor notes after session
      trim: true
    }
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
bookingSchema.index({ student: 1, date: 1 });
bookingSchema.index({ counselor: 1, date: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ date: 1, timeSlot: 1 });

// Prevent duplicate bookings for same slot
bookingSchema.index(
  { counselor: 1, date: 1, timeSlot: 1 },
  { 
    unique: true, 
    partialFilterExpression: { 
      status: { $in: ["pending", "confirmed"] } 
    } 
  }
);

// Pre-save middleware to validate booking constraints
bookingSchema.pre('save', function(next) {
  // Prevent booking more than 30 days in advance
  const maxAdvanceDays = 30;
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + maxAdvanceDays);
  
  if (this.date > maxDate) {
    return next(new Error('Cannot book more than 30 days in advance'));
  }
  
  // Prevent booking on weekends (optional)
  const dayOfWeek = this.date.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return next(new Error('Bookings are not available on weekends'));
  }
  
  next();
});

export const Booking = mongoose.model("Booking", bookingSchema);