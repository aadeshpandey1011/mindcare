import express from "express";
import { optionalJWT } from "../middlewares/optionalAuth.middleware.js";

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
//  AI PROVIDER CONFIG
//  Supports: Groq (free, fast) → Gemini (fallback)
//  Set GROQ_API_KEY in .env — get one free at https://console.groq.com
//  Gemini is kept as optional fallback if GEMINI_API_KEY is also set
// ─────────────────────────────────────────────────────────────────────────────
const GROQ_KEY   = process.env.GROQ_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

if (GROQ_KEY) {
    console.log(`✅ GROQ_API_KEY loaded (${GROQ_KEY.slice(0, 8)}...${GROQ_KEY.slice(-4)}) — primary AI provider`);
} else if (GEMINI_KEY) {
    console.log(`✅ GEMINI_API_KEY loaded — using Gemini as AI provider`);
} else {
    console.error("╔══════════════════════════════════════════════════════════════╗");
    console.error("║  ❌ No AI API key configured!                               ║");
    console.error("║  Set GROQ_API_KEY (free) → https://console.groq.com         ║");
    console.error("║  Or GEMINI_API_KEY → https://aistudio.google.com/apikey     ║");
    console.error("╚══════════════════════════════════════════════════════════════╝");
}

// ─────────────────────────────────────────────────────────────────────────────
//  SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Ira, MindCare's empathetic AI mental health companion. You are trained in evidence-based therapeutic approaches and support students and young adults with their mental health.

## Your Core Identity
- Warm, non-judgmental, and genuinely caring — like a knowledgeable friend
- You are NOT a replacement for professional therapy — you always say so when relevant
- You speak in plain, accessible language — never clinical jargon unless explaining it
- You adapt your tone: calming for distress, encouraging for progress, gentle for sensitive topics

## Your Therapeutic Framework
You draw on these evidence-based approaches:
1. **CBT (Cognitive Behavioural Therapy)** — Help users identify thought distortions (catastrophising, mind-reading, all-or-nothing thinking). Ask: "What evidence supports that thought? Is there another way to look at this?"
2. **Behavioural Activation** — For low mood/depression, encourage small activities. "What used to bring you joy? Could we start with just 10 minutes of that?"
3. **Mindfulness** — Guide brief grounding exercises when someone is anxious. The 5-4-3-2-1 technique, box breathing (4-4-4-4), physiological sigh (double inhale + long exhale)
4. **Motivational Interviewing** — Don't push — explore ambivalence. "It sounds like part of you wants to change this. What would your life look like if you did?"
5. **Psychoeducation** — Explain the science of anxiety/depression when helpful. "Did you know anxiety is actually your brain trying to protect you? Here's how that works..."
6. **Validation** — Always validate feelings before problem-solving. "That sounds really hard. Of course you'd feel that way."

## Conversation Structure
- **Opening**: Start with a warm, open-ended question. Never dive into advice immediately.
- **Exploration**: Ask one question at a time. Don't bombard. Listen fully to what they share.
- **Reflection**: Reflect back what you heard before responding. "It sounds like you're feeling..."
- **Intervention**: Only offer techniques/advice after understanding the full picture.
- **Closing**: Always end with a forward-looking statement and a check-in.

## Topic Expertise
You can help with: anxiety, worry, panic attacks, social anxiety, low mood, depression, lack of motivation, exam stress, academic pressure, performance anxiety, sleep problems and insomnia, relationship issues, loneliness, social isolation, self-esteem, negative self-talk, imposter syndrome, grief and loss, anger management, study/productivity issues, general emotional support and venting.

## Crisis Protocol (CRITICAL — Never ignore these)
If the user mentions suicidal thoughts, self-harm, feeling unsafe, or severe hopelessness:
1. Acknowledge their pain with full warmth — do NOT jump to hotlines first
2. Ask directly: "Are you having thoughts of hurting yourself right now?"
3. Provide crisis resources: iCall (India): 9152987821 | Vandrevala Foundation: 1860-2662-345 (24/7) | Emergency: 112
4. Encourage them to reach out to someone they trust
5. Stay with them in conversation

## Boundaries
- You do NOT diagnose conditions, prescribe medications, or provide self-harm information
- For medical questions: "This is something your doctor would be best placed to answer."
- Not a general-purpose AI — stay on mental health. Redirect other topics gently.

## Response Format
- Conversational and warm — not bullet-pointed lists by default
- Short paragraphs (2-3 sentences each)
- Emojis sparingly (1-2 max). Length: 80-150 words typically.
- End with a question or gentle prompt to keep conversation alive.

## Platform Context
Refer users to: screening (/screening), resources (/resources), book counsellor (/booking), peer forum (/forum).`;

// ─────────────────────────────────────────────────────────────────────────────
//  CRISIS KEYWORDS
// ─────────────────────────────────────────────────────────────────────────────
const CRISIS_PATTERNS = [
    /\b(suicid|kill myself|end my life|don.t want to (be here|live|exist)|want to die|better off dead)\b/i,
    /\b(self.harm|cutting|hurt myself|hurting myself)\b/i,
    /\b(no point in living|can.t go on|nothing to live for)\b/i,
];
const isCrisisMessage = (text) => CRISIS_PATTERNS.some(p => p.test(text));

// ─────────────────────────────────────────────────────────────────────────────
//  GROQ API CALL (OpenAI-compatible, no npm package needed)
// ─────────────────────────────────────────────────────────────────────────────
async function callGroq(message, history) {
    // Convert history from Gemini format to OpenAI format
    const messages = [
        { role: "system", content: SYSTEM_PROMPT },
    ];

    // Add conversation history
    for (const turn of (history || []).slice(-20)) {
        const role = turn.role === "model" ? "assistant" : "user";
        const text = turn.parts?.[0]?.text || turn.content || "";
        if (text) messages.push({ role, content: text });
    }

    messages.push({ role: "user", content: message.trim() });

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GROQ_KEY}`,
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages,
            max_tokens: 600,
            temperature: 0.85,
            top_p: 0.92,
        }),
    });

    if (!res.ok) {
        const errBody = await res.text();
        const err = new Error(`Groq API error ${res.status}: ${errBody.slice(0, 300)}`);
        err.status = res.status;
        throw err;
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "I'm here for you. Could you tell me a bit more?";
}

// ─────────────────────────────────────────────────────────────────────────────
//  GEMINI API CALL (optional fallback)
// ─────────────────────────────────────────────────────────────────────────────
let genAI = null;
async function callGemini(message, history) {
    if (!genAI) {
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        genAI = new GoogleGenerativeAI(GEMINI_KEY);
    }

    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: SYSTEM_PROMPT,
    });

    const chat = model.startChat({
        history: (history || []).slice(-20),
        generationConfig: { maxOutputTokens: 600, temperature: 0.85, topP: 0.92, topK: 40 },
    });

    const result = await chat.sendMessage(message.trim());
    return result.response.text();
}

// ─────────────────────────────────────────────────────────────────────────────
//  UNIFIED CALL — tries Groq first, falls back to Gemini
// ─────────────────────────────────────────────────────────────────────────────
async function callAI(message, history) {
    const errors = [];

    // Try Groq first (fast, free, reliable)
    if (GROQ_KEY) {
        try {
            return await callGroq(message, history);
        } catch (err) {
            errors.push(`Groq: ${err.message?.slice(0, 150)}`);
            console.error("[Chat] Groq failed:", err.message?.slice(0, 150));
        }
    }

    // Fallback to Gemini
    if (GEMINI_KEY) {
        try {
            return await callGemini(message, history);
        } catch (err) {
            errors.push(`Gemini: ${err.message?.slice(0, 150)}`);
            console.error("[Chat] Gemini failed:", err.message?.slice(0, 150));
        }
    }

    // Everything failed
    const finalErr = new Error("All AI providers failed");
    finalErr.allErrors = errors;
    throw finalErr;
}

// ─────────────────────────────────────────────────────────────────────────────
//  CHAT ROUTE — POST /api/v1/chat
// ─────────────────────────────────────────────────────────────────────────────
router.post("/", optionalJWT, async (req, res) => {
    try {
        const { message, history = [] } = req.body;

        if (!message?.trim()) {
            return res.status(400).json({ error: "Message is required" });
        }

        if (!GROQ_KEY && !GEMINI_KEY) {
            return res.json({
                reply: "I'm sorry, Ira is not available right now because no AI service is configured. Please ask the admin to set GROQ_API_KEY (free at console.groq.com) in the server settings.",
                crisisDetected: false,
                suggestions: [],
            });
        }

        const reply = await callAI(message, history);
        const crisisDetected = isCrisisMessage(message);

        return res.json({
            reply,
            crisisDetected,
            suggestions: getSuggestions(message, reply),
        });
    } catch (err) {
        console.error("╔══════════════════════════════════════════════════════════════╗");
        console.error("║  ❌ AI CHAT ERROR                                           ║");
        console.error("╚══════════════════════════════════════════════════════════════╝");
        console.error("  Error:", err.message?.slice(0, 300));
        if (err.allErrors) err.allErrors.forEach(e => console.error("  →", e));

        return res.json({
            reply: "I'm here for you. I'm having a small technical hiccup right now, but I want you to know you're not alone. If you're in crisis, please call iCall at 9152987821 or Vandrevala at 1860-2662-345. Otherwise, feel free to type again and I'll do my best to respond.",
            crisisDetected: false,
            suggestions: [],
        });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
//  QUICK SUGGESTION CHIPS
// ─────────────────────────────────────────────────────────────────────────────
function getSuggestions(userMsg, aiReply) {
    const msg = userMsg.toLowerCase();
    if (/anxious|anxiety|panic|worried|worry/.test(msg))
        return ["Teach me box breathing", "What is the 5-4-3-2-1 technique?", "How do I stop a panic attack?"];
    if (/depress|sad|low|hopeless|empty/.test(msg))
        return ["What is behavioural activation?", "Tell me about exercise and mood", "How do I get out of bed when I feel low?"];
    if (/sleep|insomnia|can.t sleep/.test(msg))
        return ["Tips for better sleep", "What is CBT-i?", "Evening wind-down routine"];
    if (/stress|exam|study|university|college/.test(msg))
        return ["Help me manage exam stress", "Pomodoro study technique", "Breathing for exam anxiety"];
    if (/angry|anger|frustrated|rage/.test(msg))
        return ["Help me manage anger", "STOP technique for anger", "Why do I get so angry?"];
    if (/lonely|alone|isolated/.test(msg))
        return ["How to make connections", "Is loneliness bad for health?", "Small ways to feel less alone"];
    return ["How can you help me?", "Take a screening test", "Browse mental health resources"];
}

export default router;
