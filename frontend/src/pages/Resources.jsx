import React from "react";

export default function Resources() {
  const resources = [
    { title: "Managing Stress", type: "Article" },
    { title: "Mindfulness Meditation", type: "Video" },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Resource Hub</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {resources.map((r, i) => (
          <div key={i} className="bg-gray-100 p-4 rounded shadow">
            <h3 className="font-semibold">{r.title}</h3>
            <p className="text-sm text-gray-500">{r.type}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
