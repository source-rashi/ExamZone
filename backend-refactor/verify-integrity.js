/**
 * Integrity System Verification
 * Tests 6 specific scenarios for exam integrity tracking
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

async function runVerification() {
  try {
    log('\n════════════════════════════════════════════════════════', colors.bright);
    log('      INTEGRITY SYSTEM VERIFICATION', colors.bright);
    log('════════════════════════════════════════════════════════\n', colors.bright);
    
    await connectDB();
    logSuccess('Database connected\n');
    
    await cleanup();
    await setupTestData();
    
    // Run all 6 verification tests
    await test1_StartingAttemptCreatesIntegrityObject();
    await test2_ViolationIncreasesCorrectCounter();
    await test3_HeartbeatUpdatesLastActiveAt();
    await test4_TimeoutAutoSubmitsAttempt();
    await test5_CannotLogViolationsAfterSubmitted();
    await test6_ViolationsArrayRecordsTimeline();
    
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
    name: 'Verify Teacher',
    email: 'verify_integrity@test.com',
    password: 'password123',
    role: 'teacher'
  });
  
  testData.student = await User.create({
    name: 'Verify Student',
    email: 'verify_student@test.com',
    password: 'password123',
    role: 'student'
  });
  
  testData.class = await Class.create({
    code: 'VERIFYINT',
    title: 'Integrity Verification Class',
    teacherId: testData.teacher._id,
    teacher: testData.teacher._id
  });
  
  testData.enrollment = await Enrollment.create({
    classId: testData.class._id,
    studentId: testData.student._id,
    enrolledBy: testData.teacher._id
  });
  
  logSuccess('Test data ready\n');
}

async function test1_StartingAttemptCreatesIntegrityObject() {
  log('════════════════════════════════════════════════════════', colors.bright);
  log('TEST 1: Starting Attempt Creates Integrity Object', colors.bright);
  log('════════════════════════════════════════════════════════\n', colors.bright);
  
  // Create and start exam
  const exam = await examService.createExam({
    classId: testData.class._id,
    title: 'Integrity Object Test',
    createdBy: testData.teacher._id,
    durationMinutes: 30,
    maxAttempts: 5,
    startTime: new Date(Date.now() - 1000),
    endTime: new Date(Date.now() + 3600000)
  });
  
  await examService.publishExam(exam._id, testData.teacher._id);
  await examService.startExam(exam._id);
  
  // Start attempt
  const attempt = await attemptService.startAttempt({
    examId: exam._id,
    studentId: testData.student._id
  });
  
  logInfo(`Attempt ID: ${attempt._id}`);
  logInfo(`Status: ${attempt.status}`);
  
  // Check integrity object exists
  if (attempt.integrity) {
    logSuccess('✓ integrity object created');
  } else {
    throw new Error('integrity object not created');
  }
  
  // Check default values
  if (attempt.integrity.tabSwitches === 0) {
    logSuccess('✓ tabSwitches initialized to 0');
  }
  
  if (attempt.integrity.focusLostCount === 0) {
    logSuccess('✓ focusLostCount initialized to 0');
  }
  
  if (attempt.integrity.fullscreenExitCount === 0) {
    logSuccess('✓ fullscreenExitCount initialized to 0');
  }
  
  if (attempt.integrity.copyEvents === 0) {
    logSuccess('✓ copyEvents initialized to 0');
  }
  
  if (attempt.integrity.pasteEvents === 0) {
    logSuccess('✓ pasteEvents initialized to 0');
  }
  
  if (Array.isArray(attempt.integrity.violations) && attempt.integrity.violations.length === 0) {
    logSuccess('✓ violations array initialized empty');
  }
  
  if (attempt.integrity.lastActiveAt) {
    logSuccess(`✓ lastActiveAt set: ${new Date(attempt.integrity.lastActiveAt).toLocaleString()}`);
  }
  
  if (attempt.integrity.autoSubmitted === false) {
    logSuccess('✓ autoSubmitted initialized to false');
  }
  
  log('');
}

async function test2_ViolationIncreasesCorrectCounter() {
  log('════════════════════════════════════════════════════════', colors.bright);
  log('TEST 2: /violation Increases Correct Counter', colors.bright);
  log('════════════════════════════════════════════════════════\n', colors.bright);
  
  // Create exam
  const exam = await examService.createExam({
    classId: testData.class._id,
    title: 'Counter Test',
    createdBy: testData.teacher._id,
    durationMinutes: 30,
    maxAttempts: 5,
    startTime: new Date(Date.now() - 1000),
    endTime: new Date(Date.now() + 3600000)
  });
  
  await examService.publishExam(exam._id, testData.teacher._id);
  await examService.startExam(exam._id);
  
  const attempt = await attemptService.startAttempt({
    examId: exam._id,
    studentId: testData.student._id
  });
  
  logInfo(`Initial counters: all 0`);
  
  // Test tab_switch
  await attemptService.recordIntegrityEvent(attempt._id, 'tab_switch');
  let updated = await Attempt.findById(attempt._id);
  if (updated.integrity.tabSwitches === 1) {
    logSuccess('✓ tab_switch: counter 0 → 1');
  } else {
    throw new Error(`Expected tabSwitches=1, got ${updated.integrity.tabSwitches}`);
  }
  
  // Test focus_lost
  await attemptService.recordIntegrityEvent(attempt._id, 'focus_lost');
  updated = await Attempt.findById(attempt._id);
  if (updated.integrity.focusLostCount === 1) {
    logSuccess('✓ focus_lost: counter 0 → 1');
  } else {
    throw new Error(`Expected focusLostCount=1, got ${updated.integrity.focusLostCount}`);
  }
  
  // Test fullscreen_exit
  await attemptService.recordIntegrityEvent(attempt._id, 'fullscreen_exit');
  updated = await Attempt.findById(attempt._id);
  if (updated.integrity.fullscreenExitCount === 1) {
    logSuccess('✓ fullscreen_exit: counter 0 → 1');
  } else {
    throw new Error(`Expected fullscreenExitCount=1, got ${updated.integrity.fullscreenExitCount}`);
  }
  
  // Test copy (multiple times)
  await attemptService.recordIntegrityEvent(attempt._id, 'copy');
  await attemptService.recordIntegrityEvent(attempt._id, 'copy');
  updated = await Attempt.findById(attempt._id);
  if (updated.integrity.copyEvents === 2) {
    logSuccess('✓ copy (2x): counter 0 → 2');
  } else {
    throw new Error(`Expected copyEvents=2, got ${updated.integrity.copyEvents}`);
  }
  
  // Test paste (multiple times)
  await attemptService.recordIntegrityEvent(attempt._id, 'paste');
  await attemptService.recordIntegrityEvent(attempt._id, 'paste');
  await attemptService.recordIntegrityEvent(attempt._id, 'paste');
  updated = await Attempt.findById(attempt._id);
  if (updated.integrity.pasteEvents === 3) {
    logSuccess('✓ paste (3x): counter 0 → 3');
  } else {
    throw new Error(`Expected pasteEvents=3, got ${updated.integrity.pasteEvents}`);
  }
  
  // Verify other counters unchanged
  if (updated.integrity.tabSwitches === 1 && updated.integrity.focusLostCount === 1) {
    logSuccess('✓ Other counters remain unchanged');
  }
  
  logInfo(`Final state: tabSwitches=${updated.integrity.tabSwitches}, focusLostCount=${updated.integrity.focusLostCount}, fullscreenExitCount=${updated.integrity.fullscreenExitCount}, copyEvents=${updated.integrity.copyEvents}, pasteEvents=${updated.integrity.pasteEvents}`);
  
  log('');
}

async function test3_HeartbeatUpdatesLastActiveAt() {
  log('════════════════════════════════════════════════════════', colors.bright);
  log('TEST 3: Heartbeat Updates lastActiveAt', colors.bright);
  log('════════════════════════════════════════════════════════\n', colors.bright);
  
  const exam = await examService.createExam({
    classId: testData.class._id,
    title: 'Heartbeat Test',
    createdBy: testData.teacher._id,
    durationMinutes: 30,
    maxAttempts: 5,
    startTime: new Date(Date.now() - 1000),
    endTime: new Date(Date.now() + 3600000)
  });
  
  await examService.publishExam(exam._id, testData.teacher._id);
  await examService.startExam(exam._id);
  
  const attempt = await attemptService.startAttempt({
    examId: exam._id,
    studentId: testData.student._id
  });
  
  const initialTime = new Date(attempt.integrity.lastActiveAt);
  logInfo(`Initial lastActiveAt: ${initialTime.toLocaleString()}`);
  
  // Wait 1 second
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Send heartbeat
  await attemptService.recordHeartbeat(attempt._id);
  
  const updated = await Attempt.findById(attempt._id);
  const newTime = new Date(updated.integrity.lastActiveAt);
  logInfo(`After heartbeat: ${newTime.toLocaleString()}`);
  
  if (newTime > initialTime) {
    logSuccess(`✓ lastActiveAt updated (+${newTime - initialTime}ms)`);
  } else {
    throw new Error('lastActiveAt not updated');
  }
  
  // Verify status unchanged
  if (updated.status === ATTEMPT_STATUS.IN_PROGRESS) {
    logSuccess('✓ Status remains IN_PROGRESS');
  }
  
  // Send another heartbeat
  await new Promise(resolve => setTimeout(resolve, 500));
  await attemptService.recordHeartbeat(attempt._id);
  
  const updated2 = await Attempt.findById(attempt._id);
  const finalTime = new Date(updated2.integrity.lastActiveAt);
  
  if (finalTime > newTime) {
    logSuccess(`✓ Second heartbeat also updates (+${finalTime - newTime}ms)`);
  }
  
  log('');
}

async function test4_TimeoutAutoSubmitsAttempt() {
  log('════════════════════════════════════════════════════════', colors.bright);
  log('TEST 4: Timeout Auto-Submits Attempt', colors.bright);
  log('════════════════════════════════════════════════════════\n', colors.bright);
  
  // Create exam with 1-minute duration
  const exam = await examService.createExam({
    classId: testData.class._id,
    title: 'Timeout Test',
    createdBy: testData.teacher._id,
    durationMinutes: 1,
    maxAttempts: 5,
    startTime: new Date(Date.now() - 1000),
    endTime: new Date(Date.now() + 3600000)
  });
  
  await examService.publishExam(exam._id, testData.teacher._id);
  await examService.startExam(exam._id);
  
  const attempt = await attemptService.startAttempt({
    examId: exam._id,
    studentId: testData.student._id
  });
  
  logInfo(`Duration: ${exam.durationMinutes} minute(s)`);
  logInfo(`Started at: ${new Date(attempt.startedAt).toLocaleString()}`);
  
  // Manually set startedAt to 2 minutes ago (exceeds duration)
  attempt.startedAt = new Date(Date.now() - 2 * 60 * 1000);
  await attempt.save();
  
  logInfo(`Backdated to: ${new Date(attempt.startedAt).toLocaleString()} (2 minutes ago)`);
  
  const elapsed = (Date.now() - new Date(attempt.startedAt)) / 1000 / 60;
  logInfo(`Elapsed: ${elapsed.toFixed(2)} minutes (exceeds ${exam.durationMinutes} minute limit)`);
  
  // Trigger auto-submit via heartbeat
  await attemptService.recordHeartbeat(attempt._id);
  
  // Check result
  const submitted = await Attempt.findById(attempt._id);
  
  if (submitted.status === ATTEMPT_STATUS.SUBMITTED) {
    logSuccess(`✓ Status changed: IN_PROGRESS → SUBMITTED`);
  } else {
    throw new Error(`Expected SUBMITTED, got ${submitted.status}`);
  }
  
  if (submitted.integrity.autoSubmitted === true) {
    logSuccess('✓ autoSubmitted flag = true');
  } else {
    throw new Error('autoSubmitted flag not set');
  }
  
  if (submitted.submittedAt) {
    logSuccess(`✓ submittedAt timestamp: ${new Date(submitted.submittedAt).toLocaleString()}`);
  } else {
    throw new Error('submittedAt not set');
  }
  
  log('');
}

async function test5_CannotLogViolationsAfterSubmitted() {
  log('════════════════════════════════════════════════════════', colors.bright);
  log('TEST 5: Cannot Log Violations After SUBMITTED', colors.bright);
  log('════════════════════════════════════════════════════════\n', colors.bright);
  
  const exam = await examService.createExam({
    classId: testData.class._id,
    title: 'Submit Block Test',
    createdBy: testData.teacher._id,
    durationMinutes: 30,
    maxAttempts: 5,
    startTime: new Date(Date.now() - 1000),
    endTime: new Date(Date.now() + 3600000)
  });
  
  await examService.publishExam(exam._id, testData.teacher._id);
  await examService.startExam(exam._id);
  
  const attempt = await attemptService.startAttempt({
    examId: exam._id,
    studentId: testData.student._id
  });
  
  logInfo(`Initial status: ${attempt.status}`);
  
  // Submit attempt
  await attemptService.submitAttempt(attempt._id);
  
  const submitted = await Attempt.findById(attempt._id);
  logInfo(`After submit: ${submitted.status}`);
  
  // Try to log violation (should fail)
  try {
    await attemptService.recordIntegrityEvent(attempt._id, 'tab_switch');
    throw new Error('Should have rejected violation on SUBMITTED attempt');
  } catch (error) {
    if (error.message.includes('submitted') || error.message.includes('in_progress')) {
      logSuccess('✓ Violation blocked on SUBMITTED attempt');
      logInfo(`   Error: "${error.message}"`);
    } else {
      throw error;
    }
  }
  
  // Try to heartbeat (should fail)
  try {
    await attemptService.recordHeartbeat(attempt._id);
    throw new Error('Should have rejected heartbeat on SUBMITTED attempt');
  } catch (error) {
    if (error.message.includes('submitted') || error.message.includes('in_progress')) {
      logSuccess('✓ Heartbeat blocked on SUBMITTED attempt');
      logInfo(`   Error: "${error.message}"`);
    } else {
      throw error;
    }
  }
  
  log('');
}

async function test6_ViolationsArrayRecordsTimeline() {
  log('════════════════════════════════════════════════════════', colors.bright);
  log('TEST 6: Violations Array Records Timeline', colors.bright);
  log('════════════════════════════════════════════════════════\n', colors.bright);
  
  const exam = await examService.createExam({
    classId: testData.class._id,
    title: 'Timeline Test',
    createdBy: testData.teacher._id,
    durationMinutes: 30,
    maxAttempts: 5,
    startTime: new Date(Date.now() - 1000),
    endTime: new Date(Date.now() + 3600000)
  });
  
  await examService.publishExam(exam._id, testData.teacher._id);
  await examService.startExam(exam._id);
  
  const attempt = await attemptService.startAttempt({
    examId: exam._id,
    studentId: testData.student._id
  });
  
  logInfo('Recording violations with time gaps...');
  
  // Log violations with delays
  await attemptService.recordIntegrityEvent(attempt._id, 'tab_switch');
  logInfo('  1. tab_switch');
  
  await new Promise(resolve => setTimeout(resolve, 200));
  await attemptService.recordIntegrityEvent(attempt._id, 'focus_lost');
  logInfo('  2. focus_lost (+200ms)');
  
  await new Promise(resolve => setTimeout(resolve, 200));
  await attemptService.recordIntegrityEvent(attempt._id, 'copy');
  logInfo('  3. copy (+200ms)');
  
  await new Promise(resolve => setTimeout(resolve, 200));
  await attemptService.recordIntegrityEvent(attempt._id, 'paste');
  logInfo('  4. paste (+200ms)');
  
  await new Promise(resolve => setTimeout(resolve, 200));
  await attemptService.recordIntegrityEvent(attempt._id, 'fullscreen_exit');
  logInfo('  5. fullscreen_exit (+200ms)');
  
  // Verify violations array
  const final = await Attempt.findById(attempt._id);
  
  if (final.integrity.violations.length === 5) {
    logSuccess(`✓ All 5 violations recorded in array`);
  } else {
    throw new Error(`Expected 5 violations, got ${final.integrity.violations.length}`);
  }
  
  // Verify all have timestamps
  let allHaveTimestamps = true;
  for (const v of final.integrity.violations) {
    if (!v.timestamp) {
      allHaveTimestamps = false;
      break;
    }
  }
  
  if (allHaveTimestamps) {
    logSuccess('✓ All violations have timestamps');
  } else {
    throw new Error('Some violations missing timestamps');
  }
  
  // Verify chronological order
  let inOrder = true;
  for (let i = 1; i < final.integrity.violations.length; i++) {
    const prev = new Date(final.integrity.violations[i - 1].timestamp);
    const curr = new Date(final.integrity.violations[i].timestamp);
    if (curr < prev) {
      inOrder = false;
      break;
    }
  }
  
  if (inOrder) {
    logSuccess('✓ Violations in chronological order');
  } else {
    throw new Error('Violations not in chronological order');
  }
  
  // Display timeline
  log('');
  logInfo('Complete Timeline:', colors.cyan);
  final.integrity.violations.forEach((v, idx) => {
    const time = new Date(v.timestamp);
    logInfo(`  ${idx + 1}. ${v.type.padEnd(20)} at ${time.toLocaleTimeString()}.${time.getMilliseconds()}`, colors.gray);
  });
  
  // Verify type correctness
  const expectedTypes = ['tab_switch', 'focus_lost', 'copy', 'paste', 'fullscreen_exit'];
  const actualTypes = final.integrity.violations.map(v => v.type);
  
  if (JSON.stringify(actualTypes) === JSON.stringify(expectedTypes)) {
    logSuccess('✓ All violation types recorded correctly');
  } else {
    throw new Error(`Type mismatch: expected ${expectedTypes}, got ${actualTypes}`);
  }
  
  log('');
}

async function cleanup() {
  log('🧹 Cleaning up test data...', colors.gray);
  
  try {
    await User.deleteMany({ email: { $regex: /verify.*@test\.com$/ } });
    await Class.deleteMany({ code: 'VERIFYINT' });
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
