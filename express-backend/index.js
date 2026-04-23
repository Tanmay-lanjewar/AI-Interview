const express = require("express");
const cors = require("cors");
const { QuestionRouter } = require("./Routes/question.routes");
const { InterviewRouter } = require("./Routes/interview.routes");
const { connection } = require("./db");
const rateLimit = require("express-rate-limit");
require("dotenv").config();
const PORT = 8081;

const app = express();
app.use(express.json());
app.use(cors());

// Rate limiter: Max 50 requests per IP per 15 minutes
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 50,
    message: "Too many requests from this IP, please try again after 15 minutes."
});

app.use("/questions", QuestionRouter);
app.use("/api/interview", apiLimiter, InterviewRouter);

app.get("/", async(req, res) =>{
    res.setHeader("Content-type", "text/html");
    res.send("<h1>Welcome to the Interview Question Server Api</h1>")
})

app.listen(8081, async() =>{
    try {
        await connection;
        console.log("Connected to the database");
        console.log("Server is Running on port 8081");
    } catch (error) {
        console.log(error);
    }
})