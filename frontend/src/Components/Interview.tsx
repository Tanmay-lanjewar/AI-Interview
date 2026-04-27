import React, { useState, useRef } from "react";
import useClipboard from "react-use-clipboard";
import styled from "styled-components";
import Webcam from "react-webcam";
import { MdCopyAll, MdMic, MdStop } from "react-icons/md";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import { Loader } from "./Loader ";

type Phase = "upload" | "question" | "feedback";
type Feedback = { score: number; strengths: string[]; improvements: string[] };

const API = "http://localhost:8081";

export const Interview = () => {
  const [phase, setPhase] = useState<Phase>("upload");
  const [sessionId, setSessionId] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [questionCount, setQuestionCount] = useState(1);

  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCopied, setCopied] = useClipboard(transcript);

  const [searchParams] = useSearchParams();
  const techStack = searchParams.get("techStack") || "";

  const scoreColor = (s: number) => s >= 8 ? "#10b981" : s >= 5 ? "#f59e0b" : "#ef4444";

  /* ── Recording ── */
  const startRecording = async () => {
    setError(""); setTranscript("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus" : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        await transcribeAudio(new Blob(audioChunksRef.current, { type: mimeType }), mimeType);
      };
      recorder.start();
      setIsRecording(true);
    } catch (err: any) {
      setError(err.name === "NotAllowedError"
        ? "Microphone access denied. Please allow mic access and try again."
        : "Could not start recording. Check your microphone.");
    }
  };

  const stopRecording = () => { mediaRecorderRef.current?.stop(); setIsRecording(false); };

  const transcribeAudio = async (blob: Blob, mimeType: string) => {
    setIsTranscribing(true);
    try {
      const ext = mimeType.includes("mp4") ? "mp4" : "webm";
      const fd = new FormData();
      fd.append("audio", blob, `recording.${ext}`);
      const res = await axios.post(`${API}/api/interview/transcribe`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setTranscript(res.data.transcript);
    } catch (err: any) {
      setError(err.response?.data?.error || "Transcription failed. Please try again.");
    } finally { setIsTranscribing(false); }
  };

  /* ── Phase handlers ── */
  const handleStart = async () => {
    if (!resumeFile) { setError("Please upload your resume PDF first."); return; }
    setError(""); setIsLoading(true);
    const fd = new FormData();
    fd.append("resume", resumeFile);
    fd.append("techStack", techStack);
    try {
      const res = await axios.post(`${API}/api/interview/start`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSessionId(res.data.sessionId);
      setCurrentQuestion(res.data.question);
      setPhase("question");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to start interview. Please try again.");
    } finally { setIsLoading(false); }
  };

  const handleSubmit = async () => {
    if (!transcript.trim()) { setError("Please record your answer first."); return; }
    setError(""); setIsLoading(true);
    try {
      const res = await axios.post(`${API}/api/interview/evaluate`, {
        sessionId, question: currentQuestion, answer: transcript,
      });
      setFeedback(res.data);
      setPhase("feedback");
    } catch (err: any) {
      setError(err.response?.data?.error || "Evaluation failed. Please try again.");
    } finally { setIsLoading(false); }
  };

  const handleNextQuestion = async () => {
    setError(""); setIsLoading(true); setTranscript("");
    try {
      const res = await axios.post(`${API}/api/interview/next-question`, { sessionId });
      setCurrentQuestion(res.data.question);
      setFeedback(null);
      setQuestionCount((p) => p + 1);
      setPhase("question");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load next question.");
    } finally { setIsLoading(false); }
  };

  return (
    <DIV>

      {/* ══════════════════════════════
          PHASE 0 — Upload
      ══════════════════════════════ */}
      {phase === "upload" && (
        <div className="upload-page">
          <div className="upload-card">
            <div className="upload-badge">{techStack.toUpperCase()} Interview</div>
            <h1>Ready to Practice?</h1>
            <p className="upload-sub">
              Upload your resume so the AI can generate questions tailored to
              your experience and background.
            </p>

            <label className="dropzone" htmlFor="resume-upload">
              <div className="dz-icon">{resumeFile ? "✅" : "📄"}</div>
              <div className="dz-text">
                {resumeFile
                  ? <><strong>{resumeFile.name}</strong><span>Click to change</span></>
                  : <><strong>Click to upload Resume</strong><span>PDF files only</span></>}
              </div>
              <input
                id="resume-upload"
                type="file"
                accept="application/pdf"
                onChange={(e) => { setResumeFile(e.target.files?.[0] || null); setError(""); }}
              />
            </label>

            {error && <p className="error-pill">⚠ {error}</p>}

            <button className="primary-btn" onClick={handleStart} disabled={isLoading}>
              {isLoading
                ? <span className="btn-loader"><Loader /></span>
                : "Start Interview →"}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════
          PHASE 1 — Question
      ══════════════════════════════ */}
      {phase === "question" && (
        <div className="question-page">
          {/* Top bar */}
          <div className="q-topbar">
            <span className="q-badge">Question {questionCount}</span>
            <span className="q-stack">{techStack.toUpperCase()}</span>
          </div>

          {/* Main split */}
          <div className="q-split">
            {/* Left: question + transcript */}
            <div className="q-left">
              <div className="question-card">
                <p className="q-label">YOUR QUESTION</p>
                <p className="q-text">{currentQuestion}</p>
              </div>

              <div className="transcript-card">
                <div className="tc-header">
                  <p className="tc-label">YOUR ANSWER</p>
                  <button className="copy-btn" onClick={setCopied} disabled={!transcript}>
                    <MdCopyAll /> {isCopied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <textarea
                  className="tc-area"
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder={
                    isTranscribing
                      ? "Transcribing your answer…"
                      : "Your transcribed answer will appear here. You can also type or edit directly."
                  }
                  disabled={isTranscribing}
                />
              </div>

              {error && <p className="error-pill">⚠ {error}</p>}

              {/* Controls */}
              <div className="controls-row">
                {isRecording ? (
                  <button className="rec-btn recording" onClick={stopRecording}>
                    <MdStop /> Stop Recording
                  </button>
                ) : (
                  <button
                    className="rec-btn"
                    onClick={startRecording}
                    disabled={isTranscribing || isLoading}
                  >
                    <MdMic />
                    {isTranscribing ? "Transcribing…" : transcript ? "Re-record" : "Start Recording"}
                  </button>
                )}

                <button
                  className="clear-btn"
                  onClick={() => { setTranscript(""); setError(""); }}
                  disabled={isRecording || isTranscribing}
                >
                  Clear
                </button>

                <button
                  className="submit-btn"
                  onClick={handleSubmit}
                  disabled={isLoading || isRecording || isTranscribing || !transcript.trim()}
                >
                  {isLoading ? "Evaluating…" : "Submit Answer →"}
                </button>
              </div>
            </div>

            {/* Right: webcam */}
            <div className="q-right">
              <div className="cam-card">
                <Webcam className="webcam" />
                <div className="cam-footer">
                  <span className={`rec-dot ${isRecording ? "live" : ""}`} />
                  {isRecording ? "Recording…" : "Camera Preview"}
                </div>
              </div>
              <div className="caution-card">
                ⚠ Do not refresh or use browser back/forward — it will end your session.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════
          PHASE 2 — Feedback
      ══════════════════════════════ */}
      {phase === "feedback" && feedback && (
        <div className="feedback-page">
          <div className="fb-topbar">
            <span className="q-badge">Question {questionCount} — Feedback</span>
            <span className="q-stack">{techStack.toUpperCase()}</span>
          </div>

          <div className="fb-split">
            {/* Left: answer */}
            <div className="answer-panel">
              <p className="panel-label">YOUR ANSWER</p>
              <p className="answer-text">{transcript || "—"}</p>
            </div>

            {/* Right: feedback */}
            <div className="feedback-panel">
              {isLoading ? (
                <div className="fb-loader"><Loader /></div>
              ) : (
                <>
                  {/* Score */}
                  <div className="score-row">
                    <div className="score-block">
                      <span
                        className="score-num"
                        style={{ color: scoreColor(feedback.score) }}
                      >
                        {feedback.score}
                      </span>
                      <span className="score-denom">/10</span>
                    </div>
                    <div className="score-bar-wrap">
                      <div
                        className="score-bar"
                        style={{
                          width: `${feedback.score * 10}%`,
                          background: scoreColor(feedback.score),
                        }}
                      />
                    </div>
                  </div>

                  {/* Strengths */}
                  <div className="fb-section">
                    <p className="fb-section-title strengths-title">✅ Strengths</p>
                    <ul className="fb-list">
                      {feedback.strengths.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Improvements */}
                  <div className="fb-section">
                    <p className="fb-section-title improve-title">🔧 Areas to Improve</p>
                    <ul className="fb-list">
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
            <div className="fb-actions">
              {error && <p className="error-pill">⚠ {error}</p>}
              <button className="next-btn" onClick={handleNextQuestion}>
                Next Question →
              </button>
            </div>
          )}
        </div>
      )}
    </DIV>
  );
};

const DIV = styled.div`
  background: #0f172a;
  min-height: calc(100vh - 64px);
  color: #f1f5f9;

  /* ── Shared ── */
  .error-pill {
    display: inline-block;
    padding: 8px 14px;
    background: rgba(239,68,68,0.1);
    border: 1px solid rgba(239,68,68,0.3);
    border-radius: 8px;
    font-size: 13px;
    color: #fca5a5;
    margin: 4px 0;
  }

  /* ── Upload ── */
  .upload-page {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: calc(100vh - 64px);
    padding: 40px 24px;
  }

  .upload-card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 24px;
    padding: 48px 52px;
    max-width: 500px;
    width: 100%;
    text-align: center;
    box-shadow: 0 25px 60px rgba(0,0,0,0.4);
  }

  .upload-badge {
    display: inline-block;
    padding: 5px 14px;
    background: rgba(99,102,241,0.15);
    border: 1px solid rgba(99,102,241,0.3);
    border-radius: 100px;
    font-size: 12px;
    font-weight: 700;
    color: #a5b4fc;
    letter-spacing: 0.5px;
    margin-bottom: 20px;
  }

  .upload-card h1 {
    font-size: 32px;
    font-weight: 900;
    letter-spacing: -1px;
    margin-bottom: 12px;
  }

  .upload-sub {
    font-size: 14px;
    color: #64748b;
    line-height: 1.7;
    margin-bottom: 28px;
  }

  .dropzone {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 18px 20px;
    background: #0f172a;
    border: 2px dashed #334155;
    border-radius: 12px;
    cursor: pointer;
    margin-bottom: 20px;
    transition: all 0.2s;
    text-align: left;

    input { display: none; }

    &:hover {
      border-color: #6366f1;
      background: rgba(99,102,241,0.05);
    }
  }

  .dz-icon { font-size: 26px; flex-shrink: 0; }

  .dz-text {
    display: flex;
    flex-direction: column;
    gap: 3px;

    strong { font-size: 14px; color: #f1f5f9; font-weight: 600; }
    span { font-size: 12px; color: #64748b; }
  }

  .primary-btn {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    font-size: 15px;
    font-weight: 700;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 50px;
    box-shadow: 0 0 24px rgba(99,102,241,0.4);
    transition: all 0.2s;

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 0 36px rgba(99,102,241,0.6);
    }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
  }

  .btn-loader { transform: scale(0.5); }

  /* ── Question ── */
  .question-page {
    max-width: 1280px;
    margin: 0 auto;
    padding: 28px 24px 40px;
  }

  .q-topbar, .fb-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
  }

  .q-badge {
    padding: 6px 14px;
    background: rgba(99,102,241,0.15);
    border: 1px solid rgba(99,102,241,0.25);
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    color: #a5b4fc;
  }

  .q-stack {
    padding: 5px 12px;
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 700;
    color: #64748b;
    letter-spacing: 0.5px;
  }

  .q-split {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 24px;
    align-items: start;

    @media (max-width: 900px) {
      grid-template-columns: 1fr;
    }
  }

  .q-left {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .question-card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 16px;
    padding: 24px 28px;
  }

  .q-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.5px;
    color: #6366f1;
    margin-bottom: 10px;
  }

  .q-text {
    font-size: 19px;
    font-weight: 600;
    color: #f1f5f9;
    line-height: 1.55;
    letter-spacing: -0.3px;
  }

  .transcript-card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 16px;
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .tc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .tc-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.5px;
    color: #64748b;
  }

  .copy-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) { border-color: #6366f1; color: #f1f5f9; }
    &:disabled { opacity: 0.4; cursor: not-allowed; }
  }

  .tc-area {
    width: 100%;
    min-height: 140px;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 10px;
    padding: 14px 16px;
    font-size: 15px;
    color: #f1f5f9;
    font-family: inherit;
    resize: vertical;
    outline: none;
    line-height: 1.65;
    transition: border-color 0.2s;

    &::placeholder { color: #475569; }
    &:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
    &:disabled { opacity: 0.6; }
  }

  .controls-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .rec-btn {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 11px 22px;
    background: #10b981;
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    min-width: 160px;
    justify-content: center;

    &:hover:not(:disabled) { background: #059669; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }

  .rec-btn.recording {
    background: #ef4444;
    animation: pulse 1.4s infinite;

    &:hover { background: #dc2626; }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.75; }
  }

  .clear-btn {
    padding: 11px 18px;
    background: transparent;
    border: 1px solid #334155;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    color: #94a3b8;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) { border-color: #94a3b8; color: #f1f5f9; }
    &:disabled { opacity: 0.4; cursor: not-allowed; }
  }

  .submit-btn {
    margin-left: auto;
    padding: 11px 24px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 0 18px rgba(99,102,241,0.35);
    transition: all 0.2s;

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 0 28px rgba(99,102,241,0.55);
    }
    &:disabled { opacity: 0.45; cursor: not-allowed; }
  }

  /* Right column */
  .q-right {
    display: flex;
    flex-direction: column;
    gap: 14px;
    position: sticky;
    top: 80px;
  }

  .cam-card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 16px;
    overflow: hidden;
  }

  .webcam {
    width: 100%;
    display: block;
  }

  .cam-footer {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    font-size: 12px;
    color: #64748b;
    font-weight: 500;
  }

  .rec-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #334155;
    flex-shrink: 0;

    &.live {
      background: #ef4444;
      box-shadow: 0 0 6px #ef4444;
      animation: pulse 1.2s infinite;
    }
  }

  .caution-card {
    background: rgba(245,158,11,0.08);
    border: 1px solid rgba(245,158,11,0.2);
    border-radius: 12px;
    padding: 14px 16px;
    font-size: 12px;
    color: #fbbf24;
    line-height: 1.6;
  }

  /* ── Feedback ── */
  .feedback-page {
    max-width: 1280px;
    margin: 0 auto;
    padding: 28px 24px 60px;
  }

  .fb-split {
    display: grid;
    grid-template-columns: 1fr 1.2fr;
    gap: 24px;
    margin-bottom: 24px;

    @media (max-width: 900px) {
      grid-template-columns: 1fr;
    }
  }

  .answer-panel {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 16px;
    padding: 28px;
    min-height: 400px;
  }

  .panel-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.5px;
    color: #64748b;
    margin-bottom: 14px;
  }

  .answer-text {
    font-size: 15px;
    color: #94a3b8;
    line-height: 1.75;
  }

  .feedback-panel {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 16px;
    padding: 28px;
    min-height: 400px;
  }

  .fb-loader {
    width: 100%;
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .score-row {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 28px;
    padding-bottom: 24px;
    border-bottom: 1px solid #334155;
  }

  .score-block {
    display: flex;
    align-items: baseline;
    gap: 4px;
    flex-shrink: 0;
  }

  .score-num {
    font-size: 64px;
    font-weight: 900;
    line-height: 1;
  }

  .score-denom {
    font-size: 22px;
    font-weight: 700;
    color: #475569;
  }

  .score-bar-wrap {
    flex: 1;
    height: 6px;
    background: #334155;
    border-radius: 3px;
    overflow: hidden;
  }

  .score-bar {
    height: 100%;
    border-radius: 3px;
    transition: width 0.6s ease;
  }

  .fb-section {
    margin-bottom: 22px;
  }

  .fb-section-title {
    font-size: 13px;
    font-weight: 700;
    margin-bottom: 10px;
  }

  .strengths-title { color: #10b981; }
  .improve-title { color: #f59e0b; }

  .fb-list {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;

    li {
      font-size: 14px;
      color: #94a3b8;
      line-height: 1.6;
      padding: 10px 14px;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 8px;
    }
  }

  .fb-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 14px;
  }

  .next-btn {
    padding: 13px 28px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 0 20px rgba(99,102,241,0.35);
    transition: all 0.2s;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 0 32px rgba(99,102,241,0.55);
    }
  }
`;
