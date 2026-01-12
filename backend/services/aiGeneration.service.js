/**
 * PHASE 6.3 — CONTROLLED AI INTEGRATION LAYER
 * 
 * This service handles AI-powered exam question set generation.
 * 
 * CRITICAL RULES:
 * - AI never writes to DB directly
 * - AI only works on preparation payload
 * - AI returns JSON only (no PDFs, no UI)
 * - All AI output must be validated before saving
 * - No student exam flow yet
 */

const axios = require('axios');
const Exam = require('../models/Exam');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');

// AI service URLs
const QUESTION_GENERATOR_URL = process.env.QUESTION_GENERATOR_URL || 'http://127.0.0.1:5001';
const ANSWER_CHECKER_URL = process.env.ANSWER_CHECKER_URL || 'http://127.0.0.1:5002';

/**
 * TASK 1 — Build Exam AI Preparation Payload
 * 
 * Collects all necessary data from DB and returns clean JSON payload.
 * Does NOT call AI services yet.
 * 
 * @param {string} examId - Exam ID
 * @returns {Promise<Object>} Clean payload for AI processing
 */
async function buildExamAIPayload(examId) {
  try {
    // Load exam with class data
    const exam = await Exam.findById(examId).populate('classId');
    if (!exam) {
      throw new Error('Exam not found');
    }

    // Verify exam is in correct state for generation
    if (exam.generationStatus === 'generated') {
      throw new Error('Exam sets already generated');
    }

    // Load enrolled students to get roll numbers
    const enrollments = await Enrollment.find({ 
      classId: exam.classId._id 
    }).populate('studentId', 'name email rollNumber');

    const students = enrollments
      .filter(e => e.studentId && e.studentId.rollNumber)
      .map(e => ({
        rollNumber: e.studentId.rollNumber,
        name: e.studentId.name,
        email: e.studentId.email
      }));

    // Build clean payload
    const payload = {
      examId: examId,
      examMetadata: {
        title: exam.title,
        description: exam.description,
        totalMarks: exam.totalMarks,
        duration: exam.duration,
        mode: exam.mode
      },
      questionSource: {
        type: exam.questionSource?.type || 'text',
        content: exam.questionSource?.content || '',
        filePath: exam.questionSource?.filePath || ''
      },
      numberOfSets: exam.numberOfSets || 1,
      rollNumbers: students.map(s => s.rollNumber),
      students: students,
      constraints: {
        totalMarks: exam.totalMarks,
        duration: exam.duration,
        minimumQuestionsPerSet: 5
      }
    };

    return payload;
  } catch (error) {
    console.error('[AI Payload Builder] Error:', error.message);
    throw error;
  }
}

/**
 * TASK 2 — AI Question Normalization Layer
 * 
 * Calls AI service to:
 * - Read teacher input (latex/pdf/text)
 * - Extract questions if PDF
 * - Complete incomplete questions
 * - Normalize formatting
 * - Tag questions by topic, difficulty, marks
 * 
 * Returns structured base question bank.
 * Does NOT generate sets yet.
 * 
 * @param {Object} payload - Payload from buildExamAIPayload
 * @returns {Promise<Array>} Normalized question bank
 */
async function aiNormalizeQuestions(payload) {
  try {
    console.log('[AI Normalize] Processing question source:', payload.questionSource.type);

    // Prepare request for question generator service
    const requestData = {
      source_type: payload.questionSource.type,
      content: payload.questionSource.content,
      file_path: payload.questionSource.filePath,
      total_marks: payload.examMetadata.totalMarks,
      exam_title: payload.examMetadata.title
    };

    // Call AI service for normalization
    const response = await axios.post(
      `${QUESTION_GENERATOR_URL}/api/normalize-questions`,
      requestData,
      {
        timeout: 120000, // 2 minutes
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.data || !response.data.success) {
      throw new Error(response.data?.error || 'AI normalization failed');
    }

    const normalizedQuestions = response.data.questions || [];

    console.log('[AI Normalize] Normalized', normalizedQuestions.length, 'questions');

    // Validate normalization output
    const validQuestions = normalizedQuestions.filter(q => 
      q.questionText && 
      q.marks && 
      q.topic && 
      q.difficulty
    );

    if (validQuestions.length === 0) {
      throw new Error('No valid questions after normalization');
    }

    return validQuestions;
  } catch (error) {
    console.error('[AI Normalize] Error:', error.message);
    
    // If AI service is not available, return error with details
    if (error.code === 'ECONNREFUSED') {
      throw new Error(`AI Question Generator service not available at ${QUESTION_GENERATOR_URL}`);
    }
    
    throw error;
  }
}

/**
 * TASK 3 — AI Exam Set Generation Layer
 * 
 * Calls AI service to:
 * - Balance difficulty across sets
 * - Avoid similar question placement
 * - Shuffle variants
 * - Ensure full paper coverage
 * - Generate N distinct sets
 * 
 * Returns structured sets.
 * Does NOT write to DB.
 * 
 * @param {Array} normalizedQuestions - Questions from aiNormalizeQuestions
 * @param {number} numberOfSets - Number of sets to generate
 * @param {Object} constraints - Additional constraints
 * @returns {Promise<Array>} Generated question sets
 */
async function aiGenerateExamSets(normalizedQuestions, numberOfSets, constraints = {}) {
  try {
    console.log('[AI Generate Sets] Creating', numberOfSets, 'sets from', normalizedQuestions.length, 'questions');

    // Prepare request for set generation
    const requestData = {
      questions: normalizedQuestions,
      number_of_sets: numberOfSets,
      total_marks: constraints.totalMarks,
      minimum_questions: constraints.minimumQuestionsPerSet || 5,
      balance_difficulty: true,
      shuffle_variants: true
    };

    // Call AI service for set generation
    const response = await axios.post(
      `${QUESTION_GENERATOR_URL}/api/generate-sets`,
      requestData,
      {
        timeout: 180000, // 3 minutes
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.data || !response.data.success) {
      throw new Error(response.data?.error || 'AI set generation failed');
    }

    const generatedSets = response.data.sets || [];

    console.log('[AI Generate Sets] Generated', generatedSets.length, 'sets');

    // Basic validation
    if (generatedSets.length !== numberOfSets) {
      console.warn('[AI Generate Sets] Warning: Expected', numberOfSets, 'sets but got', generatedSets.length);
    }

    return generatedSets;
  } catch (error) {
    console.error('[AI Generate Sets] Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      throw new Error(`AI Question Generator service not available at ${QUESTION_GENERATOR_URL}`);
    }
    
    throw error;
  }
}

/**
 * TASK 4 — Validation and Storage
 * 
 * Validates AI output before storing:
 * - Every set has questions
 * - Total marks correct
 * - No empty sets
 * - No duplicate questions
 * - No missing metadata
 * 
 * Only after validation, stores generated sets.
 * 
 * @param {string} examId - Exam ID
 * @param {Array} generatedSets - Sets from aiGenerateExamSets
 * @returns {Promise<Object>} Storage result
 */
async function validateAndStoreSets(examId, generatedSets, studentDistribution = []) {
  try {
    console.log('[Validate & Store] Validating', generatedSets.length, 'sets');

    // Load exam
    const exam = await Exam.findById(examId);
    if (!exam) {
      throw new Error('Exam not found');
    }

    // VALIDATION CHECKS

    // 1. Check every set has questions
    const emptySets = generatedSets.filter(set => !set.questions || set.questions.length === 0);
    if (emptySets.length > 0) {
      throw new Error(`Validation failed: ${emptySets.length} set(s) have no questions`);
    }

    // 2. Check total marks for each set
    const invalidMarksSets = generatedSets.filter(set => {
      const totalMarks = set.questions.reduce((sum, q) => sum + (q.marks || 0), 0);
      return Math.abs(totalMarks - exam.totalMarks) > 5; // Allow 5 marks tolerance
    });
    if (invalidMarksSets.length > 0) {
      throw new Error(`Validation failed: ${invalidMarksSets.length} set(s) have incorrect total marks`);
    }

    // 3. Check for empty questions
    const setsWithEmptyQuestions = generatedSets.filter(set => 
      set.questions.some(q => !q.questionText || q.questionText.trim() === '')
    );
    if (setsWithEmptyQuestions.length > 0) {
      throw new Error(`Validation failed: ${setsWithEmptyQuestions.length} set(s) have empty questions`);
    }

    // 4. Check for duplicate questions within each set
    for (let i = 0; i < generatedSets.length; i++) {
      const set = generatedSets[i];
      const questionTexts = new Set();
      for (const q of set.questions) {
        if (questionTexts.has(q.questionText)) {
          throw new Error(`Validation failed: Set ${i + 1} contains duplicate questions`);
        }
        questionTexts.add(q.questionText);
      }
    }

    // 5. Check for missing metadata
    const setsWithMissingMetadata = generatedSets.filter(set =>
      set.questions.some(q => !q.topic || !q.difficulty || q.marks === undefined)
    );
    if (setsWithMissingMetadata.length > 0) {
      throw new Error(`Validation failed: ${setsWithMissingMetadata.length} set(s) have incomplete metadata`);
    }

    console.log('[Validate & Store] All validations passed');

    // STORAGE

    // Prepare sets with proper structure
    const setsToStore = generatedSets.map((set, index) => ({
      setId: `SET-${String(index + 1).padStart(3, '0')}`,
      questions: set.questions.map(q => ({
        questionText: q.questionText,
        marks: q.marks,
        topic: q.topic || 'General',
        difficulty: q.difficulty || 'medium',
        options: q.options || [],
        correctAnswer: q.correctAnswer || ''
      })),
      totalMarks: set.questions.reduce((sum, q) => sum + (q.marks || 0), 0),
      generatedAt: new Date()
    }));

    // Update exam with generated sets and student distribution
    exam.generatedSets = setsToStore;
    
    // Prepare setMap from student distribution
    if (studentDistribution && studentDistribution.length > 0) {
      const setGroups = {};
      studentDistribution.forEach(mapping => {
        if (!setGroups[mapping.setId]) {
          setGroups[mapping.setId] = [];
        }
        setGroups[mapping.setId].push(mapping.rollNumber);
      });
      
      exam.setMap = Object.keys(setGroups).map(setId => ({
        setId: setId,
        assignedRollNumbers: setGroups[setId]
      }));
    }

    await exam.save();

    console.log('[Validate & Store] Stored', setsToStore.length, 'sets successfully');
    if (studentDistribution && studentDistribution.length > 0) {
      console.log('[Validate & Store] Distributed', studentDistribution.length, 'students');
    }

    return {
      success: true,
      setsStored: setsToStore.length,
      totalQuestions: setsToStore.reduce((sum, set) => sum + set.questions.length, 0),
      studentsDistributed: studentDistribution ? studentDistribution.length : 0
    };
  } catch (error) {
    console.error('[Validate & Store] Error:', error.message);
    throw error;
  }
}

/**
 * TASK 5 — Complete Generation Pipeline (PHASE 6.2-6.3)
 * 
 * Orchestrates the full AI generation flow:
 * 1. Prepare exam (validate & lock)
 * 2. Load preparation payload
 * 3. Normalize via AI
 * 4. Generate sets via AI
 * 5. Distribute students to sets
 * 6. Validate & Store
 * 7. Move to 'prepared' status
 * 
 * @param {string} examId - Exam ID
 * @returns {Promise<Object>} Generation summary
 */
async function generateExamSetsWithAI(examId) {
  let exam = null;
  
  try {
    console.log('[AI Pipeline] Starting generation for exam:', examId);

    // Load exam and verify status
    exam = await Exam.findById(examId).populate('classId');
    if (!exam) {
      throw new Error('Exam not found');
    }

    // TASK 8 - Only allow generation from draft status (cannot regenerate without reset)
    if (exam.status !== 'draft') {
      throw new Error(`Cannot generate from ${exam.status} status. Exam must be in draft. Use reset to regenerate.`);
    }

    // TASK 8 - Prevent regeneration if already generated (must reset first)
    if (exam.generationStatus === 'generated') {
      throw new Error('Exam sets already generated. Use reset to regenerate.');
    }

    // Set to preparing status
    exam.generationStatus = 'preparing';
    await exam.save();

    // STEP 1: Build payload
    console.log('[AI Pipeline] Step 1: Building payload...');
    const payload = await buildExamAIPayload(examId);

    // STEP 2: Normalize questions via AI
    console.log('[AI Pipeline] Step 2: Normalizing questions...');
    const normalizedQuestions = await aiNormalizeQuestions(payload);

    // STEP 3: Generate sets via AI
    console.log('[AI Pipeline] Step 3: Generating sets...');
    const generatedSets = await aiGenerateExamSets(
      normalizedQuestions,
      payload.numberOfSets,
      payload.constraints
    );

    // STEP 4: Distribute students to sets
    console.log('[AI Pipeline] Step 4: Distributing students...');
    const studentDistribution = distributeStudentsToSets(
      payload.students,
      generatedSets
    );

    // STEP 5: Validate and store
    console.log('[AI Pipeline] Step 5: Validating and storing...');
    const storageResult = await validateAndStoreSets(examId, generatedSets, studentDistribution);

    // STEP 6: Move exam to 'prepared' status
    exam = await Exam.findById(examId);
    exam.status = 'prepared';
    exam.generationStatus = 'generated';
    exam.lockedAfterGeneration = true;
    await exam.save();
    
    console.log('[AI Pipeline] Exam moved to PREPARED status. Ready for student paper generation.');

    // STEP 7: Return summary
    const summary = {
      success: true,
      message: 'Question sets generated successfully',
      numberOfSets: storageResult.setsStored,
      totalQuestions: storageResult.totalQuestions,
      studentsDistributed: studentDistribution.length,
      generatedAt: new Date()
    };

    console.log('[AI Pipeline] Generation complete:', summary);

    return summary;
  } catch (error) {
    console.error('[AI Pipeline] Generation failed:', error.message);
    
    // Reset to none if generation fails
    if (exam && exam.generationStatus === 'preparing') {
      exam.generationStatus = 'none';
      await exam.save();
    }
    
    throw error;
  }
}

/**
 * Distribute Students to Sets
 * 
 * Randomly assigns students to question sets
 * Ensures even distribution
 * 
 * @param {Array} students - List of students with rollNumber
 * @param {Array} sets - Generated question sets
 * @returns {Array} Student distribution map
 */
function distributeStudentsToSets(students, sets) {
  if (!students || students.length === 0) {
    return [];
  }

  if (!sets || sets.length === 0) {
    throw new Error('Cannot distribute students: No sets available');
  }

  // Shuffle students for random distribution
  const shuffledStudents = [...students].sort(() => Math.random() - 0.5);
  
  const distribution = [];
  
  shuffledStudents.forEach((student, index) => {
    const setIndex = index % sets.length;
    const assignedSet = sets[setIndex];
    
    distribution.push({
      studentId: student.studentId || student.rollNumber, // Use studentId if available
      rollNumber: student.rollNumber,
      setId: assignedSet.setId
    });
  });

  console.log(`[Distribution] Assigned ${distribution.length} students across ${sets.length} sets`);

  return distribution;
}

module.exports = {
  buildExamAIPayload,
  aiNormalizeQuestions,
  aiGenerateExamSets,
  validateAndStoreSets,
  generateExamSetsWithAI,
  distributeStudentsToSets
};
