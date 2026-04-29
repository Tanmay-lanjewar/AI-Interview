import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import Webcam from "react-webcam";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import { Loader } from "./Loader ";

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase = "upload" | "reading" | "recording" | "transcribing" | "evaluating" | "feedback" | "complete";
type Feedback = { score: number; strengths: string[]; improvements: string[] };
type HistoryEntry = { question: string; transcript: string; feedback: Feedback };

const API = "http://localhost:8081";
const READING_SEC = 30;
const RECORDING_SEC = 60;

// ─── Component ────────────────────────────────────────────────────────────────
export const Interview = () => {
  // session
  const [phase, setPhase] = useState<Phase>("upload");
  const [sessionId, setSessionId] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [questionCount, setQuestionCount] = useState(1);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [sessionHistory, setSessionHistory] = useState<HistoryEntry[]>([]);

  // timers
  const [readingTimer, setReadingTimer] = useState(READING_SEC);
  const [recordingTimer, setRecordingTimer] = useState(RECORDING_SEC);

  // ui
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // refs — stable across renders, safe to use inside callbacks
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const didSubmitRef = useRef(false); // guard against double evaluation
  const sessionIdRef = useRef("");
  const currentQuestionRef = useRef("");

  // keep refs in sync with state
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);
  useEffect(() => { currentQuestionRef.current = currentQuestion; }, [currentQuestion]);

  const [searchParams] = useSearchParams();
  const techStack = searchParams.get("techStack") || "";

  const scoreColor = (s: number) => s >= 8 ? "#10b981" : s >= 5 ? "#f59e0b" : "#ef4444";
  const avgScore = sessionHistory.length
    ? (sessionHistory.reduce((a, h) => a + h.feedback.score, 0) / sessionHistory.length).toFixed(1)
    : "—";

  // ── Reading countdown ──────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "reading") return;
    setReadingTimer(READING_SEC);
    didSubmitRef.current = false;

    const id = setInterval(() => {
      setReadingTimer((prev) => {
        if (prev <= 1) { clearInterval(id); return 0; }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [phase, currentQuestion]); // re-run when question changes so timer resets

  // when reading hits 0 → move to recording
  useEffect(() => {
    if (phase === "reading" && readingTimer === 0) {
      setPhase("recording");
    }
  }, [readingTimer, phase]);

  // ── Recording countdown ────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "recording") return;
    setRecordingTimer(RECORDING_SEC);
    startMediaRecorder();

    const id = setInterval(() => {
      setRecordingTimer((prev) => {
        if (prev <= 1) { clearInterval(id); return 0; }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // when recording hits 0 → wait 500ms for final audio chunk to flush, then stop
  useEffect(() => {
    if (phase === "recording" && recordingTimer === 0) {
      setTimeout(() => stopMediaRecorder(), 500);
    }
  }, [recordingTimer, phase]);

  // ── MediaRecorder ──────────────────────────────────────────────────────────
  const startMediaRecorder = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,   // standard rate Whisper expects
          channelCount: 1,     // mono is better for speech recognition
        },
      });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/mp4";

      const recorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000, // 128 kbps — cleaner audio for Whisper
      });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (!didSubmitRef.current) {
          didSubmitRef.current = true;
          const blob = new Blob(audioChunksRef.current, { type: mimeType });
          await transcribeOnly(blob, mimeType);
        }
      };

      recorder.start(250);
    } catch (err: any) {
      setError(
        err.name === "NotAllowedError"
          ? "Microphone access denied. Please allow mic access."
          : "Could not start recording. Check your microphone."
      );
      setPhase("reading");
    }
  };

  const stopMediaRecorder = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  // ── Transcribe audio, then auto-evaluate ──────────────────────────────────
  const transcribeOnly = async (blob: Blob, mimeType: string) => {
    setPhase("transcribing");
    setError("");
    try {
      const ext = mimeType.includes("mp4") ? "mp4" : "webm";
      const fd = new FormData();
      fd.append("audio", blob, `recording.${ext}`);
      fd.append("techStack", techStack);
      const tRes = await axios.post(`${API}/api/interview/transcribe`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000, // 30s — Groq is fast, if it takes longer something is wrong
      });
      const text: string = tRes.data.transcript || "";
      setTranscript(text);
      await evaluateAnswer(text);
    } catch (err: any) {
      setError("Transcription failed — skipping to next question.");
      await delay(2000);
      await loadNextQuestion();
    }
  };

  // ── Evaluate transcript via Gemini ─────────────────────────────────────────
  const evaluateAnswer = async (text: string) => {
    if (!text.trim()) {
      setError("No answer detected — skipping to next question.");
      await delay(2000);
      await loadNextQuestion();
      return;
    }
    setPhase("evaluating");
    setError("");
    try {
      const eRes = await axios.post(`${API}/api/interview/evaluate`, {
        sessionId: sessionIdRef.current,
        question: currentQuestionRef.current,
        answer: text,
      }, { timeout: 60000 }); // 60s — Gemini can be slow on first call
      const fb = eRes.data as Feedback;
      setFeedback(fb);
      setSessionHistory((prev) => [
        ...prev,
        { question: currentQuestionRef.current, transcript: text, feedback: fb },
      ]);
      setPhase("feedback");
    } catch (err: any) {
      setError(err.response?.data?.error || "Evaluation failed — skipping to next question.");
      await delay(2000);
      await loadNextQuestion();
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const loadNextQuestion = async () => {
    try {
      const res = await axios.post(`${API}/api/interview/next-question`, {
        sessionId: sessionIdRef.current,
      }, { timeout: 30000 });
      setCurrentQuestion(res.data.question);
      setFeedback(null);
      setTranscript("");
      setQuestionCount((p) => p + 1);
      setPhase("reading");
    } catch {
      // If we can't load the next question, end the session gracefully
      // so the user is never stuck on a spinner with no escape
      setPhase("complete");
    }
  };

  const handleEndInterview = () => {
    didSubmitRef.current = true;
    stopMediaRecorder();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setPhase("complete");
  };

  // ── Phase 0: Upload ────────────────────────────────────────────────────────
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
      setPhase("reading");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to start. Please try again.");
    } finally { setIsLoading(false); }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <DIV>

      {/* ══════════════════════════════════════
          PHASE: UPLOAD
      ══════════════════════════════════════ */}
      {phase === "upload" && (
        <div className="center-page">
          <div className="upload-card">
            <div className="upload-badge">{techStack.toUpperCase()} Interview</div>
            <h1>Ready to Practice?</h1>
            <p className="upload-sub">
              Upload your resume — the AI will generate personalised questions
              based on your experience.
            </p>

            <label className="dropzone" htmlFor="resume-upload">
              <span className="dz-icon">{resumeFile ? "✅" : "📄"}</span>
              <span className="dz-text">
                {resumeFile
                  ? <><strong>{resumeFile.name}</strong><small>Click to change</small></>
                  : <><strong>Click to upload Resume</strong><small>PDF files only</small></>}
              </span>
              <input id="resume-upload" type="file" accept="application/pdf"
                onChange={(e) => { setResumeFile(e.target.files?.[0] || null); setError(""); }} />
            </label>

            {error && <p className="error-pill">⚠ {error}</p>}

            <button className="primary-btn" onClick={handleStart} disabled={isLoading}>
              {isLoading ? <Loader /> : "Start Interview →"}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          PHASE: READING (30s)
      ══════════════════════════════════════ */}
      {phase === "reading" && (
        <div className="timer-page">
          <div className="phase-topbar">
            <span className="q-badge">Question {questionCount}</span>
            <button className="end-btn" onClick={handleEndInterview}>End Interview</button>
          </div>

          <div className="reading-body">
            <p className="phase-label">📖 READ THE QUESTION</p>
            <p className="big-question">{currentQuestion}</p>

            <div className="timer-ring-wrap">
              <svg className="timer-ring" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" className="ring-bg" />
                <circle
                  cx="60" cy="60" r="52"
                  className="ring-progress reading-ring"
                  style={{
                    strokeDashoffset: 2 * Math.PI * 52 * (1 - readingTimer / READING_SEC),
                  }}
                />
              </svg>
              <span className="timer-num">{readingTimer}</span>
            </div>

            <p className="timer-hint">
              Recording starts automatically when the timer ends
            </p>

            <div className="progress-bar-wrap">
              <div
                className="progress-bar reading-bar"
                style={{ width: `${(readingTimer / READING_SEC) * 100}%` }}
              />
            </div>

            <button className="continue-btn" onClick={() => setPhase("recording")}>
              I've Read It — Start Recording Now →
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          PHASE: RECORDING (60s)
      ══════════════════════════════════════ */}
      {phase === "recording" && (
        <div className="timer-page">
          <div className="phase-topbar">
            <span className="q-badge">Question {questionCount}</span>
            <div className="rec-live-badge">
              <span className="rec-dot" /> REC
            </div>
            <button className="end-btn" onClick={handleEndInterview}>End Interview</button>
          </div>

          <div className="recording-body">
            <div className="recording-split">
              {/* Left: question + timer */}
              <div className="rec-left">
                <div className="rec-question-card">
                  <p className="phase-label">🎤 YOUR QUESTION</p>
                  <p className="rec-question-text">{currentQuestion}</p>
                </div>

                <div className="timer-ring-wrap">
                  <svg className="timer-ring" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" className="ring-bg" />
                    <circle
                      cx="60" cy="60" r="52"
                      className="ring-progress rec-ring"
                      style={{
                        strokeDashoffset: 2 * Math.PI * 52 * (1 - recordingTimer / RECORDING_SEC),
                      }}
                    />
                  </svg>
                  <span className="timer-num">{recordingTimer}</span>
                </div>

                <p className="timer-hint">Speak your answer clearly — auto-submits when timer ends</p>

                <div className="progress-bar-wrap">
                  <div
                    className="progress-bar rec-bar"
                    style={{ width: `${(recordingTimer / RECORDING_SEC) * 100}%` }}
                  />
                </div>

                <button className="done-btn" onClick={stopMediaRecorder}>
                  ✓ Done Answering — Submit Now
                </button>
              </div>

              {/* Right: webcam */}
              <div className="rec-right">
                <div className="cam-card">
                  <Webcam className="webcam" />
                  <div className="cam-footer">
                    <span className="rec-dot" /> Recording…
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          PHASE: TRANSCRIBING
      ══════════════════════════════════════ */}
      {phase === "transcribing" && (
        <div className="center-page">
          <div className="eval-card">
            <Loader />
            <p className="eval-text">Transcribing your audio…</p>
            <p className="eval-sub">Groq Whisper is processing your recording</p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          PHASE: EVALUATING
      ══════════════════════════════════════ */}
      {phase === "evaluating" && (
        <div className="center-page">
          <div className="eval-card">
            <Loader />
            <p className="eval-text">Evaluating your answer…</p>
            <p className="eval-sub">Gemini is analysing your response</p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          PHASE: FEEDBACK
      ══════════════════════════════════════ */}
      {phase === "feedback" && feedback && (
        <div className="feedback-page">
          <div className="phase-topbar">
            <span className="q-badge">Question {questionCount} — Result</span>
            <button className="end-btn" onClick={handleEndInterview}>End Interview</button>
          </div>

          <div className="fb-split">
            {/* Left: answer */}
            <div className="answer-panel">
              <p className="panel-label">YOUR ANSWER</p>
              <p className="answer-text">{transcript || "—"}</p>
            </div>

            {/* Right: feedback */}
            <div className="feedback-panel">
              {/* Score */}
              <div className="score-row">
                <div className="score-block">
                  <span className="score-num" style={{ color: scoreColor(feedback.score) }}>
                    {feedback.score}
                  </span>
                  <span className="score-denom">/10</span>
                </div>
                <div className="score-bar-track">
                  <div className="score-bar-fill"
                    style={{ width: `${feedback.score * 10}%`, background: scoreColor(feedback.score) }} />
                </div>
              </div>

              {/* Strengths */}
              <div className="fb-section">
                <p className="fb-title strengths-title">✅ Strengths</p>
                <ul className="fb-list">
                  {feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>

              {/* Improvements */}
              <div className="fb-section">
                <p className="fb-title improve-title">🔧 Areas to Improve</p>
                <ul className="fb-list">
                  {feedback.improvements.map((imp, i) => <li key={i}>{imp}</li>)}
                </ul>
              </div>
            </div>
          </div>

          {error && <p className="error-pill">⚠ {error}</p>}

          <div className="fb-actions">
            <button className="next-btn" onClick={loadNextQuestion}>
              Next Question →
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          PHASE: COMPLETE
      ══════════════════════════════════════ */}
      {phase === "complete" && (
        <div className="complete-page">
          <div className="complete-header">
            <span className="complete-icon">🎉</span>
            <h1>Interview Complete</h1>
            <p className="complete-sub">Here's how you performed across all questions</p>

            <div className="complete-stats">
              <div className="stat-box">
                <span className="stat-val">{sessionHistory.length}</span>
                <span className="stat-lbl">Questions Answered</span>
              </div>
              <div className="stat-box">
                <span className="stat-val" style={{ color: scoreColor(Number(avgScore)) }}>
                  {avgScore}<span style={{ fontSize: 18, color: "#475569" }}>/10</span>
                </span>
                <span className="stat-lbl">Average Score</span>
              </div>
            </div>
          </div>

          {sessionHistory.length > 0 && (
            <div className="history-list">
              {sessionHistory.map((entry, i) => (
                <div className="history-card" key={i}>
                  <div className="history-card-top">
                    <span className="history-q-num">Q{i + 1}</span>
                    <span
                      className="history-score"
                      style={{ color: scoreColor(entry.feedback.score) }}
                    >
                      {entry.feedback.score}/10
                    </span>
                  </div>
                  <p className="history-question">{entry.question}</p>
                  <p className="history-answer">{entry.transcript}</p>
                  <div className="history-fb">
                    <div>
                      <p className="history-fb-title strengths-title">✅ Strengths</p>
                      <ul>{entry.feedback.strengths.map((s, j) => <li key={j}>{s}</li>)}</ul>
                    </div>
                    <div>
                      <p className="history-fb-title improve-title">🔧 Improvements</p>
                      <ul>{entry.feedback.improvements.map((s, j) => <li key={j}>{s}</li>)}</ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="complete-actions">
            <button className="primary-btn" onClick={() => window.location.reload()}>
              Start New Interview
            </button>
          </div>
        </div>
      )}
    </DIV>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const DIV = styled.div`
  background: #0f172a;
  min-height: calc(100vh - 64px);
  color: #f1f5f9;

  /* ── Shared ── */
  .center-page {
    display: flex; align-items: center; justify-content: center;
    min-height: calc(100vh - 64px); padding: 40px 24px;
  }

  .phase-topbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 28px; border-bottom: 1px solid #1e293b;
  }

  .q-badge {
    padding: 6px 14px; background: rgba(99,102,241,0.15);
    border: 1px solid rgba(99,102,241,0.25); border-radius: 8px;
    font-size: 13px; font-weight: 600; color: #a5b4fc;
  }

  .end-btn {
    padding: 7px 16px; background: transparent;
    border: 1px solid #ef4444; border-radius: 8px;
    font-size: 13px; font-weight: 600; color: #ef4444;
    cursor: pointer; transition: all 0.2s;
    &:hover { background: rgba(239,68,68,0.1); }
  }

  .error-pill {
    display: inline-block; padding: 8px 14px;
    background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3);
    border-radius: 8px; font-size: 13px; color: #fca5a5; margin: 12px 0;
  }

  .phase-label {
    font-size: 11px; font-weight: 700; letter-spacing: 2px; color: #6366f1; margin-bottom: 16px;
  }

  /* ── Timer ring ── */
  .timer-ring-wrap {
    position: relative; width: 140px; height: 140px;
    display: flex; align-items: center; justify-content: center;
    margin: 28px auto;
  }

  .timer-ring {
    position: absolute; top: 0; left: 0; width: 140px; height: 140px;
    transform: rotate(-90deg);
  }

  .ring-bg { fill: none; stroke: #1e293b; stroke-width: 8; }

  .ring-progress {
    fill: none; stroke-width: 8; stroke-linecap: round;
    stroke-dasharray: ${2 * Math.PI * 52};
    transition: stroke-dashoffset 1s linear;
  }

  .reading-ring { stroke: #6366f1; }
  .rec-ring     { stroke: #ef4444; }

  .timer-num {
    position: relative; font-size: 48px; font-weight: 900;
    color: #f1f5f9; line-height: 1; z-index: 1;
  }

  .timer-hint {
    text-align: center; font-size: 13px; color: #64748b;
    max-width: 320px; margin: 0 auto 20px; line-height: 1.6;
  }

  .progress-bar-wrap {
    height: 4px; background: #1e293b; border-radius: 2px;
    overflow: hidden; max-width: 400px; margin: 0 auto;
  }

  .progress-bar { height: 100%; border-radius: 2px; transition: width 1s linear; }
  .reading-bar  { background: #6366f1; }
  .rec-bar      { background: #ef4444; }

  /* ── Upload ── */
  .upload-card {
    background: #1e293b; border: 1px solid #334155; border-radius: 24px;
    padding: 48px 52px; max-width: 500px; width: 100%; text-align: center;
    box-shadow: 0 25px 60px rgba(0,0,0,0.4);
  }

  .upload-badge {
    display: inline-block; padding: 5px 14px;
    background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3);
    border-radius: 100px; font-size: 12px; font-weight: 700;
    color: #a5b4fc; letter-spacing: 0.5px; margin-bottom: 20px;
  }

  .upload-card h1 {
    font-size: 32px; font-weight: 900; letter-spacing: -1px; margin-bottom: 12px;
  }

  .upload-sub {
    font-size: 14px; color: #64748b; line-height: 1.7; margin-bottom: 28px;
  }

  .dropzone {
    display: flex; align-items: center; gap: 14px;
    padding: 18px 20px; background: #0f172a;
    border: 2px dashed #334155; border-radius: 12px;
    cursor: pointer; margin-bottom: 20px; transition: all 0.2s;
    input { display: none; }
    &:hover { border-color: #6366f1; background: rgba(99,102,241,0.05); }
  }

  .dz-icon { font-size: 26px; flex-shrink: 0; }

  .dz-text {
    display: flex; flex-direction: column; gap: 3px; text-align: left;
    strong { font-size: 14px; color: #f1f5f9; font-weight: 600; }
    small  { font-size: 12px; color: #64748b; }
  }

  .primary-btn {
    width: 100%; padding: 14px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white; font-size: 15px; font-weight: 700;
    border: none; border-radius: 12px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    min-height: 50px; box-shadow: 0 0 24px rgba(99,102,241,0.4);
    transition: all 0.2s;
    &:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 0 36px rgba(99,102,241,0.6); }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
  }

  /* ── Reading ── */
  .timer-page { min-height: calc(100vh - 64px); display: flex; flex-direction: column; }

  .reading-body {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 40px 24px; text-align: center;
  }

  .big-question {
    font-size: 32px; font-weight: 700; letter-spacing: -0.5px;
    line-height: 1.45; color: #f1f5f9;
    max-width: 800px; margin: 0 auto 8px;
  }

  /* ── Recording ── */
  .rec-live-badge {
    display: flex; align-items: center; gap: 7px;
    padding: 5px 14px; background: rgba(239,68,68,0.12);
    border: 1px solid rgba(239,68,68,0.3); border-radius: 8px;
    font-size: 13px; font-weight: 700; color: #f87171;
    animation: pulse 1.4s infinite;
  }

  .rec-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #ef4444; flex-shrink: 0;
    box-shadow: 0 0 6px #ef4444;
    animation: pulse 1.2s infinite;
  }

  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.55; } }

  .recording-body { flex: 1; padding: 28px 28px 40px; }

  .recording-split {
    display: grid; grid-template-columns: 1fr 300px; gap: 24px;
    max-width: 1100px; margin: 0 auto;
    @media (max-width: 900px) { grid-template-columns: 1fr; }
  }

  .rec-left {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
  }

  .rec-question-card {
    background: #1e293b; border: 1px solid #334155; border-radius: 16px;
    padding: 24px 28px; width: 100%; margin-bottom: 8px;
  }

  .rec-question-text {
    font-size: 20px; font-weight: 600; color: #f1f5f9; line-height: 1.55;
  }

  .rec-right { display: flex; flex-direction: column; gap: 14px; }

  .cam-card {
    background: #1e293b; border: 1px solid #334155;
    border-radius: 16px; overflow: hidden;
  }

  .webcam { width: 100%; display: block; }

  .cam-footer {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 16px; font-size: 12px; color: #64748b; font-weight: 500;
  }

  /* ── Evaluating ── */
  .eval-card {
    text-align: center; display: flex; flex-direction: column;
    align-items: center; gap: 16px;
  }

  .eval-text {
    font-size: 22px; font-weight: 700; color: #f1f5f9;
  }

  .eval-sub { font-size: 14px; color: #64748b; }

  /* ── Feedback ── */
  .feedback-page { max-width: 1280px; margin: 0 auto; padding-bottom: 60px; }

  .fb-split {
    display: grid; grid-template-columns: 1fr 1.2fr; gap: 24px;
    padding: 24px 28px; margin-bottom: 8px;
    @media (max-width: 900px) { grid-template-columns: 1fr; }
  }

  .answer-panel {
    background: #1e293b; border: 1px solid #334155;
    border-radius: 16px; padding: 28px; min-height: 380px;
  }

  .panel-label {
    font-size: 11px; font-weight: 700; letter-spacing: 1.5px;
    color: #64748b; margin-bottom: 14px;
  }

  .answer-text { font-size: 15px; color: #94a3b8; line-height: 1.75; }

  .feedback-panel {
    background: #1e293b; border: 1px solid #334155;
    border-radius: 16px; padding: 28px; min-height: 380px;
  }

  .score-row {
    display: flex; align-items: center; gap: 20px;
    margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #334155;
  }

  .score-block { display: flex; align-items: baseline; gap: 4px; flex-shrink: 0; }
  .score-num   { font-size: 60px; font-weight: 900; line-height: 1; }
  .score-denom { font-size: 22px; font-weight: 700; color: #475569; }

  .score-bar-track {
    flex: 1; height: 6px; background: #334155; border-radius: 3px; overflow: hidden;
  }

  .score-bar-fill { height: 100%; border-radius: 3px; transition: width 0.6s ease; }

  .fb-section { margin-bottom: 20px; }

  .fb-title     { font-size: 13px; font-weight: 700; margin-bottom: 10px; }
  .strengths-title { color: #10b981; }
  .improve-title   { color: #f59e0b; }

  .fb-list {
    list-style: none; padding: 0; display: flex; flex-direction: column; gap: 8px;
    li {
      font-size: 14px; color: #94a3b8; line-height: 1.6;
      padding: 10px 14px; background: #0f172a;
      border: 1px solid #334155; border-radius: 8px;
    }
  }

  .fb-actions {
    display: flex; justify-content: flex-end;
    padding: 0 28px;
  }

  .next-btn {
    padding: 13px 28px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white; border: none; border-radius: 10px;
    font-size: 15px; font-weight: 700; cursor: pointer;
    box-shadow: 0 0 20px rgba(99,102,241,0.35); transition: all 0.2s;
    &:hover { transform: translateY(-1px); box-shadow: 0 0 32px rgba(99,102,241,0.55); }
  }

  /* ── Complete ── */
  .complete-page {
    max-width: 900px; margin: 0 auto; padding: 48px 24px 80px;
  }

  .complete-header { text-align: center; margin-bottom: 48px; }

  .complete-icon { font-size: 56px; display: block; margin-bottom: 16px; }

  .complete-header h1 {
    font-size: 46px; font-weight: 900; letter-spacing: -1.5px; margin-bottom: 10px;
  }

  .complete-sub { font-size: 16px; color: #64748b; margin-bottom: 32px; }

  .complete-stats {
    display: flex; gap: 24px; justify-content: center; flex-wrap: wrap;
  }

  .stat-box {
    background: #1e293b; border: 1px solid #334155; border-radius: 16px;
    padding: 24px 40px; text-align: center;
    display: flex; flex-direction: column; gap: 6px;
  }

  .stat-val  { font-size: 48px; font-weight: 900; line-height: 1; color: #f1f5f9; }
  .stat-lbl  { font-size: 13px; color: #64748b; font-weight: 500; }

  .history-list { display: flex; flex-direction: column; gap: 20px; margin-bottom: 40px; }

  .history-card {
    background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 24px 28px;
  }

  .history-card-top {
    display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;
  }

  .history-q-num {
    font-size: 12px; font-weight: 700; letter-spacing: 1px; color: #6366f1;
  }

  .history-score { font-size: 22px; font-weight: 900; }

  .history-question {
    font-size: 16px; font-weight: 600; color: #f1f5f9;
    margin-bottom: 10px; line-height: 1.5;
  }

  .history-answer {
    font-size: 14px; color: #64748b; line-height: 1.65;
    margin-bottom: 16px; padding: 12px 16px;
    background: #0f172a; border-radius: 8px; border: 1px solid #334155;
  }

  .history-fb {
    display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
    @media (max-width: 600px) { grid-template-columns: 1fr; }

    ul { padding-left: 18px; margin-top: 8px; }
    li { font-size: 13px; color: #94a3b8; line-height: 1.7; margin-bottom: 4px; }
  }

  .history-fb-title { font-size: 12px; font-weight: 700; margin-bottom: 6px; }

  .complete-actions { display: flex; justify-content: center; }


  /* ── Continue / Done buttons ── */
  .continue-btn {
    margin-top: 28px;
    padding: 13px 32px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white; border: none; border-radius: 12px;
    font-size: 15px; font-weight: 700; cursor: pointer;
    box-shadow: 0 0 24px rgba(99,102,241,0.4);
    transition: all 0.2s;
    &:hover { transform: translateY(-2px); box-shadow: 0 0 36px rgba(99,102,241,0.6); }
  }

  .done-btn {
    margin-top: 20px;
    padding: 13px 32px;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white; border: none; border-radius: 12px;
    font-size: 15px; font-weight: 700; cursor: pointer;
    box-shadow: 0 0 24px rgba(16,185,129,0.4);
    transition: all 0.2s;
    &:hover { transform: translateY(-2px); box-shadow: 0 0 36px rgba(16,185,129,0.6); }
  }
`;
