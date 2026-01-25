/**
 * PHASE 7.0 — Student Exam PDF Download API (SECURE)
 * GET /api/v2/student/exams/:examId/my-paper/pdf
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const { studentOnly } = require('../../middleware/role.middleware');
const { getStudentPaperFilePath } = require('../../utils/paperResolver');
const { getStudentId } = require('../../utils/studentIdentity');
const fs = require('fs').promises;

/**
 * Download student's own paper PDF
 * GET /api/v2/student/exams/:examId/my-paper/pdf
 */
router.get('/exams/:examId/my-paper/pdf', authenticate, studentOnly, async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const { examId } = req.params;
    
    // Use secure paper resolver to get file path
    const { filePath, fileName, paperData } = await getStudentPaperFilePath(examId, studentId);
    
    // Verify file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Paper file not found on server'
      });
    }
    
    console.log('[PDF Download] Serving paper:', {
      studentId,
      rollNumber: paperData.student.rollNumber,
      examId,
      fileName
    });
    
    // Stream PDF file
    res.download(filePath, fileName);
  } catch (error) {
    console.error('[PDF Download] Error:', error.message);
    
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('not yet available') ? 403 :
                   error.message.includes('not enrolled') ? 403 :
                   error.message.includes('Path traversal') ? 403 :
                   500;
    
    res.status(status).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
