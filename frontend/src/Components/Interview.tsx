import React, { useState, useRef } from "react";
import useClipboard from "react-use-clipboard";
import styled from "styled-components";
import Webcam from "react-webcam";
import { MdCopyAll } from "react-icons/md";
import { MdMic, MdStop } from "react-icons/md";
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
  // ── Session state ──────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>("upload");
  const [sessionId, setSessionId] = useState<string>("");
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(1);

  // ── Recording / transcription state ───────────────────────────────────────
  const [transcript, setTranscript] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [isCopied, setCopied] = useClipboard(transcript);

  const [searchParams] = useSearchParams();
  const techStack = searchParams.get("techStack") || "";

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getScoreColor = (score: number) => {
    if (score >= 8) return "#5cdb94";
    if (score >= 5) return "#f39c12";
    return "#e74c3c";
  };

  // ── Recording logic ────────────────────────────────────────────────────────
  const startRecording = async () => {
    setError("");
    setTranscript("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      // Pick a supported mime type (Chrome → webm, Safari → mp4)
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/mp4";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        // Stop microphone tracks so the browser mic indicator turns off
        streamRef.current?.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        await transcribeAudio(blob, mimeType);
      };

      recorder.start();
      setIsRecording(true);
    } catch (err: any) {
      setError(
        err.name === "NotAllowedError"
          ? "Microphone permission denied. Please allow mic access and try again."
          : "Could not start recording. Please check your microphone."
      );
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const transcribeAudio = async (blob: Blob, mimeType: string) => {
    setIsTranscribing(true);
    setError("");
    try {
      const formData = new FormData();
      const extension = mimeType.includes("mp4") ? "mp4" : "webm";
      formData.append("audio", blob, `recording.${extension}`);

      const res = await axios.post(`${API}/api/interview/transcribe`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setTranscript(res.data.transcript);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          "Transcription failed. Please record again."
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  // ── Phase 0 → Start interview ──────────────────────────────────────────────
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

  // ── Phase 1 → Submit answer ────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!transcript.trim()) {
      setError("No answer recorded yet. Please record your answer first.");
      return;
    }
    setError("");
    setIsLoading(true);

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

  // ── Phase 2 → Next question ────────────────────────────────────────────────
  const handleNextQuestion = async () => {
    setError("");
    setIsLoading(true);
    setTranscript("");

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

  // ── Render ─────────────────────────────────────────────────────────────────
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
                Do not refresh or use the browser back / forward buttons —
                doing so will end your session.
              </p>
            </div>
            <div className="cam-container">
              <Webcam height="260px" />
            </div>
          </div>

          {/* Transcript box — editable so the user can fix any Whisper errors */}
          <textarea
            className="speech-text-container"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder={
              isTranscribing
                ? "Transcribing your answer…"
                : "Your answer will appear here after recording. You can also type or edit directly."
            }
            disabled={isTranscribing}
          />

          {error && <p className="error-inline">{error}</p>}

          <div className="btn-contianer">
            {/* Copy button — copies current transcript */}
            <div>
              <button
                className="btn copy"
                onClick={setCopied}
                disabled={!transcript}
              >
                {isCopied ? "Copied!" : "Copy"}{" "}
                <MdCopyAll className="copy-icon" />
              </button>
            </div>

            <div className="right-btns">
              {/* Record / Stop toggle */}
              {isRecording ? (
                <button className="btn record-btn recording" onClick={stopRecording}>
                  <MdStop className="btn-icon" /> Stop Recording
                </button>
              ) : (
                <button
                  className="btn record-btn"
                  onClick={startRecording}
                  disabled={isTranscribing || isLoading}
                >
                  <MdMic className="btn-icon" />
                  {isTranscribing ? "Transcribing…" : transcript ? "Re-record" : "Start Recording"}
                </button>
              )}

              {/* Clear transcript */}
              <button
                className="btn"
                onClick={() => { setTranscript(""); setError(""); }}
                disabled={isRecording || isTranscribing}
              >
                Clear
              </button>

              {/* Submit — only enabled once there's a transcript */}
              <button
                className="btn submit-btn"
                onClick={handleSubmit}
                disabled={isLoading || isRecording || isTranscribing || !transcript.trim()}
              >
                {isLoading ? "Evaluating…" : "Submit Answer"}
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

            {/* Left — user's answer */}
            <div className="student-answer">
              <h2 className="student-answer-heading">Your Answer</h2>
              <p>{transcript}</p>
            </div>

            {/* Right — AI feedback */}
            <div className="chat-feedback">
              {isLoading ? (
                <div className="loader"><Loader /></div>
              ) : (
                <>
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

                  <div className="feedback-section">
                    <h3 className="strengths-heading">✅ Strengths</h3>
                    <ul>
                      {feedback.strengths.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="feedback-section">
                    <h3 className="improvements-heading">🔧 Areas to Improve</h3>
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
              <button className="next-Question-btn" onClick={handleNextQuestion}>
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

  /* ── Upload ── */
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
    &:hover { background-color: #eef4fb; }
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
    &:hover:not(:disabled) { background-color: #0a5599; }
    &:disabled { opacity: 0.7; cursor: not-allowed; }
  }

  .error-msg {
    color: #e74c3c;
    font-size: 14px;
    margin-bottom: 12px;
  }

  /* ── Question ── */
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

  .speech-text-container {
    display: block;
    width: 90%;
    height: 200px;
    border: solid lightgray 1px;
    border-radius: 5px;
    margin: 10px auto 0;
    padding: 16px 20px;
    font-size: 15px;
    font-family: inherit;
    line-height: 1.6;
    resize: vertical;
    outline: none;
    color: #333;
    &:focus { border-color: #05396b; box-shadow: 0 0 0 2px rgba(5,57,107,0.12); }
    &:disabled { background: #f8f8f8; color: #888; }
  }

  .btn-contianer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 94%;
    margin: auto;
    padding: 8px 0;
  }

  .right-btns {
    display: flex;
    align-items: center;
  }

  .btn {
    padding: 10px 20px;
    border: solid lightgray 1px;
    margin: 10px 8px;
    border-radius: 5px;
    background-color: #05396b;
    box-shadow: rgba(0, 0, 0, 0.16) 0px 1px 4px;
    color: white;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    &:hover:not(:disabled) { background-color: #97afc6; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }

  .btn-icon {
    font-size: 18px;
  }

  .record-btn {
    background-color: #27ae60;
    min-width: 160px;
    justify-content: center;
    &:hover:not(:disabled) { background-color: #1e8449; }
  }

  .recording {
    background-color: #e74c3c;
    animation: pulse 1.2s infinite;
    &:hover { background-color: #c0392b; }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  .copy {
    background-color: #5cdb94;
    color: black;
    font-weight: 900;
  }

  .submit-btn {
    background-color: #05396b;
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }

  .copy-icon { font-size: 20px; }

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

  /* ── Feedback ── */
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

  .student-answer-heading { color: #5cdb94; }

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

  .score-section {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 2px solid #eee;
  }

  .score-label { font-size: 18px; font-weight: 700; color: #333; }

  .score-value { font-size: 52px; font-weight: 900; line-height: 1; }

  .score-max { font-size: 22px; font-weight: 600; color: #888; }

  .feedback-section {
    margin-bottom: 20px;
    ul { padding-left: 20px; margin-top: 8px; }
    li { color: #444; line-height: 1.7; margin-bottom: 6px; }
  }

  .strengths-heading { color: #27ae60; font-size: 17px; }
  .improvements-heading { color: #e67e22; font-size: 17px; }

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
    &:hover { background-color: #48c47e; }
  }

  .loader {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
`;
