/**
 * PHASE 6.4 — STUDENT PAPER PDF GENERATION SERVICE
 * 
 * TASK 1: Strict student → set binding
 * TASK 2: Per-set master PDF generation
 * 
 * CRITICAL RULES:
 * - Students receive ONLY their assigned set from exam.setMap
 * - No regeneration of questions
 * - Uses exam.generatedSets and exam.setMap ONLY
 */

const fs = require('fs').promises;
const path = require('path');
const PDFDocument = require('pdfkit');
const Exam = require('../models/Exam');
const Enrollment = require('../models/Enrollment');
const examStorage = require('./examStorage.service');

/**
 * Core PDF Generation Function
 * Generates formatted exam paper PDF
 */
async function createPDF(options) {
  const {
    outputPath,
    title,
    description,
    className,
    subject,
    studentInfo,
    setInfo,
    questions,
    examMetadata,
    instructions,
    isMaster = false
  } = options;
  
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });
      
      const writeStream = require('fs').createWriteStream(outputPath);
      doc.pipe(writeStream);
      
      // HEADER
      doc.fontSize(16).font('Helvetica-Bold').text(title.toUpperCase(), { align: 'center' });
      doc.moveDown(0.5);
      
      if (description) {
        doc.fontSize(10).font('Helvetica').text(description, { align: 'center' });
        doc.moveDown(0.3);
      }
      
      doc.fontSize(11).text(`Class: ${className}`, { align: 'center' });
      doc.text(`Subject: ${subject}`, { align: 'center' });
      doc.moveDown(1);
      
      // STUDENT/SET INFO
      doc.fontSize(10).font('Helvetica');
      
      if (studentInfo && !isMaster) {
        doc.text(`Student Name: ${studentInfo.name}`, 50, doc.y);
        doc.text(`Roll Number: ${studentInfo.rollNumber}`, 400, doc.y - 12, {
          width: 150,
          align: 'right'
        });
        doc.moveDown(0.5);
      }
      
      if (setInfo) {
        const setLabel = isMaster ? 'Master Copy' : 'Set';
        doc.text(`${setLabel}: ${setInfo.setId}`, 50, doc.y);
      }
      
      // EXAM METADATA
      doc.text(`Total Marks: ${examMetadata.totalMarks}`, 400, doc.y - 12, {
        width: 150,
        align: 'right'
      });
      doc.moveDown(0.5);
      doc.text(`Duration: ${examMetadata.duration} minutes`);
      doc.moveDown(1);
      
      // DIVIDER
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(1);
      
      // INSTRUCTIONS
      if (instructions) {
        doc.fontSize(9).font('Helvetica-Bold').text('Instructions:', 50, doc.y);
        doc.font('Helvetica').text(instructions, { width: 495, align: 'justify' });
        doc.moveDown(1);
      }
      
      doc.fontSize(9).font('Helvetica-Bold').text('General Instructions:', 50, doc.y);
      doc.font('Helvetica');
      doc.list([
        'Read all questions carefully before attempting.',
        'Write your answers clearly and legibly.',
        'Marks are indicated against each question.'
      ], 50, doc.y + 5, { bulletRadius: 2, textIndent: 20, width: 495 });
      doc.moveDown(1.5);
      
      // DIVIDER
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(1.5);
      
      // QUESTIONS
      doc.fontSize(11).font('Helvetica-Bold').text('QUESTIONS', { align: 'center' });
      doc.moveDown(1);
      
      questions.forEach((q, index) => {
        if (doc.y > 700) {
          doc.addPage();
        }
        
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text(`Q${index + 1}.`, 50, doc.y, { continued: true });
        doc.font('Helvetica').text(` ${q.questionText || 'No question text'}`, {
          width: 450,
          align: 'left'
        });
        
        // Marks
        doc.fontSize(9).font('Helvetica-Oblique');
        doc.text(`[${q.marks || 0} mark${q.marks !== 1 ? 's' : ''}]`, 500, doc.y - 15, {
          width: 45,
          align: 'right'
        });
        
        // Options if MCQ
        if (q.options && q.options.length > 0) {
          doc.moveDown(0.5);
          doc.fontSize(9).font('Helvetica');
          q.options.forEach((option, optIndex) => {
            const label = String.fromCharCode(65 + optIndex);
            doc.text(`${label}. ${option}`, 70, doc.y, { width: 475 });
            doc.moveDown(0.3);
          });
        }
        
        // Answer space
        doc.moveDown(0.5);
        doc.fontSize(8).font('Helvetica-Oblique').fillColor('#888888');
        doc.text('Answer:', 70, doc.y);
        doc.moveDown(0.2);
        doc.moveTo(70, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(0.2);
        doc.moveTo(70, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(0.2);
        doc.moveTo(70, doc.y).lineTo(545, doc.y).stroke();
        doc.fillColor('#000000');
        
        doc.moveDown(1.5);
      });
      
      // FOOTER
      doc.fontSize(8).font('Helvetica-Oblique').fillColor('#666666');
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 50, 770, {
        width: 495,
        align: 'center'
      });
      doc.text(`Total Questions: ${questions.length}`, { align: 'center' });
      
      doc.end();
      
      writeStream.on('finish', () => resolve(outputPath));
      writeStream.on('error', (err) => reject(err));
      
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * TASK 1 — Generate Student Paper (Strictly Bound to Assigned Set)
 * 
 * @param {Object} exam - Exam document
 * @param {Object} student - { studentId, rollNumber, name }
 * @returns {Promise<string>} PDF file path
 */
async function generateStudentPaper(exam, student) {
  try {
    console.log(`[PDF Gen] Generating paper for roll ${student.rollNumber}`);
    
    // CRITICAL: Find student's assigned set from setMap
    const setMapEntry = exam.setMap.find(entry => 
      entry.assignedRollNumbers.includes(student.rollNumber)
    );
    
    if (!setMapEntry) {
      throw new Error(`No set assigned to roll number ${student.rollNumber}`);
    }
    
    const assignedSetId = setMapEntry.setId;
    console.log(`[PDF Gen] Roll ${student.rollNumber} → ${assignedSetId}`);
    
    // CRITICAL: Find the set in generatedSets
    const assignedSet = exam.generatedSets.find(set => set.setId === assignedSetId);
    
    if (!assignedSet) {
      throw new Error(`Assigned set ${assignedSetId} not found in generatedSets`);
    }
    
    if (!assignedSet.questions || assignedSet.questions.length === 0) {
      throw new Error(`Set ${assignedSetId} has no questions`);
    }
    
    // Create storage directory using examStorage service
    await examStorage.ensureExamDirectories(exam._id.toString());
    
    // Generate PDF path using examStorage service
    const pdfPath = examStorage.getStudentPdfPath(exam._id.toString(), student.rollNumber);
    
    await createPDF({
      outputPath: pdfPath,
      title: exam.title,
      description: exam.description || '',
      className: (exam.classId && exam.classId.name) || 'N/A',
      subject: exam.paperConfig?.subject || 'General',
      studentInfo: {
        id: student.studentId,
        name: student.name,
        rollNumber: student.rollNumber
      },
      setInfo: {
        setId: assignedSetId,
        setName: `Set ${assignedSetId}`
      },
      questions: assignedSet.questions,
      examMetadata: {
        totalMarks: assignedSet.totalMarks || exam.totalMarks,
        duration: exam.duration,
        startTime: exam.startTime,
        endTime: exam.endTime,
        attemptsAllowed: exam.attemptsAllowed
      },
      instructions: assignedSet.instructions || exam.paperConfig?.instructions || ''
    });
    
    console.log(`[PDF Gen] ✓ Student paper: ${pdfPath}`);
    
    return pdfPath;
    
  } catch (error) {
    console.error(`[PDF Gen] Error for roll ${student.rollNumber}:`, error);
    throw error;
  }
}

/**
 * TASK 2 — Generate Master Set PDF
 * 
 * @param {Object} exam - Exam document
 * @param {Object} set - Set from exam.generatedSets
 * @returns {Promise<string>} PDF file path
 */
async function generateSetMasterPaper(exam, set) {
  try {
    console.log(`[PDF Gen] Generating master PDF for set ${set.setId}`);
    
    if (!set.questions || set.questions.length === 0) {
      throw new Error(`Set ${set.setId} has no questions`);
    }
    
    // Create storage directory using examStorage service
    await examStorage.ensureExamDirectories(exam._id.toString());
    
    // Generate PDF path using examStorage service
    const pdfPath = examStorage.getSetPdfPath(exam._id.toString(), set.setId);
    
    await createPDF({
      outputPath: pdfPath,
      title: exam.title,
      description: exam.description || '',
      className: (exam.classId && exam.classId.name) || 'N/A',
      subject: exam.paperConfig?.subject || 'General',
      setInfo: {
        setId: set.setId,
        setName: `Set ${set.setId} (Master Copy)`
      },
      questions: set.questions,
      examMetadata: {
        totalMarks: set.totalMarks || exam.totalMarks,
        duration: exam.duration,
        startTime: exam.startTime,
        endTime: exam.endTime,
        attemptsAllowed: exam.attemptsAllowed
      },
      instructions: set.instructions || exam.paperConfig?.instructions || '',
      isMaster: true
    });
    
    console.log(`[PDF Gen] ✓ Master PDF: ${pdfPath}`);
    
    return pdfPath;
    
  } catch (error) {
    console.error(`[PDF Gen] Error for set ${set.setId}:`, error);
    throw error;
  }
}

/**
 * TASK 1 & 2 — Generate All PDFs for Exam
 * 
 * @param {string} examId - Exam ID
 * @returns {Promise<Object>} Generation result
 */
async function generateAllPapersForExam(examId) {
  try {
    console.log(`[PDF Gen] Starting generation for exam ${examId}`);
    
    const exam = await Exam.findById(examId).populate('classId');
    if (!exam) {
      throw new Error('Exam not found');
    }
    
    if (!exam.generatedSets || exam.generatedSets.length === 0) {
      throw new Error('No generated sets found');
    }
    
    if (!exam.setMap || exam.setMap.length === 0) {
      throw new Error('No set map found');
    }
    
    // Get enrolled students with rollNumbers from Enrollment model
    const enrollments = await Enrollment.find({ 
      classId: exam.classId._id,
      status: 'active'
    }).populate('studentId');
    
    if (enrollments.length === 0) {
      throw new Error('No enrolled students found');
    }
    
    const students = enrollments
      .filter(e => e.studentId && e.rollNumber)
      .map(e => ({
        studentId: e.studentId._id,
        name: e.studentId.name,
        rollNumber: e.rollNumber  // From Enrollment, not User
      }));
    
    // TASK 2: Generate master PDFs for each set
    console.log(`[PDF Gen] Generating ${exam.generatedSets.length} master set PDFs...`);
    const setMasterPapers = [];
    
    for (const set of exam.generatedSets) {
      try {
        const pdfPath = await generateSetMasterPaper(exam, set);
        setMasterPapers.push({
          setId: set.setId,
          pdfPath,
          questionCount: set.questions.length,
          totalMarks: set.totalMarks || exam.totalMarks,
          generatedAt: new Date()
        });
      } catch (error) {
        console.error(`[PDF Gen] Failed master for set ${set.setId}:`, error);
      }
    }
    
    // TASK 1: Generate student papers
    console.log(`[PDF Gen] Generating ${students.length} student papers...`);
    const studentPapers = [];
    const failedPapers = [];
    
    for (const student of students) {
      try {
        const pdfPath = await generateStudentPaper(exam, student);
        
        const setMapEntry = exam.setMap.find(entry =>
          entry.assignedRollNumbers.includes(student.rollNumber)
        );
        
        studentPapers.push({
          studentId: student.studentId,
          rollNumber: student.rollNumber,
          name: student.name,
          setId: setMapEntry.setId,
          paperPath: pdfPath,
          generatedAt: new Date(),
          status: 'created'
        });
      } catch (error) {
        console.error(`[PDF Gen] Failed for roll ${student.rollNumber}:`, error);
        failedPapers.push({
          studentId: student.studentId,
          rollNumber: student.rollNumber,
          error: error.message
        });
      }
    }
    
    // Update exam document
    exam.studentPapers = studentPapers;
    exam.setMasterPapers = setMasterPapers;
    exam.generationStatus = 'generated';
    await exam.save();
    
    console.log(`[PDF Gen] ✅ Generated ${studentPapers.length} student papers, ${setMasterPapers.length} set masters`);
    
    return {
      success: true,
      studentPapers: studentPapers.length,
      setMasterPapers: setMasterPapers.length,
      failed: failedPapers.length,
      failedDetails: failedPapers
    };
    
  } catch (error) {
    console.error('[PDF Gen] Error:', error);
    throw error;
  }
}

module.exports = {
  generateStudentPaper,
  generateSetMasterPaper,
  generateAllPapersForExam
};
