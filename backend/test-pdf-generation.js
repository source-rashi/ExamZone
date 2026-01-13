/**
 * PHASE 6.4 — TEST SCRIPT
 * 
 * Tests PDF generation and student-to-set binding
 */

// Load all models first (prevents MissingSchemaError)
const models = require('./models');
const { Exam, Class, User } = models;
const pdfGeneration = require('./services/pdfGeneration.service');
const examStorage = require('./services/examStorage.service');
const fs = require('fs').promises;

async function testPDFGeneration() {
  try {
    console.log('='.repeat(60));
    console.log('PHASE 6.4 TEST: PDF Generation & Set Binding');
    console.log('='.repeat(60));
    
    // Find the most recent exam with generated sets
    const exam = await Exam.findOne({ 
      generationStatus: 'generated',
      'generatedSets.0': { $exists: true }
    })
    .populate('classId')
    .sort({ createdAt: -1 });
    
    if (!exam) {
      console.log('❌ No exam with generated sets found');
      console.log('   Create an exam and generate sets first');
      return;
    }
    
    console.log(`\n✓ Found exam: ${exam.title}`);
    console.log(`  ID: ${exam._id}`);
    console.log(`  Sets: ${exam.generatedSets.length}`);
    console.log(`  Status: ${exam.status}`);
    
    // Check setMap
    console.log(`\n📋 Set Map:`);
    if (!exam.setMap || exam.setMap.length === 0) {
      console.log('❌ No setMap found! Students not distributed.');
      return;
    }
    
    exam.setMap.forEach(mapping => {
      console.log(`  ${mapping.setId}: ${mapping.assignedRollNumbers.length} students`);
      console.log(`    Rolls: ${mapping.assignedRollNumbers.join(', ')}`);
    });
    
    // Check student papers
    console.log(`\n📄 Student Papers:`);
    if (!exam.studentPapers || exam.studentPapers.length === 0) {
      console.log('⚠️  No student papers generated yet');
      console.log('   Triggering PDF generation...\n');
      
      try {
        const result = await pdfGeneration.generateAllPapersForExam(exam._id);
        console.log(`✓ Generated ${result.studentPapers} student papers`);
        console.log(`✓ Generated ${result.setMasterPapers} set masters`);
        
        if (result.failed > 0) {
          console.log(`❌ Failed: ${result.failed} papers`);
          console.log('   Details:', result.failedDetails);
        }
        
        // Reload exam
        const updatedExam = await Exam.findById(exam._id);
        console.log(`\n✓ Student papers in DB: ${updatedExam.studentPapers.length}`);
        
        // Show sample papers
        console.log('\n📋 Sample Papers:');
        updatedExam.studentPapers.slice(0, 3).forEach(paper => {
          console.log(`  Roll ${paper.rollNumber} → ${paper.setId}`);
          console.log(`    Path: ${paper.paperPath}`);
        });
        
      } catch (error) {
        console.error('❌ PDF Generation Error:', error.message);
        console.error('   Stack:', error.stack);
      }
      
    } else {
      console.log(`✓ ${exam.studentPapers.length} papers already generated`);
      exam.studentPapers.slice(0, 3).forEach(paper => {
        console.log(`  Roll ${paper.rollNumber} → ${paper.setId}`);
      });
    }
    
    // Verify different students get different sets
    console.log(`\n🔍 Set Distribution Check:`);
    const setAssignments = {};
    exam.studentPapers.forEach(paper => {
      if (!setAssignments[paper.setId]) {
        setAssignments[paper.setId] = [];
      }
      setAssignments[paper.setId].push(paper.rollNumber);
    });
    
    Object.keys(setAssignments).forEach(setId => {
      console.log(`  ${setId}: ${setAssignments[setId].length} students`);
    });
    
    const uniqueSets = Object.keys(setAssignments).length;
    if (uniqueSets > 1) {
      console.log(`✓ ${uniqueSets} different sets assigned`);
    } else {
      console.log(`⚠️  All students got same set (expected >1 set)`);
    }
    
    // PHASE 6.4 - Verify physical PDFs exist
    console.log(`\n💾 Physical File Verification:`);
    try {
      const stats = await examStorage.getExamStorageStats(exam._id.toString());
      console.log(`  Set Master PDFs: ${stats.totalSets}`);
      console.log(`  Student PDFs: ${stats.totalStudentPapers}`);
      
      // Verify each student has a PDF
      let foundCount = 0;
      let missingCount = 0;
      
      for (const paper of exam.studentPapers.slice(0, 5)) {
        const exists = await examStorage.pdfExists(paper.paperPath);
        if (exists) {
          foundCount++;
        } else {
          missingCount++;
          console.log(`  ⚠️  Missing: Roll ${paper.rollNumber}`);
        }
      }
      
      if (missingCount === 0) {
        console.log(`✓ All sampled PDFs exist on disk (checked ${foundCount})`);
      } else {
        console.log(`❌ ${missingCount} PDFs missing from disk`);
      }
      
    } catch (error) {
      console.log(`⚠️  Could not verify physical files:`, error.message);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('TEST COMPLETE');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Test Error:', error);
  }
}

// Run test if called directly
if (require.main === module) {
  const mongoose = require('mongoose');
  const connectDB = require('./config/db');
  
  connectDB().then(async () => {
    await testPDFGeneration();
    await mongoose.connection.close();
    process.exit(0);
  }).catch(error => {
    console.error('Connection Error:', error);
    process.exit(1);
  });
}

module.exports = { testPDFGeneration };
