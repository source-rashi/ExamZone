/**
 * PHASE 8.7 - Data Integrity Check Script
 * 
 * Detects and reports data inconsistencies:
 * - Orphaned attempts (exam or student not found)
 * - Orphaned enrollments (class or student not found)
 * - Attempts without proper exam references
 * - Enrollments with duplicate roll numbers
 * - Exams with invalid class references
 * - Missing or broken references
 * 
 * Usage:
 *   node scripts/checkDataIntegrity.js              # Check only
 *   node scripts/checkDataIntegrity.js --fix        # Check and fix issues
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const { Exam, ExamAttempt, Enrollment, Class, User } = require('../models');

const issues = {
  orphanedAttempts: [],
  orphanedEnrollments: [],
  orphanedExams: [],
  duplicateEnrollments: [],
  invalidExamReferences: [],
  missingStudentReferences: [],
  inconsistentScores: []
};

/**
 * Check for orphaned exam attempts
 */
async function checkOrphanedAttempts() {
  console.log('🔍 Checking for orphaned exam attempts...');
  
  const attempts = await ExamAttempt.find({}).lean();
  let orphanCount = 0;

  for (const attempt of attempts) {
    // Check if exam exists
    const exam = await Exam.findById(attempt.exam);
    if (!exam) {
      issues.orphanedAttempts.push({
        attemptId: attempt._id,
        reason: 'Exam not found',
        examId: attempt.exam
      });
      orphanCount++;
      continue;
    }

    // Check if student exists
    const student = await User.findById(attempt.student);
    if (!student) {
      issues.orphanedAttempts.push({
        attemptId: attempt._id,
        reason: 'Student not found',
        studentId: attempt.student
      });
      orphanCount++;
    }
  }

  console.log(`   Found ${orphanCount} orphaned attempts`);
  return orphanCount;
}

/**
 * Check for orphaned enrollments
 */
async function checkOrphanedEnrollments() {
  console.log('🔍 Checking for orphaned enrollments...');
  
  const enrollments = await Enrollment.find({}).lean();
  let orphanCount = 0;

  for (const enrollment of enrollments) {
    // Check if class exists
    const classDoc = await Class.findById(enrollment.classId);
    if (!classDoc) {
      issues.orphanedEnrollments.push({
        enrollmentId: enrollment._id,
        reason: 'Class not found',
        classId: enrollment.classId
      });
      orphanCount++;
      continue;
    }

    // Check if student exists
    const student = await User.findById(enrollment.studentId);
    if (!student) {
      issues.orphanedEnrollments.push({
        enrollmentId: enrollment._id,
        reason: 'Student not found',
        studentId: enrollment.studentId
      });
      orphanCount++;
    }
  }

  console.log(`   Found ${orphanCount} orphaned enrollments`);
  return orphanCount;
}

/**
 * Check for orphaned exams
 */
async function checkOrphanedExams() {
  console.log('🔍 Checking for orphaned exams...');
  
  const exams = await Exam.find({}).lean();
  let orphanCount = 0;

  for (const exam of exams) {
    // Check if class exists
    const classDoc = await Class.findById(exam.classId);
    if (!classDoc) {
      issues.orphanedExams.push({
        examId: exam._id,
        title: exam.title,
        reason: 'Class not found',
        classId: exam.classId
      });
      orphanCount++;
      continue;
    }

    // Check if creator exists
    const creator = await User.findById(exam.createdBy);
    if (!creator) {
      issues.orphanedExams.push({
        examId: exam._id,
        title: exam.title,
        reason: 'Creator not found',
        createdBy: exam.createdBy
      });
      orphanCount++;
    }
  }

  console.log(`   Found ${orphanCount} orphaned exams`);
  return orphanCount;
}

/**
 * Check for duplicate enrollments (same student in same class multiple times)
 */
async function checkDuplicateEnrollments() {
  console.log('🔍 Checking for duplicate enrollments...');
  
  const duplicates = await Enrollment.aggregate([
    {
      $group: {
        _id: { classId: '$classId', studentId: '$studentId' },
        count: { $sum: 1 },
        enrollments: { $push: '$_id' }
      }
    },
    {
      $match: { count: { $gt: 1 } }
    }
  ]);

  issues.duplicateEnrollments = duplicates.map(dup => ({
    classId: dup._id.classId,
    studentId: dup._id.studentId,
    count: dup.count,
    enrollmentIds: dup.enrollments
  }));

  console.log(`   Found ${duplicates.length} duplicate enrollments`);
  return duplicates.length;
}

/**
 * Check for invalid exam references in attempts
 */
async function checkInvalidExamReferences() {
  console.log('🔍 Checking for invalid exam references...');
  
  const attempts = await ExamAttempt.find({}).lean();
  let invalidCount = 0;

  for (const attempt of attempts) {
    if (!mongoose.Types.ObjectId.isValid(attempt.exam)) {
      issues.invalidExamReferences.push({
        attemptId: attempt._id,
        invalidExamId: attempt.exam
      });
      invalidCount++;
    }
  }

  console.log(`   Found ${invalidCount} invalid exam references`);
  return invalidCount;
}

/**
 * Check for missing student references in class.students array
 */
async function checkMissingStudentReferences() {
  console.log('🔍 Checking for missing student references in classes...');
  
  const classes = await Class.find({}).lean();
  let missingCount = 0;

  for (const classDoc of classes) {
    if (classDoc.students && classDoc.students.length > 0) {
      for (const studentId of classDoc.students) {
        const student = await User.findById(studentId);
        if (!student) {
          issues.missingStudentReferences.push({
            classId: classDoc._id,
            className: classDoc.name || classDoc.title,
            missingStudentId: studentId
          });
          missingCount++;
        }
      }
    }
  }

  console.log(`   Found ${missingCount} missing student references`);
  return missingCount;
}

/**
 * Check for inconsistent scores (score > maxMarks)
 */
async function checkInconsistentScores() {
  console.log('🔍 Checking for inconsistent scores...');
  
  const attempts = await ExamAttempt.find({
    score: { $exists: true },
    maxMarks: { $exists: true }
  }).lean();

  let inconsistentCount = 0;

  for (const attempt of attempts) {
    if (attempt.score > attempt.maxMarks) {
      issues.inconsistentScores.push({
        attemptId: attempt._id,
        score: attempt.score,
        maxMarks: attempt.maxMarks
      });
      inconsistentCount++;
    }
  }

  console.log(`   Found ${inconsistentCount} inconsistent scores`);
  return inconsistentCount;
}

/**
 * Generate integrity report
 */
function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 DATA INTEGRITY REPORT');
  console.log('='.repeat(60));

  const totalIssues = 
    issues.orphanedAttempts.length +
    issues.orphanedEnrollments.length +
    issues.orphanedExams.length +
    issues.duplicateEnrollments.length +
    issues.invalidExamReferences.length +
    issues.missingStudentReferences.length +
    issues.inconsistentScores.length;

  if (totalIssues === 0) {
    console.log('\n✨ No data integrity issues found! Database is healthy.\n');
    return;
  }

  console.log(`\n⚠️  Found ${totalIssues} total issues:\n`);

  if (issues.orphanedAttempts.length > 0) {
    console.log(`\n❌ Orphaned Attempts (${issues.orphanedAttempts.length}):`);
    issues.orphanedAttempts.slice(0, 5).forEach(issue => {
      console.log(`   - Attempt ${issue.attemptId}: ${issue.reason}`);
    });
    if (issues.orphanedAttempts.length > 5) {
      console.log(`   ... and ${issues.orphanedAttempts.length - 5} more`);
    }
  }

  if (issues.orphanedEnrollments.length > 0) {
    console.log(`\n❌ Orphaned Enrollments (${issues.orphanedEnrollments.length}):`);
    issues.orphanedEnrollments.slice(0, 5).forEach(issue => {
      console.log(`   - Enrollment ${issue.enrollmentId}: ${issue.reason}`);
    });
    if (issues.orphanedEnrollments.length > 5) {
      console.log(`   ... and ${issues.orphanedEnrollments.length - 5} more`);
    }
  }

  if (issues.orphanedExams.length > 0) {
    console.log(`\n❌ Orphaned Exams (${issues.orphanedExams.length}):`);
    issues.orphanedExams.slice(0, 5).forEach(issue => {
      console.log(`   - Exam "${issue.title}": ${issue.reason}`);
    });
    if (issues.orphanedExams.length > 5) {
      console.log(`   ... and ${issues.orphanedExams.length - 5} more`);
    }
  }

  if (issues.duplicateEnrollments.length > 0) {
    console.log(`\n❌ Duplicate Enrollments (${issues.duplicateEnrollments.length}):`);
    issues.duplicateEnrollments.slice(0, 5).forEach(issue => {
      console.log(`   - Student ${issue.studentId} enrolled ${issue.count} times in class ${issue.classId}`);
    });
    if (issues.duplicateEnrollments.length > 5) {
      console.log(`   ... and ${issues.duplicateEnrollments.length - 5} more`);
    }
  }

  if (issues.inconsistentScores.length > 0) {
    console.log(`\n❌ Inconsistent Scores (${issues.inconsistentScores.length}):`);
    issues.inconsistentScores.slice(0, 5).forEach(issue => {
      console.log(`   - Attempt ${issue.attemptId}: score ${issue.score} > maxMarks ${issue.maxMarks}`);
    });
    if (issues.inconsistentScores.length > 5) {
      console.log(`   ... and ${issues.inconsistentScores.length - 5} more`);
    }
  }

  console.log('\n💡 Run with --fix flag to attempt automatic repairs (where safe)');
  console.log('   CAUTION: Always backup database before running with --fix\n');
}

/**
 * Fix issues (where safe to do so)
 */
async function fixIssues() {
  console.log('\n🔧 Attempting to fix issues...\n');
  
  let fixedCount = 0;

  // Fix: Delete orphaned attempts
  if (issues.orphanedAttempts.length > 0) {
    console.log('Fixing orphaned attempts...');
    for (const issue of issues.orphanedAttempts) {
      await ExamAttempt.deleteOne({ _id: issue.attemptId });
      fixedCount++;
    }
    console.log(`   ✅ Deleted ${issues.orphanedAttempts.length} orphaned attempts`);
  }

  // Fix: Delete orphaned enrollments
  if (issues.orphanedEnrollments.length > 0) {
    console.log('Fixing orphaned enrollments...');
    for (const issue of issues.orphanedEnrollments) {
      await Enrollment.deleteOne({ _id: issue.enrollmentId });
      fixedCount++;
    }
    console.log(`   ✅ Deleted ${issues.orphanedEnrollments.length} orphaned enrollments`);
  }

  // Fix: Remove duplicate enrollments (keep oldest)
  if (issues.duplicateEnrollments.length > 0) {
    console.log('Fixing duplicate enrollments...');
    for (const issue of issues.duplicateEnrollments) {
      // Keep first enrollment, delete rest
      const [keep, ...deleteIds] = issue.enrollmentIds;
      for (const id of deleteIds) {
        await Enrollment.deleteOne({ _id: id });
        fixedCount++;
      }
    }
    console.log(`   ✅ Removed ${issues.duplicateEnrollments.length} duplicate enrollments`);
  }

  console.log(`\n✨ Fixed ${fixedCount} issues`);

  // Issues that require manual intervention
  const manualIssues = issues.orphanedExams.length + 
                       issues.invalidExamReferences.length + 
                       issues.missingStudentReferences.length +
                       issues.inconsistentScores.length;

  if (manualIssues > 0) {
    console.log(`\n⚠️  ${manualIssues} issues require manual intervention`);
    console.log('   Review the report above and fix manually');
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 Starting data integrity check\n');

    const fixMode = process.argv.includes('--fix');
    if (fixMode) {
      console.log('⚠️  FIX MODE ENABLED - Issues will be repaired\n');
      console.log('   IMPORTANT: Ensure you have a database backup!\n');
    }

    // Connect to database
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/examzone');
    console.log('✅ Database connected\n');

    // Run all checks
    await checkOrphanedAttempts();
    await checkOrphanedEnrollments();
    await checkOrphanedExams();
    await checkDuplicateEnrollments();
    await checkInvalidExamReferences();
    await checkMissingStudentReferences();
    await checkInconsistentScores();

    // Generate report
    generateReport();

    // Fix issues if in fix mode
    if (fixMode) {
      const totalIssues = 
        issues.orphanedAttempts.length +
        issues.orphanedEnrollments.length +
        issues.duplicateEnrollments.length;

      if (totalIssues > 0) {
        await fixIssues();
      }
    }

    // Close database connection
    await mongoose.disconnect();
    console.log('✅ Integrity check completed\n');

  } catch (error) {
    console.error('\n❌ Integrity check failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { checkOrphanedAttempts, checkOrphanedEnrollments, generateReport };
