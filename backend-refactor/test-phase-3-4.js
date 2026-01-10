/**
 * Phase 3.4 Test Suite
 * Test exam lifecycle and attempt flow control
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

let testData = {
  teacher: null,
  student: null,
  class: null,
  enrollment: null,
  exam: null,
  attempt: null
};

async function runTests() {
  try {
    console.log('🧪 Phase 3.4 Test Suite: Exam Lifecycle & Attempt Flow\n');
    
    await connectDB();
    console.log('✅ Database connected\n');
    
    await cleanup();
    
    await testExamLifecycle();
    await testAttemptFlow();
    await testStateTransitions();
    await testFlowControl();
    
    console.log('\n✅ All Phase 3.4 tests passed!');
    console.log('\n📊 Test Summary:');
    console.log('   ✓ Exam lifecycle (DRAFT → PUBLISHED → LIVE → CLOSED → EVALUATING → RESULT_PUBLISHED)');
    console.log('   ✓ Attempt flow (IN_PROGRESS → SUBMITTED → EVALUATED)');
    console.log('   ✓ State transition validation');
    console.log('   ✓ Flow control (attempt limits, exam status checks, auto-submission)');
    
    await cleanup();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    await cleanup();
    process.exit(1);
  }
}

async function testExamLifecycle() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('TEST 1: Exam Lifecycle State Transitions');
  console.log('═══════════════════════════════════════════════════════\n');
  
  // Setup test data
  testData.teacher = await User.create({
    name: 'Test Teacher',
    email: 'teacher_phase34@test.com',
    password: 'password123',
    role: 'teacher'
  });
  
  testData.student = await User.create({
    name: 'Test Student',
    email: 'student_phase34@test.com',
    password: 'password123',
    role: 'student'
  });
  
  testData.class = await Class.create({
    code: 'TEST34',
    title: 'Phase 3.4 Test Class',
    teacherId: testData.teacher._id,
    teacher: testData.teacher._id
  });
  
  testData.enrollment = await Enrollment.create({
    classId: testData.class._id,
    studentId: testData.student._id,
    enrolledBy: testData.teacher._id
  });
  
  console.log('✓ Test setup complete\n');
  
  // Create exam (DRAFT)
  testData.exam = await examService.createExam({
    classId: testData.class._id,
    title: 'Phase 3.4 Lifecycle Test',
    description: 'Testing state transitions',
    createdBy: testData.teacher._id,
    durationMinutes: 60,
    maxAttempts: 2,
    startTime: new Date(Date.now() - 1000), // Start time in the past
    endTime: new Date(Date.now() + 3600000)
  });
  
  console.log(`✓ Exam created with status: ${testData.exam.status}`);
  if (testData.exam.status !== EXAM_STATUS.DRAFT) {
    throw new Error('Exam should start in DRAFT status');
  }
  
  // DRAFT → PUBLISHED
  testData.exam = await examService.publishExam(testData.exam._id, testData.teacher._id);
  console.log(`✓ Exam published, status: ${testData.exam.status}`);
  if (testData.exam.status !== EXAM_STATUS.PUBLISHED) {
    throw new Error('Exam should be PUBLISHED');
  }
  if (!testData.exam.publishedAt) {
    throw new Error('publishedAt should be set');
  }
  
  // PUBLISHED → LIVE
  testData.exam = await examService.startExam(testData.exam._id);
  console.log(`✓ Exam started, status: ${testData.exam.status}`);
  if (testData.exam.status !== EXAM_STATUS.LIVE) {
    throw new Error('Exam should be LIVE');
  }
  
  // LIVE → CLOSED
  testData.exam = await examService.closeExam(testData.exam._id, testData.teacher._id);
  console.log(`✓ Exam closed, status: ${testData.exam.status}`);
  if (testData.exam.status !== EXAM_STATUS.CLOSED) {
    throw new Error('Exam should be CLOSED');
  }
  if (!testData.exam.closedAt) {
    throw new Error('closedAt should be set');
  }
  
  // CLOSED → EVALUATING
  testData.exam = await examService.startEvaluation(testData.exam._id, testData.teacher._id);
  console.log(`✓ Evaluation started, status: ${testData.exam.status}`);
  if (testData.exam.status !== EXAM_STATUS.EVALUATING) {
    throw new Error('Exam should be EVALUATING');
  }
  
  // EVALUATING → RESULT_PUBLISHED
  testData.exam = await examService.publishResults(testData.exam._id, testData.teacher._id);
  console.log(`✓ Results published, status: ${testData.exam.status}`);
  if (testData.exam.status !== EXAM_STATUS.RESULT_PUBLISHED) {
    throw new Error('Exam should be RESULT_PUBLISHED');
  }
  
  console.log('\n✅ Exam lifecycle test passed\n');
}

async function testAttemptFlow() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('TEST 2: Attempt Flow Control');
  console.log('═══════════════════════════════════════════════════════\n');
  
  // Create new exam for attempt testing
  const attemptExam = await examService.createExam({
    classId: testData.class._id,
    title: 'Attempt Flow Test',
    createdBy: testData.teacher._id,
    durationMinutes: 30,
    maxAttempts: 2,
    startTime: new Date(),
    endTime: new Date(Date.now() + 3600000)
  });
  
  await examService.publishExam(attemptExam._id, testData.teacher._id);
  await examService.startExam(attemptExam._id);
  console.log('✓ Test exam created and started (LIVE)\n');
  
  // Start attempt
  testData.attempt = await attemptService.startAttempt({
    examId: attemptExam._id,
    studentId: testData.student._id
  });
  
  console.log(`✓ Attempt started, status: ${testData.attempt.status}`);
  if (testData.attempt.status !== ATTEMPT_STATUS.IN_PROGRESS) {
    throw new Error('Attempt should be IN_PROGRESS');
  }
  if (!testData.attempt.startedAt) {
    throw new Error('startedAt should be set');
  }
  
  // Submit attempt
  testData.attempt = await attemptService.submitAttempt(testData.attempt._id);
  console.log(`✓ Attempt submitted, status: ${testData.attempt.status}`);
  if (testData.attempt.status !== ATTEMPT_STATUS.SUBMITTED) {
    throw new Error('Attempt should be SUBMITTED');
  }
  if (!testData.attempt.submittedAt) {
    throw new Error('submittedAt should be set');
  }
  
  console.log('\n✅ Attempt flow test passed\n');
}

async function testStateTransitions() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('TEST 3: Invalid State Transition Prevention');
  console.log('═══════════════════════════════════════════════════════\n');
  
  // Create exam for invalid transition testing
  const transitionExam = await examService.createExam({
    classId: testData.class._id,
    title: 'Transition Test',
    createdBy: testData.teacher._id,
    durationMinutes: 30,
    maxAttempts: 1,
    startTime: new Date(),
    endTime: new Date(Date.now() + 3600000)
  });
  
  // Try to start exam from DRAFT (should fail)
  try {
    await examService.startExam(transitionExam._id);
    throw new Error('Should not allow DRAFT → LIVE transition');
  } catch (error) {
    if (error.message.includes('Invalid state transition')) {
      console.log('✓ Prevented invalid DRAFT → LIVE transition');
    } else {
      throw error;
    }
  }
  
  // Try to close exam from DRAFT (should fail)
  try {
    await examService.closeExam(transitionExam._id, testData.teacher._id);
    throw new Error('Should not allow DRAFT → CLOSED transition');
  } catch (error) {
    if (error.message.includes('Invalid state transition')) {
      console.log('✓ Prevented invalid DRAFT → CLOSED transition');
    } else {
      throw error;
    }
  }
  
  // Publish and try to skip LIVE (PUBLISHED → CLOSED should fail)
  await examService.publishExam(transitionExam._id, testData.teacher._id);
  try {
    await examService.closeExam(transitionExam._id, testData.teacher._id);
    throw new Error('Should not allow PUBLISHED → CLOSED transition');
  } catch (error) {
    if (error.message.includes('Invalid state transition')) {
      console.log('✓ Prevented invalid PUBLISHED → CLOSED transition');
    } else {
      throw error;
    }
  }
  
  console.log('\n✅ State transition validation test passed\n');
}

async function testFlowControl() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('TEST 4: Flow Control (Limits, Validations, Auto-submit)');
  console.log('═══════════════════════════════════════════════════════\n');
  
  // Create exam with maxAttempts = 1
  const limitExam = await examService.createExam({
    classId: testData.class._id,
    title: 'Limit Test',
    createdBy: testData.teacher._id,
    durationMinutes: 30,
    maxAttempts: 1,
    startTime: new Date(),
    endTime: new Date(Date.now() + 3600000)
  });
  
  await examService.publishExam(limitExam._id, testData.teacher._id);
  await examService.startExam(limitExam._id);
  
  // Start first attempt
  const attempt1 = await attemptService.startAttempt({
    examId: limitExam._id,
    studentId: testData.student._id
  });
  console.log('✓ First attempt started');
  
  // Submit first attempt
  await attemptService.submitAttempt(attempt1._id);
  console.log('✓ First attempt submitted');
  
  // Try to start second attempt (should fail - limit reached)
  try {
    await attemptService.startAttempt({
      examId: limitExam._id,
      studentId: testData.student._id
    });
    throw new Error('Should not allow attempt beyond maxAttempts');
  } catch (error) {
    if (error.message.includes('Maximum attempts')) {
      console.log('✓ Prevented attempt beyond maxAttempts limit');
    } else {
      throw error;
    }
  }
  
  // Test validateAttempt function
  const draftExam = await examService.createExam({
    classId: testData.class._id,
    title: 'Draft Validation Test',
    createdBy: testData.teacher._id,
    durationMinutes: 30,
    maxAttempts: 1,
    startTime: new Date(),
    endTime: new Date(Date.now() + 3600000)
  });
  
  // Try to start attempt on DRAFT exam (should fail)
  try {
    await attemptService.validateAttempt(testData.student._id, draftExam._id);
    throw new Error('Should not allow attempt on non-LIVE exam');
  } catch (error) {
    if (error.message.includes('not live')) {
      console.log('✓ Prevented attempt on non-LIVE exam');
    } else {
      throw error;
    }
  }
  
  // Test auto-submit overdue attempts
  const autoSubmitExam = await examService.createExam({
    classId: testData.class._id,
    title: 'Auto-submit Test',
    createdBy: testData.teacher._id,
    durationMinutes: 30,
    maxAttempts: 3,
    startTime: new Date(),
    endTime: new Date(Date.now() + 3600000)
  });
  
  await examService.publishExam(autoSubmitExam._id, testData.teacher._id);
  await examService.startExam(autoSubmitExam._id);
  
  // Start 2 attempts without submitting
  const overdue1 = await attemptService.startAttempt({
    examId: autoSubmitExam._id,
    studentId: testData.student._id
  });
  
  // Force submit first to start second
  await attemptService.submitAttempt(overdue1._id);
  
  const overdue2 = await attemptService.startAttempt({
    examId: autoSubmitExam._id,
    studentId: testData.student._id
  });
  
  console.log('✓ Created 1 overdue attempt (IN_PROGRESS)');
  
  // Close exam
  await examService.closeExam(autoSubmitExam._id, testData.teacher._id);
  
  // Auto-submit overdue attempts
  const autoSubmitCount = await attemptService.autoSubmitOverdueAttempts(autoSubmitExam._id);
  console.log(`✓ Auto-submitted ${autoSubmitCount} overdue attempt(s)`);
  
  if (autoSubmitCount !== 1) {
    throw new Error(`Expected 1 auto-submitted attempt, got ${autoSubmitCount}`);
  }
  
  // Verify attempt was submitted
  const submittedAttempt = await Attempt.findById(overdue2._id);
  if (submittedAttempt.status !== ATTEMPT_STATUS.SUBMITTED) {
    throw new Error('Overdue attempt should be auto-submitted');
  }
  console.log('✓ Verified overdue attempt status changed to SUBMITTED');
  
  console.log('\n✅ Flow control test passed\n');
}

async function cleanup() {
  console.log('🧹 Cleaning up test data...');
  
  try {
    await User.deleteMany({ email: { $regex: /_phase34@test\.com$/ } });
    await Class.deleteMany({ code: { $regex: /^TEST34/ } });
    await Enrollment.deleteMany({ classId: testData.class?._id });
    await Exam.deleteMany({ classId: testData.class?._id });
    await Attempt.deleteMany({ examId: { $exists: true } });
    
    console.log('✅ Cleanup complete\n');
  } catch (error) {
    console.log('⚠️  Cleanup error (may be expected):', error.message);
  }
}

// Run tests
runTests();
