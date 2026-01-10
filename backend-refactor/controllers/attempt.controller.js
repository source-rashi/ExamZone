/**
 * Attempt Controller
 * Handles HTTP requests for exam attempt management
 */

const attemptService = require('../services/attempt.service');

/**
 * Start a new exam attempt
 * @route POST /api/v2/attempts
 */
async function startAttempt(req, res) {
  try {
    const { examId, studentId, questionPaperId } = req.body;

    if (!examId || !studentId) {
      return res.status(400).json({
        success: false,
        message: 'examId and studentId are required'
      });
    }

    const attempt = await attemptService.startAttempt({
      examId,
      studentId,
      questionPaperId
    });

    res.status(201).json({
      success: true,
      message: 'Attempt started successfully',
      data: attempt
    });
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('does not exist')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('not enrolled')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    if (
      error.message.includes('not published') ||
      error.message.includes('has not started') ||
      error.message.includes('has ended') ||
      error.message.includes('limit reached')
    ) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to start attempt',
      error: error.message
    });
  }
}

module.exports = {
  startAttempt
};
