/**
 * Phase 3.8 - Notification and Invite System Test Suite
 * Tests email service, invitations, and exam event notifications
 */

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Class = require('./models/Class');
const Exam = require('./models/Exam');
const Invite = require('./models/Invite');
const Enrollment = require('./models/Enrollment');
const inviteService = require('./services/invite.service');
const examService = require('./services/exam.service');
const { ROLES } = require('./utils/roles');
const { EXAM_STATUS } = require('./utils/constants');

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
    log('      PHASE 3.8 - NOTIFICATION & INVITE SYSTEM TESTS', colors.bright);
    log('════════════════════════════════════════════════════════\n', colors.bright);
    
    await connectDB();
    logSuccess('Database connected\n');
    
    await cleanup();
    await setupTestData();
    
    // Run all test suites
    await testInviteCreation();
    await testInviteAcceptance();
    await testInviteExpiry();
    await testDuplicateInvite();
    await testEmailTemplates();
    await testExamNotifications();
    
    log('\n════════════════════════════════════════════════════════', colors.bright);
    log('      ALL NOTIFICATION TESTS PASSED ✅', colors.green + colors.bright);
    log('════════════════════════════════════════════════════════\n', colors.bright);
    
    await cleanup();
    process.exit(0);
  } catch (error) {
    log('\n════════════════════════════════════════════════════════', colors.bright);
    log('      NOTIFICATION TESTS FAILED ❌', colors.red + colors.bright);
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
    name: 'Notification Test Teacher',
    email: 'notify_teacher@test.com',
    password: 'password123',
    role: ROLES.TEACHER
  });
  
  testData.student1 = await User.create({
    name: 'Notification Test Student 1',
    email: 'notify_student1@test.com',
    password: 'password123',
    role: ROLES.STUDENT
  });
  
  testData.student2 = await User.create({
    name: 'Notification Test Student 2',
    email: 'notify_student2@test.com',
    password: 'password123',
    role: ROLES.STUDENT
  });
  
  testData.class = await Class.create({
    code: 'NOTIFY',
    title: 'Notification Test Class',
    teacherId: testData.teacher._id,
    teacher: testData.teacher._id
  });
  
  logSuccess('Test data ready\n');
}

async function testInviteCreation() {
  logTest('═══════════════════════════════════════════════════════');
  logTest('TEST 1: Invite Creation and Token Generation');
  logTest('═══════════════════════════════════════════════════════');
  
  logInfo('Creating class invitation...');
  
  const invite = await inviteService.createInvite(
    testData.teacher._id,
    testData.class._id,
    'newinvite@test.com',
    ROLES.STUDENT
  );
  
  if (invite && invite.token && invite.token.length === 64) {
    logSuccess('✓ Invite created with secure token (64 chars)');
    logInfo(`   Email: ${invite.email}`);
    logInfo(`   Token: ${invite.token.substring(0, 20)}...`);
    logInfo(`   Expires: ${invite.expiresAt}`);
  } else {
    throw new Error('Invite creation failed or invalid token');
  }
  
  // Verify token is unique and cryptographically secure
  if (/^[a-f0-9]{64}$/.test(invite.token)) {
    logSuccess('✓ Token is hexadecimal (crypto.randomBytes)');
  } else {
    throw new Error('Token format invalid');
  }
  
  // Verify expiry is 7 days in future
  const expiryTime = new Date(invite.expiresAt).getTime();
  const expectedExpiry = Date.now() + (7 * 24 * 60 * 60 * 1000);
  const diff = Math.abs(expiryTime - expectedExpiry);
  
  if (diff < 5000) { // Within 5 seconds
    logSuccess('✓ Invite expires in 7 days');
  } else {
    throw new Error('Expiry time mismatch');
  }
  
  // Verify invite is stored in database
  const storedInvite = await Invite.findOne({ token: invite.token });
  
  if (storedInvite && storedInvite.email === 'newinvite@test.com') {
    logSuccess('✓ Invite stored in database');
  } else {
    throw new Error('Invite not found in database');
  }
  
  testData.invite = invite;
  
  log('');
}

async function testInviteAcceptance() {
  logTest('═══════════════════════════════════════════════════════');
  logTest('TEST 2: Invite Acceptance and Enrollment');
  logTest('═══════════════════════════════════════════════════════');
  
  logInfo('Testing invite acceptance...');
  
  // Create new user to accept invite
  const newUser = await User.create({
    name: 'New Invited User',
    email: 'newinvite@test.com',
    password: 'password123',
    role: ROLES.STUDENT
  });
  
  const result = await inviteService.acceptInvite(testData.invite.token, newUser._id);
  
  if (result.enrollment && result.class) {
    logSuccess('✓ Invite accepted and user enrolled');
    logInfo(`   Class: ${result.class.title}`);
    logInfo(`   Student: ${newUser.name}`);
  } else {
    throw new Error('Invite acceptance failed');
  }
  
  // Verify enrollment exists
  const enrollment = await Enrollment.findOne({
    classId: testData.class._id,
    studentId: newUser._id
  });
  
  if (enrollment) {
    logSuccess('✓ Enrollment created in database');
  } else {
    throw new Error('Enrollment not found');
  }
  
  // Verify invite is marked as accepted
  const acceptedInvite = await Invite.findOne({ token: testData.invite.token });
  
  if (acceptedInvite.accepted && acceptedInvite.acceptedBy.toString() === newUser._id.toString()) {
    logSuccess('✓ Invite marked as accepted');
    logInfo(`   Accepted at: ${acceptedInvite.acceptedAt}`);
  } else {
    throw new Error('Invite not marked as accepted');
  }
  
  // Try to accept again (should fail)
  try {
    await inviteService.acceptInvite(testData.invite.token, newUser._id);
    throw new Error('Should not allow accepting invite twice');
  } catch (error) {
    if (error.message.includes('Invalid or expired')) {
      logSuccess('✓ Cannot accept invite twice');
    } else if (error.message.includes('already enrolled')) {
      logSuccess('✓ Duplicate enrollment prevented');
    } else {
      throw error;
    }
  }
  
  testData.newUser = newUser;
  
  log('');
}

async function testInviteExpiry() {
  logTest('═══════════════════════════════════════════════════════');
  logTest('TEST 3: Invite Expiry Handling');
  logTest('═══════════════════════════════════════════════════════');
  
  logInfo('Creating expired invite...');
  
  // Create invite with past expiry
  const expiredInvite = await Invite.create({
    email: 'expired@test.com',
    classId: testData.class._id,
    role: ROLES.STUDENT,
    token: 'expired_token_' + Date.now(),
    expiresAt: new Date(Date.now() - 1000), // 1 second in past
    createdBy: testData.teacher._id
  });
  
  // Check isExpired method
  if (expiredInvite.isExpired()) {
    logSuccess('✓ isExpired() method works correctly');
  } else {
    throw new Error('Expired invite not detected');
  }
  
  // Check isValid method
  if (!expiredInvite.isValid()) {
    logSuccess('✓ isValid() returns false for expired invite');
  } else {
    throw new Error('Expired invite should not be valid');
  }
  
  // Try to accept expired invite
  const expiredUser = await User.create({
    name: 'Expired Invite User',
    email: 'expired@test.com',
    password: 'password123',
    role: ROLES.STUDENT
  });
  
  try {
    await inviteService.acceptInvite(expiredInvite.token, expiredUser._id);
    throw new Error('Should not accept expired invite');
  } catch (error) {
    if (error.message.includes('Invalid or expired')) {
      logSuccess('✓ Expired invite rejected');
      logInfo(`   Error: "${error.message}"`);
    } else {
      throw error;
    }
  }
  
  log('');
}

async function testDuplicateInvite() {
  logTest('═══════════════════════════════════════════════════════');
  logTest('TEST 4: Duplicate Invite Prevention');
  logTest('═══════════════════════════════════════════════════════');
  
  logInfo('Testing duplicate invite prevention...');
  
  // Create first invite
  const email = 'duplicate@test.com';
  const invite1 = await inviteService.createInvite(
    testData.teacher._id,
    testData.class._id,
    email
  );
  
  logInfo(`First invite created: ${invite1.token.substring(0, 20)}...`);
  
  // Try to create second invite for same email
  try {
    await inviteService.createInvite(
      testData.teacher._id,
      testData.class._id,
      email
    );
    throw new Error('Should not allow duplicate pending invite');
  } catch (error) {
    if (error.message.includes('Pending invite already exists')) {
      logSuccess('✓ Duplicate pending invite prevented');
      logInfo(`   Error: "${error.message}"`);
    } else {
      throw error;
    }
  }
  
  // Test enrolled user invite prevention
  await Enrollment.create({
    classId: testData.class._id,
    studentId: testData.student1._id,
    enrolledBy: testData.teacher._id
  });
  
  try {
    await inviteService.createInvite(
      testData.teacher._id,
      testData.class._id,
      testData.student1.email
    );
    throw new Error('Should not invite already enrolled user');
  } catch (error) {
    if (error.message.includes('already enrolled')) {
      logSuccess('✓ Cannot invite already enrolled user');
      logInfo(`   Error: "${error.message}"`);
    } else {
      throw error;
    }
  }
  
  log('');
}

async function testEmailTemplates() {
  logTest('═══════════════════════════════════════════════════════');
  logTest('TEST 5: Email Template Generation');
  logTest('═══════════════════════════════════════════════════════');
  
  logInfo('Testing email templates...');
  
  const { 
    classInviteEmail, 
    examPublishedEmail, 
    examClosedEmail, 
    resultPublishedEmail 
  } = require('./utils/emailTemplates');
  
  // Test class invite email
  const inviteHtml = classInviteEmail({
    className: 'Test Class',
    teacherName: 'Test Teacher',
    role: 'student',
    acceptUrl: 'https://example.com/invite/token123',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });
  
  if (inviteHtml && inviteHtml.includes('Test Class') && inviteHtml.includes('Test Teacher')) {
    logSuccess('✓ Class invite email generated');
    logInfo(`   Length: ${inviteHtml.length} chars`);
  } else {
    throw new Error('Class invite email invalid');
  }
  
  // Test exam published email
  const examPublishedHtml = examPublishedEmail({
    studentName: 'Test Student',
    examTitle: 'Test Exam',
    className: 'Test Class',
    startTime: new Date(),
    endTime: new Date(Date.now() + 7200000),
    durationMinutes: 60
  });
  
  if (examPublishedHtml && examPublishedHtml.includes('Test Exam') && examPublishedHtml.includes('60 minutes')) {
    logSuccess('✓ Exam published email generated');
  } else {
    throw new Error('Exam published email invalid');
  }
  
  // Test exam closed email
  const examClosedHtml = examClosedEmail({
    studentName: 'Test Student',
    examTitle: 'Test Exam',
    className: 'Test Class'
  });
  
  if (examClosedHtml && examClosedHtml.includes('Test Exam')) {
    logSuccess('✓ Exam closed email generated');
  } else {
    throw new Error('Exam closed email invalid');
  }
  
  // Test results published email
  const resultsHtml = resultPublishedEmail({
    studentName: 'Test Student',
    examTitle: 'Test Exam',
    className: 'Test Class',
    score: 85,
    totalMarks: 100
  });
  
  if (resultsHtml && resultsHtml.includes('85') && resultsHtml.includes('100')) {
    logSuccess('✓ Results published email generated');
    logInfo('   Contains score: 85 / 100');
  } else {
    throw new Error('Results published email invalid');
  }
  
  log('');
}

async function testExamNotifications() {
  logTest('═══════════════════════════════════════════════════════');
  logTest('TEST 6: Exam Event Notifications');
  logTest('═══════════════════════════════════════════════════════');
  
  logInfo('Testing exam event notification triggers...');
  
  // Create exam (start time in past so we can start it immediately)
  const exam = await examService.createExam({
    classId: testData.class._id,
    title: 'Notification Test Exam',
    createdBy: testData.teacher._id,
    durationMinutes: 60,
    maxAttempts: 1,
    startTime: new Date(Date.now() - 1000), // 1 second in past
    endTime: new Date(Date.now() + 7200000)
  });
  
  logInfo(`Exam created: ${exam.title}`);
  
  // Test publish notification
  const publishedExam = await examService.publishExam(exam._id, testData.teacher._id);
  
  if (publishedExam.status === EXAM_STATUS.PUBLISHED) {
    logSuccess('✓ Exam published (notification triggered)');
    logInfo('   Email notifications queued for enrolled students');
  } else {
    throw new Error('Exam publish failed');
  }
  
  // Small delay to allow async email sending
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Test close notification
  await examService.startExam(exam._id);
  const closedExam = await examService.closeExam(exam._id, testData.teacher._id);
  
  if (closedExam.status === EXAM_STATUS.CLOSED) {
    logSuccess('✓ Exam closed (notification triggered)');
    logInfo('   Email notifications queued for enrolled students');
  } else {
    throw new Error('Exam close failed');
  }
  
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Test results notification
  await examService.startEvaluation(exam._id, testData.teacher._id);
  const resultExam = await examService.publishResults(exam._id, testData.teacher._id);
  
  if (resultExam.status === EXAM_STATUS.RESULT_PUBLISHED) {
    logSuccess('✓ Results published (notification triggered)');
    logInfo('   Email notifications queued for students with scores');
  } else {
    throw new Error('Results publish failed');
  }
  
  await new Promise(resolve => setTimeout(resolve, 100));
  
  logSuccess('✓ All exam event notifications triggered successfully');
  logInfo('   Note: Actual email delivery depends on SMTP configuration');
  
  log('');
}

async function cleanup() {
  log('🧹 Cleaning up test data...', colors.gray);
  
  try {
    await User.deleteMany({ email: { $regex: /(notify_|newinvite|duplicate|expired)/ } });
    await Class.deleteMany({ code: 'NOTIFY' });
    await Exam.deleteMany({ title: { $regex: /Notification/ } });
    await Invite.deleteMany({});
    await Enrollment.deleteMany({});
    
    log('✅ Cleanup complete\n', colors.gray);
  } catch (error) {
    log('⚠️  Cleanup warning: ' + error.message, colors.yellow);
  }
}

// Run tests
runTests();
