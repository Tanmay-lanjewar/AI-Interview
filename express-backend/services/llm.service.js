const { GoogleGenerativeAI } = require("@google/generative-ai");

let genAI = null;

const getClient = () => {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set in environment");
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
};

// Retry wrapper: retries up to `retries` times with exponential backoff
// Only retries on 503 (overloaded) errors — lets real errors (403, 404) fail fast
const withRetry = async (fn, retries = 3, delayMs = 2000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const is503 = err?.message?.includes("503") || err?.status === 503;
      if (!is503 || attempt === retries) throw err;
      console.warn(`Gemini 503 — retrying (attempt ${attempt}/${retries}) in ${delayMs}ms...`);
      await new Promise((r) => setTimeout(r, delayMs));
      delayMs *= 2; // exponential backoff: 2s → 4s → 8s
    }
  }
};

// Returns plain text — used for question generation
const generateText = async (prompt) => {
  return withRetry(async () => {
    const client = getClient();
    const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  });
};

// Returns a parsed JS object — used for evaluation
// Gemini sometimes wraps JSON in ```json ... ``` fences, so we strip those first
const generateJSON = async (prompt) => {
  return withRetry(async () => {
    const client = getClient();
    const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    let raw = result.response.text().trim();

    // Strip markdown code fences if present
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

    return JSON.parse(raw);
  });
};

module.exports = { generateText, generateJSON };
