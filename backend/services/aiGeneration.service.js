/**
 * PHASE 6.3 — CONTROLLED AI INTEGRATION LAYER
 * PHASE 6.3.7 — HYBRID QUESTION GENERATION ENGINE (TEACHER FIRST, AI SECOND)
 * 
 * This service handles AI-powered exam question set generation.
 * 
 * CRITICAL RULES:
 * - AI never writes to DB directly
 * - AI only works on preparation payload
 * - AI returns JSON only (no PDFs, no UI)
 * - All AI output must be validated before saving
 * - Teacher questions are PRIMARY, AI is SECONDARY
 * - AI only fills gaps when teacher questions insufficient
 */

const axios = require('axios');
const Exam = require('../models/Exam');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const questionExtractor = require('./questionExtractor.service');

// AI service URLs
const QUESTION_GENERATOR_URL = process.env.QUESTION_GENERATOR_URL || 'http://127.0.0.1:5001';
const ANSWER_CHECKER_URL = process.env.ANSWER_CHECKER_URL || 'http://127.0.0.1:5002';

// Mock mode: Set to true to bypass AI services and use mock data
const MOCK_MODE = process.env.AI_MOCK_MODE === 'true' || false;

// PHASE 6.3.7 — Question Engine Modes
const QUESTION_ENGINE_MODES = {
  TEACHER_ONLY: 'TEACHER_ONLY',   // Teacher provided enough questions
  AI_AUGMENT: 'AI_AUGMENT',       // Teacher provided some, AI fills gaps
  AI_FULL: 'AI_FULL'              // No teacher questions, AI generates all
};

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
 * PHASE 6.3.7 — TASK 1: Load Teacher Questions
 * 
 * Uses dedicated extraction module to load teacher-provided questions.
 * This is a router function that calls the appropriate extractor.
 * 
 * @param {Object} exam - Exam document
 * @returns {Promise<Array>} Array of extracted teacher questions
 */
async function loadTeacherQuestions(exam) {
  try {
    console.log('[Teacher Loader] ========================================');
    console.log('[Teacher Loader] LOADING TEACHER QUESTIONS');
    console.log('[Teacher Loader] ========================================');
    
    const questionSource = exam.questionSource;
    if (!questionSource || (!questionSource.content && !questionSource.filePath)) {
      console.log('[Teacher Loader] ⚠️ No question source provided');
      return [];
    }

    const sourceType = questionSource.type || 'text';
    const sourceContent = questionSource.content || questionSource.filePath || '';

    console.log('[Teacher Loader] Source type:', sourceType);
    console.log('[Teacher Loader] Content/Path length:', sourceContent.length);

    // Call dedicated extractor module
    const extractedQuestions = await questionExtractor.extractTeacherQuestions(
      sourceType,
      sourceContent
    );

    // Enhance with exam-specific metadata
    const marksPerQuestion = extractedQuestions.length > 0
      ? Math.floor(exam.totalMarks / extractedQuestions.length)
      : 0;

    const enrichedQuestions = extractedQuestions.map((q, idx) => ({
      ...q,
      marks: q.marks || marksPerQuestion,
      topic: q.topic || exam.title || 'General',
      difficulty: q.difficulty || 'medium',
      sourceIndex: idx
    }));

    console.log('[Teacher Loader] ========================================');
    console.log('[Teacher Loader] ✅ LOADED', enrichedQuestions.length, 'TEACHER QUESTIONS');
    console.log('[Teacher Loader] ========================================');

    return enrichedQuestions;

  } catch (error) {
    console.error('[Teacher Loader] ❌ ERROR:', error.message);
    console.error('[Teacher Loader] Stack:', error.stack);
    return [];
  }
}

/**
 * PHASE 6.3.7 — TASK 2: Calculate Required Question Count
 * 
 * Determines how many questions are needed for the exam.
 * 
 * @param {Object} exam - Exam document
 * @returns {number} Required number of questions
 */
function calculateRequiredQuestions(exam) {
  const numberOfSets = exam.numberOfSets || 1;
  const totalMarks = exam.totalMarks || 100;
  
  // Estimate: 5 marks per question on average
  const estimatedQuestionsPerSet = Math.max(5, Math.ceil(totalMarks / 5));
  
  // For multiple sets, we need enough questions to create variety
  // If sets > 1, we need more questions to shuffle
  const requiredCount = numberOfSets > 1 
    ? Math.ceil(estimatedQuestionsPerSet * 1.5) // 50% more for variety
    : estimatedQuestionsPerSet;

  console.log(`[Question Count] Required: ${requiredCount} questions (${numberOfSets} sets, ${totalMarks} marks)`);
  
  return requiredCount;
}

/**
 * PHASE 6.3.7 — TASK 3: Determine Question Engine Mode
 * 
 * Analyzes teacher questions and determines AI role.
 * 
 * @param {Array} teacherQuestions - Extracted teacher questions
 * @param {number} requiredCount - Required question count
 * @returns {Object} { mode, teacherCount, requiredCount, gapCount }
 */
function determineQuestionEngineMode(teacherQuestions, requiredCount) {
  const teacherCount = teacherQuestions.length;
  
  let mode;
  let gapCount = 0;

  if (teacherCount === 0) {
    mode = QUESTION_ENGINE_MODES.AI_FULL;
    gapCount = requiredCount;
  } else if (teacherCount < requiredCount) {
    mode = QUESTION_ENGINE_MODES.AI_AUGMENT;
    gapCount = requiredCount - teacherCount;
  } else {
    mode = QUESTION_ENGINE_MODES.TEACHER_ONLY;
    gapCount = 0;
  }

  console.log(`[Question Engine] Mode: ${mode}`);
  console.log(`[Question Engine] Teacher provided: ${teacherCount}, Required: ${requiredCount}, Gap: ${gapCount}`);

  return { mode, teacherCount, requiredCount, gapCount };
}

/**
 * PHASE 6.3.7 — TASK 2 (Updated): AI Question Normalization with Hybrid Engine
 * 
 * Implements TEACHER FIRST, AI SECOND approach with HARD GUARANTEES.
 * 
 * ABSOLUTE RULES:
 * - Teacher questions ALWAYS appear in final output
 * - AI can ONLY fill gaps
 * - Teacher count is NEVER reduced
 * - Mode is determined transparently and logged
 * 
 * @param {Object} payload - Payload from buildExamAIPayload
 * @returns {Promise<Array>} Normalized question bank
 */
async function aiNormalizeQuestions(payload) {
  try {
    console.log('[Hybrid Engine] ========================================');
    console.log('[Hybrid Engine] STARTING TEACHER-FIRST HYBRID PIPELINE');
    console.log('[Hybrid Engine] ========================================');
    
    // Load exam
    const exam = await Exam.findById(payload.examId);
    if (!exam) {
      throw new Error('Exam not found');
    }

    // PHASE 6.3.7 — STAGE 1: Load Teacher Questions
    console.log('[Hybrid Engine] STAGE 1/4 — Loading teacher questions...');
    const teacherQuestions = await loadTeacherQuestions(exam);
    console.log('[Hybrid Engine] ✅ Stage 1 Complete:', teacherQuestions.length, 'teacher questions loaded');

    // PHASE 6.3.7 — STAGE 2: Calculate Requirements
    console.log('[Hybrid Engine] STAGE 2/4 — Calculating requirements...');
    const requiredCount = calculateRequiredQuestions(exam);
    console.log('[Hybrid Engine] ✅ Stage 2 Complete:', requiredCount, 'questions required');

    // PHASE 6.3.7 — STAGE 3: Determine Mode
    console.log('[Hybrid Engine] STAGE 3/4 — Determining question engine mode...');
    const engineState = determineQuestionEngineMode(teacherQuestions, requiredCount);
    console.log('[Hybrid Engine] ✅ Stage 3 Complete: Mode =', engineState.mode);
    
    let finalQuestions = [];

    // PHASE 6.3.7 — STAGE 4: Build Final Question Bank
    console.log('[Hybrid Engine] STAGE 4/4 — Building final question bank...');
    
    if (engineState.mode === QUESTION_ENGINE_MODES.TEACHER_ONLY) {
      // TEACHER_ONLY: Use teacher questions exclusively
      console.log('[Hybrid Engine] Mode = TEACHER_ONLY');
      console.log('[Hybrid Engine] AI will NOT generate any questions');
      console.log('[Hybrid Engine] Using teacher questions only');
      
      finalQuestions = teacherQuestions.map(q => ({
        questionText: q.cleanText || q.rawText,
        marks: q.marks,
        topic: q.topic,
        difficulty: q.difficulty,
        source: 'teacher',
        teacherId: q.teacherQuestionId
      }));

      console.log('[Hybrid Engine] Teacher questions added:', finalQuestions.length);

    } else if (engineState.mode === QUESTION_ENGINE_MODES.AI_AUGMENT) {
      // AI_AUGMENT: Teacher first, AI fills gaps
      console.log('[Hybrid Engine] Mode = AI_AUGMENT');
      console.log('[Hybrid Engine] Teacher provided:', engineState.teacherCount);
      console.log('[Hybrid Engine] Gap to fill:', engineState.gapCount);
      
      // HARD GUARANTEE: Add teacher questions FIRST
      finalQuestions = teacherQuestions.map(q => ({
        questionText: q.cleanText || q.rawText,
        marks: q.marks,
        topic: q.topic,
        difficulty: q.difficulty,
        source: 'teacher',
        teacherId: q.teacherQuestionId
      }));

      console.log('[Hybrid Engine] ✅ Teacher questions added:', finalQuestions.length);

      // Generate ONLY the gap count via AI
      console.log('[Hybrid Engine] Requesting AI to generate', engineState.gapCount, 'additional questions...');
      const aiQuestions = await generateAIQuestions(exam, engineState.gapCount, teacherQuestions);
      
      // PROTECTION: Only add up to gap count
      const questionsToAdd = aiQuestions.slice(0, engineState.gapCount);
      finalQuestions.push(...questionsToAdd);
      
      console.log('[Hybrid Engine] ✅ AI questions added:', questionsToAdd.length);

    } else if (engineState.mode === QUESTION_ENGINE_MODES.AI_FULL) {
      // AI_FULL: No teacher questions, AI generates all
      console.log('[Hybrid Engine] Mode = AI_FULL');
      console.log('[Hybrid Engine] No teacher questions provided');
      console.log('[Hybrid Engine] AI will generate all', requiredCount, 'questions');
      
      const aiQuestions = await generateAIQuestions(exam, requiredCount, []);
      finalQuestions = aiQuestions;
      
      console.log('[Hybrid Engine] ✅ AI questions generated:', finalQuestions.length);
    }

    // FINAL VALIDATION
    console.log('[Hybrid Engine] ========================================');
    console.log('[Hybrid Engine] FINAL QUESTION BANK SUMMARY');
    console.log('[Hybrid Engine] Teacher questions used:', finalQuestions.filter(q => q.source === 'teacher').length);
    console.log('[Hybrid Engine] AI questions used:', finalQuestions.filter(q => q.source === 'ai').length);
    console.log('[Hybrid Engine] Total questions:', finalQuestions.length);
    console.log('[Hybrid Engine] Required count:', requiredCount);
    console.log('[Hybrid Engine] ========================================');

    // Validate we have questions
    if (finalQuestions.length === 0) {
      throw new Error('Hybrid Engine: No questions generated - critical failure');
    }

    return finalQuestions;

  } catch (error) {
    console.error('[Hybrid Engine] ❌ ERROR:', error.message);
    console.error('[Hybrid Engine] Stack:', error.stack);
    throw error;
  }
}

/**
 * PHASE 6.3.7 — TASK 4: AI Question Generation (Controlled)
 * 
 * Generates AI questions with context awareness and source tagging.
 * 
 * CRITICAL: This function ONLY generates AI questions.
 * It must NEVER modify or replace teacher questions.
 * 
 * @param {Object} exam - Exam document
 * @param {number} count - Number of questions to generate
 * @param {Array} existingQuestions - Teacher questions for context (to avoid duplicates)
 * @returns {Promise<Array>} Generated AI questions with 'source: ai' tag
 */
async function generateAIQuestions(exam, count, existingQuestions = []) {
  try {
    console.log('[AI Generation] ========================================');
    console.log('[AI Generation] GENERATING', count, 'AI QUESTIONS');
    console.log('[AI Generation] Existing teacher questions:', existingQuestions.length);
    console.log('[AI Generation] ========================================');

    // MOCK MODE
    if (MOCK_MODE) {
      console.log('[AI Generation] MOCK MODE - Creating sample AI questions');
      const totalMarks = exam.totalMarks || 100;
      const marksPerQuestion = Math.floor(totalMarks / Math.max(count, 1));
      
      const aiQuestions = [];
      for (let i = 0; i < count; i++) {
        aiQuestions.push({
          questionText: `AI Generated Question ${i + 1}: Explain the concept in detail.`,
          marks: marksPerQuestion,
          topic: ['Physics', 'Mathematics', 'Chemistry', 'Biology'][i % 4],
          difficulty: ['easy', 'medium', 'hard'][i % 3],
          source: 'ai',
          aiGenerationId: `AI-${String(i + 1).padStart(3, '0')}`
        });
      }
      
      console.log('[AI Generation] ✅ Generated', aiQuestions.length, 'mock AI questions');
      return aiQuestions;
    }

    // Real AI generation
    const requestData = {
      exam_title: exam.title,
      total_marks: exam.totalMarks,
      question_count: count,
      existing_questions: existingQuestions.map(q => q.cleanText || q.rawText || q.questionText),
      course_description: exam.description || '',
      mode: 'generate'  // Tell AI service this is generation, not normalization
    };

    console.log('[AI Generation] Calling AI service...');
    const response = await axios.post(
      `${QUESTION_GENERATOR_URL}/api/generate-questions`,
      requestData,
      {
        timeout: 120000,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (!response.data || !response.data.success) {
      throw new Error(response.data?.error || 'AI generation failed');
    }

    const generatedQuestions = (response.data.questions || []).map((q, idx) => ({
      ...q,
      source: 'ai',
      aiGenerationId: `AI-${String(idx + 1).padStart(3, '0')}`
    }));

    console.log('[AI Generation] ✅ Generated', generatedQuestions.length, 'AI questions');
    return generatedQuestions;

  } catch (error) {
    console.error('[AI Generation] ❌ ERROR:', error.message);
    
    // Fallback to mock on connection error
    if (error.code === 'ECONNREFUSED' && !MOCK_MODE) {
      console.warn('[AI Generation] ⚠️ Service unavailable, using fallback mock data');
      // Generate mock data directly instead of recursive call
      const totalMarks = exam.totalMarks || 100;
      const marksPerQuestion = Math.floor(totalMarks / Math.max(count, 1));
      
      const fallbackQuestions = [];
      for (let i = 0; i < count; i++) {
        fallbackQuestions.push({
          questionText: `AI Generated Question ${i + 1}: Explain the concept in detail.`,
          marks: marksPerQuestion,
          topic: ['Physics', 'Mathematics', 'Chemistry', 'Biology'][i % 4],
          difficulty: ['easy', 'medium', 'hard'][i % 3],
          source: 'ai',
          aiGenerationId: `AI-FALLBACK-${String(i + 1).padStart(3, '0')}`
        });
      }
      
      return fallbackQuestions;
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

    // MOCK MODE: Generate simple sets without calling AI
    if (MOCK_MODE) {
      console.log('[AI Generate Sets] MOCK MODE - Creating simple sets');
      
      // Create N sets by shuffling questions
      const sets = [];
      for (let i = 0; i < numberOfSets; i++) {
        const setQuestions = normalizedQuestions.map((q, idx) => ({
          ...q,
          questionNumber: idx + 1,
          setVariant: `Set ${String.fromCharCode(65 + i)}` // A, B, C, D...
        }));
        
        sets.push({
          setId: String.fromCharCode(65 + i),
          setName: `Set ${String.fromCharCode(65 + i)}`,
          questions: setQuestions,
          totalMarks: setQuestions.reduce((sum, q) => sum + (q.marks || 0), 0)
        });
      }
      
      return sets;
    }

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
    console.log('[AI Pipeline] BEFORE SAVE - Status:', exam.status, 'GenStatus:', exam.generationStatus);
    
    exam.status = 'prepared';
    exam.generationStatus = 'generated';
    exam.lockedAfterGeneration = true;
    await exam.save();
    
    console.log('[AI Pipeline] AFTER SAVE - Status:', exam.status, 'GenStatus:', exam.generationStatus);
    console.log('[AI Pipeline] ✅ Exam moved to PREPARED status. Ready for student paper generation.');

    // STEP 7: Return summary WITH updated exam
    const summary = {
      success: true,
      message: 'Question sets generated successfully',
      numberOfSets: storageResult.setsStored,
      totalQuestions: storageResult.totalQuestions,
      studentsDistributed: studentDistribution.length,
      generatedAt: new Date(),
      exam: exam.toObject() // CRITICAL: Return the updated exam
    };

    console.log('[AI Pipeline] ✅ Generation complete:', summary);

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
  loadTeacherQuestions,
  calculateRequiredQuestions,
  determineQuestionEngineMode,
  generateAIQuestions,
  aiNormalizeQuestions,
  aiGenerateExamSets,
  validateAndStoreSets,
  generateExamSetsWithAI,
  distributeStudentsToSets,
  QUESTION_ENGINE_MODES
};
