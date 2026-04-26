import React, { useState } from "react";
import styled from "styled-components";

export const Contact = () => {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <DIV>
      <section className="hero">
        <h1>Contact Us</h1>
        <p>Have a question or feedback? We'd love to hear from you.</p>
      </section>

      <div className="contact-wrapper">
        <div className="info-cards">
          <div className="info-card">
            <h3>Email</h3>
            <p>support@codegenius.dev</p>
          </div>
          <div className="info-card">
            <h3>Response Time</h3>
            <p>We typically respond within 24 hours on business days.</p>
          </div>
          <div className="info-card">
            <h3>Feedback</h3>
            <p>
              Found a bug or have a feature request? Let us know — we read every
              message.
            </p>
          </div>
        </div>

        <div className="form-container">
          {submitted ? (
            <div className="success">
              <h2>Message Sent!</h2>
              <p>
                Thanks for reaching out. We'll get back to you as soon as
                possible.
              </p>
              <button onClick={() => { setSubmitted(false); setForm({ name: "", email: "", message: "" }); }}>
                Send Another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h2>Send a Message</h2>
              <label>
                Name
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  required
                />
              </label>
              <label>
                Message
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Tell us what's on your mind..."
                  rows={5}
                  required
                />
              </label>
              <button type="submit">Send Message</button>
            </form>
          )}
        </div>
      </div>
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

    p {
      font-size: 18px;
      color: #aac4e0;
    }
  }

  .contact-wrapper {
    display: flex;
    gap: 40px;
    padding: 60px 80px;
    max-width: 1100px;
    margin: auto;

    @media (max-width: 768px) {
      flex-direction: column;
      padding: 30px 20px;
    }
  }

  .info-cards {
    display: flex;
    flex-direction: column;
    gap: 20px;
    flex: 1;
  }

  .info-card {
    background: #f4f8fc;
    border-left: 4px solid #5cdb94;
    border-radius: 6px;
    padding: 20px 24px;

    h3 {
      color: #05396b;
      margin-bottom: 8px;
    }

    p {
      color: #555;
      line-height: 1.6;
    }
  }

  .form-container {
    flex: 2;
    background: white;
    border-radius: 8px;
    padding: 40px;
    box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 12px;

    h2 {
      color: #05396b;
      margin-bottom: 24px;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    label {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-weight: 600;
      color: #333;
      font-size: 14px;
    }

    input,
    textarea {
      padding: 12px 14px;
      border: 1px solid #ccc;
      border-radius: 6px;
      font-size: 15px;
      font-family: inherit;
      resize: vertical;

      &:focus {
        outline: none;
        border-color: #05396b;
        box-shadow: 0 0 0 2px rgba(5, 57, 107, 0.15);
      }
    }

    button[type="submit"] {
      background-color: #05396b;
      color: white;
      padding: 14px 28px;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      align-self: flex-start;

      &:hover {
        background-color: #0a5599;
      }
    }
  }

  .success {
    text-align: center;
    padding: 40px 0;

    h2 {
      color: #5cdb94;
      font-size: 32px;
      margin-bottom: 12px;
    }

    p {
      color: #555;
      margin-bottom: 24px;
    }

    button {
      background-color: #05396b;
      color: white;
      padding: 12px 24px;
      border: none;
      border-radius: 6px;
      font-size: 15px;
      cursor: pointer;

      &:hover {
        background-color: #0a5599;
      }
    }
  }
`;
