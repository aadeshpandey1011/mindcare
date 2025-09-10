import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function Booking() {
  const { token } = useAuth();
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");

  const book = async () => {
    try {
      await axios.post(
        "http://localhost:5000/api/v1/bookings",
        { date, note },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Appointment booked successfully!");
    } catch (err) {
      alert("Booking failed");
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Book Appointment</h2>
      <input
        type="date"
        className="border p-2 w-full mb-4"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <textarea
        className="border p-2 w-full mb-4"
        placeholder="Reason for booking"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <button onClick={book} className="px-4 py-2 bg-blue-600 text-white rounded">
        Book
      </button>
    </div>
  );
}
