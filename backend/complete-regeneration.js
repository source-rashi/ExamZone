/**
 * PHASE 6.4 — COMPLETE REGENERATION SCRIPT
 * 
 * Deletes old student papers and setMap, then regenerates from scratch
 */

const mongoose = require('mongoose');
const Exam = require('./models/Exam');
const Class = require('./models/Class');
const User = require('./models/User');
const Enrollment = require('./models/Enrollment');
const pdfGeneration = require('./services/pdfGeneration.service');
const { distributeStudentsToSets } = require('./services/aiGeneration.service');

async function completeRegeneration(examId) {
  try {
    console.log('='.repeat(60));
    console.log('PHASE 6.4: Complete Regeneration');
    console.log('='.repeat(60));
    
    // Load exam
    const exam = await Exam.findById(examId).populate('classId');
    if (!exam) {
      throw new Error('Exam not found');
    }
    
    console.log(`\n✓ Exam: ${exam.title}`);
    console.log(`  ID: ${exam._id}`);
    console.log(`  Sets: ${exam.generatedSets.length}`);
    
    // Load students from enrollments
    const enrollments = await Enrollment.find({
      classId: exam.classId._id,
      status: 'active'
    }).populate('studentId', 'name email');
    
    const students = enrollments
      .filter(e => e.studentId && e.rollNumber)
      .map(e => ({
        studentId: e.studentId._id,
        rollNumber: e.rollNumber,
        name: e.studentId.name,
        email: e.studentId.email
      }));
    
    console.log(`\n✓ Students: ${students.length}`);
    students.forEach(s => {
      console.log(`  Roll ${s.rollNumber}: ${s.name}`);
    });
    
    // STEP 1: Clear old data
    console.log(`\n📋 Clearing old data...`);
    exam.setMap = [];
    exam.studentPapers = [];
    await exam.save();
    console.log('✓ Cleared setMap and studentPapers');
    
    // STEP 2: Distribute students
    console.log(`\n📋 Distributing students to sets...`);
    
    // Prepare sets in distributeStudentsToSets format
    const setsForDistribution = exam.generatedSets.map(set => ({
      setId: set.setId
    }));
    
    const distribution = [];
    const shuffledStudents = [...students].sort(() => Math.random() - 0.5);
    
    shuffledStudents.forEach((student, index) => {
      const setIndex = index % setsForDistribution.length;
      const assignedSet = setsForDistribution[setIndex];
      
      distribution.push({
        studentId: student.studentId,
        rollNumber: student.rollNumber,
        setId: assignedSet.setId
      });
    });
    
    console.log(`✓ Distributed ${distribution.length} students`);
    
    // Build setMap
    const setGroups = {};
    distribution.forEach(mapping => {
      if (!setGroups[mapping.setId]) {
        setGroups[mapping.setId] = [];
      }
      setGroups[mapping.setId].push(mapping.rollNumber);
    });
    
    exam.setMap = Object.keys(setGroups).map(setId => ({
      setId: setId,
      assignedRollNumbers: setGroups[setId]
    }));
    
    console.log(`\n✓ SetMap created:`);
    exam.setMap.forEach(mapping => {
      console.log(`  ${mapping.setId}: ${mapping.assignedRollNumbers.length} students`);
      console.log(`    Rolls: ${mapping.assignedRollNumbers.join(', ')}`);
    });
    
    await exam.save();
    
    // STEP 3: Generate PDFs
    console.log(`\n📄 Generating PDFs...`);
    const pdfResult = await pdfGeneration.generateAllPapersForExam(examId);
    console.log(`✓ Generated ${pdfResult.studentPapers} student papers`);
    console.log(`✓ Generated ${pdfResult.setMasterPapers} set masters`);
    
    if (pdfResult.failed > 0) {
      console.log(`❌ Failed: ${pdfResult.failed} papers`);
    }
    
    // STEP 4: Verify distribution
    const updatedExam = await Exam.findById(examId);
    console.log(`\n🔍 Set Distribution Verification:`);
    
    const setAssignments = {};
    updatedExam.studentPapers.forEach(paper => {
      if (!setAssignments[paper.setId]) {
        setAssignments[paper.setId] = [];
      }
      setAssignments[paper.setId].push(paper.rollNumber);
    });
    
    Object.keys(setAssignments).forEach(setId => {
      console.log(`  ${setId}: ${setAssignments[setId].length} students`);
      console.log(`    Rolls: ${setAssignments[setId].join(', ')}`);
    });
    
    const uniqueSets = Object.keys(setAssignments).length;
    if (uniqueSets > 1) {
      console.log(`\n✅ SUCCESS: ${uniqueSets} different sets assigned`);
    } else {
      console.log(`\n⚠️  WARNING: All students got same set`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('REGENERATION COMPLETE');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

// Run if called directly
if (require.main === module) {
  const connectDB = require('./config/db');
  const examId = process.argv[2];
  
  if (!examId) {
    console.error('Usage: node complete-regeneration.js <examId>');
    process.exit(1);
  }
  
  connectDB().then(async () => {
    await completeRegeneration(examId);
    await mongoose.connection.close();
    process.exit(0);
  }).catch(error => {
    console.error('Connection Error:', error);
    process.exit(1);
  });
}

module.exports = { completeRegeneration };
