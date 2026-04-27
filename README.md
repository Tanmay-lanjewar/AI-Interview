# AI Interview — AI-Powered Mock Interview Platform

> Practice technical interviews with AI-generated questions tailored to your resume, spoken answers transcribed by Groq Whisper, and instant structured feedback powered by Google Gemini.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Clone the Repository](#clone-the-repository)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [How It Works](#how-it-works)
- [Interview Tracks](#interview-tracks)
- [Screenshots](#screenshots)

---

## Overview

**AI Interview** is a full-stack MERN application that simulates a real technical interview experience. The user uploads their resume, and the AI reads it to generate personalised, context-aware questions. The user speaks their answer, which is transcribed using Groq's Whisper large-v3 model. Each answer is then evaluated by Google Gemini, which returns a score out of 10, specific strengths, and actionable areas to improve.

The difficulty adapts automatically — if you score 7 or above, the next question gets harder. Score 4 or below and it steps back down. Every session is stored in MongoDB so the AI never repeats a question.

---

## Features

- **Resume-aware questions** — Uploads your PDF resume, extracts text, and generates questions tailored to your background
- **Groq Whisper transcription** — High-accuracy speech-to-text using `whisper-large-v3`, handles accents and technical jargon
- **Editable transcript** — After recording, the transcript appears in an editable textarea so you can fix any errors before submitting
- **Structured AI feedback** — Score /10, Strengths list, Areas to Improve list — not a wall of plain text
- **Adaptive difficulty** — Questions automatically get harder or easier based on your score (Easy → Medium → Hard)
- **Session memory** — Full Q&A history stored per session so questions never repeat
- **Live webcam preview** — Simulates the real interview experience with camera feed
- **3 interview tracks** — MERN Stack, Node.js, Java
- **Modern dark UI** — Built with Styled Components and Inter font

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.2.0 | UI framework |
| TypeScript | 4.9.5 | Type safety |
| React Router DOM | 6.16.0 | Client-side routing |
| Styled Components | 6.0.8 | CSS-in-JS styling |
| Axios | 1.5.1 | HTTP client |
| React Webcam | 7.1.1 | Camera feed |
| React Icons | 4.11.0 | Icon library |
| MediaRecorder API | Built-in | Audio recording |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | — | Runtime |
| Express.js | 4.18.2 | Web framework |
| MongoDB | — | Database |
| Mongoose | 7.6.0 | ODM |
| Multer | 2.1.1 | File uploads (resume + audio) |
| pdf-parse | 1.1.1 | Extract text from resume PDF |
| dotenv | 16.6.1 | Environment variables |
| cors | 2.8.5 | Cross-origin requests |

### AI / External Services
| Service | Purpose |
|---|---|
| Google Gemini 2.5 Flash | Question generation + answer evaluation |
| Groq Whisper large-v3 | Speech-to-text transcription (free tier) |

---

## Project Structure

```
AI-Interview/
├── express-backend/
│   ├── Models/
│   │   ├── Question.model.js          # Static question schema
│   │   └── InterviewSession.model.js  # Session schema (resume, history, difficulty)
│   ├── Routes/
│   │   ├── question.routes.js         # GET /questions/get
│   │   └── interview.routes.js        # POST /api/interview/* (all 4 endpoints)
│   ├── services/
│   │   └── llm.service.js             # Gemini wrapper (generateText + generateJSON)
│   ├── db.js                          # MongoDB connection
│   ├── index.js                       # Express server entry point
│   ├── seed.js                        # Optional: seed static questions
│   ├── .env.example                   # Environment variable template
│   └── package.json
│
├── frontend/
│   └── src/
│       ├── Components/
│       │   ├── Interview.tsx          # Main interview component (3-phase flow)
│       │   ├── InterviewTypes.tsx     # Track selection page
│       │   ├── NavBar.tsx             # Navigation bar
│       │   └── Loader.tsx             # Loading spinner
│       ├── Pages/
│       │   ├── Home.tsx               # Landing page
│       │   ├── About.tsx              # About page
│       │   └── Contact.tsx            # Contact page
│       ├── Routes/
│       │   └── MainRoutes.tsx         # React Router routes
│       ├── App.tsx
│       ├── index.tsx
│       └── index.css
│
├── IMPLEMENTATION_PLAN.md
└── README.md
```

---

## Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) v16 or higher
- [MongoDB](https://www.mongodb.com/try/download/community) running locally on port `27017`
- A free [Groq API key](https://console.groq.com) — sign up, no credit card needed
- A [Google Gemini API key](https://aistudio.google.com) — free tier available

---

### Clone the Repository

```bash
git clone https://github.com/Tanmay-lanjewar/AI-Interview.git
cd AI-Interview
```

---

### Backend Setup

```bash
cd express-backend
npm install
```

Create your `.env` file:

```bash
cp .env.example .env
```

Fill in your keys inside `.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
MONGODB_URI=mongodb://localhost:27017/
PORT=8081
```

Start the backend server:

```bash
npm run server
```

You should see:
```
Connected to the database
Server is Running on port 8081
```

---

### Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm start
```

The app will open at **http://localhost:3000**

---

## Environment Variables

All environment variables live in `express-backend/.env`.

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | Google Gemini API key for question generation and evaluation. Get it free at [aistudio.google.com](https://aistudio.google.com) |
| `GROQ_API_KEY` | ✅ Yes | Groq API key for Whisper transcription. Get it free at [console.groq.com](https://console.groq.com) |
| `MONGODB_URI` | ✅ Yes | MongoDB connection string. Default: `mongodb://localhost:27017/` |
| `PORT` | Optional | Port for the Express server. Default: `8081` |

---

## API Reference

Base URL: `http://localhost:8081`

---

### `POST /api/interview/start`

Start a new interview session by uploading a resume.

**Request** — `multipart/form-data`

| Field | Type | Description |
|---|---|---|
| `resume` | File (PDF) | The candidate's resume |
| `techStack` | string | `"mern"` / `"node"` / `"java"` |

**Response**
```json
{
  "sessionId": "64f3a1b2c3d4e5f6a7b8c9d0",
  "question": "Please introduce yourself and walk me through your background and experience."
}
```

---

### `POST /api/interview/evaluate`

Submit an answer and get structured feedback.

**Request** — `application/json`

```json
{
  "sessionId": "64f3a1b2c3d4e5f6a7b8c9d0",
  "question": "Explain the Node.js event loop.",
  "answer": "The event loop is what allows Node.js to perform non-blocking I/O operations..."
}
```

**Response**
```json
{
  "score": 7,
  "strengths": [
    "Correctly explained the single-threaded nature of Node.js",
    "Mentioned non-blocking I/O with a clear example"
  ],
  "improvements": [
    "Did not mention the phases of the event loop (timers, I/O, check, etc.)",
    "Could have explained the call stack and callback queue relationship"
  ]
}
```

---

### `POST /api/interview/next-question`

Generate the next question based on session history and current difficulty.

**Request** — `application/json`

```json
{
  "sessionId": "64f3a1b2c3d4e5f6a7b8c9d0"
}
```

**Response**
```json
{
  "question": "What is the difference between process.nextTick() and setImmediate() in Node.js?"
}
```

---

### `POST /api/interview/transcribe`

Transcribe a recorded audio blob using Groq Whisper.

**Request** — `multipart/form-data`

| Field | Type | Description |
|---|---|---|
| `audio` | File (webm/mp4) | Audio blob recorded by the browser |

**Response**
```json
{
  "transcript": "The event loop is what allows Node.js to handle multiple operations..."
}
```

---

## How It Works

```
1. User selects a track (MERN / Node.js / Java)
        ↓
2. User uploads resume PDF
        ↓
3. Backend extracts resume text with pdf-parse
   Creates an InterviewSession in MongoDB
   Returns the first (fixed) opening question
        ↓
4. User clicks "Start Recording"
   MediaRecorder captures audio in the browser
        ↓
5. User clicks "Stop Recording"
   Audio blob is sent to /api/interview/transcribe
   Groq Whisper returns the transcript
        ↓
6. User reviews/edits transcript → clicks "Submit Answer"
   Sent to /api/interview/evaluate
   Gemini evaluates with resume + question + answer context
   Returns { score, strengths, improvements }
   Session history updated, difficulty adjusted
        ↓
7. User clicks "Next Question"
   Sent to /api/interview/next-question
   Gemini generates a new question based on:
     - Resume context
     - Full Q&A history (no repeats)
     - Current difficulty level
        ↓
8. Repeat from step 4
```

### Difficulty Adaptation

| Score | Effect |
|---|---|
| ≥ 7 on Easy | Moves to Medium |
| ≥ 7 on Medium | Moves to Hard |
| ≤ 4 on Medium | Moves back to Easy |
| ≤ 4 on Hard | Moves back to Medium |

---

## Interview Tracks

| Track | Tag | Topics Covered |
|---|---|---|
| **MERN Stack** | Full Stack | MongoDB, Express.js, React, Node.js, REST APIs, component architecture |
| **Node.js** | Backend | Event loop, async/await, streams, clustering, REST API design |
| **Java** | OOP / Enterprise | Core Java, OOP principles, Spring framework, Collections, Concurrency |

---

## Notes

- **Browser compatibility** — Audio recording uses the `MediaRecorder` API. Chrome is recommended. Safari records in `audio/mp4` which is also supported.
- **Speech recognition** — The old Web Speech API has been replaced with Groq Whisper for significantly better accuracy with technical vocabulary and Indian English accents.
- **Resume format** — Upload a text-based PDF (not a scanned image). If text extraction fails, the backend will return an error.
- **MongoDB** — Must be running locally before starting the backend. No Atlas setup required for local development.
