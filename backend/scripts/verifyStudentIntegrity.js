/**
 * PHASE 7.0 — Student Data Integrity Verifier
 * 
 * NO AUTO-FIXING. Only reporting.
 * 
 * Checks:
 * 1. All Class.students[] have corresponding active Enrollments
 * 2. All active Enrollments have student in Class.students[]
 * 3. No duplicate rollNumbers within same class
 * 4. All ExamPaper.setMap entries reference valid students
 * 5. All ExamPaper.studentPapers entries have valid setMap mappings
 * 6. No students have papers for exams in classes they're not enrolled in
 * 7. All student paper files exist on disk
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

const { Class, Enrollment, Exam, ExamPaper } = require('../models');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log();
  log(`${'='.repeat(60)}`, 'cyan');
  log(title, 'cyan');
  log(`${'='.repeat(60)}`, 'cyan');
}

async function verifyStudentIntegrity() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    log('✓ Connected to MongoDB', 'green');

    const issues = {
      missingEnrollments: [],
      orphanEnrollments: [],
      duplicateRollNumbers: [],
      invalidSetMapStudents: [],
      missingPaperMappings: [],
      unauthorizedPapers: [],
      missingPaperFiles: []
    };

    // ==================================================================
    // CHECK 1: All Class.students[] have active Enrollments
    // ==================================================================
    section('CHECK 1: Class.students[] → Enrollment consistency');
    const classes = await Class.find({}).lean();
    
    for (const cls of classes) {
      if (!cls.students || cls.students.length === 0) continue;

      for (const studentId of cls.students) {
        const enrollment = await Enrollment.findOne({
          classId: cls._id,
          studentId: studentId,
          status: 'active'
        });

        if (!enrollment) {
          issues.missingEnrollments.push({
            classId: cls._id,
            className: cls.name,
            studentId: studentId,
            message: `Student ${studentId} in Class.students[] but no active Enrollment`
          });
        }
      }
    }

    if (issues.missingEnrollments.length === 0) {
      log('✓ All Class.students[] have active Enrollments', 'green');
    } else {
      log(`✗ Found ${issues.missingEnrollments.length} students without enrollments`, 'red');
      issues.missingEnrollments.forEach(issue => {
        log(`  - Class "${issue.className}": ${issue.message}`, 'yellow');
      });
    }

    // ==================================================================
    // CHECK 2: All active Enrollments have student in Class.students[]
    // ==================================================================
    section('CHECK 2: Enrollment → Class.students[] consistency');
    const enrollments = await Enrollment.find({ status: 'active' }).lean();

    for (const enrollment of enrollments) {
      const cls = await Class.findById(enrollment.classId).lean();
      
      if (!cls) {
        issues.orphanEnrollments.push({
          enrollmentId: enrollment._id,
          studentId: enrollment.studentId,
          classId: enrollment.classId,
          message: `Enrollment references non-existent class`
        });
        continue;
      }

      if (!cls.students || !cls.students.some(sid => sid.toString() === enrollment.studentId.toString())) {
        issues.orphanEnrollments.push({
          enrollmentId: enrollment._id,
          studentId: enrollment.studentId,
          classId: enrollment.classId,
          className: cls.name,
          message: `Active Enrollment but student not in Class.students[]`
        });
      }
    }

    if (issues.orphanEnrollments.length === 0) {
      log('✓ All active Enrollments match Class.students[]', 'green');
    } else {
      log(`✗ Found ${issues.orphanEnrollments.length} orphan enrollments`, 'red');
      issues.orphanEnrollments.forEach(issue => {
        log(`  - ${issue.message} (Class: ${issue.className || issue.classId})`, 'yellow');
      });
    }

    // ==================================================================
    // CHECK 3: No duplicate rollNumbers within same class
    // ==================================================================
    section('CHECK 3: Duplicate rollNumbers within classes');
    
    for (const cls of classes) {
      const classEnrollments = await Enrollment.find({ 
        classId: cls._id, 
        status: 'active' 
      }).lean();

      const rollNumberMap = {};
      
      for (const enrollment of classEnrollments) {
        const roll = enrollment.rollNumber;
        if (!rollNumberMap[roll]) {
          rollNumberMap[roll] = [];
        }
        rollNumberMap[roll].push(enrollment.studentId);
      }

      for (const [roll, students] of Object.entries(rollNumberMap)) {
        if (students.length > 1) {
          issues.duplicateRollNumbers.push({
            classId: cls._id,
            className: cls.name,
            rollNumber: roll,
            studentIds: students,
            message: `Roll ${roll} assigned to ${students.length} students`
          });
        }
      }
    }

    if (issues.duplicateRollNumbers.length === 0) {
      log('✓ No duplicate rollNumbers found', 'green');
    } else {
      log(`✗ Found ${issues.duplicateRollNumbers.length} duplicate rollNumbers`, 'red');
      issues.duplicateRollNumbers.forEach(issue => {
        log(`  - Class "${issue.className}": ${issue.message}`, 'yellow');
      });
    }

    // ==================================================================
    // CHECK 4: All ExamPaper.setMap entries reference valid students
    // ==================================================================
    section('CHECK 4: ExamPaper.setMap student validity');
    const examPapers = await ExamPaper.find({}).lean();

    for (const paper of examPapers) {
      if (!paper.setMap) continue;

      const exam = await Exam.findById(paper.examId).lean();
      if (!exam) continue;

      for (const [rollNumber, setId] of Object.entries(paper.setMap)) {
        // Check if this roll number exists in the class
        const enrollment = await Enrollment.findOne({
          classId: exam.classId,
          rollNumber: parseInt(rollNumber),
          status: 'active'
        }).lean();

        if (!enrollment) {
          issues.invalidSetMapStudents.push({
            examId: paper.examId,
            rollNumber: rollNumber,
            setId: setId,
            message: `setMap references roll ${rollNumber} but no active enrollment exists`
          });
        }
      }
    }

    if (issues.invalidSetMapStudents.length === 0) {
      log('✓ All setMap entries reference valid students', 'green');
    } else {
      log(`✗ Found ${issues.invalidSetMapStudents.length} invalid setMap entries`, 'red');
      issues.invalidSetMapStudents.forEach(issue => {
        log(`  - Exam ${issue.examId}: ${issue.message}`, 'yellow');
      });
    }

    // ==================================================================
    // CHECK 5: All studentPapers have valid setMap mappings
    // ==================================================================
    section('CHECK 5: studentPapers ↔ setMap consistency');

    for (const paper of examPapers) {
      if (!paper.studentPapers || paper.studentPapers.length === 0) continue;

      for (const studentPaper of paper.studentPapers) {
        const rollStr = studentPaper.rollNumber.toString();
        
        if (!paper.setMap || !paper.setMap[rollStr]) {
          issues.missingPaperMappings.push({
            examId: paper.examId,
            rollNumber: studentPaper.rollNumber,
            message: `studentPaper exists but no setMap entry for roll ${rollStr}`
          });
        }
      }
    }

    if (issues.missingPaperMappings.length === 0) {
      log('✓ All studentPapers have valid setMap mappings', 'green');
    } else {
      log(`✗ Found ${issues.missingPaperMappings.length} papers without setMap entries`, 'red');
      issues.missingPaperMappings.forEach(issue => {
        log(`  - Exam ${issue.examId}: ${issue.message}`, 'yellow');
      });
    }

    // ==================================================================
    // CHECK 6: No unauthorized papers (student not enrolled in exam's class)
    // ==================================================================
    section('CHECK 6: Unauthorized paper assignments');

    for (const paper of examPapers) {
      if (!paper.studentPapers || paper.studentPapers.length === 0) continue;

      const exam = await Exam.findById(paper.examId).lean();
      if (!exam) continue;

      for (const studentPaper of paper.studentPapers) {
        // Check if student is enrolled in the exam's class
        const enrollment = await Enrollment.findOne({
          classId: exam.classId,
          rollNumber: studentPaper.rollNumber,
          status: 'active'
        }).lean();

        if (!enrollment) {
          issues.unauthorizedPapers.push({
            examId: paper.examId,
            classId: exam.classId,
            rollNumber: studentPaper.rollNumber,
            message: `Paper assigned to roll ${studentPaper.rollNumber} who is not enrolled in class`
          });
        }
      }
    }

    if (issues.unauthorizedPapers.length === 0) {
      log('✓ No unauthorized paper assignments found', 'green');
    } else {
      log(`✗ Found ${issues.unauthorizedPapers.length} unauthorized papers`, 'red');
      issues.unauthorizedPapers.forEach(issue => {
        log(`  - Exam ${issue.examId}: ${issue.message}`, 'yellow');
      });
    }

    // ==================================================================
    // CHECK 7: All student paper files exist on disk
    // ==================================================================
    section('CHECK 7: Student paper files on disk');

    for (const paper of examPapers) {
      if (!paper.studentPapers || paper.studentPapers.length === 0) continue;

      for (const studentPaper of paper.studentPapers) {
        const filePath = path.resolve(
          __dirname,
          '../../storage/exams',
          paper.examId.toString(),
          'students',
          `student_${studentPaper.rollNumber}.json`
        );

        try {
          await fs.access(filePath);
          // File exists, all good
        } catch (err) {
          issues.missingPaperFiles.push({
            examId: paper.examId,
            rollNumber: studentPaper.rollNumber,
            expectedPath: filePath,
            message: `Paper file missing for roll ${studentPaper.rollNumber}`
          });
        }
      }
    }

    if (issues.missingPaperFiles.length === 0) {
      log('✓ All paper files exist on disk', 'green');
    } else {
      log(`✗ Found ${issues.missingPaperFiles.length} missing paper files`, 'red');
      issues.missingPaperFiles.forEach(issue => {
        log(`  - Exam ${issue.examId}: ${issue.message}`, 'yellow');
        log(`    Expected: ${issue.expectedPath}`, 'blue');
      });
    }

    // ==================================================================
    // SUMMARY
    // ==================================================================
    section('SUMMARY');

    const totalIssues = Object.values(issues).reduce((sum, arr) => sum + arr.length, 0);

    if (totalIssues === 0) {
      log('✓✓✓ ALL CHECKS PASSED - No integrity issues found', 'green');
    } else {
      log(`✗ Found ${totalIssues} total issues:`, 'red');
      log(`  - Missing Enrollments: ${issues.missingEnrollments.length}`, 'yellow');
      log(`  - Orphan Enrollments: ${issues.orphanEnrollments.length}`, 'yellow');
      log(`  - Duplicate Roll Numbers: ${issues.duplicateRollNumbers.length}`, 'yellow');
      log(`  - Invalid SetMap Students: ${issues.invalidSetMapStudents.length}`, 'yellow');
      log(`  - Missing Paper Mappings: ${issues.missingPaperMappings.length}`, 'yellow');
      log(`  - Unauthorized Papers: ${issues.unauthorizedPapers.length}`, 'yellow');
      log(`  - Missing Paper Files: ${issues.missingPaperFiles.length}`, 'yellow');
      console.log();
      log('NO AUTO-FIXING APPLIED. Manual resolution required.', 'blue');
    }

  } catch (error) {
    log(`✗ Error during verification: ${error.message}`, 'red');
    console.error(error);
  } finally {
    await mongoose.connection.close();
    log('✓ Disconnected from MongoDB', 'green');
  }
}

// Run the verification
verifyStudentIntegrity().catch(console.error);
