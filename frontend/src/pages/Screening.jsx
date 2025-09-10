import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function Screening() {
  const { token } = useAuth();
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const questions = [
    "I feel anxious frequently.",
    "I have trouble sleeping.",
    "I find it hard to concentrate.",
  ];

  const handleChange = (i, val) => {
    setAnswers({ ...answers, [i]: val });
  };

  const handleSubmit = async () => {
    try {
      const res = await axios.post(
        "http://localhost:5000/api/v1/screenings",
        { answers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(res.data.data);
    } catch (err) {
      alert("Error submitting screening");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Screening Test</h2>
      {questions.map((q, i) => (
        <div key={i} className="mb-4">
          <p>{q}</p>
          <select
            className="border p-2 w-full"
            onChange={(e) => handleChange(i, e.target.value)}
          >
            <option value="">Select</option>
            <option value="0">Never</option>
            <option value="1">Sometimes</option>
            <option value="2">Often</option>
            <option value="3">Always</option>
          </select>
        </div>
      ))}
      <button
        onClick={handleSubmit}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Submit
      </button>

      {result && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold">Your Result:</h3>
          <p>{result.message}</p>
        </div>
      )}
    </div>
  );
}