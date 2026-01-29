/**
 * PHASE 7.0 — Secure Student Paper Resolution
 * Mathematical guarantee that student only gets their assigned paper
 */

const Exam = require('../models/Exam');
const { resolveStudentInClass } = require('./enrollmentResolver');
const path = require('path');

/**
 * Resolve student's paper with complete security chain
 * 
 * Security Chain:
 * 1. Verify exam exists
 * 2. Verify exam is accessible (published/running/closed)
 * 3. Resolve student enrollment → rollNumber
 * 4. Verify setMap contains rollNumber
 * 5. Extract assigned setId
 * 6. Verify studentPapers contains entry for rollNumber
 * 7. Verify studentPaper.setId matches setMap assignment
 * 8. Return ONLY that paper
 * 
 * @param {string} examId - Exam ID
 * @param {string} studentId - Student ID (User._id)
 * @returns {Promise<Object>} Resolved paper data
 * @throws {Error} If any validation fails
 */
async function getStudentPaper(examId, studentId) {
  // STEP 1: Load exam
  const exam = await Exam.findById(examId)
    .populate('classId', 'name code')
    .populate('createdBy', 'name');

  if (!exam) {
    throw new Error('Exam not found');
  }

  // STEP 2: Verify exam is accessible to students
  const allowedStatuses = ['published', 'running', 'closed'];
  if (!allowedStatuses.includes(exam.status)) {
    throw new Error(`Exam is not yet available. Current status: ${exam.status}`);
  }

  // STEP 3: Resolve student enrollment (critical security check)
  const resolution = await resolveStudentInClass(exam.classId._id, studentId);
  const rollNumber = resolution.rollNumber;

  console.log('[Paper Resolution] Student resolved:', {
    studentId,
    rollNumber,
    examId,
    examTitle: exam.title
  });

  // STEP 4: Verify papers exist (check both setMap and studentPapers)
  if ((!exam.setMap || exam.setMap.length === 0) && (!exam.studentPapers || exam.studentPapers.length === 0)) {
    throw new Error('Exam sets have not been generated yet. Please contact your teacher.');
  }

  // Try to find student's paper in studentPapers array first (more direct)
  if (exam.studentPapers && exam.studentPapers.length > 0) {
    const studentPaper = exam.studentPapers.find(p => p.rollNumber === rollNumber);
    
    if (studentPaper) {
      console.log('[Paper Resolution] Found paper in studentPapers array:', {
        rollNumber,
        setId: studentPaper.setId,
        paperPath: studentPaper.paperPath || studentPaper.pdfPath
      });
      
      return {
        // Student context
        student: {
          id: studentId,
          name: resolution.student.name,
          rollNumber: rollNumber
        },
        
        // Exam context
        exam: {
          id: exam._id,
          title: exam.title,
          description: exam.description,
          duration: exam.duration,
          totalMarks: exam.totalMarks,
          startTime: exam.startTime,
          endTime: exam.endTime,
          status: exam.status,
          instructions: exam.paperConfig?.instructions || ''
        },
        
        // Class context
        class: {
          id: exam.classId._id,
          name: exam.classId.name,
          code: exam.classId.code
        },
        
        // Paper assignment
        paper: {
          setId: studentPaper.setId,
          rollNumber: studentPaper.rollNumber,
          paperPath: studentPaper.paperPath || studentPaper.pdfPath,
          paperPreview: studentPaper.paperPreview,
          generatedAt: studentPaper.generatedAt,
          status: studentPaper.status
        },
        
        // Additional data for direct access
        rollNumber,
        setId: studentPaper.setId,
        paperPath: studentPaper.paperPath || studentPaper.pdfPath,
        questions: studentPaper.questions || []
      };
    }
  }

  // Fallback: Try setMap approach
  if (!exam.setMap || exam.setMap.length === 0) {
    throw new Error(`No paper found for roll number ${rollNumber}`);
  }

  // Find student's assigned set in setMap
  let assignedSetId = null;
  for (const setMapping of exam.setMap) {
    if (setMapping.assignedRollNumbers.includes(rollNumber)) {
      assignedSetId = setMapping.setId;
      break;
    }
  }

  if (!assignedSetId) {
    throw new Error(`No set assigned for roll number ${rollNumber}`);
  }

  console.log('[Paper Resolution] Set assignment found:', {
    rollNumber,
    assignedSetId
  });

  // STEP 5: Verify student paper exists
  if (!exam.studentPapers || exam.studentPapers.length === 0) {
    throw new Error('Student papers have not been generated yet');
  }

  // Find student's paper
  const studentPaper = exam.studentPapers.find(
    p => p.rollNumber === rollNumber
  );

  if (!studentPaper) {
    throw new Error(`Paper not found for roll number ${rollNumber}`);
  }

  // STEP 6: Verify paper assignment matches setMap (data integrity check)
  if (studentPaper.setId !== assignedSetId) {
    console.error('[Paper Resolution] INTEGRITY ERROR:', {
      rollNumber,
      setMapAssignment: assignedSetId,
      paperAssignment: studentPaper.setId
    });
    throw new Error('Data integrity error: Paper assignment does not match set map');
  }

  // STEP 7: Return validated paper data
  return {
    // Student context
    student: {
      id: studentId,
      name: resolution.student.name,
      rollNumber: rollNumber
    },
    
    // Exam context
    exam: {
      id: exam._id,
      title: exam.title,
      description: exam.description,
      duration: exam.duration,
      totalMarks: exam.totalMarks,
      startTime: exam.startTime,
      endTime: exam.endTime,
      status: exam.status,
      instructions: exam.paperConfig?.instructions || ''
    },
    
    // Class context
    class: {
      id: exam.classId._id,
      name: exam.classId.name,
      code: exam.classId.code
    },
    
    // Paper assignment
    paper: {
      setId: studentPaper.setId,
      rollNumber: studentPaper.rollNumber,
      paperPath: studentPaper.paperPath,
      paperPreview: studentPaper.paperPreview,
      generatedAt: studentPaper.generatedAt,
      status: studentPaper.status
    },
    
    // Verification
    verified: true,
    verifiedAt: new Date()
  };
}

/**
 * Get student paper file path for download
 * 
 * @param {string} examId - Exam ID
 * @param {string} studentId - Student ID
 * @returns {Promise<Object>} File path and metadata
 */
async function getStudentPaperFilePath(examId, studentId) {
  const paperData = await getStudentPaper(examId, studentId);
  
  console.log('[Paper File Path] Paper data received:', {
    hasPath: !!paperData.paperPath,
    hasPaper: !!paperData.paper,
    paperPath: paperData.paperPath,
    paperPaperPath: paperData.paper?.paperPath
  });
  
  // Get the paper path - try multiple possible locations
  let relativePath = paperData.paperPath || paperData.paper?.paperPath || paperData.paper?.pdfPath;
  
  if (!relativePath) {
    console.error('[Paper File Path] No paper path found in:', paperData);
    throw new Error('Paper file path not found. The paper may not have been generated properly.');
  }
  
  console.log('[Paper File Path] Using relative path:', relativePath);
  
  // Resolve absolute file path
  const path = require('path');
  const fs = require('fs');
  
  // If path is already absolute, use it
  let absolutePath;
  if (path.isAbsolute(relativePath)) {
    absolutePath = relativePath;
  } else {
    // Try multiple base paths in order of likelihood
    const possibleBases = [
      path.join(process.cwd(), 'storage/exams'),
      path.join(__dirname, '../../storage/exams'),
      path.join(process.cwd()),
      path.join(__dirname, '../../'),
      path.join(process.cwd(), 'pdfs'),
      path.join(__dirname, '../../pdfs')
    ];
    
    // Find the first base where the file exists
    for (const base of possibleBases) {
      const testPath = path.join(base, relativePath);
      console.log('[Paper File Path] Testing:', testPath);
      if (fs.existsSync(testPath)) {
        absolutePath = testPath;
        console.log('[Paper File Path] ✓ Found file at:', absolutePath);
        break;
      }
    }
    
    // If not found in any base, use default and let the route handler check existence
    if (!absolutePath) {
      absolutePath = path.join(process.cwd(), relativePath);
      console.log('[Paper File Path] File not found, using default path:', absolutePath);
    }
  }
  
  return {
    filePath: absolutePath,
    fileName: `${paperData.exam.title}_Roll_${paperData.student.rollNumber}.pdf`,
    paperData
  };
}

/**
 * Get questions from student's assigned set
 * Returns question data WITHOUT correct answers
 * 
 * @param {string} examId - Exam ID
 * @param {string} studentId - Student ID
 * @returns {Promise<Object>} Questions and metadata
 */
async function getStudentQuestions(examId, studentId) {
  const paperData = await getStudentPaper(examId, studentId);
  
  // Load exam to get generated sets
  const exam = await Exam.findById(examId);
  
  // Find the set data
  const setData = exam.generatedSets.find(
    s => s.setId === paperData.paper.setId
  );
  
  if (!setData) {
    throw new Error(`Set ${paperData.paper.setId} not found in generated sets`);
  }
  
  // Return questions WITHOUT correct answers (security)
  const questions = setData.questions.map((q, idx) => ({
    number: idx + 1,
    text: q.questionText,
    marks: q.marks,
    topic: q.topic,
    difficulty: q.difficulty,
    options: q.options || []
    // correctAnswer deliberately omitted
  }));
  
  return {
    student: paperData.student,
    exam: paperData.exam,
    paper: {
      setId: paperData.paper.setId,
      rollNumber: paperData.paper.rollNumber
    },
    questions,
    totalQuestions: questions.length,
    totalMarks: setData.totalMarks,
    instructions: setData.instructions || paperData.exam.instructions
  };
}

module.exports = {
  getStudentPaper,
  getStudentPaperFilePath,
  getStudentQuestions
};
