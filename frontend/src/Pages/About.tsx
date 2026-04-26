import React from "react";
import styled from "styled-components";

export const About = () => {
  return (
    <DIV>
      <section className="hero">
        <h1>About CodeGenius</h1>
        <p className="tagline">
          AI-powered mock interviews to help you land your dream tech role.
        </p>
      </section>

      <section className="content">
        <div className="card">
          <h2>What is CodeGenius?</h2>
          <p>
            CodeGenius is an AI-powered interview preparation platform designed
            for software developers. It simulates real technical interviews by
            presenting questions, capturing your spoken answers via speech
            recognition, and providing instant AI-generated feedback — all from
            your browser.
          </p>
        </div>

        <div className="card">
          <h2>How It Works</h2>
          <ol>
            <li>Choose a tech stack — MERN, Node.js, or Java.</li>
            <li>Answer each interview question out loud using your microphone.</li>
            <li>Submit your answer and receive AI feedback on your response.</li>
            <li>Navigate through questions at your own pace.</li>
          </ol>
        </div>

        <div className="card">
          <h2>Why CodeGenius?</h2>
          <ul>
            <li>Practice in a realistic, low-pressure environment.</li>
            <li>Get instant, objective feedback on your answers.</li>
            <li>Improve communication and subject matter expertise together.</li>
            <li>Available anytime — no scheduling, no waiting.</li>
          </ul>
        </div>

        <div className="card">
          <h2>Tech Stack</h2>
          <p>
            Built with React, TypeScript, Node.js, Express, MongoDB, and Google
            Gemini AI. Speech recognition is powered by the Web Speech API.
          </p>
        </div>
      </section>
    </DIV>
  );
};

const DIV = styled.div`
  .hero {
    background-color: #0a2640;
    color: white;
    padding: 80px 40px;
    text-align: center;

    h1 {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .tagline {
      font-size: 20px;
      color: #5cdb94;
    }
  }

  .content {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 30px;
    padding: 60px 80px;
    max-width: 1100px;
    margin: auto;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      padding: 30px 20px;
    }
  }

  .card {
    background: white;
    border-radius: 8px;
    padding: 30px;
    box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 12px;
    text-align: left;

    h2 {
      color: #05396b;
      margin-bottom: 12px;
    }

    p,
    li {
      color: #444;
      line-height: 1.7;
    }

    ol,
    ul {
      padding-left: 20px;
    }

    li {
      margin-bottom: 8px;
    }
  }
`;
