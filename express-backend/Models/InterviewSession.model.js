const mongoose = require("mongoose");

const QAEntrySchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, default: "" },
    score: { type: Number, default: null },
    strengths: { type: [String], default: [] },
    improvements: { type: [String], default: [] },
  },
  { _id: false }
);

const InterviewSessionSchema = new mongoose.Schema(
  {
    techStack: { type: String, required: true },
    resumeText: { type: String, required: true },
    currentDifficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Easy",
    },
    history: { type: [QAEntrySchema], default: [] },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
  },
  { timestamps: true }
);

const InterviewSessionModel = mongoose.model(
  "InterviewSession",
  InterviewSessionSchema
);

module.exports = { InterviewSessionModel };
