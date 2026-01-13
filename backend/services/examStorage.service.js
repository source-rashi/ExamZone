/**
 * PHASE 6.4 — TASK 3
 * REAL EXAM FILE SYSTEM STORAGE SERVICE
 * 
 * Manages physical PDF storage with proper directory structure
 * 
 * Directory Structure:
 * /storage/exams/{examId}/
 *   /sets/{setId}.pdf          - Master set PDFs
 *   /students/{rollNumber}.pdf - Individual student papers
 * 
 * RULES:
 * - ONLY PDFs allowed (no JSON dumps)
 * - Each exam isolated in its own folder
 * - Automatic directory creation
 * - Path safety validation
 * - Overwrite protection optional
 */

const fs = require('fs').promises;
const path = require('path');

// Base storage directory
const STORAGE_ROOT = path.join(__dirname, '../../storage/exams');

/**
 * Get base directory for an exam
 * @param {string} examId - Exam ID
 * @returns {string} Absolute path to exam directory
 */
function getExamDirectory(examId) {
  if (!examId) {
    throw new Error('Exam ID is required');
  }
  return path.join(STORAGE_ROOT, examId.toString());
}

/**
 * Get sets directory for an exam
 * @param {string} examId - Exam ID
 * @returns {string} Absolute path to sets directory
 */
function getSetsDirectory(examId) {
  return path.join(getExamDirectory(examId), 'sets');
}

/**
 * Get students directory for an exam
 * @param {string} examId - Exam ID
 * @returns {string} Absolute path to students directory
 */
function getStudentsDirectory(examId) {
  return path.join(getExamDirectory(examId), 'students');
}

/**
 * Get path for a master set PDF
 * @param {string} examId - Exam ID
 * @param {string} setId - Set ID (e.g., "SET-001")
 * @returns {string} Absolute path to set PDF
 */
function getSetPdfPath(examId, setId) {
  if (!setId || !setId.endsWith) {
    throw new Error('Invalid set ID');
  }
  const filename = `${setId}.pdf`;
  return path.join(getSetsDirectory(examId), filename);
}

/**
 * Get path for a student paper PDF
 * @param {string} examId - Exam ID
 * @param {number} rollNumber - Student roll number
 * @returns {string} Absolute path to student PDF
 */
function getStudentPdfPath(examId, rollNumber) {
  if (typeof rollNumber !== 'number' && typeof rollNumber !== 'string') {
    throw new Error('Invalid roll number');
  }
  const filename = `student_${rollNumber}.pdf`;
  return path.join(getStudentsDirectory(examId), filename);
}

/**
 * Ensure exam directory structure exists
 * Creates all necessary subdirectories
 * @param {string} examId - Exam ID
 * @returns {Promise<Object>} Created paths
 */
async function ensureExamDirectories(examId) {
  const examDir = getExamDirectory(examId);
  const setsDir = getSetsDirectory(examId);
  const studentsDir = getStudentsDirectory(examId);

  await fs.mkdir(examDir, { recursive: true });
  await fs.mkdir(setsDir, { recursive: true });
  await fs.mkdir(studentsDir, { recursive: true });

  return {
    examDir,
    setsDir,
    studentsDir
  };
}

/**
 * Check if a PDF file exists
 * @param {string} pdfPath - Absolute path to PDF
 * @returns {Promise<boolean>} True if exists
 */
async function pdfExists(pdfPath) {
  try {
    await fs.access(pdfPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate PDF path safety
 * Ensures path is within storage root
 * @param {string} pdfPath - Path to validate
 * @throws {Error} If path is unsafe
 */
function validatePathSafety(pdfPath) {
  const normalizedPath = path.normalize(pdfPath);
  const normalizedRoot = path.normalize(STORAGE_ROOT);
  
  if (!normalizedPath.startsWith(normalizedRoot)) {
    throw new Error('Invalid path: outside storage root');
  }
  
  if (!pdfPath.endsWith('.pdf')) {
    throw new Error('Invalid file type: only PDF allowed');
  }
}

/**
 * Delete all files for an exam (cleanup)
 * @param {string} examId - Exam ID
 * @returns {Promise<void>}
 */
async function deleteExamFiles(examId) {
  const examDir = getExamDirectory(examId);
  
  try {
    await fs.rm(examDir, { recursive: true, force: true });
    console.log(`[Storage] Deleted exam directory: ${examDir}`);
  } catch (error) {
    console.error(`[Storage] Failed to delete exam directory:`, error.message);
    throw error;
  }
}

/**
 * List all set PDFs for an exam
 * @param {string} examId - Exam ID
 * @returns {Promise<Array<string>>} Array of PDF filenames
 */
async function listSetPdfs(examId) {
  const setsDir = getSetsDirectory(examId);
  
  try {
    const files = await fs.readdir(setsDir);
    return files.filter(f => f.endsWith('.pdf'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * List all student PDFs for an exam
 * @param {string} examId - Exam ID
 * @returns {Promise<Array<string>>} Array of PDF filenames
 */
async function listStudentPdfs(examId) {
  const studentsDir = getStudentsDirectory(examId);
  
  try {
    const files = await fs.readdir(studentsDir);
    return files.filter(f => f.endsWith('.pdf'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * Get storage statistics for an exam
 * @param {string} examId - Exam ID
 * @returns {Promise<Object>} Storage stats
 */
async function getExamStorageStats(examId) {
  const [setPdfs, studentPdfs] = await Promise.all([
    listSetPdfs(examId),
    listStudentPdfs(examId)
  ]);

  return {
    examId,
    totalSets: setPdfs.length,
    totalStudentPapers: studentPdfs.length,
    setPdfs,
    studentPdfs: studentPdfs.slice(0, 10) // Sample only
  };
}

/**
 * Verify exam storage integrity
 * Checks that expected PDFs exist
 * @param {string} examId - Exam ID
 * @param {number} expectedSets - Expected number of sets
 * @param {number} expectedStudents - Expected number of students
 * @returns {Promise<Object>} Integrity report
 */
async function verifyExamStorage(examId, expectedSets, expectedStudents) {
  const [setPdfs, studentPdfs] = await Promise.all([
    listSetPdfs(examId),
    listStudentPdfs(examId)
  ]);

  const issues = [];
  
  if (setPdfs.length !== expectedSets) {
    issues.push(`Expected ${expectedSets} set PDFs, found ${setPdfs.length}`);
  }
  
  if (studentPdfs.length !== expectedStudents) {
    issues.push(`Expected ${expectedStudents} student PDFs, found ${studentPdfs.length}`);
  }

  return {
    valid: issues.length === 0,
    issues,
    found: {
      sets: setPdfs.length,
      students: studentPdfs.length
    },
    expected: {
      sets: expectedSets,
      students: expectedStudents
    }
  };
}

module.exports = {
  // Path getters
  getExamDirectory,
  getSetsDirectory,
  getStudentsDirectory,
  getSetPdfPath,
  getStudentPdfPath,
  
  // Directory management
  ensureExamDirectories,
  
  // File operations
  pdfExists,
  validatePathSafety,
  deleteExamFiles,
  listSetPdfs,
  listStudentPdfs,
  
  // Statistics and verification
  getExamStorageStats,
  verifyExamStorage,
  
  // Constants
  STORAGE_ROOT
};
