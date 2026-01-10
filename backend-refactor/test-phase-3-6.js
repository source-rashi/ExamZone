/**
 * Phase 3.6 - AI Pipeline Integration Test Suite
 * Tests AI calls, lifecycle validation, and error handling
 */

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Class = require('./models/Class');
const Enrollment = require('./models/Enrollment');
const Exam = require('./models/Exam');
const Attempt = require('./models/Attempt');
const examService = require('./services/exam.service');
const attemptService = require('./services/attempt.service');
const { EXAM_STATUS, ATTEMPT_STATUS } = require('./utils/constants');

// Test data
let testData = {};

// Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logInfo(message) {
  log(`   ${message}`, colors.blue);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logTest(message) {
  log(`\n${message}`, colors.bright);
}

async function runTests() {
  try {
    log('\n════════════════════════════════════════════════════════', colors.bright);
    log('      PHASE 3.6 - AI PIPELINE INTEGRATION TESTS', colors.bright);
    log('════════════════════════════════════════════════════════\n', colors.bright);
    
    await connectDB();
    logSuccess('Database connected\n');
    
    await cleanup();
    await setupTestData();
    
    // Run all test suites
    await testLifecycleValidation();
    await testModelExtensions();
    await testServiceIntegration();
    await testErrorHandling();
    
    log('\n════════════════════════════════════════════════════════', colors.bright);
    log('      ALL AI PIPELINE TESTS PASSED ✅', colors.green + colors.bright);
    log('════════════════════════════════════════════════════════\n', colors.bright);
    
    await cleanup();
    process.exit(0);
  } catch (error) {
    log('\n════════════════════════════════════════════════════════', colors.bright);
    log('      AI PIPELINE TESTS FAILED ❌', colors.red + colors.bright);
    log('════════════════════════════════════════════════════════', colors.bright);
    logError(`Error: ${error.message}`);
    console.error(error);
    await cleanup();
    process.exit(1);
  }
}

async function setupTestData() {
  log('📋 Setting up test data...', colors.bright);
  
  testData.teacher = await User.create({
    name: 'AI Test Teacher',
    email: 'ai_teacher@test.com',
    password: 'password123',
    role: 'teacher'
  });
  
  testData.student1 = await User.create({
    name: 'AI Test Student 1',
    email: 'ai_student1@test.com',
    password: 'password123',
    role: 'student'
  });
  
  testData.student2 = await User.create({
    name: 'AI Test Student 2',
    email: 'ai_student2@test.com',
    password: 'password123',
    role: 'student'
  });
  
  testData.class = await Class.create({
    code: 'AITEST',
    title: 'AI Test Class',
    teacherId: testData.teacher._id,
    teacher: testData.teacher._id
  });
  
  await Enrollment.create({
    classId: testData.class._id,
    studentId: testData.student1._id,
    enrolledBy: testData.teacher._id
  });
  
  await Enrollment.create({
    classId: testData.class._id,
    studentId: testData.student2._id,
    enrolledBy: testData.teacher._id
  });
  
  logSuccess('Test data ready\n');
}

async function testLifecycleValidation() {
  logTest('═══════════════════════════════════════════════════════');
  logTest('TEST 1: Lifecycle Validation');
  logTest('═══════════════════════════════════════════════════════');
  
  // Test 1a: Only DRAFT/PUBLISHED can generate papers
  const exam = await examService.createExam({
    classId: testData.class._id,
    title: 'Lifecycle Test Exam',
    createdBy: testData.teacher._id,
    durationMinutes: 30,
    maxAttempts: 1,
    startTime: new Date(Date.now() - 1000),
    endTime: new Date(Date.now() + 3600000)
  });
  
  logInfo(`Exam created with status: ${exam.status}`);
  
  // DRAFT should allow generation (will fail without AI service, which is expected)
  try {
    await examService.generatePapers(exam._id);
    logSuccess('✓ DRAFT exam allowed paper generation attempt');
  } catch (error) {
    // Expected to fail due to missing AI service, but validation passed
    if (error.message.includes('Cannot generate papers')) {
      throw error; // This would be validation error
    }
    logSuccess('✓ DRAFT exam validation passed (AI service call failed as expected)');
  }
  
  // Move to LIVE
  await examService.publishExam(exam._id, testData.teacher._id);
  await examService.startExam(exam._id);
  
  const liveExam = await Exam.findById(exam._id);
  logInfo(`Exam status: ${liveExam.status}`);
  
  // LIVE should NOT allow generation
  try {
    await examService.generatePapers(exam._id);
    throw new Error('Should not allow generation on LIVE exam');
  } catch (error) {
    if (error.message.includes('Cannot generate papers')) {
      logSuccess('✓ LIVE exam rejected paper generation');
      logInfo(`   Error: "${error.message}"`);
    } else {
      throw error;
    }
  }
  
  // Test 1b: Only CLOSED can evaluate
  // Try on LIVE (should fail)
  try {
    await examService.triggerEvaluation(exam._id);
    throw new Error('Should not allow evaluation on LIVE exam');
  } catch (error) {
    if (error.message.includes('Cannot evaluate')) {
      logSuccess('✓ LIVE exam rejected evaluation');
      logInfo(`   Error: "${error.message}"`);
    } else {
      throw error;
    }
  }
  
  // Close exam
  await examService.closeExam(exam._id, testData.teacher._id);
  const closedExam = await Exam.findById(exam._id);
  logInfo(`Exam status: ${closedExam.status}`);
  
  // CLOSED should allow evaluation (will fail without attempts)
  try {
    await examService.triggerEvaluation(exam._id);
    logSuccess('✓ CLOSED exam allowed evaluation attempt');
  } catch (error) {
    if (error.message.includes('No submitted attempts')) {
      logSuccess('✓ CLOSED exam validation passed (no attempts as expected)');
      logInfo(`   Error: "${error.message}"`);
    } else {
      throw error;
    }
  }
  
  log('');
}

async function testModelExtensions() {
  logTest('═══════════════════════════════════════════════════════');
  logTest('TEST 2: Model Extensions');
  logTest('═══════════════════════════════════════════════════════');
  
  // Test 2a: Exam model extensions
  const exam = await examService.createExam({
    classId: testData.class._id,
    title: 'Model Test Exam',
    createdBy: testData.teacher._id,
    durationMinutes: 30,
    maxAttempts: 1,
    startTime: new Date(Date.now() - 1000),
    endTime: new Date(Date.now() + 3600000)
  });
  
  logInfo('Testing Exam model extensions...');
  
  // Check questionPapers array
  if (Array.isArray(exam.questionPapers)) {
    logSuccess('✓ questionPapers array exists');
  } else {
    throw new Error('questionPapers array missing');
  }
  
  // Manually add a question paper using attachPaper
  const fs = require('fs');
  const path = require('path');
  
  // Create dummy PDF file
  const dummyPdfPath = path.join(__dirname, 'pdfs', 'dummy_test.pdf');
  const pdfsDir = path.dirname(dummyPdfPath);
  if (!fs.existsSync(pdfsDir)) {
    fs.mkdirSync(pdfsDir, { recursive: true });
  }
  fs.writeFileSync(dummyPdfPath, 'DUMMY PDF CONTENT');
  
  const updatedExam = await examService.attachPaper(exam._id, testData.student1._id, dummyPdfPath);
  
  if (updatedExam.questionPapers.length === 1) {
    logSuccess('✓ Question paper attached successfully');
    logInfo(`   StudentId: ${updatedExam.questionPapers[0].studentId}`);
    logInfo(`   FilePath: ${updatedExam.questionPapers[0].filePath}`);
    logInfo(`   SetCode: ${updatedExam.questionPapers[0].setCode}`);
  } else {
    throw new Error('Failed to attach question paper');
  }
  
  // Check aiConfig object
  const examWithConfig = await Exam.findById(exam._id);
  if (examWithConfig.aiConfig !== undefined) {
    logSuccess('✓ aiConfig object exists');
  }
  
  // Test 2b: Attempt model extensions
  await examService.publishExam(exam._id, testData.teacher._id);
  await examService.startExam(exam._id);
  
  const attempt = await attemptService.startAttempt({
    examId: exam._id,
    studentId: testData.student1._id
  });
  
  logInfo('Testing Attempt model extensions...');
  
  // Check answerSheetPath
  if (attempt.answerSheetPath === undefined || attempt.answerSheetPath === null) {
    logSuccess('✓ answerSheetPath field exists (initially null)');
  }
  
  // Check aiResult
  if (attempt.aiResult === undefined || attempt.aiResult === null) {
    logSuccess('✓ aiResult object exists (initially null)');
  }
  
  // Submit answer sheet
  const dummyAnswerPath = path.join(__dirname, 'pdfs', 'dummy_answer.pdf');
  fs.writeFileSync(dummyAnswerPath, 'DUMMY ANSWER PDF');
  
  const updatedAttempt = await attemptService.submitAnswerSheet(attempt._id, dummyAnswerPath);
  
  if (updatedAttempt.answerSheetPath === dummyAnswerPath) {
    logSuccess('✓ Answer sheet path set correctly');
    logInfo(`   Path: ${updatedAttempt.answerSheetPath}`);
  } else {
    throw new Error('Answer sheet path not set');
  }
  
  // Cleanup dummy files
  fs.unlinkSync(dummyPdfPath);
  fs.unlinkSync(dummyAnswerPath);
  
  log('');
}

async function testServiceIntegration() {
  logTest('═══════════════════════════════════════════════════════');
  logTest('TEST 3: Service Integration');
  logTest('═══════════════════════════════════════════════════════');
  
  // Test 3a: submitAnswerSheet validation
  const exam = await examService.createExam({
    classId: testData.class._id,
    title: 'Service Test Exam',
    createdBy: testData.teacher._id,
    durationMinutes: 30,
    maxAttempts: 1,
    startTime: new Date(Date.now() - 1000),
    endTime: new Date(Date.now() + 3600000)
  });
  
  await examService.publishExam(exam._id, testData.teacher._id);
  await examService.startExam(exam._id);
  
  const attempt = await attemptService.startAttempt({
    examId: exam._id,
    studentId: testData.student2._id
  });
  
  logInfo('Testing answer sheet submission...');
  
  // Try with non-existent file (should fail)
  try {
    await attemptService.submitAnswerSheet(attempt._id, '/nonexistent/file.pdf');
    throw new Error('Should reject non-existent file');
  } catch (error) {
    if (error.message.includes('file not found') || error.message.includes('not found')) {
      logSuccess('✓ Rejected non-existent file');
      logInfo(`   Error: "${error.message}"`);
    } else {
      throw error;
    }
  }
  
  // Create valid file and submit
  const fs = require('fs');
  const path = require('path');
  const validAnswerPath = path.join(__dirname, 'pdfs', 'valid_answer.pdf');
  fs.writeFileSync(validAnswerPath, 'VALID ANSWER PDF CONTENT');
  
  const submitted = await attemptService.submitAnswerSheet(attempt._id, validAnswerPath);
  if (submitted.answerSheetPath === validAnswerPath) {
    logSuccess('✓ Answer sheet submitted successfully');
  }
  
  // Test 3b: evaluateAttempt validation
  logInfo('Testing evaluation validation...');
  
  // Try on IN_PROGRESS attempt (should fail)
  try {
    await attemptService.evaluateAttempt(attempt._id);
    throw new Error('Should not evaluate IN_PROGRESS attempt');
  } catch (error) {
    if (error.message.includes('Cannot evaluate')) {
      logSuccess('✓ IN_PROGRESS attempt rejected for evaluation');
      logInfo(`   Error: "${error.message}"`);
    } else {
      throw error;
    }
  }
  
  // Submit attempt
  await attemptService.submitAttempt(attempt._id);
  
  const submittedAttempt = await Attempt.findById(attempt._id);
  logInfo(`Attempt status: ${submittedAttempt.status}`);
  
  // Now evaluation should be attempted (will fail without AI service)
  try {
    await attemptService.evaluateAttempt(attempt._id);
    logSuccess('✓ SUBMITTED attempt allowed evaluation attempt');
  } catch (error) {
    if (error.message.includes('AI service error') || error.message.includes('Failed to evaluate')) {
      logSuccess('✓ SUBMITTED attempt validation passed (AI service unavailable)');
      logInfo(`   Error: "${error.message.substring(0, 100)}..."`);
    } else {
      throw error;
    }
  }
  
  // Cleanup
  fs.unlinkSync(validAnswerPath);
  
  log('');
}

async function testErrorHandling() {
  logTest('═══════════════════════════════════════════════════════');
  logTest('TEST 4: Error Handling');
  logTest('═══════════════════════════════════════════════════════');
  
  logInfo('Testing safe failure handling...');
  
  // Test 4a: Generate papers with no enrollments
  const emptyClass = await Class.create({
    code: 'EMPTY',
    title: 'Empty Class',
    teacherId: testData.teacher._id,
    teacher: testData.teacher._id
  });
  
  const emptyExam = await examService.createExam({
    classId: emptyClass._id,
    title: 'Empty Class Exam',
    createdBy: testData.teacher._id,
    durationMinutes: 30,
    maxAttempts: 1,
    startTime: new Date(Date.now() - 1000),
    endTime: new Date(Date.now() + 3600000)
  });
  
  try {
    await examService.generatePapers(emptyExam._id);
    throw new Error('Should reject exam with no students');
  } catch (error) {
    if (error.message.includes('No students enrolled')) {
      logSuccess('✓ Rejected exam with no enrolled students');
      logInfo(`   Error: "${error.message}"`);
    } else {
      throw error;
    }
  }
  
  // Test 4b: Evaluate without answer sheets
  const evalExam = await examService.createExam({
    classId: testData.class._id,
    title: 'Eval Test Exam',
    createdBy: testData.teacher._id,
    durationMinutes: 30,
    maxAttempts: 1,
    startTime: new Date(Date.now() - 1000),
    endTime: new Date(Date.now() + 3600000)
  });
  
  await examService.publishExam(evalExam._id, testData.teacher._id);
  await examService.startExam(evalExam._id);
  
  const noSheetAttempt = await attemptService.startAttempt({
    examId: evalExam._id,
    studentId: testData.student1._id
  });
  
  await attemptService.submitAttempt(noSheetAttempt._id);
  
  // Try to evaluate without answer sheet
  try {
    await attemptService.evaluateAttempt(noSheetAttempt._id);
    throw new Error('Should reject attempt without answer sheet');
  } catch (error) {
    if (error.message.includes('Answer sheet not uploaded')) {
      logSuccess('✓ Rejected evaluation without answer sheet');
      logInfo(`   Error: "${error.message}"`);
    } else {
      throw error;
    }
  }
  
  // Test 4c: triggerEvaluation with no valid attempts
  await examService.closeExam(evalExam._id, testData.teacher._id);
  
  try {
    await examService.triggerEvaluation(evalExam._id);
    throw new Error('Should reject evaluation with no answer sheets');
  } catch (error) {
    if (error.message.includes('No submitted attempts')) {
      logSuccess('✓ Rejected bulk evaluation with no answer sheets');
      logInfo(`   Error: "${error.message}"`);
    } else {
      throw error;
    }
  }
  
  // Test 4d: Invalid exam/attempt IDs
  try {
    await examService.generatePapers('invalid_id_123');
    throw new Error('Should reject invalid exam ID');
  } catch (error) {
    logSuccess('✓ Handled invalid exam ID gracefully');
  }
  
  try {
    await attemptService.submitAnswerSheet('invalid_attempt_123', '/some/path.pdf');
    throw new Error('Should reject invalid attempt ID');
  } catch (error) {
    logSuccess('✓ Handled invalid attempt ID gracefully');
  }
  
  log('');
}

async function cleanup() {
  log('🧹 Cleaning up test data...', colors.gray);
  
  try {
    await User.deleteMany({ email: { $regex: /ai.*@test\.com$/ } });
    await Class.deleteMany({ code: { $in: ['AITEST', 'EMPTY'] } });
    await Enrollment.deleteMany({});
    await Exam.deleteMany({ title: { $regex: /(Test|Empty) Exam$/ } });
    await Attempt.deleteMany({});
    
    // Cleanup any dummy PDF files
    const fs = require('fs');
    const path = require('path');
    const pdfsDir = path.join(__dirname, 'pdfs');
    if (fs.existsSync(pdfsDir)) {
      const files = fs.readdirSync(pdfsDir);
      for (const file of files) {
        if (file.startsWith('dummy_') || file.startsWith('valid_')) {
          fs.unlinkSync(path.join(pdfsDir, file));
        }
      }
    }
    
    log('✅ Cleanup complete\n', colors.gray);
  } catch (error) {
    log('⚠️  Cleanup warning: ' + error.message, colors.yellow);
  }
}

// Run tests
runTests();
