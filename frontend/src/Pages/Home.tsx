import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

export const Home = () => {
  return (
    <DIV>
      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-badge">✦ AI-Powered Interview Practice</div>

        <h1 className="hero-title">
          Ace Your Next<br />
          <span className="gradient-text">Tech Interview</span>
        </h1>

        <p className="hero-sub">
          Upload your resume, answer questions out loud, and get instant
          AI feedback on every answer — all in your browser, completely free.
        </p>

        <div className="hero-actions">
          <Link to="/interviews" className="btn-primary">
            Start Practicing →
          </Link>
          <Link to="/about" className="btn-ghost">
            Learn More
          </Link>
        </div>

        <div className="hero-stats">
          <div className="stat">
            <span className="stat-num">3</span>
            <span className="stat-label">Tech Stacks</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-num">AI</span>
            <span className="stat-label">Generated Questions</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-num">Free</span>
            <span className="stat-label">Forever</span>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="how-section">
        <p className="section-label">HOW IT WORKS</p>
        <h2 className="section-title">Three steps to interview-ready</h2>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-num">01</div>
            <h3>Upload Resume</h3>
            <p>Upload your PDF resume. The AI reads your background and tailors every question to your experience.</p>
          </div>
          <div className="step-card">
            <div className="step-num">02</div>
            <h3>Answer Out Loud</h3>
            <p>Click record, speak your answer naturally. Groq Whisper transcribes it accurately in seconds.</p>
          </div>
          <div className="step-card">
            <div className="step-num">03</div>
            <h3>Get AI Feedback</h3>
            <p>Receive a score out of 10, specific strengths, and actionable improvements — instantly.</p>
          </div>
        </div>
      </section>

      {/* ── Tracks ── */}
      <section className="tracks-section">
        <p className="section-label">INTERVIEW TRACKS</p>
        <h2 className="section-title">Choose your stack</h2>

        <div className="tracks-grid">
          {[
            { name: 'MERN Stack', tag: 'Full Stack', emoji: '🌐', desc: 'MongoDB, Express, React & Node.js' },
            { name: 'Node.js', tag: 'Backend', emoji: '⚙️', desc: 'Server-side JavaScript & APIs' },
            { name: 'Java', tag: 'OOP / Enterprise', emoji: '☕', desc: 'Core Java, Spring & data structures' },
          ].map((t) => (
            <div className="track-card" key={t.name}>
              <span className="track-emoji">{t.emoji}</span>
              <span className="track-tag">{t.tag}</span>
              <h3>{t.name}</h3>
              <p>{t.desc}</p>
            </div>
          ))}
        </div>

        <Link to="/interviews" className="btn-primary center-btn">
          Browse All Tracks →
        </Link>
      </section>
    </DIV>
  );
};

const DIV = styled.div`
  background-color: #0f172a;
  color: #f1f5f9;

  /* ── Hero ── */
  .hero {
    max-width: 900px;
    margin: 0 auto;
    padding: 100px 24px 80px;
    text-align: center;
  }

  .hero-badge {
    display: inline-block;
    padding: 6px 16px;
    background: rgba(99, 102, 241, 0.15);
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: 100px;
    font-size: 13px;
    font-weight: 500;
    color: #a5b4fc;
    margin-bottom: 28px;
    letter-spacing: 0.3px;
  }

  .hero-title {
    font-size: 72px;
    font-weight: 900;
    line-height: 1.05;
    letter-spacing: -2px;
    margin-bottom: 24px;
    color: #f1f5f9;

    @media (max-width: 768px) {
      font-size: 42px;
      letter-spacing: -1px;
    }
  }

  .gradient-text {
    background: linear-gradient(135deg, #6366f1, #a78bfa, #38bdf8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .hero-sub {
    font-size: 18px;
    color: #94a3b8;
    line-height: 1.7;
    max-width: 560px;
    margin: 0 auto 40px;

    @media (max-width: 768px) {
      font-size: 16px;
    }
  }

  .hero-actions {
    display: flex;
    gap: 14px;
    justify-content: center;
    margin-bottom: 60px;
    flex-wrap: wrap;
  }

  .btn-primary {
    display: inline-flex;
    align-items: center;
    padding: 14px 28px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    font-size: 15px;
    font-weight: 600;
    border-radius: 10px;
    text-decoration: none;
    box-shadow: 0 0 30px rgba(99, 102, 241, 0.4);
    transition: all 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 0 40px rgba(99, 102, 241, 0.6);
    }
  }

  .btn-ghost {
    display: inline-flex;
    align-items: center;
    padding: 14px 28px;
    background: transparent;
    border: 1px solid #334155;
    color: #94a3b8;
    font-size: 15px;
    font-weight: 600;
    border-radius: 10px;
    text-decoration: none;
    transition: all 0.2s;

    &:hover {
      border-color: #6366f1;
      color: #f1f5f9;
    }
  }

  .hero-stats {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 32px;
    padding: 24px 32px;
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 16px;
    display: inline-flex;
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .stat-num {
    font-size: 22px;
    font-weight: 800;
    color: #a78bfa;
  }

  .stat-label {
    font-size: 12px;
    color: #64748b;
    font-weight: 500;
  }

  .stat-divider {
    width: 1px;
    height: 36px;
    background: #334155;
  }

  /* ── Sections ── */
  .how-section, .tracks-section {
    max-width: 1100px;
    margin: 0 auto;
    padding: 80px 24px;
    text-align: center;
  }

  .how-section {
    border-top: 1px solid #1e293b;
  }

  .tracks-section {
    border-top: 1px solid #1e293b;
    padding-bottom: 100px;
  }

  .section-label {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 2px;
    color: #6366f1;
    margin-bottom: 12px;
  }

  .section-title {
    font-size: 38px;
    font-weight: 800;
    letter-spacing: -1px;
    color: #f1f5f9;
    margin-bottom: 48px;
  }

  /* Steps */
  .steps-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }

  .step-card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 16px;
    padding: 32px;
    text-align: left;
    transition: border-color 0.2s;

    &:hover {
      border-color: #6366f1;
    }

    h3 {
      font-size: 18px;
      font-weight: 700;
      color: #f1f5f9;
      margin: 12px 0 8px;
    }

    p {
      font-size: 14px;
      color: #64748b;
      line-height: 1.7;
    }
  }

  .step-num {
    font-size: 13px;
    font-weight: 800;
    color: #6366f1;
    letter-spacing: 1px;
  }

  /* Tracks */
  .tracks-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin-bottom: 40px;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }

  .track-card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 16px;
    padding: 28px;
    text-align: left;
    transition: all 0.2s;

    &:hover {
      border-color: #8b5cf6;
      transform: translateY(-2px);
    }

    h3 {
      font-size: 20px;
      font-weight: 700;
      color: #f1f5f9;
      margin: 10px 0 6px;
    }

    p {
      font-size: 14px;
      color: #64748b;
    }
  }

  .track-emoji {
    font-size: 28px;
    display: block;
    margin-bottom: 10px;
  }

  .track-tag {
    display: inline-block;
    padding: 3px 10px;
    background: rgba(99, 102, 241, 0.15);
    border: 1px solid rgba(99, 102, 241, 0.25);
    border-radius: 100px;
    font-size: 11px;
    font-weight: 600;
    color: #a5b4fc;
    letter-spacing: 0.3px;
    margin-bottom: 10px;
  }

  .center-btn {
    margin: 0 auto;
  }
`;
