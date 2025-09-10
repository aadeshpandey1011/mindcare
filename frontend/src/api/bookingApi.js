import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  withCredentials: true,
});

// Fetch all counsellor slots
export const getAvailableSlots = () => API.get("/booking/slots");

// Book an appointment
export const bookAppointment = (data, token) =>
  API.post("/booking", data, {
    headers: { Authorization: `Bearer ${token}` },
  });

// Get user bookings
export const getUserBookings = (token) =>
  API.get("/booking/my", {
    headers: { Authorization: `Bearer ${token}` },
  });

// Cancel booking
export const cancelBooking = (id, token) =>
  API.delete(`/booking/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
