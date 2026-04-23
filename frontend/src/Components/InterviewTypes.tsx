import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export const InterviewTypes = () => {
  const [resume, setResume] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleStartInterview = async (techStack: string) => {
    if (!resume) {
      alert("Please upload your resume (PDF) first!");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("techStack", techStack);
      formData.append("resume", resume);

      const response = await axios.post("http://localhost:8081/api/interview/start", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      const { sessionId, firstInstruction } = response.data;
      
      // Store the first instruction in session storage to pass to the next page
      sessionStorage.setItem("firstInstruction", firstInstruction);

      // Navigate to the interview page with the generated Session ID
      navigate(`/interview/mern?sessionId=${sessionId}`); 
    } catch (error) {
      console.error(error);
      alert("Failed to start interview. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px" }}>
      <h2 style={{ fontSize: "28px", fontWeight: "bold" }}>Step 1: Upload Your Resume</h2>
      <p style={{ color: "gray", marginBottom: "20px" }}>We use advanced RAG parsing to tailor the interview directly to your experience.</p>
      
      <input 
        type="file" 
        accept="application/pdf" 
        onChange={(e) => setResume(e.target.files ? e.target.files[0] : null)}
        style={{ marginBottom: "40px", padding: "10px", border: "2px dashed #05396b", borderRadius: "10px", width: "400px", cursor: "pointer" }}
      />

      {loading && <h3 style={{ color: "#4CAF50" }}>Analyzing Resume & Initializing AI Session... 🧠</h3>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2,1fr)",
          gap: "40px",
          width: "100%",
          maxWidth: "1100px",
          opacity: loading ? 0.5 : 1,
          pointerEvents: loading ? "none" : "auto"
        }}
      >
        <div style={{ boxShadow: "rgba(0, 0, 0, 0.3) 0px 19px 38px, rgba(0, 0, 0, 0.22) 0px 15px 12px", padding: "40px", borderRadius: "10px" }}>
          <h1 style={{ textAlign: "justify", fontWeight: "bold", fontSize: "40px" }}>MERN</h1>
          <p style={{ textAlign: "justify", color: "#555" }}>
            A MERN (MongoDB, Express.js, React, Node.js) interview assesses a candidate's expertise in full-stack web development...
          </p>
          <button
            onClick={() => handleStartInterview("mern")}
            style={{ display: "Block", backgroundColor: "#05396b", margin: "20px auto", color: "white", padding: "12px 25px", borderRadius: "5px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "16px" }}
          >
            Start MERN Interview
          </button>
        </div>

        <div style={{ boxShadow: "rgba(0, 0, 0, 0.3) 0px 19px 38px, rgba(0, 0, 0, 0.22) 0px 15px 12px", padding: "40px", borderRadius: "10px" }}>
          <h1 style={{ textAlign: "justify", fontWeight: "bold", fontSize: "40px" }}>Node.js</h1>
          <p style={{ textAlign: "justify", color: "#555" }}>
            A Node.js interview evaluates a candidate's proficiency in server-side JavaScript development...
          </p>
          <button
            onClick={() => handleStartInterview("node")}
            style={{ display: "Block", backgroundColor: "#05396b", margin: "20px auto", color: "white", padding: "12px 25px", borderRadius: "5px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "16px" }}
          >
            Start Node.js Interview
          </button>
        </div>

        <div style={{ boxShadow: "rgba(0, 0, 0, 0.3) 0px 19px 38px, rgba(0, 0, 0, 0.22) 0px 15px 12px", padding: "40px", marginTop: "40px", borderRadius: "10px" }}>
          <h1 style={{ textAlign: "justify", fontWeight: "bold", fontSize: "40px" }}>Java</h1>
          <p style={{ textAlign: "justify", color: "#555" }}>
            A Java interview assesses a candidate's expertise in the Java programming language...
          </p>
          <button
            onClick={() => handleStartInterview("java")}
            style={{ display: "Block", backgroundColor: "#05396b", margin: "20px auto", color: "white", padding: "12px 25px", borderRadius: "5px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "16px" }}
          >
            Start Java Interview
          </button>
        </div>
      </div>
    </div>
  );
};
