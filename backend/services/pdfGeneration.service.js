/**
 * PHASE 6.4 — STUDENT PAPER ENGINE
 * 
 * Generates individual PDF question papers for each student
 * Maps students to their assigned sets
 * Stores PDFs in /storage/exams/{examId}/{rollNumber}.pdf
 */

const fs = require('fs').promises;
const path = require('path');
const PDFDocument = require('pdfkit');
const Exam = require('../models/Exam');
const Enrollment = require('../models/Enrollment');

/**
 * Generate PDF for a single student
 * 
 * Creates a formatted PDF with:
 * - Header (exam info, student info, set ID)
 * - Instructions
 * - Questions with proper numbering
 * - Footer (watermark, timestamp)
 * 
 * @param {Object} exam - Exam object
 * @param {Object} student - Student object {studentId, rollNumber, name, email}
 * @param {Object} set - Question set object
 * @returns {Promise<String>} PDF file path
 */
async function generateExamPDF({ exam, student, set }) {
  try {
    // Create storage directory if it doesn't exist
    const storageDir = path.join(process.cwd(), 'storage', 'exams', exam._id.toString());
    await fs.mkdir(storageDir, { recursive: true });

    // Define PDF path
    const pdfPath = path.join(storageDir, `${student.rollNumber}.pdf`);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        },
        size: 'A4'
      });

      const writeStream = require('fs').createWriteStream(pdfPath);
      doc.pipe(writeStream);

      // HEADER SECTION
      doc.fontSize(20).font('Helvetica-Bold').text(exam.title, { align: 'center' });
      doc.moveDown(0.5);

      if (exam.classId && exam.classId.name) {
        doc.fontSize(12).font('Helvetica').text(`Class: ${exam.classId.name}`, { align: 'center' });
      }

      doc.moveDown(0.5);
      doc.fontSize(10).text(`Student: ${student.name || 'N/A'}`, { align: 'left' });
      doc.text(`Roll Number: ${student.rollNumber}`, { align: 'left' });
      doc.text(`Set: ${set.setId}`, { align: 'left' });
      doc.text(`Total Marks: ${exam.totalMarks}`, { align: 'left' });
      doc.text(`Duration: ${exam.duration} minutes`, { align: 'left' });

      doc.moveDown(1);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.5);

      // INSTRUCTIONS
      if (exam.description || set.instructions) {
        doc.fontSize(11).font('Helvetica-Bold').text('Instructions:', { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(10).font('Helvetica').text(exam.description || set.instructions || 'Read all questions carefully before answering.');
        doc.moveDown(1);
      }

      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(1);

      // QUESTIONS SECTION
      set.questions.forEach((question, index) => {
        // Check if we need a new page
        if (doc.y > 700) {
          doc.addPage();
        }

        // Question number and text
        doc.fontSize(11).font('Helvetica-Bold').text(`Q${index + 1}. `, { continued: true })
           .font('Helvetica').text(question.questionText);
        
        doc.fontSize(9).font('Helvetica-Oblique')
           .text(`(${question.marks} mark${question.marks > 1 ? 's' : ''})`, { align: 'right' });

        doc.moveDown(0.5);

        // Options (if any)
        if (question.options && question.options.length > 0) {
          question.options.forEach((option, optIndex) => {
            const label = String.fromCharCode(97 + optIndex); // a, b, c, d...
            doc.fontSize(10).font('Helvetica').text(`   ${label}) ${option}`);
          });
          doc.moveDown(0.5);
        }

        // Answer space
        doc.fontSize(9).font('Helvetica-Oblique').text('Answer:');
        doc.moveDown(2);

        // Separator line
        if (index < set.questions.length - 1) {
          doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
          doc.moveDown(0.5);
        }
      });

      // FOOTER
      doc.moveDown(2);
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).font('Helvetica-Oblique')
           .text(
             `ExamZone • Generated: ${new Date().toLocaleString()} • Page ${i + 1} of ${pageCount}`,
             50,
             doc.page.height - 30,
             { align: 'center' }
           );
      }

      doc.end();

      writeStream.on('finish', () => {
        console.log(`[PDF Generator] Created PDF for roll ${student.rollNumber} at ${pdfPath}`);
        resolve(pdfPath);
      });

      writeStream.on('error', (error) => {
        console.error(`[PDF Generator] Error creating PDF for roll ${student.rollNumber}:`, error);
        reject(error);
      });
    });
  } catch (error) {
    console.error('[PDF Generator] Error:', error.message);
    throw error;
  }
}

/**
 * Generate Student Papers for Exam
 * 
 * Generates PDF papers for all enrolled students
 * Maps each student to their assigned set
 * Stores student paper records in exam.studentPapers
 * Updates exam status to 'generated'
 * 
 * @param {string} examId - Exam ID
 * @returns {Promise<Object>} Generation result
 */
async function generateStudentPapers(examId) {
  try {
    console.log('[Student Papers] Starting generation for exam:', examId);

    // Load exam with class data
    const exam = await Exam.findById(examId).populate('classId');
    if (!exam) {
      throw new Error('Exam not found');
    }

    // TASK 8 - Verify exam is in prepared status (cannot generate papers from other states)
    if (exam.status !== 'prepared') {
      throw new Error(`Cannot generate student papers: Exam must be in 'prepared' status (current: ${exam.status})`);
    }

    // TASK 8 - Verify sets exist (cannot generate papers without sets)
    if (!exam.generatedSets || exam.generatedSets.length === 0) {
      throw new Error('Cannot generate student papers: No question sets found. Generate sets first.');
    }

    // TASK 8 - Verify setMap exists
    if (!exam.setMap || exam.setMap.length === 0) {
      throw new Error('Cannot generate student papers: No student distribution found.');
    }

    // TASK 8 - Prevent regeneration if papers already exist
    if (exam.studentPapers && exam.studentPapers.length > 0) {
      throw new Error('Student papers already generated. Reset exam to regenerate.');
    }

    // Load enrolled students
    const enrollments = await Enrollment.find({ 
      classId: exam.classId._id 
    }).populate('studentId', 'name email rollNumber');

    const students = enrollments
      .filter(e => e.studentId && e.studentId.rollNumber)
      .map(e => ({
        studentId: e.studentId._id,
        rollNumber: e.studentId.rollNumber,
        name: e.studentId.name,
        email: e.studentId.email
      }));

    if (students.length === 0) {
      throw new Error('Cannot generate student papers: No enrolled students found');
    }

    console.log(`[Student Papers] Generating PDFs for ${students.length} students...`);

    // Generate PDF for each student
    const studentPapers = [];
    
    for (const student of students) {
      // Find student's assigned set
      const studentSetMapping = exam.setMap.find(sm => 
        sm.assignedRollNumbers.includes(student.rollNumber)
      );

      if (!studentSetMapping) {
        console.warn(`[Student Papers] No set assigned for roll ${student.rollNumber}, skipping`);
        continue;
      }

      const assignedSet = exam.generatedSets.find(s => s.setId === studentSetMapping.setId);
      
      if (!assignedSet) {
        console.warn(`[Student Papers] Set ${studentSetMapping.setId} not found for roll ${student.rollNumber}, skipping`);
        continue;
      }

      // Generate PDF
      const pdfPath = await generateExamPDF({
        exam,
        student,
        set: assignedSet
      });

      // Store paper record
      studentPapers.push({
        studentId: student.studentId,
        rollNumber: student.rollNumber,
        setId: assignedSet.setId,
        pdfPath: pdfPath,
        generatedAt: new Date()
      });
    }

    // Update exam with student papers
    exam.studentPapers = studentPapers;
    exam.status = 'generated';
    console.log('[Student Papers] BEFORE SAVE - Status:', exam.status);
    await exam.save();
    console.log('[Student Papers] AFTER SAVE - Status:', exam.status);

    console.log(`[Student Papers] ✅ Generated ${studentPapers.length} papers successfully`);

    return {
      success: true,
      papersGenerated: studentPapers.length,
      message: `Successfully generated ${studentPapers.length} student papers`,
      exam: exam.toObject() // Return updated exam
    };
  } catch (error) {
    console.error('[Student Papers] Error:', error.message);
    throw error;
  }
}

/**
 * Get Student's Paper
 * 
 * Retrieves the PDF path for a specific student's exam paper
 * 
 * @param {string} examId - Exam ID
 * @param {string} studentId - Student ID
 * @returns {Promise<Object>} Paper info
 */
async function getStudentPaper(examId, studentId) {
  try {
    const exam = await Exam.findById(examId);
    if (!exam) {
      throw new Error('Exam not found');
    }

    const paper = exam.studentPapers.find(p => 
      p.studentId.toString() === studentId.toString()
    );

    if (!paper) {
      throw new Error('Paper not found for this student');
    }

    return paper;
  } catch (error) {
    console.error('[Get Student Paper] Error:', error.message);
    throw error;
  }
}

module.exports = {
  generateExamPDF,
  generateStudentPapers,
  getStudentPaper
};
