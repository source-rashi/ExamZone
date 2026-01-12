/**
 * Exam Controller
 * Handles HTTP requests for exam management
 */

const examService = require('../services/exam.service');
const aiExamService = require('../services/aiExam.service');

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

/**
 * Generate question papers for exam (Phase 6.3 - AI Integration)
 * @route POST /api/v2/exams/:id/generate-papers
 */
async function generateQuestionPapers(req, res) {
  try {
    const { id } = req.params;
    const teacherId = req.body.teacherId || req.user?.id;

    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: 'Teacher ID required'
      });
    }

    // Call AI bridge service (BLACK BOX integration)
    const result = await aiExamService.generateExamPapers(id, teacherId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.stats
    });
  } catch (error) {
    console.error('[Generate Papers] Error:', error.message);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('Unauthorized') || error.message.includes('Only exam creator')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('must be published') || 
        error.message.includes('already generated') ||
        error.message.includes('No students')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to generate question papers',
      error: error.message
    });
  }
}

/**
 * Trigger AI evaluation for exam (Phase 3.6)
 * @route POST /api/v2/exams/:id/evaluate
 */
async function triggerEvaluation(req, res) {
  try {
    const { id } = req.params;

    const results = await examService.triggerEvaluation(id);

    res.status(200).json({
      success: true,
      message: `Evaluation triggered: ${results.evaluated} succeeded, ${results.failed} failed`,
      data: results
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('Cannot evaluate') || error.message.includes('No submitted attempts')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to trigger evaluation',
      error: error.message
    });
  }
}

/**
 * PHASE 6.2.5 — Generate question sets and assign students
 * @route POST /api/v2/exams/:id/generate-sets
 */
async function generateSets(req, res) {
  try {
    const { id } = req.params;
    const teacherId = req.body.teacherId || req.user?.id;

    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: 'Teacher ID required'
      });
    }

    const result = await examService.generateQuestionSets(id, teacherId);

    res.status(200).json({
      success: true,
      message: 'Question sets generated and students assigned successfully',
      data: {
        setMap: result.setMap,
        totalStudents: result.totalStudents
      }
    });
  } catch (error) {
    console.error('[Generate Sets] Error:', error.message);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('Only the exam creator') || error.message.includes('not authorized')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('already generated') || 
        error.message.includes('No students') ||
        error.message.includes('Reset exam')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to generate question sets',
      error: error.message
    });
  }
}

/**
 * Reset exam generation
 * @route POST /api/v2/exams/:id/reset-generation
 */
async function resetGeneration(req, res) {
  try {
    const { id } = req.params;
    const teacherId = req.body.teacherId || req.user?.id;

    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: 'Teacher ID required'
      });
    }

    const exam = await examService.resetExamGeneration(id, teacherId);

    res.status(200).json({
      success: true,
      message: 'Exam generation reset successfully',
      data: exam
    });
  } catch (error) {
    console.error('[Reset Generation] Error:', error.message);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('Only the exam creator')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('Cannot reset')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to reset exam generation',
      error: error.message
    });
  }
}

module.exports = {
  createExam,
  publishExam,
  generateQuestionPapers,
  triggerEvaluation,
  generateSets,
  resetGeneration
};
