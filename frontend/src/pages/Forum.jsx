import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Forum() {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    axios.get("http://localhost:5000/api/v1/comments")
      .then(res => setComments(res.data.data))
      .catch(err => console.error(err));
  }, []);

  const postComment = async () => {
    try {
      await axios.post(
        "http://localhost:5000/api/v1/comments",
        { text },
        { headers: { Authorization: `Bearer ${localStorage.getItem("dpi_token")}` } }
      );
      setText("");
      const res = await axios.get("http://localhost:5000/api/v1/comments");
      setComments(res.data.data);
    } catch (err) {
      alert("Failed to post comment");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Peer Forum</h2>
      <div className="mb-4">
        <textarea
          className="border w-full p-2 rounded mb-2"
          placeholder="Share something..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button onClick={postComment} className="px-4 py-2 bg-blue-600 text-white rounded">
          Post
        </button>
      </div>
      <div>
        {comments.map((c) => (
          <div key={c._id} className="bg-gray-100 p-3 rounded mb-2">
            <p>{c.text}</p>
            <small className="text-gray-600">
              {c.user?.fullName || "Anonymous"} ({c.user?.role})
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}
