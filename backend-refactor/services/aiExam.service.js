const axios = require('axios');
const path = require('path');
const fs = require('fs').promises;
const Exam = require('../models/Exam');
const ExamPaper = require('../models/ExamPaper');
const Class = require('../models/Class');
const User = require('../models/User');

/**
 * PHASE 6.3 — AI Exam Bridge Service
 * 
 * CRITICAL: This is a BRIDGE LAYER only.
 * Does NOT modify AI logic.
 * Does NOT touch Gemini/OCR/PDF generation.
 * 
 * Responsibilities:
 * 1. Load exam and validate
 * 2. Load class students
 * 3. Build payload for FastAPI
 * 4. Call FastAPI (BLACK BOX)
 * 5. Store returned files
 * 6. Create ExamPaper records
 */

// FastAPI service URL (from env or default)
const FASTAPI_URL = process.env.FASTAPI_AI_URL || 'http://localhost:8000';

/**
 * Generate question papers for an exam
 * @param {string} examId - Exam ID
 * @param {string} teacherId - Teacher ID (for authorization)
 * @returns {Promise<Object>} - Generation result with stats
 */
async function generateExamPapers(examId, teacherId) {
  try {
    // 1. Load and validate exam
    const exam = await Exam.findById(examId).populate('classId');
    if (!exam) {
      throw new Error('Exam not found');
    }

    // Validate teacher authorization
    if (exam.createdBy.toString() !== teacherId) {
      throw new Error('Unauthorized: Only exam creator can generate papers');
    }

    // Validate exam status
    if (exam.status !== 'published') {
      throw new Error('Exam must be published before generating papers');
    }

    // Check if papers already generated
    const existingPapers = await ExamPaper.countDocuments({ exam: examId });
    if (existingPapers > 0) {
      throw new Error('Question papers already generated for this exam');
    }

    // 2. Load class students
    const classData = await Class.findById(exam.classId).populate('students');
    if (!classData || !classData.students || classData.students.length === 0) {
      throw new Error('No students enrolled in this class');
    }

    const students = classData.students.filter(s => s.role === 'student');
    if (students.length === 0) {
      throw new Error('No students found in class');
    }

    // 3. Prepare student details for FastAPI
    const studentDetails = students.map((student, idx) => ({
      name: student.name || `Student ${idx + 1}`,
      reg_no: student.email || `REG${idx + 1}`,
      student_id: student._id.toString()
    }));

    // 4. Build FastAPI payload
    const payload = {
      exam_id: examId,
      class_id: exam.classId.toString(),
      student_count: students.length,
      questions_per_bank: exam.aiConfig?.questionsPerBank || 10,
      sets_per_student: exam.setsPerStudent || 1,
      custom_title: exam.title,
      course_name: classData.subject || 'General',
      section: classData.name || classData.title || 'A',
      total_marks: exam.totalMarks || 100,
      student_details: studentDetails
    };

    console.log('[AI Bridge] Calling FastAPI with payload:', {
      exam_id: payload.exam_id,
      student_count: payload.student_count,
      sets: payload.sets_per_student
    });

    // 5. Call FastAPI (BLACK BOX - do not modify their logic)
    const response = await axios.post(
      `${FASTAPI_URL}/api/generate-papers`,
      payload,
      {
        timeout: 300000, // 5 minutes timeout
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.data || !response.data.success) {
      throw new Error(response.data?.error || 'AI service returned error');
    }

    const generatedPapers = response.data.papers || [];
    
    console.log('[AI Bridge] FastAPI returned', generatedPapers.length, 'papers');

    // 6. Store files and create ExamPaper records
    const examPaperRecords = [];
    
    for (const paper of generatedPapers) {
      // Ensure upload directory exists
      const uploadDir = path.join(
        __dirname, 
        '../../uploads/exams',
        examId,
        paper.student_id
      );
      await fs.mkdir(uploadDir, { recursive: true });

      // Copy file from FastAPI output to our storage
      const destPath = path.join(uploadDir, `set_${paper.set_number}.pdf`);
      
      // If FastAPI returns base64 or file path, handle appropriately
      if (paper.pdf_base64) {
        // Base64 encoded PDF
        const buffer = Buffer.from(paper.pdf_base64, 'base64');
        await fs.writeFile(destPath, buffer);
      } else if (paper.pdf_path) {
        // File path returned
        await fs.copyFile(paper.pdf_path, destPath);
      } else {
        console.warn('[AI Bridge] No PDF data for student', paper.student_id);
        continue;
      }

      // Create ExamPaper record
      const examPaper = await ExamPaper.create({
        exam: examId,
        student: paper.student_id,
        pdfPath: destPath.replace(/\\/g, '/'),
        setNumber: paper.set_number,
        generatedAt: new Date()
      });

      examPaperRecords.push(examPaper);
    }

    // Update exam questionPapers array (for backward compatibility)
    exam.questionPapers = examPaperRecords.map(ep => ({
      studentId: ep.student,
      filePath: ep.pdfPath,
      setCode: `SET-${ep.setNumber}`,
      generatedAt: ep.generatedAt
    }));
    await exam.save();

    console.log('[AI Bridge] Successfully created', examPaperRecords.length, 'ExamPaper records');

    return {
      success: true,
      message: `Generated ${examPaperRecords.length} question papers`,
      stats: {
        totalPapers: examPaperRecords.length,
        students: students.length,
        setsPerStudent: exam.setsPerStudent || 1
      }
    };

  } catch (error) {
    console.error('[AI Bridge] Error:', error.message);
    throw error;
  }
}

/**
 * Get generated papers for a specific exam
 * @param {string} examId - Exam ID
 * @returns {Promise<Array>} - Array of ExamPaper documents
 */
async function getExamPapers(examId) {
  return await ExamPaper.find({ exam: examId })
    .populate('student', 'name email')
    .sort({ setNumber: 1, student: 1 });
}

/**
 * Get paper for a specific student
 * @param {string} examId - Exam ID
 * @param {string} studentId - Student ID
 * @param {number} setNumber - Set number (optional)
 * @returns {Promise<Object>} - ExamPaper document
 */
async function getStudentPaper(examId, studentId, setNumber = 1) {
  return await ExamPaper.findOne({
    exam: examId,
    student: studentId,
    setNumber
  });
}

module.exports = {
  generateExamPapers,
  getExamPapers,
  getStudentPaper
};
