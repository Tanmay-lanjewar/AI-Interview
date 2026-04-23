# AI Interview Preparation Platform - Project Documentation

This document contains a comprehensive, in-depth overview of the **AI Interview Preparation Platform** (CodeGenius / Ai-Interview). This platform leverages the power of AI and natural language processing to simulate real interview scenarios, providing users with valuable feedback and resources to enhance their interview skills.

## Table of Contents
1. [Project Overview](#project-overview)
2. [Key Features](#key-features)
3. [Technology Stack](#technology-stack)
4. [Architecture & Directory Structure](#architecture--directory-structure)
5. [Frontend Deep Dive](#frontend-deep-dive)
6. [Backend Deep Dive](#backend-deep-dive)
7. [Running the Project Locally](#running-the-project-locally)

---

## 1. Project Overview
The platform allows students and professionals to practice for interviews by engaging in realistic conversations with an AI interviewer. It is powered by the OpenAI API. Users can choose the type of interview they want to practice (e.g., MERN, Node.js, Java, DSA) and receive a series of relevant questions. The AI adapts its tone and style of questioning to simulate different interviewer behaviors.

## 2. Key Features
- **Interview Simulator**: Conversational AI powered by the OpenAI API.
- **Dynamic Questions**: AI dynamically generates questions and responds based on the student's answers.
- **Speech-to-Text & Text-to-Speech**: For a more realistic conversational interview experience.
- **Personalized Feedback**: After the interview, AI analyzes responses and offers constructive feedback, highlighting strengths and areas for improvement (communication skills, technical knowledge, problem-solving).
- **Webcam Integration**: Incorporates camera feed for a realistic interview environment.
- **User-Friendly Interface**: Intuitive, visually appealing UI built with modern React.

## 3. Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript (`create-react-app`)
- **Styling**: Tailwind CSS, Styled Components, Headless UI, Heroicons
- **Routing**: React Router DOM v6
- **State Management / Hooks**: Standard React Hooks
- **Media / Hardware**: `react-webcam` (for camera), `react-speech-recognition` (for capturing audio)
- **Icons**: `react-icons`, `@heroicons/react`
- **HTTP Client**: `axios`

### Backend (Express)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (via `mongoose`)
- **Middlewares**: `cors`, `dotenv`
- **Tools**: `nodemon` (for development)

### Backend (Java)
- **Framework**: Spring Boot (JAR packaged as `Bot-0.0.1-SNAPSHOT.jar`)
- Provides alternative or supplementary AI/Bot functionalities.

---

## 4. Architecture & Directory Structure
The workspace is organized into a monorepo-style structure, separating the frontend and backend implementations.

```text
AI Interview/
├── .gitignore
├── README.md                 # Brief project summary & team info
├── frontend/                 # React application (Frontend)
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── assets/           # Images, SVGs, etc.
│       ├── Components/       # Reusable React components (NavBar, Interview, InterviewTypes, Loader, etc.)
│       ├── Pages/            # Route pages (Home, About, Contact)
│       ├── Routes/           # React Router configuration
│       ├── App.tsx           # Main application entry component
│       ├── index.tsx         # React DOM rendering
│       └── index.css         # Global Tailwind styles
├── express-backend/          # Node/Express API (Backend)
│   ├── package.json
│   ├── index.js              # Entry point for the server
│   ├── db.js                 # Database connection logic
│   ├── seed.js               # Script to seed initial data into MongoDB
│   ├── Routes/               # Express routes (e.g., question.routes)
│   └── Models/               # Mongoose schemas
└── java-backend/             # Java Spring Boot API (Backend Alternative/Microservice)
    ├── Bot/                  # Spring Boot source code
    └── Bot-0.0.1-SNAPSHOT.jar# Compiled executable JAR
```

---

## 5. Frontend Deep Dive

The frontend is a React Single Page Application (SPA) utilizing TypeScript for type safety.

### Main Components
- **`App.tsx` & `index.tsx`**: Bootstraps the application, applies global routing, and wraps the app with necessary context providers.
- **Pages (`src/Pages/`)**:
  - `Home.tsx`: The landing page introducing the platform.
  - `About.tsx` & `Contact.tsx`: Informational pages.
- **Components (`src/Components/`)**:
  - `InterviewTypes.tsx`: Interface where users select the specific domain/topic for their interview (e.g., MERN, Java, DSA).
  - `Interview.tsx`: The core interview simulator interface. This component integrates `react-webcam` to show the user's camera feed, handles speech recognition (`react-speech-recognition`), and communicates with the backend / OpenAI to process questions and answers.
  - `Loader.tsx`: A visual indicator during loading states (e.g., waiting for AI responses).
  - `NavBar.tsx`: Navigation bar for routing across the application.

### Key Workflows
1. **Selection Flow**: User navigates to the interview selection page and chooses a domain.
2. **Interview Flow**: 
   - The user starts the interview.
   - The application prompts for camera and microphone access.
   - The user speaks their answers, which are transcribed using `react-speech-recognition`.
   - The transcribed text is sent (via Axios) to the AI backend for evaluation and to generate the next question.
3. **Feedback Flow**: Once the interview completes, the data is compiled into a feedback report showing strengths, weaknesses, and a score.

---

## 6. Backend Deep Dive

### Express Backend
The Express backend acts as the primary API server connecting the frontend to the database and potentially the AI services.

- **Entry Point (`index.js`)**: 
  - Runs on port **8081**.
  - Applies `express.json()` and `cors()` middlewares.
  - Mounts the `QuestionRouter` at the `/questions` endpoint.
  - Connects to MongoDB upon starting.
- **Database (`db.js` / Models)**: 
  - Connects to a MongoDB instance (URI configured in `.env`).
  - Contains models to store questions, interview types, and possibly user performance.
- **Seeding (`seed.js`)**: 
  - A utility script used to populate the database with initial questions or interview configurations.
- **Routing (`Routes/question.routes.js`)**: 
  - Handles CRUD operations for interview questions.

### Java Backend
The Java backend exists in the `java-backend/` folder as a Spring Boot application (`Bot`). This might be used as an alternative backend, a specific microservice for AI interactions, or a legacy implementation. The presence of `Bot-0.0.1-SNAPSHOT.jar` indicates that it can be run as a standalone Java application.

---

## 7. Running the Project Locally

To run the full stack locally, you need to start the frontend and backend servers separately.

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (Local instance or Atlas cluster)
- Java 17+ (If running the Java backend)
- OpenAI API Key

### Start the Express Backend
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd "express-backend"
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Create a `.env` file in the `express-backend` directory and add:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   OPENAI_API_KEY=your_openai_api_key
   ```
4. Start the server (runs on port 8081):
   ```bash
   npm run server
   ```

### Start the Frontend
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd "frontend"
   ```
2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Start the React development server (runs on port 3000):
   ```bash
   npm start
   ```

### (Optional) Start the Java Backend
1. Open a terminal and navigate to the Java backend directory:
   ```bash
   cd "java-backend"
   ```
2. Run the JAR file:
   ```bash
   java -jar Bot-0.0.1-SNAPSHOT.jar
   ```

---
*Generated based on the current repository structure and package contents.*
