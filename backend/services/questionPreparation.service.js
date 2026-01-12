/**
 * PHASE 6.2 — QUESTION SOURCE PIPELINE
 * 
 * Handles validation, storage, and preparation of teacher question sources
 * before set generation.
 * 
 * RESPONSIBILITIES:
 * - Validate question source (text/latex/pdf)
 * - Lock questions after preparation
 * - Prepare exam for set generation
 */

const Exam = require('../models/Exam');
const Enrollment = require('../models/Enrollment');

/**
 * Validate Question Source
 * 
 * Ensures question source is not empty and properly formatted
 * 
 * @param {Object} questionSource - Question source object
 * @returns {boolean} True if valid
 * @throws {Error} If invalid
 */
function validateQuestionSource(questionSource) {
  if (!questionSource) {
    throw new Error('Question source is required');
  }

  const { type, content, filePath } = questionSource;

  if (!type || !['text', 'latex', 'pdf'].includes(type)) {
    throw new Error('Invalid question source type. Must be text, latex, or pdf');
  }

  // For text/latex, content must not be empty
  if ((type === 'text' || type === 'latex') && (!content || content.trim() === '')) {
    throw new Error('Question content cannot be empty');
  }

  // For PDF, filePath must be provided
  if (type === 'pdf' && (!filePath || filePath.trim() === '')) {
    throw new Error('PDF file path is required for PDF question source');
  }

  return true;
}

/**
 * Prepare Exam for Generation
 * 
 * Validates question source and moves exam to 'prepared' status
 * Locks the question source from further editing
 * 
 * @param {string} examId - Exam ID
 * @returns {Promise<Object>} Updated exam
 */
async function prepareExam(examId) {
  try {
    const exam = await Exam.findById(examId).populate('classId');
    
    if (!exam) {
      throw new Error('Exam not found');
    }

    // Only allow preparation from draft status
    if (exam.status !== 'draft') {
      throw new Error(`Cannot prepare exam in ${exam.status} status. Must be in draft status.`);
    }

    // Validate question source
    validateQuestionSource(exam.questionSource);

    // Check if there are enrolled students
    const enrollmentCount = await Enrollment.countDocuments({ 
      classId: exam.classId._id 
    });

    if (enrollmentCount === 0) {
      throw new Error('Cannot prepare exam: No students enrolled in this class');
    }

    // Validate numberOfSets
    if (!exam.numberOfSets || exam.numberOfSets < 1) {
      throw new Error('Number of sets must be at least 1');
    }

    // Lock the exam and mark as ready for generation
    exam.lockedAfterGeneration = true;
    exam.generationStatus = 'preparing';
    
    await exam.save();

    console.log(`[Question Preparation] Exam ${examId} prepared and locked`);

    return exam;
  } catch (error) {
    console.error('[Question Preparation] Error:', error.message);
    throw error;
  }
}

/**
 * Update Question Source
 * 
 * Updates exam question source if exam is still in draft status
 * 
 * @param {string} examId - Exam ID
 * @param {Object} questionSource - New question source
 * @returns {Promise<Object>} Updated exam
 */
async function updateQuestionSource(examId, questionSource) {
  try {
    const exam = await Exam.findById(examId);
    
    if (!exam) {
      throw new Error('Exam not found');
    }

    // Prevent editing if locked
    if (exam.lockedAfterGeneration) {
      throw new Error('Cannot edit questions: Exam has been prepared. Please reset to edit.');
    }

    // Only allow updates in draft status
    if (exam.status !== 'draft') {
      throw new Error(`Cannot update questions in ${exam.status} status`);
    }

    // Validate new question source
    validateQuestionSource(questionSource);

    // Update question source
    exam.questionSource = questionSource;
    await exam.save();

    console.log(`[Question Preparation] Question source updated for exam ${examId}`);

    return exam;
  } catch (error) {
    console.error('[Question Preparation] Error:', error.message);
    throw error;
  }
}

/**
 * Reset Exam to Draft
 * 
 * Unlocks exam and resets to draft status
 * Clears generated sets and student papers
 * 
 * @param {string} examId - Exam ID
 * @returns {Promise<Object>} Reset exam
 */
async function resetExamToDraft(examId) {
  try {
    const exam = await Exam.findById(examId);
    
    if (!exam) {
      throw new Error('Exam not found');
    }

    // Don't allow reset if already published
    if (exam.status === 'published' || exam.status === 'running') {
      throw new Error('Cannot reset published or running exam');
    }

    // Reset exam
    exam.status = 'draft';
    exam.generationStatus = 'none';
    exam.lockedAfterGeneration = false;
    exam.generatedSets = [];
    exam.setMap = [];
    exam.studentPapers = [];

    await exam.save();

    console.log(`[Question Preparation] Exam ${examId} reset to draft`);

    return exam;
  } catch (error) {
    console.error('[Question Preparation] Error:', error.message);
    throw error;
  }
}

module.exports = {
  validateQuestionSource,
  prepareExam,
  updateQuestionSource,
  resetExamToDraft
};
