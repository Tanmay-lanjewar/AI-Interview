import React, { useState } from 'react';
import styled from 'styled-components';

export const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <DIV>
      <div className="hero">
        <p className="section-label">CONTACT</p>
        <h1>Get in Touch</h1>
        <p className="hero-sub">Have feedback, a bug report, or a feature idea? We read every message.</p>
      </div>

      <div className="layout">
        <div className="info-col">
          {[
            { icon: '📬', title: 'Email Us', body: 'support@codegenius.dev' },
            { icon: '⏱', title: 'Response Time', body: 'We typically reply within 24 hours on business days.' },
            { icon: '🐛', title: 'Bug Reports', body: 'Found something broken? Describe what happened and we\'ll fix it fast.' },
            { icon: '💡', title: 'Feature Requests', body: 'Have an idea for a new track or feature? We\'d love to hear it.' },
          ].map((item) => (
            <div className="info-card" key={item.title}>
              <span className="info-icon">{item.icon}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="form-col">
          {submitted ? (
            <div className="success-state">
              <span className="success-icon">✅</span>
              <h2>Message Sent!</h2>
              <p>Thanks for reaching out. We'll get back to you shortly.</p>
              <button
                onClick={() => { setSubmitted(false); setForm({ name: '', email: '', message: '' }); }}
                className="reset-btn"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="contact-form">
              <h2>Send a Message</h2>

              <div className="field">
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                />
              </div>

              <div className="field">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div className="field">
                <label>Message</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Tell us what's on your mind…"
                  rows={5}
                  required
                />
              </div>

              <button type="submit" className="submit-btn">
                Send Message →
              </button>
            </form>
          )}
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
    max-width: 600px;
    margin: 0 auto;
    padding: 72px 24px 48px;
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
    margin-bottom: 16px;
  }

  .hero-sub {
    font-size: 16px;
    color: #64748b;
    line-height: 1.7;
  }

  .layout {
    display: grid;
    grid-template-columns: 1fr 1.6fr;
    gap: 28px;
    max-width: 1000px;
    margin: 0 auto;
    padding: 0 24px 80px;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }

  .info-col {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .info-card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 14px;
    padding: 18px 20px;
    display: flex;
    align-items: flex-start;
    gap: 14px;
    transition: border-color 0.2s;

    &:hover { border-color: #6366f1; }

    h3 {
      font-size: 14px;
      font-weight: 700;
      color: #f1f5f9;
      margin-bottom: 4px;
    }

    p {
      font-size: 13px;
      color: #64748b;
      line-height: 1.6;
    }
  }

  .info-icon {
    font-size: 20px;
    margin-top: 2px;
    flex-shrink: 0;
  }

  .form-col {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 20px;
    padding: 36px;
  }

  .contact-form h2 {
    font-size: 22px;
    font-weight: 800;
    color: #f1f5f9;
    margin-bottom: 28px;
    letter-spacing: -0.5px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 7px;
    margin-bottom: 20px;

    label {
      font-size: 13px;
      font-weight: 600;
      color: #94a3b8;
    }

    input, textarea {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 11px 14px;
      font-size: 14px;
      color: #f1f5f9;
      font-family: inherit;
      resize: vertical;
      outline: none;
      transition: border-color 0.2s;

      &::placeholder { color: #475569; }

      &:focus {
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
      }
    }
  }

  .submit-btn {
    width: 100%;
    padding: 13px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    font-size: 15px;
    font-weight: 700;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 0 30px rgba(99, 102, 241, 0.5);
    }
  }

  .success-state {
    text-align: center;
    padding: 40px 20px;

    h2 {
      font-size: 24px;
      font-weight: 800;
      color: #f1f5f9;
      margin: 16px 0 10px;
    }

    p {
      font-size: 15px;
      color: #64748b;
      margin-bottom: 28px;
    }
  }

  .success-icon {
    font-size: 44px;
  }

  .reset-btn {
    padding: 12px 24px;
    background: #1e293b;
    border: 1px solid #334155;
    color: #94a3b8;
    font-size: 14px;
    font-weight: 600;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: #6366f1;
      color: #f1f5f9;
    }
  }
`;
