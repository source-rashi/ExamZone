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
    const aiServiceUrl = process.env.AI_ANSWER_CHECKER_URL || 'http://localhost:8002';
    console.log('[AI Checker] Using AI service URL:', aiServiceUrl);

    // Questions already have studentAnswer merged in
    const questionsForAI = questions.map(q => ({
      id: q.id,
      text: q.text,
      marks: q.marks,
      expectedAnswer: q.expectedAnswer || '',
      studentAnswer: q.studentAnswer || ''
    }));

    console.log('[AI Checker] Sending to AI:', {
      questionsCount: questionsForAI.length,
      totalMarks,
      aiServiceUrl
    });

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

    console.log('[AI Checker] AI response received:', {
      totalScore: response.data.totalScore,
      feedbackCount: response.data.questionFeedback?.length
    });

    return {
      suggestedScore: response.data.totalScore || 0,
      feedback: response.data.overallFeedback || 'AI evaluation completed',
      perQuestionFeedback: response.data.questionFeedback || []
    };

  } catch (error) {
    console.error('[AI Checker] Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('[AI Checker] Cannot connect to AI service. Make sure it\'s running on', process.env.AI_ANSWER_CHECKER_URL || 'http://localhost:5002');
    }
    
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
    const exam = await Exam.findById(attempt.exam).lean();
    if (!exam) {
      throw new Error('Exam not found');
    }

    // Get questions
    const questionsData = await getStudentQuestions(exam._id, attempt.student);
    
    // Merge student answers with questions (same logic as evaluation)
    const questionsWithAnswers = questionsData.questions.map((q, index) => {
      const studentAnswer = attempt.answers?.find(a => {
        return a.questionId === `q${index}` || 
               a.questionId === q.number.toString() ||
               a.questionId === `q${q.number}` ||
               parseInt(a.questionId) === q.number;
      });

      return {
        id: q.number.toString(),
        text: q.text,
        marks: q.marks,
        expectedAnswer: q.expectedAnswer || q.answer || '',
        studentAnswer: studentAnswer?.answer || ''
      };
    });

    // Calculate actual total marks from questions
    const actualTotalMarks = questionsWithAnswers.reduce((sum, q) => sum + (q.marks || 0), 0);
    
    // Get AI suggestion with merged questions
    const aiResult = await getAISuggestion(attempt, questionsWithAnswers, actualTotalMarks);

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

    console.log(`[AI Checker] Saved AI suggestion for attempt ${attemptId}: ${aiResult.suggestedScore}/${actualTotalMarks}`);

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
