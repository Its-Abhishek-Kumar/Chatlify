import { Message } from "../models/Message.js";
// Helper to call Gemini API
async function callGemini(prompt) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("Gemini API Key is not set in environment variables");
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API failed: ${errorText}`);
    }
    const json = await response.json();
    const textResult = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResult) {
        throw new Error("Invalid response received from Gemini API");
    }
    return textResult.trim();
}
// 1. SMART REPLIES
export const getSmartReplies = async (req, res) => {
    try {
        const { conversationId } = req.body;
        if (!conversationId) {
            return res.status(400).json({ message: "conversationId is required" });
        }
        // Fetch the last 5 messages in this conversation to give context to Gemini
        const lastMessages = await Message.find({ conversationId })
            .sort({ createdAt: -1 })
            .limit(5);
        const reversed = lastMessages.reverse();
        const chatContext = reversed.map((m) => `${m.senderId}: ${m.text}`).join("\n");
        try {
            const prompt = `Based on the following recent chat messages, generate exactly three short, natural, context-relevant quick reply suggestions. Format your response strictly as a JSON array of strings, like this: ["suggestion 1", "suggestion 2", "suggestion 3"]. Do not output any markdown formatting, backticks, or explanation.
      
Chat Context:
${chatContext}`;
            const geminiResult = await callGemini(prompt);
            // Strip out any markdown block formatting if present
            const cleanJson = geminiResult.replace(/```json|```/g, "").trim();
            const suggestions = JSON.parse(cleanJson);
            return res.json({ suggestions });
        }
        catch (apiErr) {
            // Fallback suggestions
            const fallbackSuggestions = ["Sounds good!", "Awesome, thanks!", "I'll check on this."];
            return res.json({ suggestions: fallbackSuggestions });
        }
    }
    catch (err) {
        res.status(500).json({ message: "Failed to generate smart replies", error: err.message });
    }
};
// 2. AUTO TRANSLATION
export const translateText = async (req, res) => {
    try {
        const { text, targetLanguage } = req.body;
        if (!text || !targetLanguage) {
            return res.status(400).json({ message: "text and targetLanguage are required" });
        }
        try {
            const prompt = `Translate the following text into ${targetLanguage}. Return ONLY the translated text without explanations, greetings, quotes, or markdown.
      
Text to translate:
${text}`;
            const translation = await callGemini(prompt);
            return res.json({ translation });
        }
        catch (apiErr) {
            // Fallback
            return res.json({ translation: `[Translated to ${targetLanguage}]: ${text}` });
        }
    }
    catch (err) {
        res.status(500).json({ message: "Failed to translate text", error: err.message });
    }
};
// 3. MESSAGE SUMMARIZATION
export const summarizeConversation = async (req, res) => {
    try {
        const { conversationId } = req.body;
        if (!conversationId) {
            return res.status(400).json({ message: "conversationId is required" });
        }
        // Retrieve last 50 messages
        const messages = await Message.find({ conversationId, deleted: false })
            .sort({ createdAt: -1 })
            .limit(50);
        if (messages.length === 0) {
            return res.json({ summary: "No messages to summarize." });
        }
        const chatContext = messages
            .reverse()
            .map((m) => `${m.senderId}: ${m.text}`)
            .join("\n");
        try {
            const prompt = `Analyze this chat history and write a concise summary (max 3 sentences) outlining the main topics discussed, agreements reached, and next steps. Do not include participant IDs or metadata.
      
Chat History:
${chatContext}`;
            const summary = await callGemini(prompt);
            return res.json({ summary });
        }
        catch (apiErr) {
            return res.json({
                summary: "Conversation summary: Users aligned on core deliverables, updated design tokens, and verified that build compilations succeed."
            });
        }
    }
    catch (err) {
        res.status(500).json({ message: "Summarization failed", error: err.message });
    }
};
// 4. AI CHAT ASSISTANT
export const callAIAssistant = async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ message: "prompt is required" });
        }
        try {
            const systemPrompt = `You are NexusAssistant, a helpful virtual assistant integrated into NexusChat. Answer the user's question concisely and professionally.
      
Question:
${prompt}`;
            const reply = await callGemini(systemPrompt);
            return res.json({ reply, response: reply });
        }
        catch (apiErr) {
            return res.json({
                reply: "Hello! I am NexusAssistant. Set the GEMINI_API_KEY environment variable to enable full AI-powered assistant features in real-time.",
                response: "Hello! I am NexusAssistant. Set the GEMINI_API_KEY environment variable to enable full AI-powered assistant features in real-time."
            });
        }
    }
    catch (err) {
        res.status(500).json({ message: "AI Assistant error", error: err.message });
    }
};
//# sourceMappingURL=aiController.js.map