// import express from "express";
// import OpenAI from "openai";

// const router = express.Router();

// // Initialize OpenAI client
// const client = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// // POST /api/chat
// router.post("/", async (req, res) => {
//   try {
//     const { message } = req.body;
//     if (!message) {
//       return res.status(400).json({ error: "Message is required" });
//     }

//     // Call OpenAI
//     const response = await client.chat.completions.create({
//       model: "gpt-4o-mini", // or "gpt-4o" / "gpt-3.5-turbo"
//       messages: [{ role: "user", content: message }],
//     });

//     res.json({ reply: response.choices[0].message.content });
//   } catch (error) {
//     console.error("Chat API Error:", error);
//     res.status(500).json({ error: "Failed to get AI response" });
//   }
// });

// export default router;






import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Load the Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Send user message
    const result = await model.generateContent(message);
    const reply = result.response.text();

    res.json({ reply });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Failed to get AI response" });
  }
});

export default router;
