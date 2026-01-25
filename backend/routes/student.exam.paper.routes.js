/**
 * PHASE 7.0 — Student Exam Paper API (SECURE)
 * GET /api/v2/student/exams/:examId/my-paper
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { studentOnly } = require('../middleware/role.middleware');
const { getStudentPaper } = require('../utils/paperResolver');
const { getStudentId } = require('../utils/studentIdentity');

/**
 * Get student's own paper metadata
 * GET /api/v2/student/exams/:examId/my-paper
 */
router.get('/exams/:examId/my-paper', authenticate, studentOnly, async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const { examId } = req.params;
    
    // Use secure paper resolver
    const paperData = await getStudentPaper(examId, studentId);
    
    res.json({
      success: true,
      data: paperData
    });
  } catch (error) {
    console.error('[Get My Paper] Error:', error.message);
    
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('not yet available') ? 403 :
                   error.message.includes('not enrolled') ? 403 :
                   error.message.includes('not been generated') ? 404 :
                   500;
    
    res.status(status).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
