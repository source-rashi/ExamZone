/**
 * Phase 3.5 - Integrity System Test Suite
 * Tests secure exam environment and integrity tracking
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
const integrityService = require('./services/integrity.service');
const { EXAM_STATUS, ATTEMPT_STATUS } = require('./utils/constants');

// Test data
let testData = {
  teacher: null,
  student: null,
  class: null,
  enrollment: null,
  exam: null,
  attempt: null
};

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
  log(`   ✅ ${message}`, colors.green);
}

function logError(message) {
  log(`   ❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`   ℹ️  ${message}`, colors.blue);
}

function logTest(message) {
  log(`\n${message}`, colors.bright);
}

async function runTests() {
  try {
    log('\n════════════════════════════════════════════════════════', colors.bright);
    log('      PHASE 3.5 - INTEGRITY SYSTEM TESTS', colors.bright);
    log('════════════════════════════════════════════════════════\n', colors.bright);
    
    await connectDB();
    log('✅ Database connected\n', colors.green);
    
    await cleanup();
    await setupTestData();
    
    // Run all test suites
    await testViolationLogging();
    await testHeartbeat();
    await testAutoSubmit();
    await testValidation();
    await testIntegrityCounters();
    await testAuditTrail();
    
    log('\n════════════════════════════════════════════════════════', colors.bright);
    log('      ALL INTEGRITY TESTS PASSED ✅', colors.green + colors.bright);
    log('════════════════════════════════════════════════════════\n', colors.bright);
    
    await cleanup();
    process.exit(0);
  } catch (error) {
    log('\n════════════════════════════════════════════════════════', colors.bright);
    log('      INTEGRITY TESTS FAILED ❌', colors.red + colors.bright);
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
    name: 'Integrity Teacher',
    email: 'integrity_teacher@test.com',
    password: 'password123',
    role: 'teacher'
  });
  
  testData.student = await User.create({
    name: 'Integrity Student',
    email: 'integrity_student@test.com',
    password: 'password123',
    role: 'student'
  });
  
  testData.class = await Class.create({
    code: 'INTEGRITY',
    title: 'Integrity Test Class',
    teacherId: testData.teacher._id,
    teacher: testData.teacher._id
  });
  
  testData.enrollment = await Enrollment.create({
    classId: testData.class._id,
    studentId: testData.student._id,
    enrolledBy: testData.teacher._id
  });
  
  testData.exam = await examService.createExam({
    classId: testData.class._id,
    title: 'Integrity Test Exam',
    createdBy: testData.teacher._id,
    durationMinutes: 30,
    maxAttempts: 5,
    startTime: new Date(Date.now() - 1000),
    endTime: new Date(Date.now() + 3600000)
  });
  
  await examService.publishExam(testData.exam._id, testData.teacher._id);
  await examService.startExam(testData.exam._id);
  
  testData.attempt = await attemptService.startAttempt({
    examId: testData.exam._id,
    studentId: testData.student._id
  });
  
  logSuccess('Test data ready\n');
}

async function testViolationLogging() {
  logTest('═══════════════════════════════════════════════════════');
  logTest('TEST 1: Violation Logging');
  logTest('═══════════════════════════════════════════════════════');
  
  const violationTypes = ['tab_switch', 'focus_lost', 'fullscreen_exit', 'copy', 'paste'];
  
  for (const type of violationTypes) {
    const updatedAttempt = await attemptService.recordIntegrityEvent(testData.attempt._id, type);
    
    if (updatedAttempt.integrity.violations.some(v => v.type === type)) {
      logSuccess(`✓ ${type} logged in violations array`);
    } else {
      throw new Error(`Failed to log ${type}`);
    }
  }
  
  // Verify violation count
  const attempt = await Attempt.findById(testData.attempt._id);
  if (attempt.integrity.violations.length === 5) {
    logSuccess(`✓ Total violations: ${attempt.integrity.violations.length}`);
  }
}

async function testHeartbeat() {
  logTest('\n═══════════════════════════════════════════════════════');
  logTest('TEST 2: Heartbeat Tracking');
  logTest('═══════════════════════════════════════════════════════');
  
  // Get initial lastActiveAt
  let attempt = await Attempt.findById(testData.attempt._id);
  const initialTime = attempt.integrity.lastActiveAt;
  
  logInfo(`Initial lastActiveAt: ${new Date(initialTime).toLocaleString()}`);
  
  // Wait 1 second
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Send heartbeat
  const updatedAttempt = await attemptService.recordHeartbeat(testData.attempt._id);
  const newTime = updatedAttempt.integrity.lastActiveAt;
  
  logInfo(`After heartbeat: ${new Date(newTime).toLocaleString()}`);
  
  if (new Date(newTime) > new Date(initialTime)) {
    logSuccess('✓ Heartbeat updated lastActiveAt timestamp');
  } else {
    throw new Error('Heartbeat failed to update timestamp');
  }
  
  // Verify status unchanged
  if (updatedAttempt.status === ATTEMPT_STATUS.IN_PROGRESS) {
    logSuccess('✓ Status remains IN_PROGRESS after heartbeat');
  }
}

async function testAutoSubmit() {
  logTest('\n═══════════════════════════════════════════════════════');
  logTest('TEST 3: Auto-Submit on Timeout');
  logTest('═══════════════════════════════════════════════════════');
  
  // Create new attempt with 1-minute duration that already started
  const timeoutExam = await examService.createExam({
    classId: testData.class._id,
    title: 'Timeout Test',
    createdBy: testData.teacher._id,
    durationMinutes: 1, // 1 minute
    maxAttempts: 5,
    startTime: new Date(Date.now() - 1000),
    endTime: new Date(Date.now() + 3600000)
  });
  
  await examService.publishExam(timeoutExam._id, testData.teacher._id);
  await examService.startExam(timeoutExam._id);
  
  const timeoutAttempt = await attemptService.startAttempt({
    examId: timeoutExam._id,
    studentId: testData.student._id
  });
  
  // Manually set startedAt to 2 minutes ago (exceeds 1-minute duration)
  timeoutAttempt.startedAt = new Date(Date.now() - 2 * 60 * 1000);
  await timeoutAttempt.save();
  
  logInfo(`Attempt duration: 1 minute, started: 2 minutes ago`);
  
  // Debug: verify the attempt times
  const beforeHeartbeat = await Attempt.findById(timeoutAttempt._id).populate('examId');
  const elapsed = Date.now() - new Date(beforeHeartbeat.startedAt).getTime();
  const elapsedMinutes = elapsed / (60 * 1000);
  logInfo(`Elapsed: ${elapsedMinutes.toFixed(2)} minutes, Duration: ${beforeHeartbeat.examId.durationMinutes} minutes`);
  
  // Trigger auto-submit check via heartbeat
  const result = await attemptService.recordHeartbeat(timeoutAttempt._id);
  logInfo(`Heartbeat result status: ${result.status}`);
  
  // Check if auto-submitted
  const submittedAttempt = await Attempt.findById(timeoutAttempt._id);
  
  if (submittedAttempt.status === ATTEMPT_STATUS.SUBMITTED) {
    logSuccess('✓ Attempt auto-submitted after timeout');
  } else {
    throw new Error(`Expected SUBMITTED, got ${submittedAttempt.status}`);
  }
  
  if (submittedAttempt.integrity.autoSubmitted === true) {
    logSuccess('✓ autoSubmitted flag set to true');
  } else {
    throw new Error('autoSubmitted flag not set');
  }
  
  if (submittedAttempt.submittedAt) {
    logSuccess(`✓ submittedAt timestamp: ${new Date(submittedAttempt.submittedAt).toLocaleString()}`);
  }
}

async function testValidation() {
  logTest('\n═══════════════════════════════════════════════════════');
  logTest('TEST 4: Validation Rules');
  logTest('═══════════════════════════════════════════════════════');
  
  // Create and submit an attempt
  const validationExam = await examService.createExam({
    classId: testData.class._id,
    title: 'Validation Test',
    createdBy: testData.teacher._id,
    durationMinutes: 30,
    maxAttempts: 5,
    startTime: new Date(Date.now() - 1000),
    endTime: new Date(Date.now() + 3600000)
  });
  
  await examService.publishExam(validationExam._id, testData.teacher._id);
  await examService.startExam(validationExam._id);
  
  const validationAttempt = await attemptService.startAttempt({
    examId: validationExam._id,
    studentId: testData.student._id
  });
  
  // Submit it
  await attemptService.submitAttempt(validationAttempt._id);
  
  // Try to log violation on SUBMITTED attempt (should fail)
  try {
    await attemptService.recordIntegrityEvent(validationAttempt._id, 'tab_switch');
    throw new Error('Should not allow violation on SUBMITTED attempt');
  } catch (error) {
    if (error.message.includes('submitted') || error.message.includes('in_progress')) {
      logSuccess('✓ Blocked violation on SUBMITTED attempt');
    } else {
      throw error;
    }
  }
  
  // Try to heartbeat on SUBMITTED attempt (should fail)
  try {
    await attemptService.recordHeartbeat(validationAttempt._id);
    throw new Error('Should not allow heartbeat on SUBMITTED attempt');
  } catch (error) {
    if (error.message.includes('submitted') || error.message.includes('in_progress')) {
      logSuccess('✓ Blocked heartbeat on SUBMITTED attempt');
    } else {
      throw error;
    }
  }
  
  // Start attempt while LIVE, then close exam
  const closedAttempt = await attemptService.startAttempt({
    examId: validationExam._id,
    studentId: testData.student._id
  });
  
  // Close the exam (attempt is still IN_PROGRESS but exam is CLOSED)
  await examService.closeExam(validationExam._id, testData.teacher._id);
  
  try {
    await attemptService.recordIntegrityEvent(closedAttempt._id, 'tab_switch');
    throw new Error('Should not allow violation when exam CLOSED');
  } catch (error) {
    if (error.message.includes('not live') || error.message.includes('closed')) {
      logSuccess('✓ Blocked violation when exam CLOSED');
    } else {
      throw error;
    }
  }
  
  // Test invalid violation type (use fresh exam)
  const typeExam = await examService.createExam({
    classId: testData.class._id,
    title: 'Type Validation Test',
    createdBy: testData.teacher._id,
    durationMinutes: 30,
    maxAttempts: 5,
    startTime: new Date(Date.now() - 1000),
    endTime: new Date(Date.now() + 3600000)
  });
  
  await examService.publishExam(typeExam._id, testData.teacher._id);
  await examService.startExam(typeExam._id);
  
  const liveAttempt = await attemptService.startAttempt({
    examId: typeExam._id,
    studentId: testData.student._id
  });
  
  try {
    await attemptService.recordIntegrityEvent(liveAttempt._id, 'invalid_type');
    throw new Error('Should reject invalid violation type');
  } catch (error) {
    if (error.message.includes('Invalid event type')) {
      logSuccess('✓ Rejected invalid violation type');
    } else {
      throw error;
    }
  }
}

async function testIntegrityCounters() {
  logTest('\n═══════════════════════════════════════════════════════');
  logTest('TEST 5: Integrity Counters');
  logTest('═══════════════════════════════════════════════════════');
  
  // Create fresh exam for counter tests
  const counterExam = await examService.createExam({
    classId: testData.class._id,
    title: 'Counter Test',
    createdBy: testData.teacher._id,
    durationMinutes: 30,
    maxAttempts: 5,
    startTime: new Date(Date.now() - 1000),
    endTime: new Date(Date.now() + 3600000)
  });
  
  await examService.publishExam(counterExam._id, testData.teacher._id);
  await examService.startExam(counterExam._id);
  
  const counterAttempt = await attemptService.startAttempt({
    examId: counterExam._id,
    studentId: testData.student._id
  });
  
  // Log multiple violations of same type
  await attemptService.recordIntegrityEvent(counterAttempt._id, 'tab_switch');
  await attemptService.recordIntegrityEvent(counterAttempt._id, 'tab_switch');
  await attemptService.recordIntegrityEvent(counterAttempt._id, 'tab_switch');
  
  await attemptService.recordIntegrityEvent(counterAttempt._id, 'copy');
  await attemptService.recordIntegrityEvent(counterAttempt._id, 'copy');
  
  await attemptService.recordIntegrityEvent(counterAttempt._id, 'paste');
  
  const updated = await Attempt.findById(counterAttempt._id);
  
  if (updated.integrity.tabSwitches === 3) {
    logSuccess(`✓ tabSwitches counter: ${updated.integrity.tabSwitches}`);
  } else {
    throw new Error(`Expected tabSwitches=3, got ${updated.integrity.tabSwitches}`);
  }
  
  if (updated.integrity.copyEvents === 2) {
    logSuccess(`✓ copyEvents counter: ${updated.integrity.copyEvents}`);
  } else {
    throw new Error(`Expected copyEvents=2, got ${updated.integrity.copyEvents}`);
  }
  
  if (updated.integrity.pasteEvents === 1) {
    logSuccess(`✓ pasteEvents counter: ${updated.integrity.pasteEvents}`);
  } else {
    throw new Error(`Expected pasteEvents=1, got ${updated.integrity.pasteEvents}`);
  }
  
  if (updated.integrity.violations.length === 6) {
    logSuccess(`✓ Total violations logged: ${updated.integrity.violations.length}`);
  }
}

async function testAuditTrail() {
  logTest('\n═══════════════════════════════════════════════════════');
  logTest('TEST 6: Audit Trail');
  logTest('═══════════════════════════════════════════════════════');
  
  // Create fresh exam for audit trail tests
  const auditExam = await examService.createExam({
    classId: testData.class._id,
    title: 'Audit Trail Test',
    createdBy: testData.teacher._id,
    durationMinutes: 30,
    maxAttempts: 5,
    startTime: new Date(Date.now() - 1000),
    endTime: new Date(Date.now() + 3600000)
  });
  
  await examService.publishExam(auditExam._id, testData.teacher._id);
  await examService.startExam(auditExam._id);
  
  const auditAttempt = await attemptService.startAttempt({
    examId: auditExam._id,
    studentId: testData.student._id
  });
  
  // Log violations with time gaps
  await attemptService.recordIntegrityEvent(auditAttempt._id, 'tab_switch');
  await new Promise(resolve => setTimeout(resolve, 100));
  
  await attemptService.recordIntegrityEvent(auditAttempt._id, 'focus_lost');
  await new Promise(resolve => setTimeout(resolve, 100));
  
  await attemptService.recordIntegrityEvent(auditAttempt._id, 'copy');
  
  const audit = await Attempt.findById(auditAttempt._id);
  
  // Verify violations have timestamps
  for (let i = 0; i < audit.integrity.violations.length; i++) {
    const violation = audit.integrity.violations[i];
    if (!violation.timestamp) {
      throw new Error(`Violation ${i} missing timestamp`);
    }
  }
  logSuccess(`✓ All ${audit.integrity.violations.length} violations have timestamps`);
  
  // Verify chronological order
  for (let i = 1; i < audit.integrity.violations.length; i++) {
    const prev = new Date(audit.integrity.violations[i - 1].timestamp);
    const curr = new Date(audit.integrity.violations[i].timestamp);
    
    if (curr < prev) {
      throw new Error('Violations not in chronological order');
    }
  }
  logSuccess('✓ Violations in chronological order');
  
  // Display audit trail
  logInfo('Audit Trail:');
  audit.integrity.violations.forEach((v, idx) => {
    logInfo(`  ${idx + 1}. ${v.type} at ${new Date(v.timestamp).toLocaleString()}`);
  });
}

async function cleanup() {
  log('🧹 Cleaning up test data...', colors.gray);
  
  try {
    await User.deleteMany({ email: { $regex: /integrity.*@test\.com$/ } });
    await Class.deleteMany({ code: 'INTEGRITY' });
    await Enrollment.deleteMany({});
    await Exam.deleteMany({ title: { $regex: /(Integrity|Timeout|Validation) Test/ } });
    await Attempt.deleteMany({});
    
    log('✅ Cleanup complete\n', colors.gray);
  } catch (error) {
    log('⚠️  Cleanup warning: ' + error.message, colors.yellow);
  }
}

// Run tests
runTests();
