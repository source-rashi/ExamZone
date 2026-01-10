/**
 * Exam Controller
 * Handles HTTP requests for exam management
 */

const examService = require('../services/exam.service');

/**
 * Create a new exam
 * @route POST /api/v2/exams
 */
async function createExam(req, res) {
  try {
    const { classId, title, createdBy, ...rest } = req.body;

    if (!classId || !title || !createdBy) {
      return res.status(400).json({
        success: false,
        message: 'classId, title, and createdBy are required'
      });
    }

    const exam = await examService.createExam({
      classId,
      title,
      createdBy,
      ...rest
    });

    res.status(201).json({
      success: true,
      message: 'Exam created successfully',
      data: exam
    });
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('does not exist')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('not authorized') || error.message.includes('Only teachers')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create exam',
      error: error.message
    });
  }
}

/**
 * Publish an exam
 * @route PATCH /api/v2/exams/:examId/publish
 */
async function publishExam(req, res) {
  try {
    const { examId } = req.params;
    const { userId } = req.body;

    if (!examId) {
      return res.status(400).json({
        success: false,
        message: 'examId is required'
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required for authorization'
      });
    }

    const exam = await examService.publishExam(examId, userId);

    res.status(200).json({
      success: true,
      message: 'Exam published successfully',
      data: exam
    });
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('does not exist')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('not authorized') || error.message.includes('Only the creator')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('already published') || error.message.includes('cannot be published')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to publish exam',
      error: error.message
    });
  }
}

module.exports = {
  createExam,
  publishExam
};
