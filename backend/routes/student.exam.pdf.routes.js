// Student Exam PDF Access API
// GET /api/v2/student/exams/:examId/my-paper/pdf

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const { studentOnly } = require('../../middleware/role.middleware');
const Exam = require('../../models/Exam');
const Class = require('../../models/Class');
const path = require('path');

// GET /api/v2/student/exams/:examId/my-paper/pdf
router.get('/exams/:examId/my-paper/pdf', authenticate, studentOnly, async (req, res) => {
  try {
    const userId = req.user.id;
    const { examId } = req.params;
    // 1. Find exam
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    // 2. Find class
    const classDoc = await Class.findById(exam.classId);
    if (!classDoc) return res.status(404).json({ success: false, message: 'Class not found' });
    // 3. Find student in class
    const student = classDoc.students.find(s => s.userId && s.userId.toString() === userId);
    if (!student) return res.status(403).json({ success: false, message: 'You are not enrolled in this class' });
    // 4. Get rollNumber
    const rollNumber = student.rollNumber;
    // 5. Resolve assigned set
    const setId = exam.setMap && rollNumber ? exam.setMap[rollNumber] : null;
    if (!setId) return res.status(404).json({ success: false, message: 'No set assigned for this student' });
    // 6. Fetch student PDF metadata
    let pdfMeta = null;
    if (exam.studentPapers && exam.studentPapers[rollNumber]) {
      pdfMeta = exam.studentPapers[rollNumber];
    }
    if (!pdfMeta || !pdfMeta.path) {
      return res.status(404).json({ success: false, message: 'PDF not generated or not available' });
    }
    // 7. Serve PDF file
    const pdfPath = path.resolve(pdfMeta.path);
    res.download(pdfPath, path.basename(pdfPath));
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to serve student PDF', error: error.message });
  }
});

module.exports = router;
