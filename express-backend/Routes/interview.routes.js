const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { InterviewSessionModel } = require('../Models/InterviewSession.model');

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

module.exports = {
    InterviewRouter
};
