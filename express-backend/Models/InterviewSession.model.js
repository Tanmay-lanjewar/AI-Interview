const mongoose = require("mongoose");

const InterviewSessionSchema = new mongoose.Schema({
    userId: { type: String, required: false, default: "anonymous" }, // Easy to connect to auth later
    techStack: { type: String, required: true },
    resumeChunks: { type: [String], default: [] }, // Stores the RAG-extracted resume parts
    introduction: { type: String, default: "" }, // The user's initial intro answer
    currentDifficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Medium" },
    history: [{
        question: String,
        answer: String,
        score: Number,
        strengths: [String],
        improvements: [String]
    }],
    status: { type: String, enum: ["IN_PROGRESS", "COMPLETED"], default: "IN_PROGRESS" }
}, {
    timestamps: true, // Automatically manages createdAt and updatedAt
    versionKey: false
});

const InterviewSessionModel = mongoose.model("interview_session", InterviewSessionSchema);

module.exports = {
    InterviewSessionModel
};
