/**
 * PHASE 7.5.2 — Evaluation Controller
 * Teacher evaluation and result management
 */

const ExamAttempt = require('../models/ExamAttempt');
const Exam = require('../models/Exam');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const { getStudentQuestions } = require('../services/paperResolver');
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
        error: 'Not authorized to evaluate this exam'
      });
    }

    // Get all submitted attempts
    const attempts = await ExamAttempt.find({
      exam: examId,
      status: { $in: ['submitted', 'auto-submitted'] }
    })
    .populate('student', 'name email rollNumber')
    .sort({ submittedAt: -1 })
    .lean();

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

    res.status(200).json({
      success: true,
      data: {
        exam: {
          id: exam._id,
          title: exam.title,
          totalMarks: exam.totalMarks,
          duration: exam.duration
        },
        attempts: attemptsWithRolls,
        totalAttempts: attemptsWithRolls.length,
        evaluated: attemptsWithRolls.filter(a => a.evaluationStatus === 'evaluated').length,
        pending: attemptsWithRolls.filter(a => a.evaluationStatus === 'pending').length
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
    const questions = await getStudentQuestions(exam._id, attempt.student._id);

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
        questions: questions.questions,
        exam: {
          id: exam._id,
          title: exam.title,
          totalMarks: exam.totalMarks,
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

    if (exam.teacher.toString() !== teacherId) {
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

module.exports = {
  getExamAttempts,
  getAttemptForEvaluation,
  submitEvaluation,
  requestAIChecking
};
