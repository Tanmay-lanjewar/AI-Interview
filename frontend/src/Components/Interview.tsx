import React, { useEffect, useState } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import useClipboard from "react-use-clipboard";
import styled from "styled-components";
import Webcam from "react-webcam";
import { MdCopyAll } from "react-icons/md";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import { Loader } from "./Loader ";

export const Interview = () => {
  const { transcript, browserSupportsSpeechRecognition, resetTranscript } = useSpeechRecognition();
  const [text, setText] = useState("");
  const [isCopied, setCopied] = useClipboard(text);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  // App State Machine
  const [appState, setAppState] = useState<"INTRO" | "QUESTION" | "FEEDBACK" | "REPORT">("INTRO");
  
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [feedback, setFeedback] = useState<any>(null);
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    const instruction = sessionStorage.getItem("firstInstruction") || "Please introduce yourself.";
    setCurrentQuestion(instruction);
  }, []);

  const start = () => {
    SpeechRecognition.startListening({ continuous: true, language: "en-IN" });
  };
  
  const stop = () => {
    SpeechRecognition.stopListening();
  };

  const handleClear = () => {
    resetTranscript();
  };

  const handleSubmitIntro = async () => {
    setIsLoading(true);
    stop();
    try {
      await axios.post("http://localhost:8081/api/interview/intro", {
        sessionId,
        answer: transcript,
      });
      // Fetch first real technical question
      await fetchNextQuestion();
    } catch (error) {
      console.error(error);
      alert("Error submitting introduction.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    setIsLoading(true);
    stop();
    try {
      const response = await axios.post("http://localhost:8081/api/interview/evaluate", {
        sessionId,
        question: currentQuestion,
        answer: transcript,
      });
      setFeedback(response.data.evaluation);
      setAppState("FEEDBACK");
      resetTranscript();
    } catch (error) {
      console.error(error);
      alert("Error evaluating answer.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNextQuestion = async () => {
    setIsLoading(true);
    setAppState("QUESTION");
    setFeedback(null);
    try {
      const response = await axios.post("http://localhost:8081/api/interview/next-question", {
        sessionId,
      });
      setCurrentQuestion(response.data.question);
    } catch (error) {
      console.error(error);
      alert("Error fetching next question.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndInterview = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`http://localhost:8081/api/interview/report/${sessionId}`);
      setReport(response.data);
      setAppState("REPORT");
    } catch (error) {
      console.error(error);
      alert("Error generating final report.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!browserSupportsSpeechRecognition) {
    return <div>Browser does not support speech recognition.</div>;
  }

  return (
    <DIV>
      {appState === "REPORT" && report ? (
        <div className="report-container">
          <h1 className="report-heading">Final Interview Report 🎯</h1>
          <div className="score-box">
            <h2>Average Score: {report.averageScore} / 10</h2>
          </div>
          
          <div className="report-section">
            <h3 style={{color: "#5cdb94"}}>Key Strengths 💪</h3>
            <ul>
              {report.report.keyStrengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
            </ul>
          </div>

          <div className="report-section">
            <h3 style={{color: "#ff3d3d"}}>Areas to Improve 📉</h3>
            <ul>
              {report.report.overallWeakAreas.map((w: string, i: number) => <li key={i}>{w}</li>)}
            </ul>
          </div>

          <div className="report-section">
            <h3 style={{color: "#05396b"}}>Actionable Suggestions 📝</h3>
            <ul>
              {report.report.actionableSuggestions.map((a: string, i: number) => <li key={i}>{a}</li>)}
            </ul>
          </div>
        </div>
      ) : (
        <div>
          <div className="question-and-cam-container">
            <div className="question-container">
              {appState === "INTRO" ? <h1>Introduction</h1> : <h1>Technical Question</h1>}
              <p className="question">{currentQuestion}</p>
              
              {appState === "FEEDBACK" && feedback && (
                <div className="instant-feedback">
                  <h3>Score: {feedback.score}/10</h3>
                  <p><b>Strengths:</b> {feedback.strengths?.join(" ")}</p>
                  <p><b>Improvements:</b> {feedback.improvements?.join(" ")}</p>
                </div>
              )}
            </div>
            <div className="cam-container">
              <Webcam height="260px" />
            </div>
          </div>

          {appState !== "FEEDBACK" && (
            <div className="speech-text-container" onClick={() => setText(transcript)}>
              {transcript ? transcript : <h2 className="your_answer">Click Start and begin speaking...</h2>}
            </div>
          )}

          <div className="btn-contianer">
            {isLoading ? (
               <div style={{ margin: "auto", padding: "20px" }}><h3>Processing...</h3></div>
            ) : (
              <>
                {appState !== "FEEDBACK" && (
                  <div>
                    <button className="btn" onClick={start}>Start Mic</button>
                    <button className="btn stop" onClick={stop}>Stop Mic</button>
                    <button className="btn" onClick={handleClear}>Clear</button>
                    {appState === "INTRO" ? (
                      <button className="btn submit" onClick={handleSubmitIntro}>Submit Intro</button>
                    ) : (
                      <button className="btn submit" onClick={handleSubmitAnswer}>Submit Answer</button>
                    )}
                  </div>
                )}
                
                {appState === "FEEDBACK" && (
                  <div style={{ margin: "auto" }}>
                    <button className="btn" onClick={fetchNextQuestion}>Next Question</button>
                    <button className="btn stop" onClick={handleEndInterview}>End Interview & Get Report</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </DIV>
  );
};

const DIV = styled.div`
  .speech-text-container {
    width: 90%;
    height: 200px;
    border: solid lightgray 1px;
    border-radius: 5px;
    margin: auto;
    margin-top: 10px;
    padding: 20px;
    text-align: start;
    font-size: 18px;
    background-color: #f9f9f9;
  }

  .question-and-cam-container {
    display: flex;
    width: 93%;
    margin: auto;
    height: 350px;
  }

  .question-container {
    width: 50%;
    text-align: left;
    padding: 20px;
  }

  .cam-container {
    width: 50%;
    display: flex;
    justify-content: right;
    padding-top: 30px;
  }

  .question {
    font-size: 22px;
    font-weight: 500;
    margin-top: 20px;
    color: #05396b;
  }

  .instant-feedback {
    margin-top: 20px;
    padding: 15px;
    background-color: #e6f7ff;
    border-left: 5px solid #1890ff;
    border-radius: 5px;
  }

  .your_answer {
    color: #999;
  }

  .btn-contianer {
    display: flex;
    justify-content: center;
    width: 94%;
    margin: auto;
    margin-top: 20px;
  }

  .btn {
    padding: 12px 25px;
    border: none;
    margin: 10px 15px;
    border-radius: 5px;
    background-color: #05396b;
    box-shadow: rgba(0, 0, 0, 0.16) 0px 1px 4px;
    color: white;
    font-weight: bold;
    cursor: pointer;
    font-size: 16px;
  }

  .btn:hover {
    opacity: 0.8;
  }

  .stop {
    background-color: #ff3d3d;
  }
  
  .submit {
    background-color: #5cdb94;
    color: black;
  }

  /* Report Styling */
  .report-container {
    max-width: 800px;
    margin: 40px auto;
    padding: 40px;
    background: white;
    box-shadow: rgba(0, 0, 0, 0.1) 0px 10px 50px;
    border-radius: 15px;
    text-align: left;
  }

  .report-heading {
    text-align: center;
    color: #05396b;
    font-size: 36px;
    margin-bottom: 20px;
  }

  .score-box {
    background: #5cdb94;
    padding: 20px;
    border-radius: 10px;
    text-align: center;
    color: #05396b;
    margin-bottom: 30px;
  }

  .report-section {
    margin-bottom: 30px;
  }
  
  .report-section ul {
    line-height: 1.8;
    font-size: 18px;
    color: #444;
  }
`;
