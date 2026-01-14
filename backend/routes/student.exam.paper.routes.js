// Student Exam Paper API
// GET /api/v2/student/exams/:examId/my-paper

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const { studentOnly } = require('../../middleware/role.middleware');
const Exam = require('../../models/Exam');
const Class = require('../../models/Class');

// GET /api/v2/student/exams/:examId/my-paper
router.get('/exams/:examId/my-paper', authenticate, studentOnly, async (req, res) => {
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
    // 6. Fetch generated paper / PDF metadata
    let paper = null;
    if (exam.generatedSets && exam.generatedSets[setId]) {
      paper = exam.generatedSets[setId];
    }
    // 7. Find student PDF metadata if available
    let pdfMeta = null;
    if (exam.studentPapers && exam.studentPapers[rollNumber]) {
      pdfMeta = exam.studentPapers[rollNumber];
    }
    // 8. Build response
    res.json({
      success: true,
      exam: {
        id: exam._id,
        title: exam.title,
        subject: exam.subject,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        instructions: exam.instructions || '',
        status: exam.status
      },
      class: {
        id: classDoc._id,
        name: classDoc.name || classDoc.title,
        code: classDoc.code,
        teacher: classDoc.teacher
      },
      student: {
        userId,
        rollNumber
      },
      setId,
      questions: paper ? paper.questions : null,
      pdf: pdfMeta ? pdfMeta.pdfUrl || pdfMeta.path : null
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to resolve student paper', error: error.message });
  }
});

module.exports = router;
