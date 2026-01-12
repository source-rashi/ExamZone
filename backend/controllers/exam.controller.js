/**
 * Exam Controller
 * Handles HTTP requests for exam management
 */

const examService = require('../services/exam.service');
const aiExamService = require('../services/aiExam.service');
const aiGenerationService = require('../services/aiGeneration.service');
const pdfGenerationService = require('../services/pdfGeneration.service');

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
 * Update an exam
 * @route PATCH /api/v2/exams/:id
 */
async function updateExam(req, res) {
  try {
    const { id } = req.params;
    const teacherId = req.body.teacherId || req.user?.id;

    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: 'Teacher ID required'
      });
    }

    const exam = await examService.updateExam(id, req.body, teacherId);

    res.status(200).json({
      success: true,
      message: 'Exam updated successfully',
      data: exam
    });
  } catch (error) {
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

    if (error.message.includes('Cannot update') || 
        error.message.includes('Cannot modify') || 
        error.message.includes('Reset exam')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update exam',
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

    if (error.message.includes('generate question sets')) {
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
/**
 * PHASE 6.3 - Generate Question Papers using AI
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

    console.log('[Generate Papers] Starting generation for exam:', id);

    // Use PHASE 6.3 AI Generation Service
    const result = await aiGenerationService.generateExamSetsWithAI(id);

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        numberOfSets: result.numberOfSets,
        totalQuestions: result.totalQuestions,
        generatedAt: result.generatedAt
      }
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

    if (error.message.includes('already generated') ||
        error.message.includes('No students')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('service not available')) {
      return res.status(503).json({
        success: false,
        message: 'AI service unavailable. Please ensure AI services are running.',
        error: error.message
      });
    }

    if (error.message.includes('Validation failed')) {
      return res.status(422).json({
        success: false,
        message: 'AI output validation failed',
        error: error.message
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
 * PHASE 6.4 - Generate Student Papers with PDFs
 * @route POST /api/v2/exams/:id/generate-student-papers
 */
async function generateStudentPapers(req, res) {
  try {
    const { id } = req.params;
    const teacherId = req.body.teacherId || req.user?.id;

    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: 'Teacher ID required'
      });
    }

    console.log('[Generate Student Papers] Starting for exam:', id);

    // Generate PDF papers for all students
    const result = await pdfGenerationService.generateStudentPapers(id);

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        papersGenerated: result.papersGenerated
      }
    });
  } catch (error) {
    console.error('[Generate Student Papers] Error:', error.message);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('must be in')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('No question sets') || error.message.includes('No enrolled students')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to generate student papers',
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

/**
 * Get exam preparation data
 * @route GET /api/v2/exams/:id/preparation-data
 */
async function getPreparationData(req, res) {
  try {
    const { id } = req.params;

    const data = await examService.getExamPreparationData(id);

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('[Get Preparation Data] Error:', error.message);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve exam preparation data',
      error: error.message
    });
  }
}

/**
 * PHASE 6.3 — Generate exam sets with AI
 * @route POST /api/v2/exams/:id/generate
 */
async function generateExamSetsWithAI(req, res) {
  try {
    const { id } = req.params;

    console.log('[Generate Exam Sets] Starting AI generation for exam:', id);

    // Run the complete AI generation pipeline
    const result = await aiGenerationService.generateExamSetsWithAI(id);

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        numberOfSets: result.numberOfSets,
        totalQuestions: result.totalQuestions,
        generatedAt: result.generatedAt
      }
    });
  } catch (error) {
    console.error('[Generate Exam Sets] Error:', error.message);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('already generated')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('service not available')) {
      return res.status(503).json({
        success: false,
        message: 'AI service unavailable. Please ensure AI services are running.',
        error: error.message
      });
    }

    if (error.message.includes('Validation failed')) {
      return res.status(422).json({
        success: false,
        message: 'AI output validation failed',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to generate exam sets',
      error: error.message
    });
  }
}

/**
 * Get exam by ID
 * @route GET /api/v2/exams/:id
 */
async function getExamById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const exam = await examService.getExamById(id, userId);

    res.status(200).json({
      success: true,
      data: exam
    });
  } catch (error) {
    console.error('[Get Exam] Error:', error.message);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get exam',
      error: error.message
    });
  }
}

module.exports = {
  createExam,
  updateExam,
  publishExam,
  generateQuestionPapers,
  generateStudentPapers,
  triggerEvaluation,
  generateSets,
  resetGeneration,
  getPreparationData,
  generateExamSetsWithAI,
  getExamById
};
