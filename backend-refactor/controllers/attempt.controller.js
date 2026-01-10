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

/**
 * Record integrity violation
 * @route POST /api/v2/attempts/:id/violation
 */
async function recordViolation(req, res) {
  try {
    const { id } = req.params;
    const { type } = req.body;

    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Violation type is required'
      });
    }

    const attempt = await attemptService.recordIntegrityEvent(id, type);

    res.status(200).json({
      success: true,
      message: 'Violation recorded',
      data: {
        attemptId: attempt._id,
        status: attempt.status,
        integrity: attempt.integrity
      }
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (
      error.message.includes('not in_progress') ||
      error.message.includes('not live') ||
      error.message.includes('Invalid event type')
    ) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to record violation',
      error: error.message
    });
  }
}

/**
 * Record heartbeat
 * @route POST /api/v2/attempts/:id/heartbeat
 */
async function recordHeartbeat(req, res) {
  try {
    const { id } = req.params;

    const attempt = await attemptService.recordHeartbeat(id);

    res.status(200).json({
      success: true,
      message: 'Heartbeat recorded',
      data: {
        attemptId: attempt._id,
        status: attempt.status,
        lastActiveAt: attempt.integrity?.lastActiveAt,
        autoSubmitted: attempt.integrity?.autoSubmitted
      }
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (
      error.message.includes('not in_progress') ||
      error.message.includes('not live')
    ) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to record heartbeat',
      error: error.message
    });
  }
}

/**
 * Submit answer sheet (Phase 3.6)
 * @route POST /api/v2/attempts/:id/submit-sheet
 */
async function submitAnswerSheet(req, res) {
  try {
    const { id } = req.params;
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: 'filePath is required'
      });
    }

    const attempt = await attemptService.submitAnswerSheet(id, filePath);

    res.status(200).json({
      success: true,
      message: 'Answer sheet submitted',
      data: {
        attemptId: attempt._id,
        status: attempt.status,
        answerSheetPath: attempt.answerSheetPath
      }
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (
      error.message.includes('Cannot submit answer sheet') ||
      error.message.includes('file not found')
    ) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to submit answer sheet',
      error: error.message
    });
  }
}

module.exports = {
  startAttempt,
  recordViolation,
  recordHeartbeat,
  submitAnswerSheet
};
