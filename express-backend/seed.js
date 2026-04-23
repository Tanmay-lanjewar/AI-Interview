const mongoose = require("mongoose");
const { QuestionModel } = require("./Models/Question.model");

mongoose.connect("mongodb://localhost:27017/").then(async () => {
    const questions = [
        { techStack: "mern", question: "What is the Virtual DOM in React?" },
        { techStack: "mern", question: "Explain the purpose of middleware in Express.js." },
        { techStack: "mern", question: "How does MongoDB store data?" },
        { techStack: "mern", question: "What is the role of Node.js in the MERN stack?" },
        { techStack: "mern", question: "How do you handle state management in React?" },

        { techStack: "node", question: "What is the Event Loop in Node.js?" },
        { techStack: "node", question: "Explain the difference between process.nextTick and setImmediate." },
        { techStack: "node", question: "What are Streams in Node.js?" },
        { techStack: "node", question: "How does Node.js handle concurrency?" },
        { techStack: "node", question: "What is the purpose of the package.json file?" },

        { techStack: "java", question: "What is the difference between an interface and an abstract class?" },
        { techStack: "java", question: "Explain the concept of OOPs in Java." },
        { techStack: "java", question: "How does Garbage Collection work in Java?" },
        { techStack: "java", question: "What are Collections in Java?" },
        { techStack: "java", question: "What is a thread and how do you create one in Java?" },
    ];

    await QuestionModel.deleteMany({});
    await QuestionModel.insertMany(questions);
    console.log("Questions seeded successfully!");
    process.exit();
}).catch(console.error);
