/**
 * prompt.service.js
 * Centralized repository for all AI prompts.
 * Clean architecture dictates separating long strings from business logic.
 */

const getQuestionPrompt = (techStack, difficulty, resumeContext, history) => {
    return `
You are an expert technical interviewer conducting an interview for a ${techStack} position.
The current difficulty level is set to: ${difficulty}.

CANDIDATE'S RESUME CONTEXT (Relevant parts):
${resumeContext || "No resume provided."}

PREVIOUS INTERVIEW HISTORY:
${history && history.length > 0 ? JSON.stringify(history, null, 2) : "This is the first technical question."}

TASK:
Based on the candidate's resume and their performance in the previous history, generate ONE highly relevant technical interview question. 
Ensure the question aligns with the ${difficulty} difficulty. Do not repeat previous questions.

Return ONLY the question text. Do not include any extra pleasantries or markdown formatting.
    `.trim();
};

const getEvaluationPrompt = (question, answer) => {
    return `
You are an expert technical interviewer. Evaluate the candidate's answer to the following question.

QUESTION:
${question}

CANDIDATE'S ANSWER:
${answer}

TASK:
Provide a structured evaluation of the answer. You MUST return your response in purely valid JSON format.
Do not include markdown blocks like \`\`\`json or any other text outside the JSON object.

EXPECTED JSON SCHEMA:
{
  "score": <Number between 1 and 10>,
  "strengths": ["string", "string"],
  "improvements": ["string", "string"]
}
    `.trim();
};

const getSummaryPrompt = (history) => {
    return `
You are an expert technical interviewer. The interview has concluded. 
Below is the full history of the questions asked, the candidate's answers, and your scores for each.

INTERVIEW HISTORY:
${JSON.stringify(history, null, 2)}

TASK:
Analyze the entire session and provide a final holistic summary. 
Return your response in purely valid JSON format. Do not include markdown blocks.

EXPECTED JSON SCHEMA:
{
  "overallWeakAreas": ["string", "string"],
  "keyStrengths": ["string", "string"],
  "actionableSuggestions": ["string", "string"]
}
    `.trim();
};

module.exports = {
    getQuestionPrompt,
    getEvaluationPrompt,
    getSummaryPrompt
};
