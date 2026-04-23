const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { InterviewSessionModel } = require('../Models/InterviewSession.model');
const { QuestionModel } = require('../Models/Question.model');
const { generateResponse, parseJSONResponse } = require('../services/llm.service');
const { getQuestionPrompt, getEvaluationPrompt, getSummaryPrompt } = require('../services/prompt.service');

const InterviewRouter = express.Router();

// Setup Multer for memory storage (keeps server clean by avoiding disk saves)
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Advanced RAG Utility: Text Chunking
 * Splits a massive resume into smaller logical chunks (~1000 chars)
 * This prevents LLM token limits from blowing up and saves API cost.
 */
const chunkText = (text, maxLength = 1000) => {
    if (!text) return [];
    const chunks = [];
    let currentChunk = "";
    
    // Split by newlines to respect paragraph boundaries
    const sentences = text.split('\n');
    
    for (let sentence of sentences) {
        if (currentChunk.length + sentence.length > maxLength) {
            chunks.push(currentChunk.trim());
            currentChunk = sentence + " ";
        } else {
            currentChunk += sentence + " ";
        }
    }
    if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
    }
    return chunks;
};

/**
 * POST /api/interview/start
 * Initializes an interview session with a PDF resume and a tech stack.
 */
InterviewRouter.post('/start', upload.single('resume'), async (req, res) => {
    try {
        const { techStack, userId } = req.body;
        
        if (!techStack) {
            return res.status(400).json({ error: "techStack is required." });
        }

        let resumeChunks = [];

        // RAG Implementation: Parse PDF and chunk the extracted text
        if (req.file) {
            const pdfData = await pdfParse(req.file.buffer);
            resumeChunks = chunkText(pdfData.text, 1000);
            console.log(`[RAG] Extracted and created ${resumeChunks.length} chunks from resume.`);
        }

        // Create the session in MongoDB
        const newSession = new InterviewSessionModel({
            userId: userId || "anonymous",
            techStack,
            resumeChunks,
            currentDifficulty: "Medium",
            history: [],
            status: "IN_PROGRESS"
        });

        await newSession.save();

        res.status(200).json({
            message: "Interview session initialized.",
            sessionId: newSession._id,
            firstInstruction: "Please introduce yourself and walk me through your background."
        });

    } catch (error) {
        console.error("[Interview Start Error]:", error.message);
        res.status(500).json({ error: "Failed to initialize interview session." });
    }
});

/**
 * POST /api/interview/intro
 * Saves the user's introduction and triggers the first technical question.
 */
InterviewRouter.post('/intro', async (req, res) => {
    try {
        const { sessionId, answer } = req.body;
        const session = await InterviewSessionModel.findById(sessionId);
        
        if (!session) return res.status(404).json({ error: "Session not found." });

        session.introduction = answer;
        await session.save();

        res.status(200).json({ message: "Introduction saved successfully." });
    } catch (error) {
        console.error("[Interview Intro Error]:", error.message);
        res.status(500).json({ error: "Failed to save introduction." });
    }
});

/**
 * POST /api/interview/next-question
 * Generates the next technical question dynamically using context and history.
 */
InterviewRouter.post('/next-question', async (req, res) => {
    try {
        const { sessionId } = req.body;
        const session = await InterviewSessionModel.findById(sessionId);
        
        if (!session) return res.status(404).json({ error: "Session not found." });

        // RAG Logic: Pick the first 2 chunks of the resume to give context (saves tokens)
        const resumeContext = session.resumeChunks.slice(0, 2).join('\n');
        
        const prompt = getQuestionPrompt(session.techStack, session.currentDifficulty, resumeContext, session.history);

        let questionText = "";

        try {
            questionText = await generateResponse(prompt);
        } catch (llmError) {
            console.error("[LLM Generation Failed, Fallback to DB]:", llmError.message);
            // Fallback to pre-existing MongoDB Database
            const fallbackQuestions = await QuestionModel.find({ techStack: session.techStack });
            if (fallbackQuestions.length > 0) {
                const randomQ = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
                questionText = randomQ.question;
            } else {
                questionText = "Could you explain a challenging technical problem you solved recently?";
            }
        }

        res.status(200).json({ question: questionText });
    } catch (error) {
        console.error("[Interview Next-Question Error]:", error.message);
        res.status(500).json({ error: "Failed to generate next question." });
    }
});

/**
 * POST /api/interview/evaluate
 * Evaluates the answer via AI, updates history, and implements adaptive difficulty.
 */
InterviewRouter.post('/evaluate', async (req, res) => {
    try {
        const { sessionId, question, answer } = req.body;
        const session = await InterviewSessionModel.findById(sessionId);
        
        if (!session) return res.status(404).json({ error: "Session not found." });

        const prompt = getEvaluationPrompt(question, answer);
        
        let evaluationResult;
        try {
            const rawResponse = await generateResponse(prompt);
            evaluationResult = parseJSONResponse(rawResponse);
        } catch (llmError) {
            console.error("[Evaluation LLM Failed]:", llmError.message);
            // Graceful fallback evaluation if AI fails completely
            evaluationResult = {
                score: 5,
                strengths: ["Attempted the question."],
                improvements: ["Detailed evaluation unavailable due to server error."]
            };
        }

        // Add to persistent memory (history)
        session.history.push({
            question,
            answer,
            score: evaluationResult.score,
            strengths: evaluationResult.strengths || [],
            improvements: evaluationResult.improvements || []
        });

        // 🔥 Adaptive Difficulty Engine
        if (evaluationResult.score > 7) {
            session.currentDifficulty = "Hard";
        } else if (evaluationResult.score < 4) {
            session.currentDifficulty = "Easy";
        } else {
            session.currentDifficulty = "Medium";
        }

        await session.save();

        res.status(200).json({
            evaluation: evaluationResult,
            newDifficulty: session.currentDifficulty
        });

    } catch (error) {
        console.error("[Interview Evaluate Error]:", error.message);
        res.status(500).json({ error: "Failed to evaluate answer." });
    }
});

/**
 * GET /api/interview/report/:sessionId
 * Generates a final, holistic interview summary report based on the entire session history.
 * Changes the session status to COMPLETED.
 */
InterviewRouter.get('/report/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await InterviewSessionModel.findById(sessionId);
        
        if (!session) return res.status(404).json({ error: "Session not found." });

        if (!session.history || session.history.length === 0) {
            return res.status(400).json({ error: "No interview history found to generate a report." });
        }

        // Calculate Average Score
        const totalScore = session.history.reduce((acc, curr) => acc + (curr.score || 0), 0);
        const averageScore = (totalScore / session.history.length).toFixed(1);

        const prompt = getSummaryPrompt(session.history);

        let summaryReport;
        try {
            const rawResponse = await generateResponse(prompt);
            summaryReport = parseJSONResponse(rawResponse);
        } catch (llmError) {
            console.error("[Summary Report LLM Failed]:", llmError.message);
            // Graceful fallback summary
            summaryReport = {
                overallWeakAreas: ["Unable to generate detailed weak areas due to AI server timeout."],
                keyStrengths: ["Successfully completed the technical interview."],
                actionableSuggestions: ["Please review your individual question feedback for detailed improvements."]
            };
        }

        // Mark session as completed
        session.status = "COMPLETED";
        await session.save();

        res.status(200).json({
            averageScore: parseFloat(averageScore),
            report: summaryReport
        });

    } catch (error) {
        console.error("[Interview Report Error]:", error.message);
        res.status(500).json({ error: "Failed to generate interview report." });
    }
});

module.exports = {
    InterviewRouter
};
