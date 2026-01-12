/**
 * PHASE 6.4 — STUDENT PAPER GENERATION SERVICE
 * 
 * Converts generated question sets into student-specific papers.
 * Creates JSON files and optional PDFs for each student.
 * 
 * CRITICAL RULES:
 * - Only works on exams with status "prepared"
 * - Uses existing generatedSets (no AI calls)
 * - Must not break if generation fails
 * - All-or-nothing transaction approach
 */

const fs = require('fs').promises;
const path = require('path');
const Exam = require('../models/Exam');
const Enrollment = require('../models/Enrollment');

const STORAGE_BASE = path.join(__dirname, '../../storage/exams');

/**
 * Ensure storage directory exists for an exam
 */
async function ensureExamStorage(examId) {
  const examDir = path.join(STORAGE_BASE, examId);
  const studentsDir = path.join(examDir, 'students');
  const setsDir = path.join(examDir, 'sets');

  await fs.mkdir(studentsDir, { recursive: true });
  await fs.mkdir(setsDir, { recursive: true });

  return { examDir, studentsDir, setsDir };
}

/**
 * Build a paper object for a student
 */
function buildPaperData(exam, student, setData) {
  return {
    examId: exam._id.toString(),
    examTitle: exam.title,
    description: exam.description,
    className: exam.classId?.name || 'Unknown Class',
    studentInfo: {
      id: student.userId.toString(),
      name: student.name,
      rollNumber: student.rollNumber
    },
    setInfo: {
      setId: setData.setId,
      setName: `Set ${setData.setId}`
    },
    questions: setData.questions.map((q, idx) => ({
      number: idx + 1,
      text: q.questionText,
      marks: q.marks,
      topic: q.topic,
      difficulty: q.difficulty,
      options: q.options || [],
      // Do NOT include correctAnswer in student paper
    })),
    examMetadata: {
      totalMarks: setData.totalMarks || exam.totalMarks,
      duration: exam.duration,
      startTime: exam.startTime,
      endTime: exam.endTime,
      attemptsAllowed: exam.attemptsAllowed
    },
    instructions: setData.instructions || exam.aiConfig?.instructions || '',
    generatedAt: new Date().toISOString()
  };
}

/**
 * Save paper as JSON file
 */
async function savePaperFile(studentsDir, rollNumber, paperData) {
  const filename = `student_${rollNumber}.json`;
  const filepath = path.join(studentsDir, filename);
  
  await fs.writeFile(
    filepath, 
    JSON.stringify(paperData, null, 2), 
    'utf8'
  );

  return filepath;
}

/**
 * Main function: Generate student papers from existing sets
 * 
 * @param {string} examId - Exam ID
 * @returns {Promise<Object>} Result with success status and updated exam
 */
async function generateStudentPapers(examId) {
  console.log('[Student Papers] Starting generation for exam:', examId);

  // Step 1: Validate exam
  const exam = await Exam.findById(examId).populate('classId');
  
  if (!exam) {
    throw new Error('Exam not found');
  }

  if (exam.status !== 'prepared') {
    throw new Error(`Cannot generate papers. Exam status is "${exam.status}", expected "prepared"`);
  }

  if (!exam.generatedSets || exam.generatedSets.length === 0) {
    throw new Error('No question sets found. Run "Generate Question Papers" first.');
  }

  if (exam.studentPapers && exam.studentPapers.length > 0) {
    throw new Error('Student papers already generated. Reset exam to regenerate.');
  }

  console.log('[Student Papers] Exam validated. Status:', exam.status);

  // Step 2: Ensure storage exists
  const { studentsDir } = await ensureExamStorage(examId);
  console.log('[Student Papers] Storage ready:', studentsDir);

  // Step 3: Fetch enrolled students
  const enrollments = await Enrollment.find({ 
    classId: exam.classId._id 
  }).populate('userId');

  if (enrollments.length === 0) {
    throw new Error('No students enrolled in this class');
  }

  console.log('[Student Papers] Found', enrollments.length, 'enrolled students');

  // Step 4: Generate papers for each student
  const generatedPapers = [];
  const createdFiles = []; // Track for rollback

  try {
    for (const enrollment of enrollments) {
      const student = {
        userId: enrollment.userId._id,
        name: enrollment.userId.name,
        rollNumber: enrollment.rollNumber
      };

      // Find assigned set from setMap
      let assignedSetId = null;
      for (const setMapping of exam.setMap) {
        if (setMapping.assignedRollNumbers.includes(student.rollNumber)) {
          assignedSetId = setMapping.setId;
          break;
        }
      }

      // If no assignment found, use first set (fallback)
      if (!assignedSetId) {
        assignedSetId = exam.generatedSets[0].setId;
        console.warn('[Student Papers] No set assignment for roll', student.rollNumber, '- using', assignedSetId);
      }

      // Get the set data
      const setData = exam.generatedSets.find(s => s.setId === assignedSetId);
      if (!setData) {
        throw new Error(`Set ${assignedSetId} not found in generated sets`);
      }

      // Build paper data
      const paperData = buildPaperData(exam, student, setData);

      // Save to file
      const filepath = await savePaperFile(studentsDir, student.rollNumber, paperData);
      createdFiles.push(filepath);

      console.log('[Student Papers] Generated paper for roll', student.rollNumber, '- Set', assignedSetId);

      // Add to array
      generatedPapers.push({
        studentId: student.userId,
        rollNumber: student.rollNumber,
        name: student.name,
        setId: assignedSetId,
        paperPath: path.relative(STORAGE_BASE, filepath),
        paperPreview: {
          totalQuestions: paperData.questions.length,
          totalMarks: paperData.examMetadata.totalMarks,
          setName: paperData.setInfo.setName
        },
        generatedAt: new Date(),
        status: 'created'
      });
    }

    // Step 5: All successful - update exam
    exam.studentPapers = generatedPapers;
    exam.status = 'generated';
    
    console.log('[Student Papers] BEFORE SAVE - Status:', exam.status);
    await exam.save();
    console.log('[Student Papers] AFTER SAVE - Status:', exam.status);

    console.log('[Student Papers] ✅ Successfully generated', generatedPapers.length, 'papers');

    return {
      success: true,
      message: 'Student papers generated successfully',
      papersGenerated: generatedPapers.length,
      exam: exam.toObject()
    };

  } catch (error) {
    // Rollback: Delete created files
    console.error('[Student Papers] Error during generation:', error.message);
    console.log('[Student Papers] Rolling back...');

    for (const filepath of createdFiles) {
      try {
        await fs.unlink(filepath);
      } catch (unlinkError) {
        console.error('[Student Papers] Failed to delete:', filepath);
      }
    }

    throw error;
  }
}

/**
 * Get student's paper data
 */
async function getStudentPaper(examId, studentId) {
  const exam = await Exam.findById(examId);
  
  if (!exam) {
    throw new Error('Exam not found');
  }

  if (exam.status !== 'published' && exam.status !== 'running') {
    throw new Error('Exam not yet published');
  }

  const paper = exam.studentPapers.find(
    p => p.studentId.toString() === studentId.toString()
  );

  if (!paper) {
    throw new Error('Paper not found for this student');
  }

  // Read the actual paper file
  const filepath = path.join(STORAGE_BASE, paper.paperPath);
  const paperData = JSON.parse(await fs.readFile(filepath, 'utf8'));

  return {
    ...paper.toObject(),
    paperData
  };
}

/**
 * Get full exam details with all papers
 */
async function getExamDetails(examId) {
  const exam = await Exam.findById(examId)
    .populate('classId')
    .populate('createdBy', 'name email');

  if (!exam) {
    throw new Error('Exam not found');
  }

  return exam.toObject();
}

module.exports = {
  generateStudentPapers,
  getStudentPaper,
  getExamDetails,
  ensureExamStorage
};
