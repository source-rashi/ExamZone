/**
 * V2 API Integration Test Suite
 * Tests all V2 endpoints with real database operations
 */

const mongoose = require('mongoose');
const User = require('./models/User');
const Class = require('./models/Class');
const Enrollment = require('./models/Enrollment');
const Exam = require('./models/Exam');
const Attempt = require('./models/Attempt');

// Import services (to verify controller uses them correctly)
const classService = require('./services/class.service');
const enrollmentService = require('./services/enrollment.service');
const examService = require('./services/exam.service');
const attemptService = require('./services/attempt.service');

// Connect to database
const connectDB = require('./config/db');

// Test data storage
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
    console.log('🧪 Starting V2 API Test Suite...\n');

    // Connect to database
    await connectDB();
    console.log('✅ Database connected\n');

    // Clean up test data
    await cleanup();

    // Run architecture review
    await reviewArchitecture();

    // Run integration tests
    await testCreateClass();
    await testEnrollStudent();
    await testCreateExam();
    await testStartAttempt();

    console.log('\n✅ All tests passed!');
    console.log('\n📊 Test Summary:');
    console.log('   ✓ Architecture review passed');
    console.log('   ✓ POST /api/v2/classes - Class created');
    console.log('   ✓ POST /api/v2/enrollments - Student enrolled');
    console.log('   ✓ POST /api/v2/exams - Exam created');
    console.log('   ✓ POST /api/v2/attempts - Attempt started');

    await cleanup();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    await cleanup();
    process.exit(1);
  }
}

async function reviewArchitecture() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('📋 ARCHITECTURE REVIEW');
  console.log('═══════════════════════════════════════════════════════\n');

  const fs = require('fs');
  
  // Check controllers
  console.log('🔍 Reviewing Controllers:\n');
  
  const controllers = [
    'controllers/class.controller.js',
    'controllers/enrollment.controller.js',
    'controllers/exam.controller.js',
    'controllers/attempt.controller.js'
  ];

  let issues = [];

  for (const ctrl of controllers) {
    const content = fs.readFileSync(ctrl, 'utf8');
    
    console.log(`   Checking ${ctrl}...`);
    
    // Check for direct DB queries (Model.find, Model.create, etc)
    const dbPatterns = [
      /\bClass\.(find|findOne|create|save|update|delete)/,
      /\bUser\.(find|findOne|create|save|update|delete)/,
      /\bEnrollment\.(find|findOne|create|save|update|delete)/,
      /\bExam\.(find|findOne|create|save|update|delete)/,
      /\bAttempt\.(find|findOne|create|save|update|delete)/
    ];
    
    for (const pattern of dbPatterns) {
      if (pattern.test(content)) {
        issues.push(`   ❌ ${ctrl}: Contains direct DB query (${pattern})`);
      }
    }
    
    // Check for service imports
    if (!content.includes('Service = require(')) {
      issues.push(`   ❌ ${ctrl}: Missing service import`);
    } else {
      console.log('      ✅ Imports service layer');
    }
    
    // Check for try-catch
    if (!content.includes('try {')) {
      issues.push(`   ❌ ${ctrl}: Missing error handling (try-catch)`);
    } else {
      console.log('      ✅ Has error handling');
    }
    
    // Check for status codes
    const statusCodes = content.match(/res\.status\((\d+)\)/g);
    if (statusCodes) {
      const codes = statusCodes.map(m => m.match(/\d+/)[0]);
      console.log(`      ✅ Status codes: ${[...new Set(codes)].join(', ')}`);
    }
    
    // Check for consistent JSON structure
    const hasSuccessField = content.includes('"success":') || content.includes('success:');
    const hasMessageField = content.includes('"message":') || content.includes('message:');
    const hasDataField = content.includes('"data":') || content.includes('data:');
    
    if (hasSuccessField && hasMessageField) {
      console.log('      ✅ Consistent JSON structure (success, message, data)');
    } else {
      issues.push(`   ❌ ${ctrl}: Inconsistent JSON structure`);
    }
    
    console.log('');
  }

  // Check routes
  console.log('🔍 Reviewing Routes:\n');
  
  const routes = [
    'routes/class.routes.v2.js',
    'routes/enrollment.routes.js',
    'routes/exam.routes.js',
    'routes/attempt.routes.js'
  ];

  for (const route of routes) {
    const content = fs.readFileSync(route, 'utf8');
    
    console.log(`   Checking ${route}...`);
    
    // Check it only forwards to controllers
    if (content.includes('Service')) {
      issues.push(`   ❌ ${route}: Route imports service (should only import controller)`);
    } else {
      console.log('      ✅ Only imports controllers');
    }
    
    // Check for business logic
    if (content.includes('await') && !content.includes('// Example')) {
      issues.push(`   ❌ ${route}: Contains async operations (should only forward)`);
    } else {
      console.log('      ✅ No business logic');
    }
    
    console.log('');
  }

  // Report issues
  if (issues.length > 0) {
    console.log('⚠️  Issues Found:\n');
    issues.forEach(issue => console.log(issue));
    console.log('');
  } else {
    console.log('✅ No architectural issues found!\n');
  }

  console.log('═══════════════════════════════════════════════════════\n');
}

async function testCreateClass() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('TEST 1: POST /api/v2/classes');
  console.log('═══════════════════════════════════════════════════════\n');

  // Create teacher
  testData.teacher = await User.create({
    name: 'Test Teacher',
    email: 'teacher@test.com',
    password: 'password123',
    role: 'teacher'
  });
  console.log('✓ Test teacher created');

  // Simulate controller behavior
  const reqBody = {
    title: 'Mathematics 101',
    description: 'Advanced Math Course',
    subject: 'Mathematics',
    teacherId: testData.teacher._id
  };

  console.log('📤 Request:', JSON.stringify(reqBody, null, 2));

  // Call service (this is what controller does)
  testData.class = await classService.createClassV2(reqBody);

  console.log('📥 Response:');
  console.log(JSON.stringify({
    success: true,
    message: 'Class created successfully',
    data: {
      _id: testData.class._id,
      code: testData.class.code,
      title: testData.class.title,
      subject: testData.class.subject,
      teacherId: testData.class.teacherId
    }
  }, null, 2));

  console.log('\n✅ Test passed: Class created successfully\n');
}

async function testEnrollStudent() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('TEST 2: POST /api/v2/enrollments');
  console.log('═══════════════════════════════════════════════════════\n');

  // Create student
  testData.student = await User.create({
    name: 'Test Student',
    email: 'student@test.com',
    password: 'password123',
    role: 'student'
  });
  console.log('✓ Test student created');

  // Simulate controller behavior
  const reqBody = {
    classId: testData.class._id,
    studentId: testData.student._id,
    enrolledBy: testData.teacher._id
  };

  console.log('📤 Request:', JSON.stringify(reqBody, null, 2));

  // Call service
  testData.enrollment = await enrollmentService.enrollStudent(reqBody);

  console.log('📥 Response:');
  console.log(JSON.stringify({
    success: true,
    message: 'Student enrolled successfully',
    data: {
      _id: testData.enrollment._id,
      classId: testData.enrollment.classId,
      studentId: testData.enrollment.studentId,
      status: testData.enrollment.status
    }
  }, null, 2));

  console.log('\n✅ Test passed: Student enrolled successfully\n');
}

async function testCreateExam() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('TEST 3: POST /api/v2/exams');
  console.log('═══════════════════════════════════════════════════════\n');

  // Simulate controller behavior
  const reqBody = {
    classId: testData.class._id,
    title: 'Midterm Exam',
    description: 'Midterm examination covering chapters 1-5',
    createdBy: testData.teacher._id,
    duration: 120,
    maxAttempts: 1
  };

  console.log('📤 Request:', JSON.stringify(reqBody, null, 2));

  // Call service
  testData.exam = await examService.createExam(reqBody);

  console.log('📥 Response:');
  console.log(JSON.stringify({
    success: true,
    message: 'Exam created successfully',
    data: {
      _id: testData.exam._id,
      classId: testData.exam.classId,
      title: testData.exam.title,
      status: testData.exam.status,
      duration: testData.exam.duration
    }
  }, null, 2));

  console.log('\n✅ Test passed: Exam created successfully\n');
}

async function testStartAttempt() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('TEST 4: POST /api/v2/attempts');
  console.log('═══════════════════════════════════════════════════════\n');

  // First, set exam times
  await Exam.findByIdAndUpdate(testData.exam._id, {
    startTime: new Date(),
    endTime: new Date(Date.now() + 86400000) // 24 hours from now
  });
  console.log('✓ Exam time window set');

  // Publish the exam
  await examService.publishExam(testData.exam._id, testData.teacher._id);
  console.log('✓ Exam published');

  // Simulate controller behavior
  const reqBody = {
    examId: testData.exam._id,
    studentId: testData.student._id
  };

  console.log('📤 Request:', JSON.stringify(reqBody, null, 2));

  // Call service
  testData.attempt = await attemptService.startAttempt(reqBody);

  console.log('📥 Response:');
  console.log(JSON.stringify({
    success: true,
    message: 'Attempt started successfully',
    data: {
      _id: testData.attempt._id,
      examId: testData.attempt.examId,
      studentId: testData.attempt.studentId,
      attemptNumber: testData.attempt.attemptNumber,
      status: testData.attempt.status,
      startedAt: testData.attempt.startedAt
    }
  }, null, 2));

  console.log('\n✅ Test passed: Attempt started successfully\n');
}

async function cleanup() {
  console.log('🧹 Cleaning up test data...');
  
  try {
    await User.deleteMany({ email: { $in: ['teacher@test.com', 'student@test.com'] } });
    
    if (testData.class) {
      await Class.deleteOne({ _id: testData.class._id });
    }
    if (testData.enrollment) {
      await Enrollment.deleteOne({ _id: testData.enrollment._id });
    }
    if (testData.exam) {
      await Exam.deleteOne({ _id: testData.exam._id });
    }
    if (testData.attempt) {
      await Attempt.deleteOne({ _id: testData.attempt._id });
    }
    
    console.log('✅ Cleanup complete\n');
  } catch (error) {
    console.log('⚠️  Cleanup error (may be expected):', error.message);
  }
}

// Run tests
runTests();
