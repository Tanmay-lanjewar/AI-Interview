const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const OpenAI = require("openai").default;
const { toFile } = require("openai");
const { InterviewSessionModel } = require("../Models/InterviewSession.model");
const { generateText, generateJSON } = require("../services/llm.service");

const InterviewRouter = express.Router();

// Store uploaded file in memory (no disk writes needed)
const upload = multer({ storage: multer.memoryStorage() });

// ─────────────────────────────────────────────────────────────────────────────
// Helper: decide difficulty bump based on latest score
// ─────────────────────────────────────────────────────────────────────────────
const adjustDifficulty = (current, score) => {
  if (score >= 7 && current === "Easy") return "Medium";
  if (score >= 7 && current === "Medium") return "Hard";
  if (score <= 4 && current === "Hard") return "Medium";
  if (score <= 4 && current === "Medium") return "Easy";
  return current;
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/interview/start
// Accepts: multipart/form-data { resume: <PDF file>, techStack: string }
// Returns: { sessionId, question }
// ─────────────────────────────────────────────────────────────────────────────
InterviewRouter.post("/start", upload.single("resume"), async (req, res) => {
  try {
    const { techStack } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "Resume PDF is required." });
    }
    if (!techStack) {
      return res.status(400).json({ error: "techStack is required." });
    }

    // Extract text from the uploaded PDF buffer
    const parsed = await pdfParse(req.file.buffer);
    const resumeText = parsed.text.trim();

    if (!resumeText) {
      return res
        .status(400)
        .json({ error: "Could not extract text from the PDF. Please upload a text-based PDF." });
    }

    // Create a new session in MongoDB
    const session = await InterviewSessionModel.create({
      techStack,
      resumeText,
      currentDifficulty: "Easy",
      history: [],
      status: "active",
    });

    const firstQuestion =
      "Please introduce yourself and walk me through your background and experience.";

    res.status(201).json({
      sessionId: session._id,
      question: firstQuestion,
    });
  } catch (error) {
    console.error("Error in /start:", error.message);
    res.status(500).json({ error: "Failed to start the interview. Please try again." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/interview/evaluate
// Accepts: { sessionId, question, answer }
// Returns: { score, strengths, improvements }
// ─────────────────────────────────────────────────────────────────────────────
InterviewRouter.post("/evaluate", async (req, res) => {
  try {
    const { sessionId, question, answer } = req.body;

    if (!sessionId || !question || !answer) {
      return res
        .status(400)
        .json({ error: "sessionId, question, and answer are all required." });
    }

    const session = await InterviewSessionModel.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    const prompt = `
You are a supportive but honest technical interviewer evaluating a candidate for a ${session.techStack} developer role.
The candidate answered verbally (speech-to-text), so minor grammar issues or filler words should be ignored.
Focus on whether they understand the concept, not perfect wording.

Candidate's Resume:
"""
${session.resumeText}
"""

Interview Question:
"${question}"

Candidate's Answer:
"${answer}"

Evaluate the answer and return ONLY a valid JSON object — no explanation, no markdown, no extra text.
The JSON must follow this exact structure:
{
  "score": <integer from 1 to 10>,
  "strengths": [<string>, ...],
  "improvements": [<string>, ...]
}

Scoring guide (be generous — reward understanding, not memorised definitions):
- score 1–3: answer is off-topic or shows no understanding of the concept
- score 4–5: shows basic awareness but major gaps
- score 6–7: understands the concept, explains it reasonably well
- score 8–9: clear, accurate answer with good depth
- score 10: exceptional — thorough, precise, includes edge cases or real examples
- strengths: 2–3 specific things the candidate did well
- improvements: 2–3 actionable suggestions (not penalties, just growth areas)
`.trim();

    const feedback = await generateJSON(prompt);

    // Validate the returned shape before saving
    if (
      typeof feedback.score !== "number" ||
      !Array.isArray(feedback.strengths) ||
      !Array.isArray(feedback.improvements)
    ) {
      throw new Error("LLM returned unexpected JSON shape.");
    }

    // Save this Q&A round into history
    session.history.push({
      question,
      answer,
      score: feedback.score,
      strengths: feedback.strengths,
      improvements: feedback.improvements,
    });

    // Adapt difficulty based on the score
    session.currentDifficulty = adjustDifficulty(
      session.currentDifficulty,
      feedback.score
    );

    await session.save();

    res.status(200).json({
      score: feedback.score,
      strengths: feedback.strengths,
      improvements: feedback.improvements,
    });
  } catch (error) {
    console.error("Error in /evaluate:", error.message);
    res.status(500).json({ error: "Failed to evaluate the answer. Please try again." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/interview/next-question
// Accepts: { sessionId }
// Returns: { question }
// ─────────────────────────────────────────────────────────────────────────────
InterviewRouter.post("/next-question", async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required." });
    }

    const session = await InterviewSessionModel.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    // Build a summary of questions already asked so Gemini won't repeat them
    const askedQuestions = session.history
      .map((entry, i) => `${i + 1}. ${entry.question}`)
      .join("\n");

    const prompt = `
You are conducting a technical interview for a ${session.techStack} developer role.

Candidate's Resume:
"""
${session.resumeText}
"""

Questions already asked in this session:
${askedQuestions || "None yet."}

Current difficulty level: ${session.currentDifficulty}

Generate exactly ONE new interview question that:
- Is appropriate for the "${session.currentDifficulty}" difficulty level
- Is relevant to the candidate's background and the ${session.techStack} tech stack
- Has NOT already been asked in this session
- Tests a different concept from the questions already asked

Return ONLY the question text — no numbering, no explanation, no extra text.
`.trim();

    const question = await generateText(prompt);

    res.status(200).json({ question });
  } catch (error) {
    console.error("Error in /next-question:", error.message);
    res.status(500).json({ error: "Failed to generate next question. Please try again." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/interview/transcribe
// Accepts: multipart/form-data { audio: <webm/mp4 blob> }
// Returns: { transcript }
// ─────────────────────────────────────────────────────────────────────────────
InterviewRouter.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Audio file is required." });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GROQ_API_KEY is not configured." });
    }

    // Use the OpenAI SDK pointed at Groq's API — no extra package needed
    const groq = new OpenAI({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });

    // Determine the mime type the browser sent (webm on Chrome, mp4 on Safari)
    const mimeType = req.file.mimetype || "audio/webm";
    const extension = mimeType.includes("mp4") ? "mp4" : "webm";

    // Convert the buffer into a File-like object the SDK can send
    const audioFile = await toFile(req.file.buffer, `recording.${extension}`, {
      type: mimeType,
    });

    // techStack can be passed from the frontend to improve context accuracy
    const techStack = req.body.techStack || "";

    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-large-v3-turbo",
      language: "en",         // force English — prevents misdetection as other languages
      response_format: "text",
      // Prompt primes Whisper with vocabulary it will likely hear.
      // This dramatically improves accuracy for technical terms and proper nouns.
      prompt: `This is a spoken answer to a technical interview question about ${techStack || "software development"}.
The candidate may mention terms such as: JavaScript, TypeScript, Node.js, React, MongoDB, Express, REST API,
async/await, event loop, useState, useEffect, props, components, middleware, schema, aggregation,
object-oriented programming, inheritance, polymorphism, Spring Boot, Java, SQL, NoSQL,
HTTP, JSON, API, frontend, backend, full-stack, deployment, Git, algorithm, data structure.`,
    });

    // When response_format is "text", the SDK returns a plain string directly
    res.json({ transcript: transcription.trim() });
  } catch (error) {
    console.error("Error in /transcribe:", error.message);
    res.status(500).json({ error: "Transcription failed. Please try again." });
  }
});

module.exports = { InterviewRouter };
