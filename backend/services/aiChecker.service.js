/**
 * PHASE 7.5.3 — AI Answer Checking Service
 * Optional AI-assisted grading bridge
 */

const axios = require('axios');

/**
 * Get AI suggested score and feedback for an attempt
 * @param {Object} attempt - ExamAttempt document
 * @param {Array} questions - Question paper questions
 * @param {Number} totalMarks - Maximum marks for exam
 * @returns {Object} - { suggestedScore, feedback, perQuestionFeedback }
 */
async function getAISuggestion(attempt, questions, totalMarks) {
  try {
    console.log('[AI Checker] Processing attempt:', attempt._id);

    // Check if AI service is configured
    const aiServiceUrl = process.env.AI_ANSWER_CHECKER_URL;
    if (!aiServiceUrl) {
      console.log('[AI Checker] AI service not configured, skipping');
      return {
        suggestedScore: null,
        feedback: 'AI checking not available',
        perQuestionFeedback: []
      };
    }

    // Prepare data for AI service
    const answersMap = {};
    attempt.answers.forEach(ans => {
      answersMap[ans.questionId] = ans.answer;
    });

    const questionsForAI = questions.map(q => ({
      id: q.id,
      text: q.text,
      marks: q.marks,
      expectedAnswer: q.expectedAnswer || q.answer || '',
      studentAnswer: answersMap[q.id] || ''
    }));

    // Call AI service
    const response = await axios.post(
      `${aiServiceUrl}/check-answers`,
      {
        questions: questionsForAI,
        totalMarks,
        attemptId: attempt._id.toString()
      },
      {
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('[AI Checker] AI response received');

    return {
      suggestedScore: response.data.totalScore || 0,
      feedback: response.data.overallFeedback || 'AI evaluation completed',
      perQuestionFeedback: response.data.questionFeedback || []
    };

  } catch (error) {
    console.error('[AI Checker] Error:', error.message);
    
    // Return graceful fallback
    return {
      suggestedScore: null,
      feedback: `AI checking unavailable: ${error.message}`,
      perQuestionFeedback: []
    };
  }
}

/**
 * Get AI suggestion and save to attempt
 * @param {String} attemptId - ExamAttempt ID
 * @returns {Object} - AI suggestion data
 */
async function processAIChecking(attemptId) {
  try {
    const ExamAttempt = require('../models/ExamAttempt');
    const Exam = require('../models/Exam');
    const { getStudentQuestions } = require('../utils/paperResolver');

    // Get attempt
    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt) {
      throw new Error('Attempt not found');
    }

    // Get exam
    const exam = await Exam.findById(attempt.exam);
    if (!exam) {
      throw new Error('Exam not found');
    }

    // Get questions
    const questionsData = await getStudentQuestions(exam._id, attempt.student);
    
    // Get AI suggestion
    const aiResult = await getAISuggestion(attempt, questionsData.questions, exam.totalMarks);

    // Save AI suggestion to attempt
    attempt.aiSuggestedScore = aiResult.suggestedScore;
    attempt.aiFeedback = aiResult.feedback;
    attempt.evaluationStatus = 'ai-checked';
    
    // Save per-question AI feedback
    if (aiResult.perQuestionFeedback && aiResult.perQuestionFeedback.length > 0) {
      attempt.perQuestionMarks = aiResult.perQuestionFeedback.map(qf => ({
        questionId: qf.questionId,
        marksAwarded: qf.suggestedMarks || 0,
        maxMarks: qf.maxMarks || 0,
        feedback: qf.feedback || ''
      }));
    }

    await attempt.save();

    console.log(`[AI Checker] Saved AI suggestion for attempt ${attemptId}: ${aiResult.suggestedScore}/${exam.totalMarks}`);

    return aiResult;

  } catch (error) {
    console.error('[AI Checker] Process error:', error);
    throw error;
  }
}

module.exports = {
  getAISuggestion,
  processAIChecking
};
