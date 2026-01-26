/**
 * PHASE 7.5.2 — Evaluation Controller
 * Teacher evaluation and result management
 */

const ExamAttempt = require('../models/ExamAttempt');
const Exam = require('../models/Exam');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const logger = require('../config/logger');
const { getStudentQuestions } = require('../utils/paperResolver');
const { processAIChecking } = require('../services/aiChecker.service');
const mongoose = require('mongoose');

/**
 * Get all submitted attempts for an exam (Teacher only)
 * GET /api/v2/evaluation/exams/:examId/attempts
 */
async function getExamAttempts(req, res) {
  try {
    const { examId } = req.params;
    const teacherId = req.user.id;

    // ==================================================================
    // PHASE 8.6: PAGINATION - Extract query parameters
    // ==================================================================
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Verify exam exists and teacher owns it
    const exam = await Exam.findById(examId).lean();
    if (!exam) {
      return res.status(404).json({
        success: false,
        error: 'Exam not found'
      });
    }

    if (exam.createdBy.toString() !== teacherId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to evaluate this exam'
      });
    }

    console.log('[Evaluation] Exam totalMarks check:', {
      examId,
      totalMarks: exam.totalMarks,
      paperConfig: exam.paperConfig,
      totalMarksPerSet: exam.paperConfig?.totalMarksPerSet
    });

    // ==================================================================
    // PHASE 8.6: COUNT TOTAL FOR PAGINATION
    // ==================================================================
    const totalAttempts = await ExamAttempt.countDocuments({
      exam: examId,
      status: { $in: ['submitted', 'auto-submitted'] }
    });

    // Get submitted attempts with pagination
    const attempts = await ExamAttempt.find({
      exam: examId,
      status: { $in: ['submitted', 'auto-submitted'] }
    })
    .populate('student', 'name email rollNumber')
    .sort({ submittedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean(); // PHASE 8.6: Performance optimization

    // Get enrollment data for roll numbers
    const Enrollment = require('../models/Enrollment');
    const attemptsWithRolls = await Promise.all(
      attempts.map(async (attempt) => {
        const enrollment = await Enrollment.findOne({
          studentId: attempt.student._id,
          classId: exam.classId
        }).lean();

        return {
          ...attempt,
          rollNumber: enrollment?.rollNumber || 'N/A'
        };
      })
    );

    console.log('[Evaluation] Exam data:', {
      totalMarks: exam.totalMarks,
      paperConfigTotalMarks: exam.paperConfig?.totalMarksPerSet,
      hasPaperConfig: !!exam.paperConfig
    });

    // Try to get actual total from generatedSets if available
    let actualTotalMarks = exam.paperConfig?.totalMarksPerSet || exam.totalMarks;
    if (exam.generatedSets && exam.generatedSets.length > 0) {
      actualTotalMarks = exam.generatedSets[0].totalMarks || actualTotalMarks;
    }

    console.log('[Evaluation] Using totalMarks:', actualTotalMarks);

    // ==================================================================
    // PHASE 8.6: PAGINATION METADATA
    // ==================================================================
    const totalPages = Math.ceil(totalAttempts / limit);

    res.status(200).json({
      success: true,
      data: {
        exam: {
          id: exam._id,
          title: exam.title,
          totalMarks: actualTotalMarks,
          duration: exam.duration
        },
        attempts: attemptsWithRolls,
        totalAttempts,
        evaluated: attemptsWithRolls.filter(a => a.evaluationStatus === 'evaluated').length,
        pending: attemptsWithRolls.filter(a => a.evaluationStatus === 'pending').length,
        pagination: {
          currentPage: page,
          totalPages,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('[Evaluation] Get exam attempts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch attempts'
    });
  }
}

/**
 * Get full attempt details for evaluation (Teacher only)
 * GET /api/v2/evaluation/attempts/:attemptId
 */
async function getAttemptForEvaluation(req, res) {
  try {
    const { attemptId } = req.params;
    const teacherId = req.user.id;

    // Get attempt with student info
    const attempt = await ExamAttempt.findById(attemptId)
      .populate('student', 'name email')
      .lean();

    if (!attempt) {
      return res.status(404).json({
        success: false,
        error: 'Attempt not found'
      });
    }

    // Verify teacher owns the exam
    const exam = await Exam.findById(attempt.exam);
    if (!exam) {
      return res.status(404).json({
        success: false,
        error: 'Exam not found'
      });
    }

    if (exam.createdBy.toString() !== teacherId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to evaluate this attempt'
      });
    }

    // Get student's questions
    const questionsData = await getStudentQuestions(exam._id, attempt.student._id);

    // Merge student answers with questions
    const questionsWithAnswers = questionsData.questions.map((q, index) => {
      // Find the student's answer for this question
      // Frontend uses q0, q1, q2... (0-indexed)
      // Backend uses 1, 2, 3... (1-indexed)
      const studentAnswer = attempt.answers?.find(a => {
        return a.questionId === `q${index}` || // Match q0, q1, q2...
               a.questionId === q.number.toString() || // Match 1, 2, 3...
               a.questionId === `q${q.number}` || // Match q1, q2, q3...
               parseInt(a.questionId) === q.number; // Match numeric
      });

      console.log(`[Evaluation] Question ${q.number}:`, {
        questionNumber: q.number,
        index,
        studentAnswer: studentAnswer ? {
          questionId: studentAnswer.questionId,
          answerLength: studentAnswer.answer?.length,
          timestamp: studentAnswer.timestamp
        } : null
      });

      return {
        id: q.number.toString(),
        number: q.number,
        text: q.text,
        marks: q.marks,
        topic: q.topic,
        difficulty: q.difficulty,
        options: q.options || [],
        studentAnswer: studentAnswer?.answer || '',
        answeredAt: studentAnswer?.timestamp || null
      };
    });

    // Calculate actual total marks from questions
    const actualTotalMarks = questionsWithAnswers.reduce((sum, q) => sum + (q.marks || 0), 0);

    console.log('[Evaluation] Total marks calculation:', {
      fromQuestions: actualTotalMarks,
      fromPaperConfig: exam.paperConfig?.totalMarksPerSet,
      fromExamTotal: exam.totalMarks
    });

    // Get roll number
    const Enrollment = require('../models/Enrollment');
    const enrollment = await Enrollment.findOne({
      studentId: attempt.student._id,
      classId: exam.classId
    }).lean();

    // Calculate integrity score
    const totalViolations = attempt.integrityLogs?.length || 0;
    const integrityScore = Math.max(0, 100 - (totalViolations * 10));

    res.status(200).json({
      success: true,
      data: {
        attempt: {
          ...attempt,
          rollNumber: enrollment?.rollNumber || 'N/A',
          integrityScore
        },
        questions: questionsWithAnswers,
        exam: {
          id: exam._id,
          title: exam.title,
          totalMarks: actualTotalMarks || exam.paperConfig?.totalMarksPerSet || exam.totalMarks,
          duration: exam.duration
        }
      }
    });
  } catch (error) {
    console.error('[Evaluation] Get attempt details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch attempt details'
    });
  }
}

/**
 * Submit evaluation scores and feedback (Teacher only)
 * POST /api/v2/evaluation/attempts/:attemptId/score
 */
async function submitEvaluation(req, res) {
  try {
    const { attemptId } = req.params;
    const teacherId = req.user.id;
    const { score, feedback, perQuestionMarks } = req.body;

    // Validate input
    if (score === undefined || score < 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid score is required'
      });
    }

    // Get attempt
    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({
        success: false,
        error: 'Attempt not found'
      });
    }

    // Verify teacher owns the exam
    const exam = await Exam.findById(attempt.exam);
    if (!exam) {
      return res.status(404).json({
        success: false,
        error: 'Exam not found'
      });
    }

    if (exam.createdBy.toString() !== teacherId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to evaluate this attempt'
      });
    }

    // Validate score doesn't exceed max marks
    if (score > exam.totalMarks) {
      return res.status(400).json({
        success: false,
        error: `Score cannot exceed maximum marks (${exam.totalMarks})`
      });
    }

    // Update attempt with evaluation
    attempt.score = score;
    attempt.maxMarks = exam.totalMarks;
    attempt.feedback = feedback || '';
    attempt.perQuestionMarks = perQuestionMarks || [];
    attempt.evaluatedAt = new Date();
    attempt.evaluatedBy = teacherId;
    attempt.evaluationStatus = 'evaluated';

    await attempt.save();

    console.log(`[Evaluation] Evaluated attempt ${attemptId}, score: ${score}/${exam.totalMarks}`);

    // ==================================================================
    // PHASE 8.5: STRUCTURED LOGGING - Evaluation submitted
    // ==================================================================
    logger.logOperation('EVALUATION_SUBMITTED', {
      attemptId: attempt._id,
      examId: exam._id,
      studentId: attempt.student,
      teacherId,
      score,
      maxMarks: exam.totalMarks,
      percentage: ((score / exam.totalMarks) * 100).toFixed(2)
    });

    // Check if all attempts for this exam are now evaluated
    await checkAndFinalizeExam(exam._id);

    res.status(200).json({
      success: true,
      message: 'Evaluation submitted successfully',
      data: {
        attemptId: attempt._id,
        score: attempt.score,
        maxMarks: attempt.maxMarks,
        evaluatedAt: attempt.evaluatedAt
      }
    });
  } catch (error) {
    console.error('[Evaluation] Submit evaluation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit evaluation'
    });
  }
}

/**
 * Request AI checking for an attempt (Teacher only)
 * POST /api/v2/evaluation/attempts/:attemptId/ai-check
 */
async function requestAIChecking(req, res) {
  try {
    const { attemptId } = req.params;
    const teacherId = req.user.id;

    // Get attempt
    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({
        success: false,
        error: 'Attempt not found'
      });
    }

    // Verify attempt is submitted
    if (attempt.status !== 'submitted') {
      return res.status(400).json({
        success: false,
        error: 'Only submitted attempts can be AI-checked'
      });
    }

    // Verify teacher owns exam
    const exam = await Exam.findById(attempt.exam);
    if (!exam) {
      return res.status(404).json({
        success: false,
        error: 'Exam not found'
      });
    }

    if (exam.createdBy.toString() !== teacherId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: You can only AI-check attempts for your own exams'
      });
    }

    // Process AI checking
    const aiResult = await processAIChecking(attemptId);

    res.status(200).json({
      success: true,
      message: 'AI checking completed',
      data: {
        attemptId: attempt._id,
        aiSuggestedScore: aiResult.suggestedScore,
        aiFeedback: aiResult.feedback,
        totalMarks: exam.totalMarks,
        perQuestionFeedback: aiResult.perQuestionFeedback || []
      }
    });
  } catch (error) {
    console.error('[Evaluation] AI checking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete AI checking'
    });
  }
}

/**
 * Check if all attempts are evaluated and finalize exam
 * Helper function (not a route handler)
 */
async function checkAndFinalizeExam(examId) {
  try {
    // Get all submitted attempts for this exam
    const totalAttempts = await ExamAttempt.countDocuments({
      exam: examId,
      status: 'submitted'
    });

    // Get evaluated attempts count
    const evaluatedAttempts = await ExamAttempt.countDocuments({
      exam: examId,
      status: 'submitted',
      evaluationStatus: 'evaluated'
    });

    console.log(`[Finalization] Exam ${examId}: ${evaluatedAttempts}/${totalAttempts} attempts evaluated`);

    // If all attempts are evaluated, finalize the exam
    if (totalAttempts > 0 && evaluatedAttempts === totalAttempts) {
      await Exam.findByIdAndUpdate(examId, {
        $set: { 
          evaluationComplete: true,
          evaluationCompletedAt: new Date()
        }
      });
      console.log(`[Finalization] ✅ Exam ${examId} finalized - all attempts evaluated`);
    }
  } catch (error) {
    console.error('[Finalization] Error checking exam completion:', error);
    // Don't throw - this is a background helper, shouldn't break main flow
  }
}

/**
 * Manually finalize exam (Teacher only)
 * POST /api/v2/evaluation/exams/:examId/finalize
 */
async function finalizeExam(req, res) {
  try {
    const { examId } = req.params;
    const teacherId = req.user.id;

    // Verify exam exists and teacher owns it
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        error: 'Exam not found'
      });
    }

    if (exam.createdBy.toString() !== teacherId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: You can only finalize your own exams'
      });
    }

    // ==================================================================
    // PHASE 8.3: STATE VALIDATION - Cannot finalize before exam closed
    // ==================================================================
    if (!['closed', 'published', 'running'].includes(exam.status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot finalize exam with status: ${exam.status}. Exam must be published, running, or closed.`
      });
    }

    // Get attempt counts
    const totalAttempts = await ExamAttempt.countDocuments({
      exam: examId,
      status: { $in: ['submitted', 'auto-submitted'] }
    });

    const evaluatedAttempts = await ExamAttempt.countDocuments({
      exam: examId,
      status: { $in: ['submitted', 'auto-submitted'] },
      evaluationStatus: 'evaluated'
    });

    // Update exam
    exam.evaluationComplete = true;
    exam.evaluationCompletedAt = new Date();
    await exam.save();

    console.log(`[Finalization] Exam ${examId} manually finalized by teacher ${teacherId}`);

    res.status(200).json({
      success: true,
      message: 'Exam finalized successfully',
      data: {
        examId: exam._id,
        totalAttempts,
        evaluatedAttempts,
        evaluationComplete: exam.evaluationComplete,
        evaluationCompletedAt: exam.evaluationCompletedAt
      }
    });
  } catch (error) {
    console.error('[Finalization] Finalize exam error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to finalize exam'
    });
  }
}

module.exports = {
  getExamAttempts,
  getAttemptForEvaluation,
  submitEvaluation,
  requestAIChecking,
  finalizeExam
};
