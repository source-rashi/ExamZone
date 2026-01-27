/**
 * Exam Controller
 * Handles HTTP requests for exam management
 */

const examService = require('../services/exam.service');
const aiExamService = require('../services/aiExam.service');
const aiGenerationService = require('../services/aiGeneration.service');
const pdfGenerationService = require('../services/pdfGeneration.service');
const examStorage = require('../services/examStorage.service');
const logger = require('../config/logger');
const path = require('path');

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

    // PHASE 8.5: Log exam creation
    logger.logOperation('EXAM_CREATED', {
      examId: exam._id,
      title: exam.title,
      classId: exam.classId,
      createdBy: exam.createdBy,
      userId: req.user?.id
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
    const teacherId = req.user?.id;

    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
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
    const teacherId = req.user?.id;

    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    console.log('[Generate Papers] ⚡ Starting generation for exam:', id);

    // TASK 2 - Validate question source first
    await examService.prepareExam(id, teacherId);

    // TASK 3 - Use PHASE 6.3 AI Generation Service
    const result = await aiGenerationService.generateExamSetsWithAI(id);

    console.log('[Generate Papers] ✅ Generation complete. Exam status:', result.exam?.status);

    // CRITICAL: Return the updated exam object so frontend can update state
    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        numberOfSets: result.numberOfSets,
        totalQuestions: result.totalQuestions,
        studentsDistributed: result.studentsDistributed,
        generatedAt: result.generatedAt,
        exam: result.exam // CRITICAL: Include updated exam
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
    const teacherId = req.user?.id;

    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    console.log('[Generate Student Papers] ⚡ Starting for exam:', id);

    // Use new studentPaper service
    const studentPaperService = require('../services/studentPaper.service');
    const result = await studentPaperService.generateStudentPapers(id);

    console.log('[Generate Student Papers] ✅ Complete. Exam status:', result.exam?.status);

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        papersGenerated: result.papersGenerated,
        exam: result.exam // Return updated exam
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

    if (error.message.includes('Cannot generate') || error.message.includes('already generated')) {
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
    const teacherId = req.user?.id;

    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
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
    const teacherId = req.user?.id;

    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
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
 * PHASE 7.3.2: Student-safe exam detail API
 */
async function getExamById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const exam = await examService.getExamById(id, userId, userRole);

    // PHASE 7.3.2: Filter sensitive fields for students
    let responseData = exam;
    if (userRole === 'student') {
      // Student only sees essential exam information
      responseData = {
        _id: exam._id,
        title: exam.title,
        description: exam.description,
        status: exam.status,
        startTime: exam.startTime,
        endTime: exam.endTime,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        attemptsAllowed: exam.attemptsAllowed,
        classId: exam.classId, // populated with name and subject
        mode: exam.mode,
        paperConfig: exam.paperConfig, // Include for marks display
        numberOfSets: exam.numberOfSets // Include for marks display
      };
    }

    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('[Get Exam] Error:', error.message);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('not yet available') || error.message.includes('not enrolled')) {
      return res.status(403).json({
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

/**
 * TASK 5 - Get Student Papers for Teacher View
 * @route GET /api/v2/exams/:id/papers
 */
async function getStudentPapers(req, res) {
  try {
    const { id } = req.params;
    const teacherId = req.user?.id;

    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: 'Teacher ID required'
      });
    }

    const exam = await examService.getExamById(id, teacherId);

    // Verify teacher owns the exam
    if (exam.createdBy._id.toString() !== teacherId) {
      return res.status(403).json({
        success: false,
        message: 'Only the exam creator can view student papers'
      });
    }

    // Populate student details
    await exam.populate('studentPapers.studentId', 'name email');

    res.status(200).json({
      success: true,
      data: {
        examTitle: exam.title,
        totalPapers: exam.studentPapers?.length || 0,
        papers: exam.studentPapers || []
      }
    });
  } catch (error) {
    console.error('[Get Student Papers] Error:', error.message);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get student papers',
      error: error.message
    });
  }
}

/**
 * PHASE 7.3.3 - Get Student's Own Paper (Secure Resolution)
 * @route GET /api/v2/exams/:id/my-paper
 */
async function getMyPaper(req, res) {
  try {
    const { id } = req.params;
    const studentId = req.user?.id;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // PHASE 7.3.3: Use secure paper resolver
    const { getStudentPaper } = require('../utils/paperResolver');
    const paperData = await getStudentPaper(id, studentId);

    res.status(200).json({
      success: true,
      data: {
        // Student info
        rollNumber: paperData.student.rollNumber,
        
        // Exam info
        examTitle: paperData.exam.title,
        examDescription: paperData.exam.description,
        duration: paperData.exam.duration,
        totalMarks: paperData.exam.totalMarks,
        startTime: paperData.exam.startTime,
        endTime: paperData.exam.endTime,
        instructions: paperData.exam.instructions,
        
        // Paper assignment
        setId: paperData.paper.setId,
        paperPreview: paperData.paper.paperPreview,
        generatedAt: paperData.paper.generatedAt,
        
        // Paper availability
        isPaperGenerated: true,
        canDownload: ['published', 'running', 'closed'].includes(paperData.exam.status)
      }
    });
  } catch (error) {
    console.error('[Get My Paper] Error:', error.message);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('not yet available') || 
        error.message.includes('not enrolled') ||
        error.message.includes('not been generated')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get paper',
      error: error.message
    });
  }
}

/**
 * PHASE 7.3.4 - Download Paper PDF (Secure Student Access)
 * @route GET /api/v2/exams/:id/papers/:rollNumber/download
 */
async function downloadPaper(req, res) {
  try {
    const { id, rollNumber } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const exam = await examService.getExamById(id, userId, userRole);

    // Find paper
    const paper = exam.studentPapers?.find(p => p.rollNumber === parseInt(rollNumber));

    if (!paper) {
      return res.status(404).json({
        success: false,
        message: 'Paper not found'
      });
    }

    // PHASE 7.3.4: Authorization check
    const isTeacher = exam.createdBy?._id ? exam.createdBy._id.toString() === userId : false;
    const isStudent = userRole === 'student';
    
    if (isStudent) {
      // ==================================================================
      // PHASE 8.3: SECURITY - Students cannot download papers before published
      // ==================================================================
      if (!['published', 'running', 'closed'].includes(exam.status)) {
        return res.status(403).json({
          success: false,
          message: 'Paper not yet available. Exam must be published first.'
        });
      }

      // PHASE 7.3.4: Students MUST own the rollNumber they're requesting
      const Enrollment = require('../models/Enrollment');
      const enrollment = await Enrollment.findOne({
        classId: exam.classId._id,
        studentId: userId,
        status: 'active'
      });

      if (!enrollment) {
        return res.status(403).json({
          success: false,
          message: 'You are not enrolled in this class'
        });
      }

      // PHASE 7.3.4: Verify rollNumber matches enrollment
      if (enrollment.rollNumber !== parseInt(rollNumber)) {
        return res.status(403).json({
          success: false,
          message: 'You can only download your own paper'
        });
      }
    } else if (!isTeacher) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to download this paper'
      });
    }

    // ==================================================================
    // PHASE 8.4: SECURE FILE ACCESS - Validate path, size, MIME type
    // ==================================================================
    const fileSecurityUtil = require('../utils/fileSecurityUtil');
    const pdfPath = paper.paperPath || paper.pdfPath;
    
    if (!pdfPath) {
      return res.status(404).json({
        success: false,
        message: 'PDF file path not found'
      });
    }

    // Secure file access validation
    const fileValidation = fileSecurityUtil.secureFileAccess(pdfPath, {
      checkExists: true,
      allowedMimeTypes: ['application/pdf'],
      maxSize: fileSecurityUtil.MAX_FILE_SIZE
    });

    if (!fileValidation.valid) {
      console.error('[Download Paper] Security validation failed:', fileValidation.errors);
      return res.status(400).json({
        success: false,
        message: 'File security validation failed',
        errors: fileValidation.errors
      });
    }

    // Use validated safe path
    const safePath = fileValidation.safePath;

    res.download(safePath, `${exam.title}_Roll_${rollNumber}.pdf`);
  } catch (error) {
    console.error('[Download Paper] Error:', error.message);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to download paper',
      error: error.message
    });
  }
}

/**
 * PHASE 6.4 - Get Full Exam Details
 * @route GET /api/v2/exams/:id/details
 */
async function getExamDetails(req, res) {
  try {
    const { id } = req.params;
    const studentPaperService = require('../services/studentPaper.service');
    
    const exam = await studentPaperService.getExamDetails(id);

    res.status(200).json({
      success: true,
      data: exam
    });
  } catch (error) {
    console.error('[Get Exam Details] Error:', error.message);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get exam details',
      error: error.message
    });
  }
}

/**
 * PHASE 6.4 - List All Set PDFs
 * @route GET /api/exams/:id/files/sets
 */
async function listSetFiles(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const exam = await examService.getExamById(id, userId);

    // Check if user is teacher/creator
    if (exam.createdBy._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only exam creator can access set files'
      });
    }

    // Get set files info
    const setFiles = exam.setMasterPapers || [];

    res.status(200).json({
      success: true,
      data: {
        examId: exam._id,
        examTitle: exam.title,
        totalSets: setFiles.length,
        sets: setFiles.map(set => ({
          setId: set.setId,
          questionCount: set.questionCount,
          totalMarks: set.totalMarks,
          generatedAt: set.generatedAt,
          downloadUrl: `/api/exams/${id}/files/sets/${set.setId}`
        }))
      }
    });
  } catch (error) {
    console.error('[List Set Files] Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to list set files',
      error: error.message
    });
  }
}

/**
 * PHASE 6.4 - Download Set Master PDF
 * @route GET /api/exams/:id/files/sets/:setId
 */
async function downloadSetPdf(req, res) {
  try {
    const { id, setId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const exam = await examService.getExamById(id, userId);

    // Check if user is teacher/creator
    if (exam.createdBy._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only exam creator can download set PDFs'
      });
    }

    // Find set PDF
    const setPdf = exam.setMasterPapers?.find(s => s.setId === setId);

    if (!setPdf) {
      return res.status(404).json({
        success: false,
        message: 'Set PDF not found'
      });
    }

    // ==================================================================
    // PHASE 8.4: SECURE FILE ACCESS - Validate path, size, MIME type
    // ==================================================================
    const fileSecurityUtil = require('../utils/fileSecurityUtil');
    const fileValidation = fileSecurityUtil.secureFileAccess(setPdf.pdfPath, {
      checkExists: true,
      allowedMimeTypes: ['application/pdf'],
      maxSize: fileSecurityUtil.MAX_FILE_SIZE
    });

    if (!fileValidation.valid) {
      console.error('[Download Set PDF] Security validation failed:', fileValidation.errors);
      return res.status(400).json({
        success: false,
        message: 'File security validation failed',
        errors: fileValidation.errors
      });
    }

    // Send file using validated safe path
    res.download(fileValidation.safePath, `${exam.title}_${setId}_Master.pdf`);
  } catch (error) {
    console.error('[Download Set PDF] Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to download set PDF',
      error: error.message
    });
  }
}

/**
 * PHASE 6.4 - List All Student Papers
 * @route GET /api/exams/:id/files/students
 */
async function listStudentFiles(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const exam = await examService.getExamById(id, userId);

    // Check if user is teacher/creator
    if (exam.createdBy._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only exam creator can access student files'
      });
    }

    // Get student files info
    const studentFiles = exam.studentPapers || [];

    res.status(200).json({
      success: true,
      data: {
        examId: exam._id,
        examTitle: exam.title,
        totalStudents: studentFiles.length,
        students: studentFiles.map(paper => ({
          rollNumber: paper.rollNumber,
          name: paper.name,
          setId: paper.setId,
          generatedAt: paper.generatedAt,
          status: paper.status,
          downloadUrl: `/api/exams/${id}/papers/${paper.rollNumber}/download`
        }))
      }
    });
  } catch (error) {
    console.error('[List Student Files] Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to list student files',
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
  getExamById,
  getStudentPapers,
  getMyPaper,
  downloadPaper,
  getExamDetails,
  listSetFiles,
  downloadSetPdf,
  listStudentFiles
};
