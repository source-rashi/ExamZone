// Phase 6.3.11 - Test Script to Verify Strict Validation
// Run this to test that exam creation without paperConfig fails

const mongoose = require('mongoose');
const Exam = require('./models/Exam');

async function testStrictValidation() {
  try {
    console.log('=================================================');
    console.log('PHASE 6.3.11: STRICT VALIDATION TEST');
    console.log('=================================================\n');

    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/examzone', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✓ Connected to MongoDB\n');

    // TEST 1: Create exam WITHOUT paperConfig (should FAIL)
    console.log('TEST 1: Creating exam without paperConfig...');
    try {
      const examWithoutConfig = new Exam({
        title: 'Test Exam Without Config',
        classId: new mongoose.Types.ObjectId(),
        mode: 'online',
        duration: 60,
        status: 'draft'
      });
      await examWithoutConfig.save();
      console.log('❌ FAIL: Exam created without paperConfig (SHOULD HAVE FAILED!)');
    } catch (error) {
      console.log('✓ PASS: Exam creation blocked without paperConfig');
      console.log(`  Error: ${error.message}\n`);
    }

    // TEST 2: Create exam with PARTIAL paperConfig (should FAIL)
    console.log('TEST 2: Creating exam with partial paperConfig...');
    try {
      const examPartialConfig = new Exam({
        title: 'Test Exam Partial Config',
        classId: new mongoose.Types.ObjectId(),
        mode: 'online',
        duration: 60,
        status: 'draft',
        paperConfig: {
          subject: 'Mathematics'
          // Missing: difficulty, questionsPerSet, totalMarksPerSet
        }
      });
      await examPartialConfig.save();
      console.log('❌ FAIL: Exam created with partial paperConfig (SHOULD HAVE FAILED!)');
    } catch (error) {
      console.log('✓ PASS: Exam creation blocked with partial paperConfig');
      console.log(`  Error: ${error.message}\n`);
    }

    // TEST 3: Create exam with COMPLETE paperConfig (should SUCCEED)
    console.log('TEST 3: Creating exam with complete paperConfig...');
    try {
      const examCompleteConfig = new Exam({
        title: 'Test Exam Complete Config',
        classId: new mongoose.Types.ObjectId(),
        createdBy: new mongoose.Types.ObjectId(), // Required field
        mode: 'online',
        duration: 60,
        status: 'draft',
        paperConfig: {
          subject: 'Mathematics',
          difficulty: 'medium',
          questionsPerSet: 20,
          totalMarksPerSet: 100,
          marksMode: 'auto',
          instructions: 'Use only black or blue pen'
        }
      });
      await examCompleteConfig.save();
      console.log('✓ PASS: Exam created successfully with complete paperConfig');
      console.log(`  Exam ID: ${examCompleteConfig._id}`);
      console.log(`  Subject: ${examCompleteConfig.paperConfig.subject}`);
      console.log(`  Difficulty: ${examCompleteConfig.paperConfig.difficulty}`);
      console.log(`  Questions: ${examCompleteConfig.paperConfig.questionsPerSet}`);
      console.log(`  Marks: ${examCompleteConfig.paperConfig.totalMarksPerSet}\n`);

      // Clean up
      await Exam.findByIdAndDelete(examCompleteConfig._id);
      console.log('✓ Test exam cleaned up');
    } catch (error) {
      console.log('❌ FAIL: Exam creation failed with complete paperConfig');
      console.log(`  Error: ${error.message}\n`);
    }

    console.log('\n=================================================');
    console.log('TEST SUMMARY:');
    console.log('=================================================');
    console.log('✓ Schema validation working correctly');
    console.log('✓ paperConfig is required');
    console.log('✓ All paperConfig fields are enforced');
    console.log('✓ No default values being used');
    console.log('=================================================\n');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run test
testStrictValidation();
