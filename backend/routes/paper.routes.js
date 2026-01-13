/**
 * PHASE 6.4 — TASK 3 & 4: PAPER DOWNLOAD ROUTES
 * 
 * Secure access to exam PDFs:
 * - Students can only access their own paper
 * - Teachers can access all papers for their classes
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { teacherOnly } = require('../middleware/role.middleware');
const Exam = require('../models/Exam');
const Enrollment = require('../models/Enrollment');
const path = require('path');
const fs = require('fs').promises;

/**
 * TASK 3: Get student's own paper
 * GET /api/papers/student/:examId
 * 
 * Student can download only their assigned paper
 */
router.get('/student/:examId', authenticate, async (req, res) => {
  try {
    const { examId } = req.params;
    const studentId = req.user.id;
    
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }
    
    // Find student's paper
    const paper = exam.studentPapers.find(p => 
      p.studentId.toString() === studentId
    );
    
    if (!paper) {
      return res.status(404).json({ 
        success: false, 
        message: 'Paper not found or not yet generated' 
      });
    }
    
    // Check file exists (paperPath is already absolute)
    const filePath = paper.paperPath;
    
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({ 
        success: false, 
        message: 'Paper file not found on server' 
      });
    }
    
    // Stream PDF file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="exam_${exam.title}_roll_${paper.rollNumber}.pdf"`);
    res.sendFile(filePath);
    
  } catch (error) {
    console.error('[Paper Download] Student error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * TASK 4: Get student paper by roll (teacher only)
 * GET /api/papers/exam/:examId/student/:rollNumber
 * 
 * Teacher can download any student's paper
 */
router.get('/exam/:examId/student/:rollNumber', 
  authenticate, 
  teacherOnly, 
  async (req, res) => {
    try {
      const { examId, rollNumber } = req.params;
      const teacherId = req.user.id;
      
      const exam = await Exam.findById(examId).populate('classId').populate('createdBy');
      if (!exam) {
        return res.status(404).json({ success: false, message: 'Exam not found' });
      }
      
      // Verify teacher owns this class (safe toString check)
      const examCreatorId = exam.createdBy?._id || exam.createdBy;
      if (!examCreatorId || examCreatorId.toString() !== teacherId) {
        return res.status(403).json({ 
          success: false, 
          message: 'Unauthorized: You do not own this exam' 
        });
      }
      
      // Find student's paper
      const paper = exam.studentPapers.find(p => 
        p.rollNumber === parseInt(rollNumber)
      );
      
      if (!paper) {
        return res.status(404).json({ 
          success: false, 
          message: 'Paper not found for this roll number' 
        });
      }
      
      // Check file exists (paperPath is already absolute)
      const filePath = paper.paperPath;
      
      try {
        await fs.access(filePath);
      } catch (error) {
        return res.status(404).json({ 
          success: false, 
          message: 'Paper file not found on server' 
        });
      }
      
      // Stream PDF file
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="exam_${exam.title}_roll_${rollNumber}.pdf"`);
      res.sendFile(filePath);
      
    } catch (error) {
      console.error('[Paper Download] Teacher student paper error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

/**
 * TASK 4: Get set master paper (teacher only)
 * GET /api/papers/exam/:examId/set/:setId
 * 
 * Teacher can download master copy of any set
 */
router.get('/exam/:examId/set/:setId', 
  authenticate, 
  teacherOnly, 
  async (req, res) => {
    try {
      const { examId, setId } = req.params;
      const teacherId = req.user.id;
      
      const exam = await Exam.findById(examId).populate('classId').populate('createdBy');
      if (!exam) {
        return res.status(404).json({ success: false, message: 'Exam not found' });
      }
      
      // Verify teacher owns this class (safe toString check)
      const examCreatorId = exam.createdBy?._id || exam.createdBy;
      if (!examCreatorId || examCreatorId.toString() !== teacherId) {
        return res.status(403).json({ 
          success: false, 
          message: 'Unauthorized: You do not own this exam' 
        });
      }
      
      // Verify set exists
      const set = exam.generatedSets.find(s => s.setId === setId);
      if (!set) {
        return res.status(404).json({ 
          success: false, 
          message: 'Set not found' 
        });
      }
      
      // Construct file path
      const filePath = path.join(
        process.cwd(), 
        'storage/exams', 
        examId, 
        'sets', 
        `${setId}.pdf`
      );
      
      try {
        await fs.access(filePath);
      } catch (error) {
        return res.status(404).json({ 
          success: false, 
          message: 'Set PDF not found on server' 
        });
      }
      
      // Stream PDF file
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="exam_${exam.title}_${setId}.pdf"`);
      res.sendFile(filePath);
      
    } catch (error) {
      console.error('[Paper Download] Set master error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

/**
 * TASK 4: List all papers for exam (teacher only)
 * GET /api/papers/exam/:examId/list
 * 
 * Returns metadata for all student papers and set masters
 */
router.get('/exam/:examId/list', 
  authenticate, 
  teacherOnly, 
  async (req, res) => {
    try {
      const { examId } = req.params;
      const teacherId = req.user.id;
      
      const exam = await Exam.findById(examId).populate('classId').populate('createdBy');
      if (!exam) {
        return res.status(404).json({ success: false, message: 'Exam not found' });
      }
      
      // Verify teacher owns this class (safe toString check)
      const examCreatorId = exam.createdBy?._id || exam.createdBy;
      if (!examCreatorId || examCreatorId.toString() !== teacherId) {
        return res.status(403).json({ 
          success: false, 
          message: 'Unauthorized: You do not own this exam' 
        });
      }
      
      // Return paper metadata
      res.json({
        success: true,
        data: {
          examTitle: exam.title,
          className: exam.classId.name,
          studentPapers: exam.studentPapers.map(p => ({
            studentId: p.studentId,
            rollNumber: p.rollNumber,
            name: p.name,
            setId: p.setId,
            generatedAt: p.generatedAt,
            downloadUrl: `/api/papers/exam/${examId}/student/${p.rollNumber}`
          })),
          setMasters: exam.generatedSets.map(s => ({
            setId: s.setId,
            questionCount: s.questions.length,
            totalMarks: s.totalMarks,
            downloadUrl: `/api/papers/exam/${examId}/set/${s.setId}`
          }))
        }
      });
      
    } catch (error) {
      console.error('[Paper List] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

module.exports = router;
