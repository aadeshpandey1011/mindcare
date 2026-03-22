// import React, { useState } from "react";

// export default function ChatSupport() {
//   const [messages, setMessages] = useState([
//     { from: "bot", text: "Hi! How can I help you today?" },
//   ]);
//   const [input, setInput] = useState("");

//   const sendMessage = () => {
//     if (!input) return;
//     setMessages([...messages, { from: "user", text: input }]);
//     // Placeholder bot response
//     setMessages((m) => [
//       ...m,
//       { from: "bot", text: "Thank you for sharing. I’m here to support you." },
//     ]);
//     setInput("");
//   };

//   return (
//     <div className="max-w-2xl mx-auto p-6 flex flex-col h-[80vh]">
//       <div className="flex-1 overflow-y-auto border p-4 rounded bg-gray-50">
//         {messages.map((m, i) => (
//           <div key={i} className={`mb-2 ${m.from === "user" ? "text-right" : "text-left"}`}>
//             <span
//               className={`inline-block px-3 py-2 rounded ${
//                 m.from === "user" ? "bg-blue-500 text-white" : "bg-gray-200"
//               }`}
//             >
//               {m.text}
//             </span>
//           </div>
//         ))}
//       </div>
//       <div className="mt-4 flex">
//         <input
//           className="flex-1 border rounded-l p-2"
//           value={input}
//           onChange={(e) => setInput(e.target.value)}
//         />
//         <button
//           onClick={sendMessage}
//           className="bg-blue-600 text-white px-4 rounded-r"
//         >
//           Send
//         </button>
//       </div>
//     </div>
//   );
// }











// import React, { useState } from "react";
// import axios from "axios";
// import ReactMarkdown from "react-markdown";
// import remarkGfm from "remark-gfm";

// export default function ChatSupport() {
//   const [messages, setMessages] = useState([
//     { from: "bot", text: "Hi! How can I help you today?" },
//   ]);
//   const [input, setInput] = useState("");
//   const [loading, setLoading] = useState(false);

//   const sendMessage = async () => {
//     if (!input) return;

//     // Add user message
//     setMessages((prev) => [...prev, { from: "user", text: input }]);
//     const userMessage = input;
//     setInput("");
//     setLoading(true);

//     try {
//       const res = await axios.post("http://localhost:5000/api/chat", {
//         message: userMessage,
//       });

//       setMessages((prev) => [
//         ...prev,
//         { from: "bot", text: res.data.reply || "Sorry, I couldn’t respond." },
//       ]);
//     } catch (error) {
//       setMessages((prev) => [
//         ...prev,
//         { from: "bot", text: "⚠️ Error connecting to AI support." },
//       ]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="max-w-2xl mx-auto p-6 flex flex-col h-[80vh]">
//       <div className="flex-1 overflow-y-auto border p-4 rounded bg-gray-50">
//         {messages.map((m, i) => (
//           <div
//             key={i}
//             className={`mb-2 ${m.from === "user" ? "text-right" : "text-left"}`}
//           >
//             <div
//               className={`inline-block px-3 py-2 rounded max-w-[80%] whitespace-pre-wrap ${
//                 m.from === "user"
//                   ? "bg-blue-500 text-white"
//                   : "bg-gray-100 text-black"
//               }`}
//             >
//               {m.from === "bot" ? (
//                 <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
//               ) : (
//                 m.text
//               )}
//             </div>
//           </div>
//         ))}
//         {loading && (
//           <div className="text-left">
//             <span className="inline-block px-3 py-2 rounded bg-gray-200 text-black">
//               Typing...
//             </span>
//           </div>
//         )}
//       </div>
//       <div className="mt-4 flex">
//         <input
//           className="flex-1 border rounded-l p-2"
//           value={input}
//           onChange={(e) => setInput(e.target.value)}
//           onKeyDown={(e) => e.key === "Enter" && sendMessage()}
//         />
//         <button
//           onClick={sendMessage}
//           disabled={loading}
//           className="bg-blue-600 text-white px-4 rounded-r disabled:opacity-50"
//         >
//           Send
//         </button>
//       </div>
//     </div>
//   );
// }





import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatSupport() {
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    setMessages((prev) => [...prev, { from: "user", text: input }]);
    const userMessage = input;
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/v1/chat", {
        message: userMessage,
      });

      setMessages((prev) => [
        ...prev,
        { from: "bot", text: res.data.reply || "Sorry, I couldn't respond." },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "⚠️ Error connecting to AI support." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-32 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
      </div>

      <div className="relative w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            AI Assistant
          </h1>
          <p className="text-slate-400 text-lg">Powered by advanced AI technology</p>
        </div>

        {/* Chat Container */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-purple-600/20 to-cyan-600/20 border-b border-white/10 p-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.847a4.5 4.5 0 003.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 00-3.09 3.091zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                  </svg>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">AI Support Agent</h3>
                <p className="text-slate-300 text-sm">Online • Ready to help</p>
              </div>
            </div>
          </div>

          {/* Messages Container */}
          <div className="h-96 md:h-[500px] overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-transparent">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.from === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}
              >
                <div className={`flex items-end space-x-3 max-w-[80%] ${m.from === "user" ? "flex-row-reverse space-x-reverse" : ""}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    m.from === "user" 
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500" 
                      : "bg-gradient-to-r from-purple-500 to-pink-500"
                  }`}>
                    {m.from === "user" ? (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.847a4.5 4.5 0 003.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 00-3.09 3.091z" />
                      </svg>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`relative px-6 py-4 rounded-2xl shadow-lg ${
                    m.from === "user"
                      ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-md"
                      : "bg-white/90 backdrop-blur-sm text-slate-800 rounded-bl-md border border-white/20"
                  }`}>
                    <div className="prose prose-sm max-w-none">
                      {m.from === "bot" ? (
                        <div className="text-slate-800 [&>*]:text-slate-800 [&>p]:text-slate-800 [&>ul]:text-slate-800 [&>ol]:text-slate-800 [&>h1]:text-slate-800 [&>h2]:text-slate-800 [&>h3]:text-slate-800 [&>li]:text-slate-800 [&>blockquote]:text-slate-800 [&>code]:text-slate-800 [&>pre]:text-slate-800">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {m.text}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{m.text}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {loading && (
              <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-end space-x-3 max-w-[80%]">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.847a4.5 4.5 0 003.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 00-3.09 3.091z" />
                    </svg>
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm px-6 py-4 rounded-2xl rounded-bl-md border border-white/20 shadow-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-white/10 bg-white/5 p-6">
            <div className="flex items-end space-x-4">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-4 text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-transparent"
                  placeholder="Type your message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  rows={1}
                  style={{
                    minHeight: '56px',
                    maxHeight: '120px',
                  }}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 disabled:from-slate-600 disabled:to-slate-600 text-white p-4 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 group-hover:translate-x-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
            
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 mt-4">
              <button 
                onClick={() => setInput("What can you help me with?")}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm transition-all duration-200 border border-white/20"
              >
                How can you help?
              </button>
              <button 
                onClick={() => setInput("Tell me about your features")}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm transition-all duration-200 border border-white/20"
              >
                Features
              </button>
              <button 
                onClick={() => setInput("What's new?")}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm transition-all duration-200 border border-white/20"
              >
                What's new?
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-slate-500 text-sm">
          <p>Powered by AI • Secure & Private • Available 24/7</p>
        </div>
      </div>
    </div>
  );
}
