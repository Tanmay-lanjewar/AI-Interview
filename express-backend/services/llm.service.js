/**
 * llm.service.js
 * Multi-LLM provider service with robust retry, timeout, and fallback logic.
 */

const { OpenAI } = require("openai");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Initialize SDKs
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

const DEFAULT_PROVIDER = process.env.DEFAULT_AI_PROVIDER || 'openai';

/**
 * Helper to call OpenAI with a strict timeout.
 */
const callOpenAI = async (prompt) => {
    if (!openai) throw new Error("OpenAI API Key is missing.");
    
    // Custom 15-second timeout to prevent hanging requests
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('OpenAI Request Timeout')), 15000));
    
    const apiPromise = openai.chat.completions.create({
        model: "gpt-3.5-turbo", // You can update this to gpt-4o or gpt-4-turbo based on cost preference
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
    });

    const response = await Promise.race([apiPromise, timeoutPromise]);
    return response.choices[0].message.content.trim();
};

/**
 * Helper to call Gemini with a strict timeout.
 */
const callGemini = async (prompt) => {
    if (!genAI) throw new Error("Gemini API Key is missing.");
    
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Gemini Request Timeout')), 15000));
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const apiPromise = model.generateContent(prompt);
    
    const result = await Promise.race([apiPromise, timeoutPromise]);
    const response = await result.response;
    return response.text().trim();
};

/**
 * Generic wrapper to automatically retry failed LLM requests with exponential backoff.
 */
const withRetry = async (fn, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            console.error(`[LLM Service] Attempt ${i + 1} failed: ${error.message}`);
            if (i === retries - 1) throw error; // Re-throw error if all retries are exhausted
            // Exponential backoff (1s, 2s, 4s...)
            await new Promise(res => setTimeout(res, Math.pow(2, i) * 1000));
        }
    }
};

/**
 * Core function to generate a response using the configured provider.
 */
const generateResponse = async (prompt, provider = DEFAULT_PROVIDER) => {
    const aiCall = () => {
        if (provider === 'gemini') {
            return callGemini(prompt);
        } else {
            return callOpenAI(prompt);
        }
    };

    return await withRetry(aiCall, 3);
};

/**
 * Helper to safely parse JSON outputs from the LLM.
 * Strips out accidental markdown blocks (e.g., ```json) before parsing.
 */
const parseJSONResponse = (text) => {
    try {
        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanText);
    } catch (e) {
        console.error("Failed to parse JSON from AI response:", text);
        throw new Error("Invalid JSON format returned from AI.");
    }
};

module.exports = {
    generateResponse,
    parseJSONResponse
};
