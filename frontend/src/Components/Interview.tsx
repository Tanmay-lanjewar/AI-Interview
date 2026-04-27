import React, { useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import useClipboard from "react-use-clipboard";
import styled from "styled-components";
import Webcam from "react-webcam";
import { MdCopyAll } from "react-icons/md";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import { Loader } from "./Loader ";

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase = "upload" | "question" | "feedback";

type Feedback = {
  score: number;
  strengths: string[];
  improvements: string[];
};

const API = "http://localhost:8081";

// ─── Component ────────────────────────────────────────────────────────────────
export const Interview = () => {
  const { transcript, browserSupportsSpeechRecognition, resetTranscript } =
    useSpeechRecognition();
  const [text, setText] = useState("");
  const [isCopied, setCopied] = useClipboard(text);

  const [phase, setPhase] = useState<Phase>("upload");
  const [sessionId, setSessionId] = useState<string>("");
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [questionCount, setQuestionCount] = useState<number>(1);

  const [searchParams] = useSearchParams();
  const techStack = searchParams.get("techStack") || "";

  if (!browserSupportsSpeechRecognition) {
    return (
      <p style={{ padding: 40 }}>
        Your browser does not support speech recognition. Please use Chrome.
      </p>
    );
  }

  // ── Score colour helper ──────────────────────────────────────────────────
  const getScoreColor = (score: number) => {
    if (score >= 8) return "#5cdb94";
    if (score >= 5) return "#f39c12";
    return "#e74c3c";
  };

  // ── Phase 0 → Start interview ────────────────────────────────────────────
  const handleStart = async () => {
    if (!resumeFile) {
      setError("Please upload your resume PDF before starting.");
      return;
    }
    setError("");
    setIsLoading(true);

    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("techStack", techStack);

    try {
      const res = await axios.post(`${API}/api/interview/start`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSessionId(res.data.sessionId);
      setCurrentQuestion(res.data.question);
      setPhase("question");
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          "Failed to start the interview. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ── Phase 1 → Submit answer ──────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!transcript.trim()) {
      setError("Please speak your answer before submitting.");
      return;
    }
    setError("");
    setIsLoading(true);
    SpeechRecognition.stopListening();
    window.speechSynthesis.cancel();

    try {
      const res = await axios.post(`${API}/api/interview/evaluate`, {
        sessionId,
        question: currentQuestion,
        answer: transcript,
      });
      setFeedback(res.data);
      setPhase("feedback");
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          "Failed to evaluate your answer. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ── Phase 2 → Next question ──────────────────────────────────────────────
  const handleNextQuestion = async () => {
    setError("");
    setIsLoading(true);
    resetTranscript();

    try {
      const res = await axios.post(`${API}/api/interview/next-question`, {
        sessionId,
      });
      setCurrentQuestion(res.data.question);
      setFeedback(null);
      setQuestionCount((prev) => prev + 1);
      setPhase("question");
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          "Failed to load the next question. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <DIV>

      {/* ════════════════════════════════════════
          PHASE 0 — Resume Upload
      ════════════════════════════════════════ */}
      {phase === "upload" && (
        <div className="upload-container">
          <div className="upload-card">
            <h1 className="upload-title">
              {techStack.toUpperCase()} Interview
            </h1>
            <p className="upload-subtitle">
              Upload your resume so the AI can generate personalised questions
              based on your background and experience.
            </p>

            <div className="file-input-wrapper">
              <label className="file-label" htmlFor="resume-upload">
                {resumeFile ? `✅  ${resumeFile.name}` : "📄  Choose Resume PDF"}
              </label>
              <input
                id="resume-upload"
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  setResumeFile(e.target.files?.[0] || null);
                  setError("");
                }}
              />
            </div>

            {error && <p className="error-msg">{error}</p>}

            <button
              className="start-btn"
              onClick={handleStart}
              disabled={isLoading}
            >
              {isLoading ? <Loader /> : "Start Interview"}
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          PHASE 1 — Interview Question
      ════════════════════════════════════════ */}
      {phase === "question" && (
        <div>
          <div className="question-and-cam-container">
            <div className="question-container">
              <h1>Question {questionCount}</h1>
              <p className="question">{currentQuestion}</p>
              <p className="Caution">
                Caution: Do not refresh or use the browser back / forward
                buttons. Doing so will end your session and you will have to
                start over.
              </p>
            </div>
            <div className="cam-container">
              <Webcam height="260px" />
            </div>
          </div>

          <div
            className="speech-text-container"
            onClick={() => setText(transcript)}
          >
            {transcript ? (
              transcript
            ) : (
              <h2 className="your_answer">
                Click <strong>Start</strong> and speak your answer, then click{" "}
                <strong>Submit</strong> when done…
              </h2>
            )}
          </div>

          {error && <p className="error-inline">{error}</p>}

          <div className="btn-contianer">
            <div>
              <button className="btn copy" onClick={setCopied}>
                {isCopied ? "Copied!" : "Copy"}{" "}
                <MdCopyAll className="copy-icon" />
              </button>
            </div>
            <div>
              <button
                className="btn"
                onClick={() =>
                  SpeechRecognition.startListening({
                    continuous: true,
                    language: "en-IN",
                  })
                }
              >
                Start
              </button>
              <button
                className="btn stop"
                onClick={() => SpeechRecognition.abortListening()}
              >
                Stop
              </button>
              <button className="btn" onClick={resetTranscript}>
                Clear
              </button>
              <button
                className="btn submit-btn"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? "Evaluating…" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          PHASE 2 — Structured Feedback
      ════════════════════════════════════════ */}
      {phase === "feedback" && feedback && (
        <div className="feedback-container">
          <div className="feedback">

            {/* Left panel — user's answer */}
            <div className="student-answer">
              <h2 className="student-answer-heading">Your Answer</h2>
              <p>{transcript}</p>
            </div>

            {/* Right panel — AI feedback */}
            <div className="chat-feedback">
              {isLoading ? (
                <div className="loader">
                  <Loader />
                </div>
              ) : (
                <>
                  {/* Score */}
                  <div className="score-section">
                    <span className="score-label">Score</span>
                    <span
                      className="score-value"
                      style={{ color: getScoreColor(feedback.score) }}
                    >
                      {feedback.score}
                      <span className="score-max">/10</span>
                    </span>
                  </div>

                  {/* Strengths */}
                  <div className="feedback-section">
                    <h3 className="strengths-heading">✅ Strengths</h3>
                    <ul>
                      {feedback.strengths.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Improvements */}
                  <div className="feedback-section">
                    <h3 className="improvements-heading">
                      🔧 Areas to Improve
                    </h3>
                    <ul>
                      {feedback.improvements.map((imp, i) => (
                        <li key={i}>{imp}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>

          {!isLoading && (
            <div className="next-prev-container">
              {error && <p className="error-msg">{error}</p>}
              <button
                className="next-Question-btn"
                onClick={handleNextQuestion}
              >
                Next Question →
              </button>
            </div>
          )}
        </div>
      )}
    </DIV>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const DIV = styled.div`

  /* ── Upload phase ── */
  .upload-container {
    min-height: calc(100vh - 80px);
    background-color: #0a2640;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
  }

  .upload-card {
    background: white;
    border-radius: 12px;
    padding: 50px 60px;
    max-width: 520px;
    width: 100%;
    text-align: center;
    box-shadow: rgba(0, 0, 0, 0.3) 0px 20px 40px;
  }

  .upload-title {
    font-size: 36px;
    color: #05396b;
    margin-bottom: 12px;
  }

  .upload-subtitle {
    color: #555;
    font-size: 15px;
    line-height: 1.6;
    margin-bottom: 32px;
  }

  .file-input-wrapper input[type="file"] {
    display: none;
  }

  .file-label {
    display: block;
    padding: 14px 20px;
    border: 2px dashed #05396b;
    border-radius: 8px;
    cursor: pointer;
    color: #05396b;
    font-weight: 600;
    font-size: 15px;
    margin-bottom: 20px;
    transition: background 0.2s;

    &:hover {
      background-color: #eef4fb;
    }
  }

  .start-btn {
    width: 100%;
    padding: 14px;
    background-color: #05396b;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 17px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 50px;

    &:hover:not(:disabled) {
      background-color: #0a5599;
    }

    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  }

  .error-msg {
    color: #e74c3c;
    font-size: 14px;
    margin-bottom: 12px;
  }

  /* ── Question phase ── */
  .question-and-cam-container {
    display: flex;
    width: 93%;
    margin: auto;
    height: 295px;
  }

  .question-container {
    width: 50%;
    text-align: left;
    padding: 20px;
  }

  .cam-container {
    width: 50%;
    display: flex;
    justify-content: right;
    padding-top: 30px;
  }

  .question {
    font-size: 18px;
    margin-left: 20px;
  }

  .your_answer {
    margin-left: 20px;
    color: #aaa;
    font-weight: 400;
  }

  .speech-text-container {
    width: 90%;
    height: 250px;
    border: solid lightgray 1px;
    border-radius: 5px;
    margin: auto;
    margin-top: 10px;
    padding: 20px;
    text-align: start;
    overflow-y: auto;
  }

  .btn-contianer {
    display: flex;
    justify-content: space-between;
    width: 94%;
    margin: auto;
  }

  .btn {
    padding: 10px 25px;
    border: solid lightgray 1px;
    margin: 10px 15px;
    border-radius: 5px;
    background-color: #05396b;
    box-shadow: rgba(0, 0, 0, 0.16) 0px 1px 4px;
    color: white;
    font-weight: 700;
    cursor: pointer;

    &:hover {
      background-color: #97afc6;
    }
  }

  .copy {
    background-color: #5cdb94;
    font-weight: 900;
    border-radius: 5px;
    box-shadow: rgba(0, 0, 0, 0.16) 0px 1px 4px;
    display: flex;
    align-items: center;
    color: black;
  }

  .stop {
    background-color: #ff3d3d;

    &:hover {
      background-color: #ddacac;
    }
  }

  .submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .copy-icon {
    font-size: 20px;
  }

  .error-inline {
    color: #e74c3c;
    font-size: 14px;
    margin: 4px 0 0 40px;
  }

  .Caution {
    font-size: 13px;
    border: solid red 1px;
    padding: 10px;
    border-radius: 5px;
    background-color: #fac8c8;
  }

  /* ── Feedback phase ── */
  .feedback-container {
    padding: 20px;
    background-color: #0a2640;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    min-height: calc(100vh - 80px);
  }

  .feedback {
    display: flex;
    justify-content: space-between;
    width: 100%;
  }

  .student-answer {
    width: 45%;
    min-height: 500px;
    border: solid lightgray 1px;
    text-align: left;
    padding: 20px 30px;
    background-color: #244361;
    color: white;
    border-radius: 8px;
    margin-right: 20px;
    overflow-y: auto;
  }

  .student-answer-heading {
    color: #5cdb94;
  }

  .chat-feedback {
    width: 52%;
    min-height: 500px;
    border: solid lightgray 1px;
    background-color: white;
    text-align: left;
    padding: 20px 30px;
    border-radius: 8px;
    overflow-y: auto;
  }

  /* Score */
  .score-section {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 2px solid #eee;
  }

  .score-label {
    font-size: 18px;
    font-weight: 700;
    color: #333;
  }

  .score-value {
    font-size: 52px;
    font-weight: 900;
    line-height: 1;
  }

  .score-max {
    font-size: 22px;
    font-weight: 600;
    color: #888;
  }

  /* Strengths / Improvements */
  .feedback-section {
    margin-bottom: 20px;

    ul {
      padding-left: 20px;
      margin-top: 8px;

      li {
        color: #444;
        line-height: 1.7;
        margin-bottom: 6px;
      }
    }
  }

  .strengths-heading {
    color: #27ae60;
    font-size: 17px;
  }

  .improvements-heading {
    color: #e67e22;
    font-size: 17px;
  }

  /* Next button */
  .next-prev-container {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    margin-top: 10px;
  }

  .next-Question-btn {
    padding: 12px 28px;
    margin-top: 16px;
    border-radius: 6px;
    border: none;
    background-color: #5cdb94;
    color: black;
    font-weight: 700;
    font-size: 16px;
    cursor: pointer;

    &:hover {
      background-color: #48c47e;
    }
  }

  .loader {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
`;
