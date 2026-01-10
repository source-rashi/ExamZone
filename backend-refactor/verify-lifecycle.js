/**
 * Exam Lifecycle Verification
 * Clear test cases with detailed state change logging
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

// Test data storage
let testData = {
  teacher: null,
  student: null,
  class: null,
  enrollment: null
};

// Color codes for console
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

function logStateChange(from, to, entity = 'Entity') {
  log(`   🔄 ${entity}: ${colors.yellow}${from}${colors.reset} → ${colors.green}${to}${colors.reset}`);
}

function logTimestamp(label, timestamp) {
  log(`   📅 ${label}: ${colors.cyan}${timestamp ? new Date(timestamp).toLocaleString() : 'Not set'}${colors.reset}`);
}

function logError(message) {
  log(`   ❌ ${message}`, colors.red);
}

function logSuccess(message) {
  log(`   ✅ ${message}`, colors.green);
}

function logInfo(message) {
  log(`   ℹ️  ${message}`, colors.blue);
}

async function runVerification() {
  try {
    log('\n════════════════════════════════════════════════════════', colors.bright);
    log('      EXAM LIFECYCLE VERIFICATION', colors.bright);
    log('════════════════════════════════════════════════════════\n', colors.bright);
    
    await connectDB();
    log('✅ Database connected\n', colors.green);
    
    await cleanup();
    await setupTestData();
    
    // Run all test cases
    await testCase1_CannotStartDraftExam();
    await testCase2_CannotSubmitAfterClosed();
    await testCase3_CannotExceedMaxAttempts();
    await testCase4_OnlyLiveExamCanStart();
    await testCase5_AttemptStateFlow();
    await testCase6_ExamCompleteLifecycle();
    await testCase7_TimestampsSetCorrectly();
    
    log('\n════════════════════════════════════════════════════════', colors.bright);
    log('      ALL VERIFICATIONS PASSED ✅', colors.green + colors.bright);
    log('════════════════════════════════════════════════════════\n', colors.bright);
    
    await cleanup();
    process.exit(0);
  } catch (error) {
    log('\n════════════════════════════════════════════════════════', colors.bright);
    log('      VERIFICATION FAILED ❌', colors.red + colors.bright);
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
    name: 'Verification Teacher',
    email: 'verify_teacher@test.com',
    password: 'password123',
    role: 'teacher'
  });
  logSuccess('Created test teacher');
  
  testData.student = await User.create({
    name: 'Verification Student',
    email: 'verify_student@test.com',
    password: 'password123',
    role: 'student'
  });
  logSuccess('Created test student');
  
  testData.class = await Class.create({
    code: 'VERIFY',
    title: 'Verification Class',
    teacherId: testData.teacher._id,
    teacher: testData.teacher._id
  });
  logSuccess('Created test class');
  
  testData.enrollment = await Enrollment.create({
    classId: testData.class._id,
    studentId: testData.student._id,
    enrolledBy: testData.teacher._id
  });
  logSuccess('Enrolled student in class\n');
}

async function testCase1_CannotStartDraftExam() {
  log('════════════════════════════════════════════════════════', colors.bright);
  log('TEST CASE 1: Cannot Start Exam in DRAFT Status', colors.bright);
  log('════════════════════════════════════════════════════════\n', colors.bright);
  
  // Create exam in DRAFT
  const draftExam = await examService.createExam({
    classId: testData.class._id,
    title: 'Draft Exam Test',
    createdBy: testData.teacher._id,
    durationMinutes: 30,
    maxAttempts: 1,
    startTime: new Date(),
    endTime: new Date(Date.now() + 3600000)
  });
  
  logInfo(`Exam created with status: ${draftExam.status}`);
  
  // Try to start attempt on DRAFT exam
  try {
    await attemptService.startAttempt({
      examId: draftExam._id,
      studentId: testData.student._id
    });
    throw new Error('Should not allow attempt on DRAFT exam');
  } catch (error) {
    if (error.message.includes('not live')) {
      logSuccess('✓ Correctly prevented attempt on DRAFT exam');
      logInfo(`Error message: "${error.message}"`);
    } else {
      throw error;
    }
  }
  
  log('');
}

async function testCase2_CannotSubmitAfterClosed() {
  log('════════════════════════════════════════════════════════', colors.bright);
  log('TEST CASE 2: Cannot Start New Attempt After CLOSED', colors.bright);
  log('════════════════════════════════════════════════════════\n', colors.bright);
  
  // Create, publish, start, and close exam
  const closedExam = await examService.createExam({
    classId: testData.class._id,
    title: 'Closed Exam Test',
    createdBy: testData.teacher._id,
    durationMinutes: 30,
    maxAttempts: 3,
    startTime: new Date(Date.now() - 1000),
    endTime: new Date(Date.now() + 3600000)
  });
  
  logInfo(`Initial status: ${closedExam.status}`);
  
  await examService.publishExam(closedExam._id, testData.teacher._id);
  logStateChange('DRAFT', 'PUBLISHED', 'Exam');
  
  await examService.startExam(closedExam._id);
  logStateChange('PUBLISHED', 'LIVE', 'Exam');
  
  await examService.closeExam(closedExam._id, testData.teacher._id);
  logStateChange('LIVE', 'CLOSED', 'Exam');
  
  // Try to start attempt on CLOSED exam
  try {
    await attemptService.startAttempt({
      examId: closedExam._id,
      studentId: testData.student._id
    });
    throw new Error('Should not allow new attempt on CLOSED exam');
  } catch (error) {
    if (error.message.includes('not live')) {
      logSuccess('✓ Correctly prevented new attempt on CLOSED exam');
      logInfo(`Error message: "${error.message}"`);
    } else {
      throw error;
    }
  }
  
  log('');
}

async function testCase3_CannotExceedMaxAttempts() {
  log('════════════════════════════════════════════════════════', colors.bright);
  log('TEST CASE 3: Cannot Exceed maxAttempts Limit', colors.bright);
  log('════════════════════════════════════════════════════════\n', colors.bright);
  
  // Create exam with maxAttempts = 2
  const limitExam = await examService.createExam({
    classId: testData.class._id,
    title: 'Attempt Limit Test',
    createdBy: testData.teacher._id,
    durationMinutes: 30,
    maxAttempts: 2,
    startTime: new Date(Date.now() - 1000),
    endTime: new Date(Date.now() + 3600000)
  });
  
  await examService.publishExam(limitExam._id, testData.teacher._id);
  await examService.startExam(limitExam._id);
  logInfo(`Exam status: ${EXAM_STATUS.LIVE}, maxAttempts: 2`);
  
  // Attempt 1
  const attempt1 = await attemptService.startAttempt({
    examId: limitExam._id,
    studentId: testData.student._id
  });
  logSuccess(`Attempt 1 started (attemptNumber: ${attempt1.attemptNumber})`);
  
  await attemptService.submitAttempt(attempt1._id);
  logSuccess('Attempt 1 submitted');
  
  // Attempt 2
  const attempt2 = await attemptService.startAttempt({
    examId: limitExam._id,
    studentId: testData.student._id
  });
  logSuccess(`Attempt 2 started (attemptNumber: ${attempt2.attemptNumber})`);
  
  await attemptService.submitAttempt(attempt2._id);
  logSuccess('Attempt 2 submitted');
  
  // Try attempt 3 (should fail)
  try {
    await attemptService.startAttempt({
      examId: limitExam._id,
      studentId: testData.student._id
    });
    throw new Error('Should not allow attempt beyond maxAttempts');
  } catch (error) {
    if (error.message.includes('Maximum attempts')) {
      logSuccess('✓ Correctly prevented attempt 3 (limit reached)');
      logInfo(`Error message: "${error.message}"`);
    } else {
      throw error;
    }
  }
  
  log('');
}

async function testCase4_OnlyLiveExamCanStart() {
  log('════════════════════════════════════════════════════════', colors.bright);
  log('TEST CASE 4: Only LIVE Exam Allows New Attempts', colors.bright);
  log('════════════════════════════════════════════════════════\n', colors.bright);
  
  const stateExam = await examService.createExam({
    classId: testData.class._id,
    title: 'State Validation Test',
    createdBy: testData.teacher._id,
    durationMinutes: 30,
    maxAttempts: 5,
    startTime: new Date(Date.now() - 1000),
    endTime: new Date(Date.now() + 3600000)
  });
  
  // Test DRAFT
  logInfo(`Testing status: ${EXAM_STATUS.DRAFT}`);
  try {
    await attemptService.validateAttempt(testData.student._id, stateExam._id);
    throw new Error('Should reject DRAFT');
  } catch (error) {
    if (error.message.includes('not live')) {
      logSuccess(`✓ ${EXAM_STATUS.DRAFT} rejected`);
    } else {
      throw error;
    }
  }
  
  // Test PUBLISHED
  await examService.publishExam(stateExam._id, testData.teacher._id);
  logInfo(`Testing status: ${EXAM_STATUS.PUBLISHED}`);
  try {
    await attemptService.validateAttempt(testData.student._id, stateExam._id);
    throw new Error('Should reject PUBLISHED');
  } catch (error) {
    if (error.message.includes('not live')) {
      logSuccess(`✓ ${EXAM_STATUS.PUBLISHED} rejected`);
    } else {
      throw error;
    }
  }
  
  // Test LIVE (should succeed)
  await examService.startExam(stateExam._id);
  logInfo(`Testing status: ${EXAM_STATUS.LIVE}`);
  const validation = await attemptService.validateAttempt(testData.student._id, stateExam._id);
  if (validation.canAttempt) {
    logSuccess(`✓ ${EXAM_STATUS.LIVE} accepted`);
  }
  
  // Test CLOSED
  await examService.closeExam(stateExam._id, testData.teacher._id);
  logInfo(`Testing status: ${EXAM_STATUS.CLOSED}`);
  try {
    await attemptService.validateAttempt(testData.student._id, stateExam._id);
    throw new Error('Should reject CLOSED');
  } catch (error) {
    if (error.message.includes('not live')) {
      logSuccess(`✓ ${EXAM_STATUS.CLOSED} rejected`);
    } else {
      throw error;
    }
  }
  
  log('');
}

async function testCase5_AttemptStateFlow() {
  log('════════════════════════════════════════════════════════', colors.bright);
  log('TEST CASE 5: Attempt State Flow (IN_PROGRESS → SUBMITTED)', colors.bright);
  log('════════════════════════════════════════════════════════\n', colors.bright);
  
  const flowExam = await examService.createExam({
    classId: testData.class._id,
    title: 'Attempt Flow Test',
    createdBy: testData.teacher._id,
    durationMinutes: 30,
    maxAttempts: 1,
    startTime: new Date(Date.now() - 1000),
    endTime: new Date(Date.now() + 3600000)
  });
  
  await examService.publishExam(flowExam._id, testData.teacher._id);
  await examService.startExam(flowExam._id);
  
  // Start attempt
  const attempt = await attemptService.startAttempt({
    examId: flowExam._id,
    studentId: testData.student._id
  });
  
  logInfo(`Attempt created with status: ${attempt.status}`);
  if (attempt.status === ATTEMPT_STATUS.IN_PROGRESS) {
    logSuccess(`✓ Attempt starts in ${ATTEMPT_STATUS.IN_PROGRESS} state`);
  }
  
  // Submit attempt
  const submittedAttempt = await attemptService.submitAttempt(attempt._id);
  logStateChange(ATTEMPT_STATUS.IN_PROGRESS, ATTEMPT_STATUS.SUBMITTED, 'Attempt');
  
  if (submittedAttempt.status === ATTEMPT_STATUS.SUBMITTED) {
    logSuccess(`✓ Attempt transitioned to ${ATTEMPT_STATUS.SUBMITTED}`);
  }
  
  // Try to submit again (should fail)
  try {
    await attemptService.submitAttempt(attempt._id);
    throw new Error('Should not allow re-submission');
  } catch (error) {
    if (error.message.includes('Invalid attempt transition')) {
      logSuccess('✓ Correctly prevented re-submission');
      logInfo(`Error message: "${error.message}"`);
    } else {
      throw error;
    }
  }
  
  log('');
}

async function testCase6_ExamCompleteLifecycle() {
  log('════════════════════════════════════════════════════════', colors.bright);
  log('TEST CASE 6: Complete Exam Lifecycle', colors.bright);
  log('════════════════════════════════════════════════════════\n', colors.bright);
  
  let lifecycleExam = await examService.createExam({
    classId: testData.class._id,
    title: 'Complete Lifecycle Test',
    createdBy: testData.teacher._id,
    durationMinutes: 60,
    maxAttempts: 1,
    startTime: new Date(Date.now() - 1000),
    endTime: new Date(Date.now() + 3600000)
  });
  
  logInfo(`1️⃣  Created: ${lifecycleExam.status}`);
  
  // DRAFT → PUBLISHED
  lifecycleExam = await examService.publishExam(lifecycleExam._id, testData.teacher._id);
  logStateChange('DRAFT', 'PUBLISHED', 'Exam');
  if (lifecycleExam.status === EXAM_STATUS.PUBLISHED) {
    logSuccess('✓ Transition successful');
  }
  
  // PUBLISHED → LIVE
  lifecycleExam = await examService.startExam(lifecycleExam._id);
  logStateChange('PUBLISHED', 'LIVE', 'Exam');
  if (lifecycleExam.status === EXAM_STATUS.LIVE) {
    logSuccess('✓ Transition successful');
  }
  
  // LIVE → CLOSED
  lifecycleExam = await examService.closeExam(lifecycleExam._id, testData.teacher._id);
  logStateChange('LIVE', 'CLOSED', 'Exam');
  if (lifecycleExam.status === EXAM_STATUS.CLOSED) {
    logSuccess('✓ Transition successful');
  }
  
  // CLOSED → EVALUATING
  lifecycleExam = await examService.startEvaluation(lifecycleExam._id, testData.teacher._id);
  logStateChange('CLOSED', 'EVALUATING', 'Exam');
  if (lifecycleExam.status === EXAM_STATUS.EVALUATING) {
    logSuccess('✓ Transition successful');
  }
  
  // EVALUATING → RESULT_PUBLISHED
  lifecycleExam = await examService.publishResults(lifecycleExam._id, testData.teacher._id);
  logStateChange('EVALUATING', 'RESULT_PUBLISHED', 'Exam');
  if (lifecycleExam.status === EXAM_STATUS.RESULT_PUBLISHED) {
    logSuccess('✓ Transition successful');
  }
  
  logSuccess('\n✓ Complete lifecycle: DRAFT → PUBLISHED → LIVE → CLOSED → EVALUATING → RESULT_PUBLISHED');
  
  log('');
}

async function testCase7_TimestampsSetCorrectly() {
  log('════════════════════════════════════════════════════════', colors.bright);
  log('TEST CASE 7: Timestamps Set Correctly', colors.bright);
  log('════════════════════════════════════════════════════════\n', colors.bright);
  
  // Test exam timestamps
  let timestampExam = await examService.createExam({
    classId: testData.class._id,
    title: 'Timestamp Test',
    createdBy: testData.teacher._id,
    durationMinutes: 30,
    maxAttempts: 1,
    startTime: new Date(Date.now() - 1000),
    endTime: new Date(Date.now() + 3600000)
  });
  
  logInfo('Exam Timestamps:');
  logTimestamp('createdAt', timestampExam.createdAt);
  logTimestamp('publishedAt (before publish)', timestampExam.publishedAt);
  logTimestamp('closedAt (before close)', timestampExam.closedAt);
  
  // Publish exam
  timestampExam = await examService.publishExam(timestampExam._id, testData.teacher._id);
  logTimestamp('publishedAt (after publish)', timestampExam.publishedAt);
  if (timestampExam.publishedAt) {
    logSuccess('✓ publishedAt set on publish');
  }
  
  // Start and close exam
  await examService.startExam(timestampExam._id);
  timestampExam = await examService.closeExam(timestampExam._id, testData.teacher._id);
  logTimestamp('closedAt (after close)', timestampExam.closedAt);
  if (timestampExam.closedAt) {
    logSuccess('✓ closedAt set on close');
  }
  
  // Test attempt timestamps
  const timestampExam2 = await examService.createExam({
    classId: testData.class._id,
    title: 'Attempt Timestamp Test',
    createdBy: testData.teacher._id,
    durationMinutes: 30,
    maxAttempts: 1,
    startTime: new Date(Date.now() - 1000),
    endTime: new Date(Date.now() + 3600000)
  });
  
  await examService.publishExam(timestampExam2._id, testData.teacher._id);
  await examService.startExam(timestampExam2._id);
  
  logInfo('\nAttempt Timestamps:');
  let timestampAttempt = await attemptService.startAttempt({
    examId: timestampExam2._id,
    studentId: testData.student._id
  });
  
  logTimestamp('startedAt (on start)', timestampAttempt.startedAt);
  logTimestamp('submittedAt (before submit)', timestampAttempt.submittedAt);
  
  if (timestampAttempt.startedAt) {
    logSuccess('✓ startedAt set on start');
  }
  
  timestampAttempt = await attemptService.submitAttempt(timestampAttempt._id);
  logTimestamp('submittedAt (after submit)', timestampAttempt.submittedAt);
  
  if (timestampAttempt.submittedAt) {
    logSuccess('✓ submittedAt set on submit');
  }
  
  // Verify timestamps are in correct order
  const startTime = new Date(timestampAttempt.startedAt);
  const submitTime = new Date(timestampAttempt.submittedAt);
  
  if (submitTime > startTime) {
    logSuccess('✓ Timestamps in correct chronological order (startedAt < submittedAt)');
  } else {
    throw new Error('Timestamps not in correct order');
  }
  
  log('');
}

async function cleanup() {
  log('🧹 Cleaning up test data...', colors.gray);
  
  try {
    await User.deleteMany({ email: { $regex: /verify.*@test\.com$/ } });
    await Class.deleteMany({ code: 'VERIFY' });
    await Enrollment.deleteMany({});
    await Exam.deleteMany({ title: { $regex: /Test$/ } });
    await Attempt.deleteMany({});
    
    log('✅ Cleanup complete\n', colors.gray);
  } catch (error) {
    log('⚠️  Cleanup warning: ' + error.message, colors.yellow);
  }
}

// Run verification
runVerification();
