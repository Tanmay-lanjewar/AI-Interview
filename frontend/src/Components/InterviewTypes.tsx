import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const tracks = [
  {
    emoji: '🌐',
    name: 'MERN Stack',
    tag: 'Full Stack',
    techStack: 'mern',
    color: '#6366f1',
    desc: 'Full-stack JavaScript development using MongoDB, Express.js, React, and Node.js. Covers both frontend and backend concepts, REST APIs, and database design.',
    topics: ['MongoDB', 'Express.js', 'React', 'Node.js'],
  },
  {
    emoji: '⚙️',
    name: 'Node.js',
    tag: 'Backend',
    techStack: 'node',
    color: '#10b981',
    desc: 'Server-side JavaScript with Node.js. Covers event-driven architecture, async programming, REST APIs, streams, and building scalable backend services.',
    topics: ['Event Loop', 'Async/Await', 'REST APIs', 'Streams'],
  },
  {
    emoji: '☕',
    name: 'Java',
    tag: 'OOP / Enterprise',
    techStack: 'java',
    color: '#f59e0b',
    desc: 'Core Java concepts, object-oriented programming, data structures, and algorithms. Covers Spring framework, collections, concurrency, and enterprise patterns.',
    topics: ['OOP', 'Spring', 'Collections', 'Concurrency'],
  },
];

export const InterviewTypes = () => {
  return (
    <DIV>
      <div className="page-header">
        <p className="section-label">INTERVIEW TRACKS</p>
        <h1 className="page-title">Choose Your Interview Track</h1>
        <p className="page-sub">
          AI-generated questions tailored to your resume. Speak your answers and
          get scored feedback instantly.
        </p>
      </div>

      <div className="cards-grid">
        {tracks.map((track) => (
          <div className="track-card" key={track.techStack} style={{ '--accent': track.color } as React.CSSProperties}>
            <div className="card-header">
              <span className="track-emoji">{track.emoji}</span>
              <span className="track-tag">{track.tag}</span>
            </div>

            <h2 className="track-name">{track.name}</h2>
            <p className="track-desc">{track.desc}</p>

            <div className="topic-chips">
              {track.topics.map((t) => (
                <span className="chip" key={t}>{t}</span>
              ))}
            </div>

            <Link
              to={`/interview/mern?techStack=${track.techStack}`}
              className="start-btn"
            >
              Start Interview →
            </Link>
          </div>
        ))}
      </div>
    </DIV>
  );
};

const DIV = styled.div`
  background-color: #0f172a;
  min-height: calc(100vh - 64px);
  padding-bottom: 80px;

  .page-header {
    max-width: 700px;
    margin: 0 auto;
    padding: 64px 24px 48px;
    text-align: center;
  }

  .section-label {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 2px;
    color: #6366f1;
    margin-bottom: 12px;
  }

  .page-title {
    font-size: 46px;
    font-weight: 900;
    letter-spacing: -1.5px;
    color: #f1f5f9;
    margin-bottom: 16px;
  }

  .page-sub {
    font-size: 16px;
    color: #64748b;
    line-height: 1.7;
  }

  .cards-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 24px;

    @media (max-width: 900px) {
      grid-template-columns: 1fr;
      max-width: 520px;
    }
  }

  .track-card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 20px;
    padding: 32px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    transition: all 0.25s;
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      background: var(--accent);
      opacity: 0;
      transition: opacity 0.25s;
    }

    &:hover {
      border-color: var(--accent);
      transform: translateY(-4px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);

      &::before { opacity: 1; }
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .track-emoji {
    font-size: 32px;
  }

  .track-tag {
    padding: 4px 12px;
    background: rgba(99, 102, 241, 0.12);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 100px;
    font-size: 11px;
    font-weight: 600;
    color: #a5b4fc;
    letter-spacing: 0.3px;
  }

  .track-name {
    font-size: 26px;
    font-weight: 800;
    color: #f1f5f9;
    letter-spacing: -0.5px;
  }

  .track-desc {
    font-size: 14px;
    color: #64748b;
    line-height: 1.7;
    flex: 1;
  }

  .topic-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .chip {
    padding: 4px 10px;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    color: #94a3b8;
  }

  .start-btn {
    display: block;
    text-align: center;
    padding: 13px 20px;
    background: var(--accent);
    color: white;
    font-size: 14px;
    font-weight: 700;
    border-radius: 10px;
    text-decoration: none;
    margin-top: 8px;
    transition: all 0.2s;
    opacity: 0.9;

    &:hover {
      opacity: 1;
      transform: translateY(-1px);
    }
  }
`;
