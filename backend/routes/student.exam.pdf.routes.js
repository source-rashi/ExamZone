/**
 * PHASE 7.0 — Student Exam PDF Download API (SECURE)
 * GET /api/v2/student/exams/:examId/my-paper/pdf
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { studentOnly } = require('../middleware/role.middleware');
const { getStudentPaperFilePath } = require('../utils/paperResolver');
const { getStudentId } = require('../utils/studentIdentity');
const fs = require('fs').promises;

/**
 * Download student's own paper PDF
 * GET /api/v2/student/exams/:examId/my-paper/pdf
 */
router.get('/exams/:examId/my-paper/pdf', authenticate, studentOnly, async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const { examId } = req.params;
    
    console.log('[Student PDF Download] ===================================');
    console.log('[Student PDF Download] Request:', { studentId, examId });
    
    // Use secure paper resolver to get file path
    const { filePath, fileName, paperData } = await getStudentPaperFilePath(examId, studentId);
    
    console.log('[Student PDF Download] Resolved:', { 
      filePath, 
      fileName,
      rollNumber: paperData.student?.rollNumber,
      paperPath: paperData.paperPath || paperData.paper?.paperPath 
    });
    
    // Verify file exists using sync method (more reliable)
    const fsSync = require('fs');
    if (!fsSync.existsSync(filePath)) {
      console.error('[Student PDF Download] ❌ File does not exist:', filePath);
      console.error('[Student PDF Download] Paper data:', JSON.stringify(paperData.paper, null, 2));
      
      // Try to give helpful error message
      return res.status(404).json({
        success: false,
        message: 'Paper file not found. The paper may not have been generated yet or the file was deleted.',
        debug: process.env.NODE_ENV === 'development' ? {
          attemptedPath: filePath,
          storedPath: paperData.paperPath || paperData.paper?.paperPath
        } : undefined
      });
    }
    
    console.log('[Student PDF Download] ✓ File exists, sending download');
    
    // Send file with error handling
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('[Student PDF Download] ❌ Error sending file:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Failed to download file: ' + err.message
          });
        }
      } else {
        console.log('[Student PDF Download] ✅ Download successful for roll:', paperData.student?.rollNumber);
      }
    });
    
  } catch (error) {
    console.error('[Student PDF Download] ❌ Error:', error.message);
    console.error('[Student PDF Download] Stack:', error.stack);
    
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('not yet available') ? 403 :
                   error.message.includes('not enrolled') ? 403 :
                   error.message.includes('not have been generated') ? 404 :
                   error.message.includes('Path traversal') ? 403 :
                   500;
    
    res.status(status).json({
      success: false,
      message: error.message,
      debug: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
