// utils/notifications.js - Backend
import { Server } from 'socket.io';
import { User } from '../models/user.model.js';
import { Booking } from '../models/booking.model.js';
import sendMail from './mail.js';

class NotificationService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId
  }

  // Initialize Socket.IO
  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5000",
        methods: ["GET", "POST"],
      },
    });

    this.io.on("connection", (socket) => {
      console.log("User connected:", socket.id);

      // User joins with their ID
      socket.on("join", (userId) => {
        this.connectedUsers.set(userId, socket.id);
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined with socket ${socket.id}`);
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        for (const [userId, socketId] of this.connectedUsers.entries()) {
          if (socketId === socket.id) {
            this.connectedUsers.delete(userId);
            break;
          }
        }
        console.log("User disconnected:", socket.id);
      });
    });
  }

  // Send real-time notification to specific user
  sendToUser(userId, event, data) {
    if (this.io) {
      this.io.to(`user_${userId}`).emit(event, data);
    }
  }

  // Send notification to multiple users
  sendToMultiple(userIds, event, data) {
    if (this.io) {
      userIds.forEach((userId) => {
        this.io.to(`user_${userId}`).emit(event, data);
      });
    }
  }

  // Broadcast to all connected users
  broadcast(event, data) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  // Booking notifications
  async sendBookingNotification(booking, type) {
    const student = booking.student;
    const counselor = booking.counselor;

    let notificationData = {
      id: booking._id,
      type: "booking",
      action: type,
      booking: {
        id: booking._id,
        date: booking.date,
        timeSlot: booking.timeSlot,
        mode: booking.mode,
        status: booking.status,
        student: student ? { id: student._id, name: student.fullName } : null,
        counselor: counselor ? { id: counselor._id, name: counselor.fullName } : null,
      },
      timestamp: new Date(),
    };

    switch (type) {
      case "created":
        this.sendToUser(counselor._id.toString(), "booking_request", {
          ...notificationData,
          message: `New booking request from ${student.fullName}`,
        });
        break;

      case "approved":
        this.sendToUser(student._id.toString(), "booking_approved", {
          ...notificationData,
          message: `Your booking with ${counselor.fullName} has been approved`,
          meetingLink: booking.meetingLink,
        });
        break;

      case "cancelled":
        const cancelMessage = `Booking for ${new Date(
          booking.date
        ).toLocaleDateString()} at ${booking.timeSlot} has been cancelled`;

        this.sendToUser(student._id.toString(), "booking_cancelled", {
          ...notificationData,
          message: cancelMessage,
          reason: booking.cancellationReason,
        });

        this.sendToUser(counselor._id.toString(), "booking_cancelled", {
          ...notificationData,
          message: cancelMessage,
          reason: booking.cancellationReason,
        });
        break;

      case "completed":
        this.sendToUser(student._id.toString(), "booking_completed", {
          ...notificationData,
          message: `Your session with ${counselor.fullName} has been marked as completed`,
        });
        break;

      case "reminder":
        this.sendToUser(student._id.toString(), "booking_reminder", {
          ...notificationData,
          message: `Reminder: You have a counseling session tomorrow at ${booking.timeSlot}`,
        });

        this.sendToUser(counselor._id.toString(), "booking_reminder", {
          ...notificationData,
          message: `Reminder: You have a session with ${student.fullName} tomorrow at ${booking.timeSlot}`,
        });
        break;
    }

    // Send emails also
    await this.sendEmailNotification(booking, type);
  }

  // Email Notification Handler
  async sendEmailNotification(booking, type) {
    const student = booking.student;
    const counselor = booking.counselor;

    try {
      switch (type) {
        case "created":
          await sendMail({
            to: student.email,
            subject: "📅 Booking Request Submitted - Mental Health Support",
            html: this.generateBookingCreatedEmailHTML(booking, "student"),
          });
          await sendMail({
            to: counselor.email,
            subject: "🔔 New Booking Request - Mental Health Support",
            html: this.generateBookingCreatedEmailHTML(booking, "counselor"),
          });
          break;

        case "approved":
          await sendMail({
            to: student.email,
            subject: "✅ Booking Confirmed - Mental Health Support",
            html: this.generateBookingApprovedEmailHTML(booking),
          });
          break;

        case "cancelled":
          await Promise.all([
            sendMail({
              to: student.email,
              subject: "❌ Booking Cancelled - Mental Health Support",
              html: this.generateBookingCancelledEmailHTML(booking, "student"),
            }),
            sendMail({
              to: counselor.email,
              subject: "❌ Booking Cancelled - Mental Health Support",
              html: this.generateBookingCancelledEmailHTML(booking, "counselor"),
            }),
          ]);
          break;

        case "completed":
          await sendMail({
            to: student.email,
            subject: "✨ Session Completed - Mental Health Support",
            html: this.generateSessionCompletedEmailHTML(booking),
          });
          break;

        case "reminder":
          await Promise.all([
            sendMail({
              to: student.email,
              subject: "⏰ Reminder: Counseling Session Tomorrow",
              html: this.generateReminderEmailHTML(booking, "student"),
            }),
            sendMail({
              to: counselor.email,
              subject: "⏰ Reminder: Counseling Session Tomorrow",
              html: this.generateReminderEmailHTML(booking, "counselor"),
            }),
          ]);
          break;
      }
    } catch (error) {
      console.error("Email notification failed:", error);
    }
  }

  // --- Email Templates (all completed) ---
  generateBookingCreatedEmailHTML(booking, recipient) {
    const isStudent = recipient === "student";
    const otherPerson = isStudent ? booking.counselor : booking.student;
    const title = isStudent ? "Booking Request Submitted" : "New Booking Request";

    return `
      <div style="font-family: sans-serif; max-width:600px; margin:auto;">
        <h2>${title}</h2>
        <p><strong>${isStudent ? "Counselor" : "Student"}:</strong> ${
      otherPerson.fullName
    }</p>
        <p><strong>Date:</strong> ${new Date(
          booking.date
        ).toLocaleDateString()}</p>
        <p><strong>Time:</strong> ${booking.timeSlot}</p>
        <p><strong>Mode:</strong> ${booking.mode}</p>
        <p><strong>Status:</strong> ${booking.status}</p>
      </div>
    `;
  }

  generateBookingApprovedEmailHTML(booking) {
    return `<div><h2>✅ Booking Confirmed</h2><p>Your session with ${
      booking.counselor.fullName
    } is scheduled for ${new Date(booking.date).toLocaleDateString()} at ${
      booking.timeSlot
    }.</p></div>`;
  }

  generateBookingCancelledEmailHTML(booking, recipient) {
    return `<div><h2>❌ Booking Cancelled</h2><p>Your booking on ${new Date(
      booking.date
    ).toLocaleDateString()} at ${booking.timeSlot} was cancelled.</p><p>Reason: ${
      booking.cancellationReason || "Not specified"
    }</p></div>`;
  }

  generateSessionCompletedEmailHTML(booking) {
    return `<div><h2>✨ Session Completed</h2><p>Your session with ${
      booking.counselor.fullName
    } is completed. Thank you for taking care of your mental health.</p></div>`;
  }

  generateReminderEmailHTML(booking, recipient) {
    const isStudent = recipient === "student";
    const otherPerson = isStudent ? booking.counselor : booking.student;

    return `<div><h2>⏰ Reminder</h2><p>You have a session with ${
      otherPerson.fullName
    } tomorrow at ${booking.timeSlot}.</p></div>`;
  }

  // Reminder Scheduler
  async scheduleReminders() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    try {
      const upcomingBookings = await Booking.find({
        date: { $gte: tomorrow, $lt: dayAfterTomorrow },
        status: "confirmed",
      }).populate("student counselor");

      for (const booking of upcomingBookings) {
        await this.sendBookingNotification(booking, "reminder");
      }

      console.log(`Sent ${upcomingBookings.length} reminder notifications`);
    } catch (error) {
      console.error("Failed to send reminder notifications:", error);
    }
  }
}

// Export singleton
export const notificationService = new NotificationService();

// Cron job
export const scheduleReminderCronJob = () => {
  const cron = require("node-cron");

  cron.schedule(
    "0 9 * * *",
    async () => {
      console.log("Running daily reminder check...");
      await notificationService.scheduleReminders();
    },
    { timezone: "Asia/Kolkata" }
  );
};
