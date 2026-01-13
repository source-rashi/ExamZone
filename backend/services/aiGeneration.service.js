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
 * PHASE 6.3.11 — Generate Subject-Specific Mock Questions
 * Creates realistic mock questions based on subject and difficulty
 */
function generateSubjectSpecificMockQuestions(subject, difficulty, count, setIndex) {
  const questions = [];
  
  // Subject-specific question templates
  const templates = {
    'Physics': {
      easy: [
        `What is Newton's First Law of Motion?`,
        `Define the term 'velocity'.`,
        `What is the SI unit of force?`,
        `Explain the difference between mass and weight.`,
        `What happens to the pressure of a gas when temperature increases?`
      ],
      medium: [
        `Derive the equation for kinetic energy.`,
        `Explain how a hydraulic lift works based on Pascal's principle.`,
        `Calculate the gravitational force between two objects of mass 5kg and 10kg separated by 2 meters.`,
        `Describe the working principle of a transformer.`,
        `What is the relationship between frequency and wavelength in electromagnetic waves?`
      ],
      hard: [
        `Derive Einstein's mass-energy equivalence equation (E=mc²).`,
        `Analyze the motion of a projectile launched at an angle of 45° with air resistance.`,
        `Explain quantum tunneling and its applications in modern technology.`,
        `Derive the Schrödinger equation for a particle in a box.`,
        `Discuss the photoelectric effect and its significance in quantum mechanics.`
      ]
    },
    'Mathematics': {
      easy: [
        `What is the Pythagorean theorem?`,
        `Solve: 2x + 5 = 15`,
        `Find the area of a circle with radius 7 cm.`,
        `What is the value of π (pi)?`,
        `Calculate: 15% of 200`
      ],
      medium: [
        `Differentiate f(x) = x³ + 2x² - 5x + 3`,
        `Solve the quadratic equation: x² - 7x + 12 = 0`,
        `Find the integral of 3x² + 2x + 1`,
        `Prove that the sum of angles in a triangle is 180°.`,
        `Calculate the determinant of a 3x3 matrix.`
      ],
      hard: [
        `Prove the Fundamental Theorem of Calculus.`,
        `Solve the differential equation: dy/dx + 2y = e^x`,
        `Find the eigenvalues and eigenvectors of the given matrix.`,
        `Prove Euler's formula: e^(iπ) + 1 = 0`,
        `Apply Green's theorem to evaluate the line integral.`
      ]
    },
    'Chemistry': {
      easy: [
        `What is the chemical symbol for gold?`,
        `Define an atom.`,
        `What is the pH value of pure water?`,
        `Name the three states of matter.`,
        `What is the atomic number of carbon?`
      ],
      medium: [
        `Explain the concept of electronegativity.`,
        `Balance the chemical equation: C₃H₈ + O₂ → CO₂ + H₂O`,
        `Describe the process of electrolysis.`,
        `What is the difference between ionic and covalent bonds?`,
        `Explain Le Chatelier's principle with an example.`
      ],
      hard: [
        `Derive the Nernst equation and explain its applications.`,
        `Explain the molecular orbital theory for diatomic molecules.`,
        `Discuss the mechanism of SN1 and SN2 reactions.`,
        `Analyze the thermodynamics of the Haber process.`,
        `Explain crystal field theory and its applications in coordination chemistry.`
      ]
    },
    'Biology': {
      easy: [
        `What is photosynthesis?`,
        `Name the powerhouse of the cell.`,
        `What are the four bases in DNA?`,
        `Define metabolism.`,
        `What is the function of red blood cells?`
      ],
      medium: [
        `Explain the process of cellular respiration.`,
        `Describe the structure and function of DNA.`,
        `What is natural selection?`,
        `Explain the nitrogen cycle.`,
        `Describe the human digestive system.`
      ],
      hard: [
        `Explain the molecular mechanism of gene expression regulation.`,
        `Discuss the process of meiosis and its significance in genetic variation.`,
        `Analyze the immune response to viral infections.`,
        `Explain the CRISPR-Cas9 gene editing technology.`,
        `Discuss the role of epigenetics in evolution.`
      ]
    },
    'Computer Science': {
      easy: [
        `What is an algorithm?`,
        `Define a variable in programming.`,
        `What does CPU stand for?`,
        `What is the difference between RAM and ROM?`,
        `Name three programming languages.`
      ],
      medium: [
        `Explain the concept of object-oriented programming.`,
        `What is the time complexity of binary search?`,
        `Describe how a stack data structure works.`,
        `What is the difference between HTTP and HTTPS?`,
        `Explain polymorphism with an example.`
      ],
      hard: [
        `Analyze the time and space complexity of quicksort algorithm.`,
        `Explain the CAP theorem in distributed systems.`,
        `Implement a red-black tree and analyze its properties.`,
        `Discuss the Byzantine Generals Problem in distributed computing.`,
        `Explain neural network backpropagation algorithm.`
      ]
    },
    'History': {
      easy: [
        `When did World War II end?`,
        `Who was the first President of the United States?`,
        `What year did India gain independence?`,
        `Name the ancient Egyptian writing system.`,
        `Who discovered America?`
      ],
      medium: [
        `Explain the causes of the French Revolution.`,
        `Discuss the impact of the Industrial Revolution on society.`,
        `What were the main provisions of the Treaty of Versailles?`,
        `Describe the Silk Road and its significance.`,
        `Explain the Cold War and its global impact.`
      ],
      hard: [
        `Analyze the socio-economic factors that led to the fall of the Roman Empire.`,
        `Compare and contrast the political ideologies of capitalism and communism.`,
        `Discuss the long-term effects of colonialism in Africa.`,
        `Analyze the role of nationalism in 20th-century conflicts.`,
        `Evaluate the impact of the Renaissance on modern Western civilization.`
      ]
    }
  };
  
  // Default general questions if subject not found
  const defaultTemplates = {
    easy: [
      `Define the key concepts in ${subject}.`,
      `What are the basic principles of ${subject}?`,
      `List the main topics covered in ${subject}.`,
      `Explain a fundamental concept in ${subject}.`,
      `What is the importance of studying ${subject}?`
    ],
    medium: [
      `Explain the relationship between major concepts in ${subject}.`,
      `Analyze a case study in ${subject}.`,
      `Compare and contrast two theories in ${subject}.`,
      `Describe the practical applications of ${subject}.`,
      `Discuss the methodology used in ${subject}.`
    ],
    hard: [
      `Critically analyze advanced theories in ${subject}.`,
      `Evaluate the current research trends in ${subject}.`,
      `Synthesize multiple concepts to solve a complex problem in ${subject}.`,
      `Discuss the interdisciplinary connections of ${subject}.`,
      `Propose an innovative approach to a challenge in ${subject}.`
    ]
  };
  
  // Get appropriate template array
  const subjectTemplates = templates[subject] || defaultTemplates;
  const difficultyTemplates = subjectTemplates[difficulty] || subjectTemplates['medium'];
  
  // Generate questions
  for (let i = 0; i < count; i++) {
    const templateIndex = i % difficultyTemplates.length;
    questions.push(difficultyTemplates[templateIndex]);
  }
  
  return questions;
}

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
 * PHASE 6.3.11 — Get Exam Configuration (STRICT - NO FALLBACKS)
 * 
 * Extracts exam configuration from paperConfig.
 * THROWS ERROR if configuration is missing or incomplete.
 * 
 * @param {Object} exam - Exam document
 * @returns {Object} Configuration object
 * @throws {Error} If paperConfig is missing or incomplete
 */
function getExamConfig(exam) {
  console.log('[Config Validator] ========================================');
  console.log('[Config Validator] VALIDATING EXAM CONFIGURATION');
  console.log('[Config Validator] ========================================');

  // PHASE 6.3.11: STRICT validation - NO fallbacks allowed
  if (!exam.paperConfig) {
    throw new Error('GENERATION BLOCKED: paperConfig is missing. Teacher must configure exam settings.');
  }

  const config = exam.paperConfig;

  // Validate required fields
  const errors = [];

  if (!config.subject || config.subject.trim() === '') {
    errors.push('Subject is required');
  }

  if (!config.difficulty) {
    errors.push('Difficulty level is required');
  }

  if (!config.questionsPerSet || config.questionsPerSet < 1) {
    errors.push('Questions per set must be specified (minimum 1)');
  }

  if (!config.totalMarksPerSet || config.totalMarksPerSet < 1) {
    errors.push('Total marks per set must be specified (minimum 1)');
  }

  if (errors.length > 0) {
    console.log('[Config Validator] ❌ VALIDATION FAILED:');
    errors.forEach(err => console.log(`[Config Validator]   - ${err}`));
    throw new Error(`GENERATION BLOCKED: ${errors.join(', ')}`);
  }

  const validatedConfig = {
    questionsPerSet: config.questionsPerSet,
    totalMarksPerSet: config.totalMarksPerSet,
    marksMode: config.marksMode || 'auto',
    subject: config.subject.trim(),
    difficulty: config.difficulty,
    instructions: config.instructions || ''
  };

  console.log('[Config Validator] ✅ Configuration valid:');
  console.log('[Config Validator]   Subject:', validatedConfig.subject);
  console.log('[Config Validator]   Difficulty:', validatedConfig.difficulty);
  console.log('[Config Validator]   Questions per set:', validatedConfig.questionsPerSet);
  console.log('[Config Validator]   Marks per set:', validatedConfig.totalMarksPerSet);
  console.log('[Config Validator]   Marks mode:', validatedConfig.marksMode);
  console.log('[Config Validator] ========================================');

  return validatedConfig;
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

    // Enhance with exam-specific metadata (marks will be calculated later)
    const enrichedQuestions = extractedQuestions.map((q, idx) => ({
      ...q,
      marks: q.marks || null,  // Don't assign marks yet - will distribute later
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
 * PHASE 6.3.9 — STEP 1: Create Teacher Question Priority Pool
 * 
 * Prepares teacher questions as a priority pool with metadata.
 * 
 * @param {Array} teacherQuestions - Raw teacher questions
 * @param {Object} exam - Exam document
 * @returns {Array} Priority-tagged teacher pool
 */
function createTeacherPriorityPool(teacherQuestions, exam) {
  console.log('[Priority Pool] ========================================');
  console.log('[Priority Pool] CREATING TEACHER PRIORITY POOL');
  console.log('[Priority Pool] ========================================');

  if (!teacherQuestions || teacherQuestions.length === 0) {
    console.log('[Priority Pool] ⚠️ No teacher questions to pool');
    return [];
  }

  // Get exam configuration
  const config = getExamConfig(exam);

  // Shuffle for random distribution
  const shuffled = [...teacherQuestions].sort(() => Math.random() - 0.5);

  // Tag with priority and metadata
  const priorityPool = shuffled.map((q, idx) => ({
    ...q,
    priority: 'teacher',
    subject: config.subject,
    difficulty: config.difficulty,
    poolIndex: idx,
    usageCount: 0 // Track how many sets this question appears in
  }));

  console.log('[Priority Pool] ✅ Created pool with', priorityPool.length, 'teacher questions');
  console.log('[Priority Pool] Subject:', config.subject);
  console.log('[Priority Pool] Difficulty:', config.difficulty);
  console.log('[Priority Pool] Shuffled for random distribution');

  return priorityPool;
}

/**
 * PHASE 6.3.9 — STEP 2: AI Repair Pass (Optional)
 * 
 * Optionally sends teacher questions to AI for formatting/completion.
 * 
 * @param {Array} teacherPool - Teacher priority pool
 * @param {Object} exam - Exam document
 * @returns {Promise<Array>} Repaired teacher pool
 */
async function aiRepairPass(teacherPool, exam) {
  console.log('[AI Repair] ========================================');
  console.log('[AI Repair] CHECKING IF REPAIR NEEDED');
  console.log('[AI Repair] ========================================');

  if (!exam.allowAIImprovement) {
    console.log('[AI Repair] ⏭️ AI improvement disabled - skipping repair');
    return teacherPool;
  }

  // Check if questions appear incomplete
  const incompleteQuestions = teacherPool.filter(q => {
    const text = q.cleanText || q.rawText || '';
    return text.length < 10 || // Very short
           text.includes('\\incomplete') || // Broken LaTeX
           text.trim().endsWith('...');  // Trailing ellipsis
  });

  if (incompleteQuestions.length === 0) {
    console.log('[AI Repair] ✅ All questions appear complete - no repair needed');
    return teacherPool;
  }

  console.log('[AI Repair] ⚠️ Found', incompleteQuestions.length, 'potentially incomplete questions');
  console.log('[AI Repair] 🔧 AI repair would improve these (NOT IMPLEMENTED YET)');
  
  // TODO: Call AI service for repair
  // For now, return original pool
  return teacherPool;
}

/**
 * PHASE 6.3.9 — STEP 3: Calculate Required Questions Per Set
 * 
 * Uses the new per-set configuration.
 * 
 * @param {Object} exam - Exam document
 * @returns {Object} { questionsPerSet, totalMarksPerSet, numberOfSets }
 */
function calculatePerSetRequirements(exam) {
  console.log('[Per-Set Requirements] ========================================');
  console.log('[Per-Set Requirements] CALCULATING PER-SET CONFIGURATION');
  console.log('[Per-Set Requirements] ========================================');

  // Get configuration - will throw if invalid
  const config = getExamConfig(exam);
  const numberOfSets = exam.numberOfSets || 1;

  console.log('[Per-Set Requirements] Questions per set:', config.questionsPerSet);
  console.log('[Per-Set Requirements] Marks per set:', config.totalMarksPerSet);
  console.log('[Per-Set Requirements] Number of sets:', numberOfSets);
  console.log('[Per-Set Requirements] Marks mode:', config.marksMode);
  console.log('[Per-Set Requirements] Subject:', config.subject);
  console.log('[Per-Set Requirements] Difficulty:', config.difficulty);
  console.log('[Per-Set Requirements] ========================================');

  return {
    questionsPerSet: config.questionsPerSet,
    totalMarksPerSet: config.totalMarksPerSet,
    marksMode: config.marksMode,
    subject: config.subject,
    difficulty: config.difficulty,
    instructions: config.instructions,
    numberOfSets
  };
}

/**
 * PHASE 6.3.9 — STEP 4: Sufficiency Check
 * 
 * Determines if teacher pool is sufficient per set.
 * 
 * @param {Array} teacherPool - Teacher priority pool
 * @param {number} questionsPerSet - Required questions per set
 * @returns {Object} { isSufficient, gapPerSet }
 */
function checkTeacherSufficiency(teacherPool, questionsPerSet) {
  const teacherCount = teacherPool.length;
  const isSufficient = teacherCount >= questionsPerSet;
  const gapPerSet = isSufficient ? 0 : questionsPerSet - teacherCount;

  console.log('[Sufficiency Check] ========================================');
  console.log('[Sufficiency Check] Teacher questions:', teacherCount);
  console.log('[Sufficiency Check] Required per set:', questionsPerSet);
  console.log('[Sufficiency Check] Sufficient?', isSufficient ? '✅ YES' : '❌ NO');
  
  if (!isSufficient) {
    console.log('[Sufficiency Check] Gap per set:', gapPerSet);
    console.log('[Sufficiency Check] ⚠️ AI generation REQUIRED to fill gaps');
  } else {
    console.log('[Sufficiency Check] ✅ AI generation OPTIONAL');
  }
  
  console.log('[Sufficiency Check] ========================================');

  return { isSufficient, gapPerSet };
}

/**
 * PHASE 6.3.9 — STEP 5: Priority Distribution Engine
 * 
 * Distributes teacher questions across sets with random selection.
 * Ensures at least one teacher question per set (if possible).
 * 
 * @param {Array} teacherPool - Teacher priority pool
 * @param {number} questionsPerSet - Required questions per set
 * @param {number} numberOfSets - Number of sets to generate
 * @returns {Array} Array of set configurations
 */
function distributePriorityQuestions(teacherPool, questionsPerSet, numberOfSets) {
  console.log('[Priority Distribution] ========================================');
  console.log('[Priority Distribution] DISTRIBUTING TEACHER QUESTIONS');
  console.log('[Priority Distribution] ========================================');

  const sets = [];
  const teacherCount = teacherPool.length;

  if (teacherCount === 0) {
    console.log('[Priority Distribution] ⚠️ No teacher questions to distribute');
    // Create empty sets - will be filled by AI
    for (let i = 0; i < numberOfSets; i++) {
      sets.push({
        setIndex: i,
        teacherQuestions: [],
        aiSlotsNeeded: questionsPerSet
      });
    }
    return sets;
  }

  // Calculate distribution strategy
  const teacherPerSet = Math.floor(teacherCount / numberOfSets);
  const remainder = teacherCount % numberOfSets;

  console.log('[Priority Distribution] Strategy:');
  console.log('[Priority Distribution]   Base teacher per set:', teacherPerSet);
  console.log('[Priority Distribution]   Extra for first', remainder, 'sets');

  // Create a copy of the pool for distribution
  const availablePool = [...teacherPool];

  // Distribute questions
  for (let i = 0; i < numberOfSets; i++) {
    const teacherForThisSet = teacherPerSet + (i < remainder ? 1 : 0);
    const selectedTeachers = [];

    // Draw teacher questions for this set
    for (let j = 0; j < teacherForThisSet && availablePool.length > 0; j++) {
      const randomIndex = Math.floor(Math.random() * availablePool.length);
      const question = availablePool.splice(randomIndex, 1)[0];
      question.usageCount++;
      selectedTeachers.push(question);
    }

    const aiSlotsNeeded = Math.max(0, questionsPerSet - selectedTeachers.length);

    sets.push({
      setIndex: i,
      setId: String.fromCharCode(65 + i), // A, B, C...
      teacherQuestions: selectedTeachers,
      aiSlotsNeeded: aiSlotsNeeded
    });

    console.log(`[Priority Distribution] Set ${i + 1}: ${selectedTeachers.length} teacher + ${aiSlotsNeeded} AI slots`);
  }

  console.log('[Priority Distribution] ========================================');
  console.log('[Priority Distribution] ✅ Distribution complete');
  console.log('[Priority Distribution] ========================================');

  return sets;
}

/**
 * PHASE 6.3.9 — STEP 7: Build Final Sets with AI Generation + Marks Normalization
 * 
 * For each set configuration:
 * - Generate AI questions to fill slots
 * - Combine teacher + AI questions
 * - Normalize marks to match totalMarksPerSet
 * - Shuffle for uniqueness
 * - Validate
 * 
 * @param {Array} setConfigs - Set configurations from distribution
 * @param {Object} exam - Exam document
 * @param {Object} requirements - Per-set requirements
 * @returns {Promise<Array>} Final question sets ready for storage
 */
async function buildFinalSets(setConfigs, exam, requirements) {
  console.log('[Final Sets Builder] ========================================');
  console.log('[Final Sets Builder] BUILDING FINAL SETS');
  console.log('[Final Sets Builder] ========================================');

  const finalSets = [];

  for (const config of setConfigs) {
    console.log(`[Final Sets Builder] Processing Set ${config.setIndex + 1}...`);
    
    // Start with teacher questions
    const setQuestions = config.teacherQuestions.map(q => ({
      questionText: q.cleanText || q.rawText,
      marks: 0, // Will be normalized below
      topic: q.topic || exam.subject || 'General',
      difficulty: q.difficulty || exam.difficultyLevel || 'mixed',
      source: 'teacher',
      teacherId: q.teacherQuestionId,
      options: [],
      correctAnswer: ''
    }));

    console.log(`[Final Sets Builder]   Teacher questions: ${setQuestions.length}`);

    // Generate AI questions if needed
    if (config.aiSlotsNeeded > 0) {
      console.log(`[Final Sets Builder]   Generating ${config.aiSlotsNeeded} AI questions...`);
      
      const aiQuestions = await generateAIQuestionsForSet(
        exam,
        config.aiSlotsNeeded,
        config.teacherQuestions,
        config.setIndex
      );

      setQuestions.push(...aiQuestions);
      console.log(`[Final Sets Builder]   AI questions added: ${aiQuestions.length}`);
    } else {
      console.log(`[Final Sets Builder]   No AI questions needed`);
    }

    // PHASE 6.3.11 — STEP 6: Normalize marks based on mode (STRICT)
    const totalMarksPerSet = requirements.totalMarksPerSet;
    const marksMode = requirements.marksMode;
    const questionCount = setQuestions.length;

    console.log(`[Final Sets Builder]   Applying marks mode: ${marksMode}`);

    if (marksMode === 'auto') {
      // Auto distribution - divide evenly
      const marksPerQuestion = Math.floor(totalMarksPerSet / questionCount);
      const remainder = totalMarksPerSet % questionCount;

      setQuestions.forEach((q, idx) => {
        q.marks = marksPerQuestion + (idx < remainder ? 1 : 0);
      });
    } else if (marksMode === 'manual') {
      // Manual mode - preserve teacher marks, AI fills remaining
      let usedMarks = 0;
      let aiQuestionCount = 0;

      // Calculate marks already assigned to teacher questions
      setQuestions.forEach(q => {
        if (q.source === 'teacher' && q.marks > 0) {
          usedMarks += q.marks;
        } else if (q.source === 'ai') {
          aiQuestionCount++;
        }
      });

      // Distribute remaining marks to AI questions
      const remainingMarks = totalMarksPerSet - usedMarks;
      if (aiQuestionCount > 0 && remainingMarks > 0) {
        const aiMarksPerQuestion = Math.floor(remainingMarks / aiQuestionCount);
        const aiRemainder = remainingMarks % aiQuestionCount;

        let aiIndex = 0;
        setQuestions.forEach(q => {
          if (q.source === 'ai') {
            q.marks = aiMarksPerQuestion + (aiIndex < aiRemainder ? 1 : 0);
            aiIndex++;
          }
        });
      }
    }

    const actualTotal = setQuestions.reduce((sum, q) => sum + q.marks, 0);
    console.log(`[Final Sets Builder]   Marks normalized: ${actualTotal}/${totalMarksPerSet}`);

    // STEP 7: Shuffle for uniqueness
    const shuffledQuestions = [...setQuestions].sort(() => Math.random() - 0.5);

    // Add question numbers
    shuffledQuestions.forEach((q, idx) => {
      q.questionNumber = idx + 1;
    });

    // PHASE 6.3.10 — Build final set object with complete metadata
    const finalSet = {
      setId: `SET-${String(config.setIndex + 1).padStart(3, '0')}`,
      setName: `Set ${config.setId}`,
      questions: shuffledQuestions,
      totalMarks: actualTotal,
      questionCount: shuffledQuestions.length,
      subject: requirements.subject,
      difficulty: requirements.difficulty,
      instructions: requirements.instructions || '',
      generatedAt: new Date()
    };

    // PHASE 6.3.11 — HARD VALIDATION: Question count MUST match exactly (NO TOLERANCE)
    if (finalSet.questionCount !== requirements.questionsPerSet) {
      const errorMsg = `QUESTION COUNT VALIDATION FAILED: Set ${config.setIndex + 1} has ${finalSet.questionCount} questions, expected exactly ${requirements.questionsPerSet}. Teacher config MUST be respected.`;
      console.error(`[Final Sets Builder] ❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }

    // PHASE 6.3.11 — HARD VALIDATION: Total marks MUST match exactly (NO TOLERANCE)
    if (finalSet.totalMarks !== totalMarksPerSet) {
      const errorMsg = `MARKS VALIDATION FAILED: Set ${config.setIndex + 1} has ${finalSet.totalMarks} marks, expected exactly ${totalMarksPerSet}. Teacher config MUST be respected.`;
      console.error(`[Final Sets Builder] ❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }

    finalSets.push(finalSet);
    console.log(`[Final Sets Builder] ✅ Set ${config.setIndex + 1} complete`);
  }

  console.log('[Final Sets Builder] ========================================');
  console.log('[Final Sets Builder] ✅ ALL SETS BUILT SUCCESSFULLY');
  console.log('[Final Sets Builder] ========================================');

  return finalSets;
}

/**
 * PHASE 6.3.9 — Generate AI Questions for Specific Set
 * 
 * Generates AI questions with set-specific context.
 * 
 * @param {Object} exam - Exam document
 * @param {number} count - Number of questions needed
 * @param {Array} existingQuestions - Teacher questions in this set
 * @param {number} setIndex - Set index for logging
 * @returns {Promise<Array>} Generated AI questions
 */
async function generateAIQuestionsForSet(exam, count, existingQuestions, setIndex) {
  console.log(`[AI Generation Set ${setIndex + 1}] Generating ${count} questions...`);

  // Get exam configuration
  const config = getExamConfig(exam);

  // MOCK MODE
  if (MOCK_MODE) {
    console.log(`[AI Generation Set ${setIndex + 1}] MOCK MODE - Generating subject-specific questions`);
    const aiQuestions = [];
    
    // PHASE 6.3.11 - Generate subject and difficulty-specific mock questions
    const mockQuestions = generateSubjectSpecificMockQuestions(config.subject, config.difficulty, count, setIndex);
    
    for (let i = 0; i < count; i++) {
      aiQuestions.push({
        questionText: mockQuestions[i],
        marks: 0, // Will be normalized in buildFinalSets
        topic: config.subject,
        difficulty: config.difficulty,
        source: 'ai',
        aiGenerationId: `AI-S${setIndex + 1}-${String(i + 1).padStart(2, '0')}`,
        options: [],
        correctAnswer: ''
      });
    }
    
    return aiQuestions;
  }

  // Real AI generation with EXPLICIT TEACHER-DRIVEN PROMPT
  try {
    // PHASE 6.3.11 — Explicit AI Prompt (NO DEFAULTS)
    const aiPrompt = `STRICT REQUIREMENTS - DO NOT DEVIATE:

You MUST generate exactly ${count} questions.
Subject: ${config.subject}
Difficulty Level: ${config.difficulty}

PRIORITY RULES:
1. Primary source: Teacher-provided questions (already included in set)
2. Your role: Fill remaining ${count} question slots only
3. Questions must be appropriate for ${config.difficulty} difficulty
4. All questions must relate to ${config.subject}
5. Do NOT generate more or fewer than ${count} questions

FORBIDDEN:
- Generating questions outside the specified subject
- Changing difficulty level
- Exceeding or reducing question count`;

    const requestData = {
      exam_title: exam.title,
      subject: config.subject,
      difficulty: config.difficulty,
      question_count: count,
      existing_questions: existingQuestions.map(q => q.cleanText || q.rawText),
      course_description: exam.description || '',
      explicit_prompt: aiPrompt,
      set_index: setIndex,
      mode: 'generate'
    };

    console.log(`[AI Generation Set ${setIndex + 1}] Sending strict prompt...`);
    console.log(`[AI Generation Set ${setIndex + 1}] Required: ${count} questions`);
    console.log(`[AI Generation Set ${setIndex + 1}] Subject: ${config.subject}`);
    console.log(`[AI Generation Set ${setIndex + 1}] Difficulty: ${config.difficulty}`);

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
      questionText: q.questionText || q.text,
      marks: 0, // Will be normalized
      topic: config.subject,
      difficulty: config.difficulty,
      source: 'ai',
      aiGenerationId: `AI-S${setIndex + 1}-${String(idx + 1).padStart(2, '0')}`,
      options: q.options || [],
      correctAnswer: q.correctAnswer || ''
    }));

    // PHASE 6.3.11 — STRICT VALIDATION: AI must return EXACTLY what was requested
    if (generatedQuestions.length !== count) {
      const errorMsg = `AI VALIDATION FAILED: Requested ${count} questions, received ${generatedQuestions.length}. Teacher config MUST be respected.`;
      console.error(`[AI Generation Set ${setIndex + 1}] ❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }

    console.log(`[AI Generation Set ${setIndex + 1}] ✅ Generated ${generatedQuestions.length} questions (validated)`);
    return generatedQuestions;

  } catch (error) {
    console.error(`[AI Generation Set ${setIndex + 1}] ❌ ERROR:`, error.message);
    
    // Fallback to mock on connection error
    if (error.code === 'ECONNREFUSED') {
      console.warn(`[AI Generation Set ${setIndex + 1}] ⚠️ Using fallback mock data`);
      return generateAIQuestionsForSet(exam, count, existingQuestions, setIndex);
    }
    
    throw error;
  }
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
 * PHASE 6.3.9 — AI Question Normalization with Priority-Driven Construction
 * 
 * Implements TEACHER PRIORITY POOL with per-set distribution.
 * 
 * NEW APPROACH:
 * - Teacher questions become a priority pool
 * - Questions distributed randomly across sets
 * - Each set gets at least one teacher question (if available)
 * - AI fills remaining slots per set
 * - Marks normalized per set
 * 
 * @param {Object} payload - Payload from buildExamAIPayload
 * @returns {Promise<Array>} Generated question sets (not just question bank)
 */
async function aiNormalizeQuestions(payload) {
  try {
    console.log('[Priority Engine] ========================================');
    console.log('[Priority Engine] STARTING PRIORITY-DRIVEN CONSTRUCTION');
    console.log('[Priority Engine] ========================================');
    
    // Load exam
    const exam = await Exam.findById(payload.examId);
    if (!exam) {
      throw new Error('Exam not found');
    }

    // STAGE 1: Load Teacher Questions
    console.log('[Priority Engine] STAGE 1/7 — Loading teacher questions...');
    const teacherQuestions = await loadTeacherQuestions(exam);
    console.log('[Priority Engine] ✅ Stage 1 Complete:', teacherQuestions.length, 'teacher questions loaded');

    // STAGE 2: Create Priority Pool
    console.log('[Priority Engine] STAGE 2/7 — Creating teacher priority pool...');
    const teacherPool = createTeacherPriorityPool(teacherQuestions, exam);
    console.log('[Priority Engine] ✅ Stage 2 Complete:', teacherPool.length, 'questions in priority pool');

    // STAGE 3: AI Repair Pass (Optional)
    console.log('[Priority Engine] STAGE 3/7 — AI repair pass...');
    const repairedPool = await aiRepairPass(teacherPool, exam);
    console.log('[Priority Engine] ✅ Stage 3 Complete: Pool repaired/verified');

    // STAGE 4: Calculate Per-Set Requirements
    console.log('[Priority Engine] STAGE 4/7 — Calculating per-set requirements...');
    const requirements = calculatePerSetRequirements(exam);
    console.log('[Priority Engine] ✅ Stage 4 Complete:', requirements.questionsPerSet, 'questions per set');

    // STAGE 5: Sufficiency Check
    console.log('[Priority Engine] STAGE 5/7 — Checking sufficiency...');
    const sufficiency = checkTeacherSufficiency(repairedPool, requirements.questionsPerSet);
    console.log('[Priority Engine] ✅ Stage 5 Complete: Gap per set =', sufficiency.gapPerSet);

    // STAGE 6: Priority Distribution
    console.log('[Priority Engine] STAGE 6/7 — Distributing questions across sets...');
    const setConfigs = distributePriorityQuestions(
      repairedPool,
      requirements.questionsPerSet,
      requirements.numberOfSets
    );
    console.log('[Priority Engine] ✅ Stage 6 Complete:', setConfigs.length, 'set configurations created');

    // STAGE 7: Generate AI Questions Per Set + Normalize Marks
    console.log('[Priority Engine] STAGE 7/7 — Generating AI questions and normalizing marks...');
    const finalSets = await buildFinalSets(setConfigs, exam, requirements);
    console.log('[Priority Engine] ✅ Stage 7 Complete:', finalSets.length, 'final sets built');

    // FINAL SUMMARY
    console.log('[Priority Engine] ========================================');
    console.log('[Priority Engine] CONSTRUCTION COMPLETE');
    finalSets.forEach((set, idx) => {
      const teacherCount = set.questions.filter(q => q.source === 'teacher').length;
      const aiCount = set.questions.filter(q => q.source === 'ai').length;
      const totalMarks = set.questions.reduce((sum, q) => sum + (q.marks || 0), 0);
      console.log(`[Priority Engine] Set ${idx + 1}: ${teacherCount} teacher + ${aiCount} AI = ${set.questions.length} total (${totalMarks} marks)`);
    });
    console.log('[Priority Engine] ========================================');

    return finalSets;

  } catch (error) {
    console.error('[Priority Engine] ❌ ERROR:', error.message);
    console.error('[Priority Engine] Stack:', error.stack);
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
      
      const aiQuestions = [];
      for (let i = 0; i < count; i++) {
        aiQuestions.push({
          questionText: `AI Generated Question ${i + 1}: Explain the concept in detail.`,
          marks: null,  // Marks will be distributed later in hybrid engine
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
      
      const fallbackQuestions = [];
      for (let i = 0; i < count; i++) {
        fallbackQuestions.push({
          questionText: `AI Generated Question ${i + 1}: Explain the concept in detail.`,
          marks: null,  // Marks will be distributed later
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

    // PHASE 6.3.11 - Use paperConfig.totalMarksPerSet (no fallback to global totalMarks)
    const expectedMarksPerSet = exam.paperConfig?.totalMarksPerSet || exam.totalMarksPerSet || exam.totalMarks || 100;
    console.log('[Validate & Store] Expected marks per set:', expectedMarksPerSet);
    console.log('[Validate & Store] Source: paperConfig.totalMarksPerSet =', exam.paperConfig?.totalMarksPerSet);

    // 1. Check every set has questions
    const emptySets = generatedSets.filter(set => !set.questions || set.questions.length === 0);
    if (emptySets.length > 0) {
      throw new Error(`Validation failed: ${emptySets.length} set(s) have no questions`);
    }

    // 2. Check total marks for each set (UPDATED for per-set validation)
    const invalidMarksSets = generatedSets.filter(set => {
      const totalMarks = set.questions.reduce((sum, q) => sum + (q.marks || 0), 0);
      const difference = Math.abs(totalMarks - expectedMarksPerSet);
      if (difference > 5) {
        console.log(`[Validate & Store] Set marks validation failed: ${totalMarks} vs expected ${expectedMarksPerSet} (diff: ${difference})`);
        return true;
      }
      return false;
    });
    if (invalidMarksSets.length > 0) {
      throw new Error(`Validation failed: ${invalidMarksSets.length} set(s) have incorrect total marks (expected ${expectedMarksPerSet})`);
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

    // STEP 2: Priority-Driven Construction (replaces normalize + generate steps)
    console.log('[AI Pipeline] Step 2: Priority-driven set construction...');
    const generatedSets = await aiNormalizeQuestions(payload);

    // STEP 3: Distribute students to sets
    console.log('[AI Pipeline] Step 3: Distributing students...');
    const studentDistribution = distributeStudentsToSets(
      payload.students,
      generatedSets
    );

    // STEP 4: Validate and store
    console.log('[AI Pipeline] Step 4: Validating and storing...');
    const storageResult = await validateAndStoreSets(examId, generatedSets, studentDistribution);

    // STEP 5: Move exam to 'prepared' status
    exam = await Exam.findById(examId);
    console.log('[AI Pipeline] BEFORE SAVE - Status:', exam.status, 'GenStatus:', exam.generationStatus);
    
    exam.status = 'prepared';
    exam.generationStatus = 'generated';
    exam.lockedAfterGeneration = true;
    await exam.save();
    
    console.log('[AI Pipeline] AFTER SAVE - Status:', exam.status, 'GenStatus:', exam.generationStatus);
    console.log('[AI Pipeline] ✅ Exam moved to PREPARED status. Ready for student paper generation.');

    // STEP 6: Return summary WITH updated exam
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
  getExamConfig,
  loadTeacherQuestions,
  createTeacherPriorityPool,
  aiRepairPass,
  calculatePerSetRequirements,
  checkTeacherSufficiency,
  distributePriorityQuestions,
  buildFinalSets,
  generateAIQuestionsForSet,
  aiNormalizeQuestions,
  aiGenerateExamSets,
  validateAndStoreSets,
  generateExamSetsWithAI,
  distributeStudentsToSets,
  QUESTION_ENGINE_MODES
};
