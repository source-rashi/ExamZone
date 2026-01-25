/**
 * PHASE 6.1 — Exam Controller
 * Handles HTTP requests for exam management
 */

const examService = require('../services/exam.service');
const attemptService = require('../services/attempt.service');

/**
 * Create exam (Teacher only)
 * POST /api/exams
 */
async function createExam(req, res) {
  try {
    const teacherId = req.user.id;
    const exam = await examService.createExam(req.body, teacherId);

    res.status(201).json({
      success: true,
      message: 'Exam created successfully',
      data: { exam }
    });
  } catch (error) {
    console.error('Create exam error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create exam'
    });
  }
}

/**
 * Publish exam (Teacher only)
 * POST /api/exams/:id/publish
 */
async function publishExam(req, res) {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;

    const exam = await examService.publishExam(id, teacherId);

    res.status(200).json({
      success: true,
      message: 'Exam published successfully',
      data: { exam }
    });
  } catch (error) {
    console.error('Publish exam error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to publish exam'
    });
  }
}

/**
 * Close exam (Teacher only)
 * POST /api/exams/:id/close
 */
async function closeExam(req, res) {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;

    const exam = await examService.closeExam(id, teacherId);

    res.status(200).json({
      success: true,
      message: 'Exam closed successfully',
      data: { exam }
    });
  } catch (error) {
    console.error('Close exam error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to close exam'
    });
  }
}

/**
 * Get class exams (Teacher only)
 * GET /api/exams/class/:classId
 */
async function getClassExams(req, res) {
  try {
    const { classId } = req.params;
    const teacherId = req.user.id;

    const exams = await examService.getClassExams(classId, teacherId);

    res.status(200).json({
      success: true,
      message: 'Exams fetched successfully',
      data: { exams }
    });
  } catch (error) {
    console.error('Get class exams error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch exams'
    });
  }
}

/**
 * Get all exams for student across all enrolled classes — PHASE 7.0
 * @route GET /api/v2/student/exams/all
 */
async function getAllStudentExams(req, res) {
  try {
    const studentId = req.user.id;
    
    console.log('[Get All Student Exams] Request from:', studentId);
    
    const Enrollment = require('../models/Enrollment');
    const Exam = require('../models/Exam');
    const mongoose = require('mongoose');
    
    // Get all active enrollments for this student
    const enrollments = await Enrollment.find({
      studentId: new mongoose.Types.ObjectId(studentId),
      status: 'active'
    }).select('classId');
    
    const classIds = enrollments.map(e => e.classId);
    console.log('[Get All Student Exams] Enrolled in classes:', classIds.length);
    
    if (classIds.length === 0) {
      return res.status(200).json({
        success: true,
        exams: []
      });
    }
    
    // Get all exams from enrolled classes with visible status
    const exams = await Exam.find({
      classId: { $in: classIds },
      status: { $in: ['published', 'running', 'closed', 'ended'] }
    })
    .populate('classId', 'name title code')
    .sort({ scheduledAt: 1 });
    
    console.log('[Get All Student Exams] Found exams:', exams.length);
    
    res.status(200).json({
      success: true,
      exams
    });
  } catch (error) {
    console.error('[Get All Student Exams] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exams',
      error: error.message
    });
  }
}

/**
 * Get student exams (Student only)
 * GET /api/exams/student/:classId
 */
async function getStudentExams(req, res) {
  try {
    const { classId } = req.params;
    const studentId = req.user.id;

    const exams = await examService.getStudentExams(classId, studentId);

    res.status(200).json({
      success: true,
      message: 'Exams fetched successfully',
      data: { exams }
    });
  } catch (error) {
    console.error('Get student exams error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch exams'
    });
  }
}

/**
 * Start exam attempt (Student only)
 * POST /api/exams/:id/start
 */
async function startAttempt(req, res) {
  try {
    const { id } = req.params;
    const studentId = req.user.id;

    const attempt = await attemptService.startAttempt(id, studentId);

    res.status(201).json({
      success: true,
      message: 'Exam attempt started successfully',
      data: { attempt }
    });
  } catch (error) {
    console.error('Start attempt error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to start exam attempt'
    });
  }
}

/**
 * Submit exam attempt (Student only)
 * POST /api/exams/:attemptId/submit
 */
async function submitAttempt(req, res) {
  try {
    const { attemptId } = req.params;
    const studentId = req.user.id;

    const attempt = await attemptService.submitAttempt(attemptId, studentId, req.body);

    res.status(200).json({
      success: true,
      message: 'Exam submitted successfully',
      data: { attempt }
    });
  } catch (error) {
    console.error('Submit attempt error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to submit exam'
    });
  }
}

module.exports = {
  createExam,
  publishExam,
  closeExam,
  getClassExams,
  getAllStudentExams,
  getStudentExams,
  startAttempt,
  submitAttempt
};
