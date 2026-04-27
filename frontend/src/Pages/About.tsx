import React from 'react';
import styled from 'styled-components';

export const About = () => {
  return (
    <DIV>
      <div className="hero">
        <p className="section-label">ABOUT</p>
        <h1>Built to help you <span className="gradient-text">get hired</span></h1>
        <p className="hero-sub">
          CodeGenius is an AI-powered mock interview platform that simulates
          real technical interviews — personalised to your resume, evaluated
          in real time.
        </p>
      </div>

      <div className="content">
        <div className="cards-row">
          <div className="info-card">
            <span className="card-icon">🎯</span>
            <h3>What is CodeGenius?</h3>
            <p>
              A browser-based interview simulator that reads your resume, generates
              context-aware questions, records your spoken answers via Groq Whisper AI,
              and gives you structured feedback — all without any scheduling or waiting.
            </p>
          </div>

          <div className="info-card">
            <span className="card-icon">🧠</span>
            <h3>How the AI Works</h3>
            <p>
              Your resume is parsed and stored in a session. Google Gemini generates
              questions tailored to your background. Difficulty adapts automatically
              based on your scores — Easy → Medium → Hard as you improve.
            </p>
          </div>

          <div className="info-card">
            <span className="card-icon">🎤</span>
            <h3>Groq Whisper Transcription</h3>
            <p>
              Instead of the unreliable browser Speech API, we use Groq's hosted
              Whisper large-v3 model — highly accurate for technical vocabulary,
              accents, and fast speech.
            </p>
          </div>

          <div className="info-card">
            <span className="card-icon">📊</span>
            <h3>Structured Feedback</h3>
            <p>
              Every answer gets a score out of 10, a list of specific strengths,
              and actionable improvement areas — not a wall of plain text, but
              clear, structured, and honest feedback.
            </p>
          </div>
        </div>

        <div className="stack-section">
          <h2>Tech Stack</h2>
          <div className="stack-grid">
            {[
              { layer: 'Frontend', items: ['React 18', 'TypeScript', 'Styled Components'] },
              { layer: 'Backend', items: ['Node.js', 'Express.js', 'MongoDB'] },
              { layer: 'AI', items: ['Google Gemini 2.5 Flash', 'Groq Whisper large-v3'] },
            ].map((s) => (
              <div className="stack-card" key={s.layer}>
                <p className="stack-layer">{s.layer}</p>
                <ul>
                  {s.items.map((i) => <li key={i}>{i}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DIV>
  );
};

const DIV = styled.div`
  background-color: #0f172a;
  min-height: calc(100vh - 64px);
  color: #f1f5f9;

  .hero {
    max-width: 720px;
    margin: 0 auto;
    padding: 72px 24px 56px;
    text-align: center;
  }

  .section-label {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 2px;
    color: #6366f1;
    margin-bottom: 14px;
  }

  h1 {
    font-size: 52px;
    font-weight: 900;
    letter-spacing: -1.5px;
    line-height: 1.1;
    margin-bottom: 20px;
  }

  .gradient-text {
    background: linear-gradient(135deg, #6366f1, #a78bfa, #38bdf8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .hero-sub {
    font-size: 17px;
    color: #64748b;
    line-height: 1.7;
  }

  .content {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 24px 80px;
  }

  .cards-row {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    margin-bottom: 48px;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }

  .info-card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 16px;
    padding: 28px;
    transition: border-color 0.2s;

    &:hover { border-color: #6366f1; }

    h3 {
      font-size: 16px;
      font-weight: 700;
      color: #f1f5f9;
      margin: 10px 0 10px;
    }

    p {
      font-size: 14px;
      color: #64748b;
      line-height: 1.7;
    }
  }

  .card-icon {
    font-size: 26px;
  }

  .stack-section {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 16px;
    padding: 32px;

    h2 {
      font-size: 20px;
      font-weight: 700;
      color: #f1f5f9;
      margin-bottom: 24px;
    }
  }

  .stack-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }

  .stack-card {
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 10px;
    padding: 20px;

    ul {
      padding-left: 18px;
      margin-top: 10px;
    }

    li {
      font-size: 14px;
      color: #94a3b8;
      line-height: 1.8;
    }
  }

  .stack-layer {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.5px;
    color: #6366f1;
  }
`;
