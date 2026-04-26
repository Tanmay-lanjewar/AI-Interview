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

// Returns plain text — used for question generation
const generateText = async (prompt) => {
  const client = getClient();
  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
};

// Returns a parsed JS object — used for evaluation
// Gemini sometimes wraps JSON in ```json ... ``` fences, so we strip those first
const generateJSON = async (prompt) => {
  const client = getClient();
  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);
  let raw = result.response.text().trim();

  // Strip markdown code fences if present
  raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  return JSON.parse(raw);
};

module.exports = { generateText, generateJSON };
