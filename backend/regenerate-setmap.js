/**
 * PHASE 6.4 — REGENERATE SETMAP AND PDFS
 * 
 * For exams that were generated before setMap implementation
 */

const Exam = require('./models/Exam');
const Class = require('./models/Class');
const User = require('./models/User');
const Enrollment = require('./models/Enrollment');
const pdfGeneration = require('./services/pdfGeneration.service');

async function regenerateSetMapAndPDFs(examId) {
  try {
    console.log('='.repeat(60));
    console.log('PHASE 6.4: Regenerate SetMap and PDFs');
    console.log('='.repeat(60));
    
    // Find exam
    const exam = await Exam.findById(examId).populate('classId');
    if (!exam) {
      console.log('❌ Exam not found');
      return;
    }
    
    console.log(`\n✓ Exam: ${exam.title}`);
    console.log(`  ID: ${exam._id}`);
    console.log(`  Sets: ${exam.generatedSets.length}`);
    
    // Get enrolled students
    const enrollments = await Enrollment.find({ 
      classId: exam.classId._id,
      status: 'active'
    }).populate('studentId');
    
    if (enrollments.length === 0) {
      console.log('❌ No students enrolled in this class');
      return;
    }
    
    const students = enrollments.map(e => ({
      studentId: e.studentId._id,
      rollNumber: e.studentId.rollNumber,
      name: e.studentId.name
    }));
    
    console.log(`\n✓ Students: ${students.length}`);
    
    // Shuffle students for random distribution
    const shuffledStudents = [...students].sort(() => Math.random() - 0.5);
    
    const distribution = [];
    const setGroups = {};
    
    shuffledStudents.forEach((student, index) => {
      const setIndex = index % exam.generatedSets.length;
      const assignedSet = exam.generatedSets[setIndex];
      
      distribution.push({
        studentId: student.studentId,
        rollNumber: student.rollNumber,
        name: student.name,
        setId: assignedSet.setId
      });
      
      if (!setGroups[assignedSet.setId]) {
        setGroups[assignedSet.setId] = [];
      }
      setGroups[assignedSet.setId].push(student.rollNumber);
    });
    
    // Update setMap
    exam.setMap = Object.keys(setGroups).map(setId => ({
      setId: setId,
      assignedRollNumbers: setGroups[setId]
    }));
    
    await exam.save();
    
    console.log('\n✓ SetMap updated:');
    exam.setMap.forEach(mapping => {
      console.log(`  ${mapping.setId}: ${mapping.assignedRollNumbers.length} students`);
      console.log(`    Rolls: ${mapping.assignedRollNumbers.join(', ')}`);
    });
    
    // Generate PDFs
    console.log('\n📄 Generating PDFs...');
    const pdfResult = await pdfGeneration.generateAllPapersForExam(examId);
    
    console.log(`\n✓ Generated ${pdfResult.studentPapers} student papers`);
    console.log(`✓ Generated ${pdfResult.setMasterPapers} set masters`);
    
    if (pdfResult.failed > 0) {
      console.log(`❌ Failed: ${pdfResult.failed} papers`);
    }
    
    // Reload exam to verify
    const updatedExam = await Exam.findById(examId);
    console.log(`\n✓ Student papers in DB: ${updatedExam.studentPapers.length}`);
    
    // Show sample papers
    console.log('\n📋 Sample Papers:');
    updatedExam.studentPapers.slice(0, 5).forEach(paper => {
      console.log(`  Roll ${paper.rollNumber} (${paper.name}) → ${paper.setId}`);
    });
    
    // Verify different students get different sets
    console.log(`\n🔍 Set Distribution:`);
    const setAssignments = {};
    updatedExam.studentPapers.forEach(paper => {
      if (!setAssignments[paper.setId]) {
        setAssignments[paper.setId] = [];
      }
      setAssignments[paper.setId].push(paper.rollNumber);
    });
    
    Object.keys(setAssignments).forEach(setId => {
      console.log(`  ${setId}: ${setAssignments[setId].length} students`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ COMPLETE');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

// Run if called directly
if (require.main === module) {
  const mongoose = require('mongoose');
  const connectDB = require('./config/db');
  
  const examId = process.argv[2];
  if (!examId) {
    console.log('Usage: node regenerate-setmap.js <examId>');
    process.exit(1);
  }
  
  connectDB().then(async () => {
    await regenerateSetMapAndPDFs(examId);
    await mongoose.connection.close();
    process.exit(0);
  }).catch(error => {
    console.error('Connection Error:', error);
    process.exit(1);
  });
}

module.exports = { regenerateSetMapAndPDFs };
