import React, { useState } from "react";

export default function ChatSupport() {
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! How can I help you today?" },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input) return;
    setMessages([...messages, { from: "user", text: input }]);
    // Placeholder bot response
    setMessages((m) => [
      ...m,
      { from: "bot", text: "Thank you for sharing. I’m here to support you." },
    ]);
    setInput("");
  };

  return (
    <div className="max-w-2xl mx-auto p-6 flex flex-col h-[80vh]">
      <div className="flex-1 overflow-y-auto border p-4 rounded bg-gray-50">
        {messages.map((m, i) => (
          <div key={i} className={`mb-2 ${m.from === "user" ? "text-right" : "text-left"}`}>
            <span
              className={`inline-block px-3 py-2 rounded ${
                m.from === "user" ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              {m.text}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex">
        <input
          className="flex-1 border rounded-l p-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 rounded-r"
        >
          Send
        </button>
      </div>
    </div>
  );
}
