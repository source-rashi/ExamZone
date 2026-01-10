/**
 * Phase 3.7 - Authentication Integration Tests
 * Tests real authentication scenarios with controllers and routes
 */

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Class = require('./models/Class');
const Exam = require('./models/Exam');
const authService = require('./services/auth.service');
const authController = require('./controllers/auth.controller');
const examController = require('./controllers/exam.controller');
const attemptController = require('./controllers/attempt.controller');
const { authenticate } = require('./middleware/auth.middleware');
const { teacherOnly, studentOnly } = require('./middleware/role.middleware');
const { signToken } = require('./utils/jwt');
const { ROLES } = require('./utils/roles');

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
    log('      PHASE 3.7 - AUTH INTEGRATION TESTS', colors.bright);
    log('════════════════════════════════════════════════════════\n', colors.bright);
    
    await connectDB();
    logSuccess('Database connected\n');
    
    await cleanup();
    await setupTestData();
    
    // Run all test suites
    await testGoogleLoginReturnsJWT();
    await testSameEmailSameUser();
    await testAuthMeEndpoint();
    await testProtectedRouteBlocked();
    await testStudentCannotCreateExam();
    await testTeacherCannotStartAttempt();
    await testJWTExpiry();
    
    log('\n════════════════════════════════════════════════════════', colors.bright);
    log('      ALL AUTH INTEGRATION TESTS PASSED ✅', colors.green + colors.bright);
    log('════════════════════════════════════════════════════════\n', colors.bright);
    
    await cleanup();
    process.exit(0);
  } catch (error) {
    log('\n════════════════════════════════════════════════════════', colors.bright);
    log('      AUTH INTEGRATION TESTS FAILED ❌', colors.red + colors.bright);
    log('════════════════════════════════════════════════════════', colors.bright);
    logError(`Error: ${error.message}`);
    console.error(error);
    await cleanup();
    process.exit(1);
  }
}

async function setupTestData() {
  log('📋 Setting up test data...', colors.bright);
  
  // Create teacher and student directly (bypass Google OAuth for testing)
  testData.teacher = await User.create({
    name: 'Integration Test Teacher',
    email: 'integration_teacher@test.com',
    password: 'password123',
    role: ROLES.TEACHER,
    authProvider: 'local'
  });
  
  testData.student = await User.create({
    name: 'Integration Test Student',
    email: 'integration_student@test.com',
    password: 'password123',
    role: ROLES.STUDENT,
    authProvider: 'local'
  });
  
  // Create a class for exam creation tests
  testData.class = await Class.create({
    code: 'AUTHTEST',
    title: 'Auth Test Class',
    teacherId: testData.teacher._id,
    teacher: testData.teacher._id
  });
  
  logSuccess('Test data ready\n');
}

async function testGoogleLoginReturnsJWT() {
  logTest('═══════════════════════════════════════════════════════');
  logTest('TEST 1: Login with Google Token Returns JWT');
  logTest('═══════════════════════════════════════════════════════');
  
  logInfo('Simulating Google OAuth login flow...');
  
  // Simulate Google profile
  const googleProfile = {
    email: 'googleuser@gmail.com',
    name: 'Google Test User',
    picture: 'https://example.com/photo.jpg',
    emailVerified: true
  };
  
  // Use auth service directly (simulates controller behavior)
  const result = await authService.findOrCreateUser(googleProfile);
  const token = authService.issueJwt(result);
  
  if (token && typeof token === 'string' && token.split('.').length === 3) {
    logSuccess('✓ Google login returned valid JWT');
    logInfo(`   User: ${result.name}`);
    logInfo(`   Email: ${result.email}`);
    logInfo(`   Role: ${result.role}`);
    logInfo(`   Token: ${token.substring(0, 30)}...`);
  } else {
    throw new Error('Failed to receive JWT from Google login');
  }
  
  // Verify token contains correct data
  const jwt = require('jsonwebtoken');
  const decoded = jwt.decode(token);
  
  if (decoded.email === googleProfile.email && 
      decoded.id === result._id.toString() &&
      decoded.role === result.role) {
    logSuccess('✓ JWT contains correct user data');
  } else {
    throw new Error('JWT payload mismatch');
  }
  
  testData.googleUser = result;
  testData.googleToken = token;
  
  log('');
}

async function testSameEmailSameUser() {
  logTest('═══════════════════════════════════════════════════════');
  logTest('TEST 2: Same Email Logs into Same User');
  logTest('═══════════════════════════════════════════════════════');
  
  logInfo('Testing duplicate login prevention...');
  
  const userCountBefore = await User.countDocuments({ email: 'googleuser@gmail.com' });
  logInfo(`   Users before second login: ${userCountBefore}`);
  
  // Try to login again with same email
  const googleProfile = {
    email: 'googleuser@gmail.com',
    name: 'Google Test User Updated',
    picture: 'https://example.com/newphoto.jpg',
    emailVerified: true
  };
  
  const result = await authService.findOrCreateUser(googleProfile);
  const userCountAfter = await User.countDocuments({ email: 'googleuser@gmail.com' });
  
  logInfo(`   Users after second login: ${userCountAfter}`);
  
  if (userCountBefore === userCountAfter && 
      result._id.toString() === testData.googleUser._id.toString()) {
    logSuccess('✓ Same email logged into same user (no duplicate)');
    logInfo(`   User ID: ${result._id}`);
    logInfo(`   Email: ${result.email}`);
  } else {
    throw new Error('Duplicate user created for same email');
  }
  
  // Verify picture was updated
  const updatedUser = await User.findById(result._id);
  if (updatedUser.picture === googleProfile.picture) {
    logSuccess('✓ User picture updated on subsequent login');
    logInfo(`   New picture: ${updatedUser.picture}`);
  }
  
  log('');
}

async function testAuthMeEndpoint() {
  logTest('═══════════════════════════════════════════════════════');
  logTest('TEST 3: /auth/me Returns Correct Profile');
  logTest('═══════════════════════════════════════════════════════');
  
  logInfo('Testing GET /auth/me with valid token...');
  
  // Create token for teacher
  const token = signToken(testData.teacher);
  
  // Simulate request/response
  const req = {
    user: {
      id: testData.teacher._id.toString(),
      email: testData.teacher.email,
      role: testData.teacher.role,
      name: testData.teacher.name
    },
    headers: {
      authorization: `Bearer ${token}`
    }
  };
  
  const res = {
    statusCode: null,
    body: null,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.body = data;
      return this;
    }
  };
  
  await authController.getCurrentUser(req, res);
  
  if (res.statusCode === 200 && 
      res.body.success === true &&
      res.body.data.email === testData.teacher.email &&
      res.body.data.role === testData.teacher.role) {
    logSuccess('✓ /auth/me returned correct profile');
    logInfo(`   Name: ${res.body.data.name}`);
    logInfo(`   Email: ${res.body.data.email}`);
    logInfo(`   Role: ${res.body.data.role}`);
    logInfo(`   Provider: ${res.body.data.authProvider}`);
  } else {
    throw new Error('/auth/me endpoint failed');
  }
  
  // Test with invalid token
  logInfo('Testing /auth/me with missing user...');
  
  const reqInvalid = {
    user: {
      id: new mongoose.Types.ObjectId().toString(),
      email: 'nonexistent@test.com',
      role: 'student',
      name: 'Ghost User'
    }
  };
  
  const resInvalid = {
    statusCode: null,
    body: null,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.body = data;
      return this;
    }
  };
  
  await authController.getCurrentUser(reqInvalid, resInvalid);
  
  if (resInvalid.statusCode === 404 && resInvalid.body.success === false) {
    logSuccess('✓ /auth/me rejected non-existent user with 404');
    logInfo(`   Error: "${resInvalid.body.error}"`);
  } else {
    throw new Error('Should reject non-existent user');
  }
  
  log('');
}

async function testProtectedRouteBlocked() {
  logTest('═══════════════════════════════════════════════════════');
  logTest('TEST 4: Protected Route Blocked Without Token');
  logTest('═══════════════════════════════════════════════════════');
  
  logInfo('Testing route access without token...');
  
  // Simulate request without token
  const req = {
    headers: {}
  };
  
  const res = {
    statusCode: null,
    body: null,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.body = data;
      return this;
    }
  };
  
  let nextCalled = false;
  const next = () => { nextCalled = true; };
  
  await authenticate(req, res, next);
  
  if (res.statusCode === 401 && 
      res.body.success === false &&
      res.body.error.includes('No token provided')) {
    logSuccess('✓ Request without token blocked with 401');
    logInfo(`   Error: "${res.body.error}"`);
  } else {
    throw new Error('Should block request without token');
  }
  
  if (!nextCalled) {
    logSuccess('✓ Middleware did not call next() (request blocked)');
  } else {
    throw new Error('Middleware should not call next() for unauthenticated request');
  }
  
  // Test with invalid token
  logInfo('Testing route access with invalid token...');
  
  const reqBadToken = {
    headers: {
      authorization: 'Bearer invalid.token.here'
    }
  };
  
  const resBadToken = {
    statusCode: null,
    body: null,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.body = data;
      return this;
    }
  };
  
  await authenticate(reqBadToken, resBadToken, () => {});
  
  if (resBadToken.statusCode === 401) {
    logSuccess('✓ Request with invalid token blocked with 401');
    logInfo(`   Error: "${resBadToken.body.error}"`);
  } else {
    throw new Error('Should block request with invalid token');
  }
  
  log('');
}

async function testStudentCannotCreateExam() {
  logTest('═══════════════════════════════════════════════════════');
  logTest('TEST 5: Student Cannot Create Exam');
  logTest('═══════════════════════════════════════════════════════');
  
  logInfo('Testing student blocked from teacher-only route...');
  
  // Student tries to create exam
  const req = {
    user: {
      id: testData.student._id.toString(),
      email: testData.student.email,
      role: ROLES.STUDENT,
      name: testData.student.name
    },
    body: {
      classId: testData.class._id,
      title: 'Unauthorized Exam',
      durationMinutes: 60,
      maxAttempts: 1,
      startTime: new Date(),
      endTime: new Date(Date.now() + 7200000)
    }
  };
  
  const res = {
    statusCode: null,
    body: null,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.body = data;
      return this;
    }
  };
  
  let nextCalled = false;
  const next = () => { nextCalled = true; };
  
  // Test role middleware
  await teacherOnly(req, res, next);
  
  if (res.statusCode === 403 && 
      res.body.success === false &&
      res.body.error.includes('Access denied')) {
    logSuccess('✓ Student blocked from creating exam with 403');
    logInfo(`   Error: "${res.body.error}"`);
  } else {
    throw new Error('Student should be blocked from teacher route');
  }
  
  if (!nextCalled) {
    logSuccess('✓ Role middleware blocked request (next() not called)');
  } else {
    throw new Error('Role middleware should block student from teacher route');
  }
  
  // Verify no exam was created
  const examCount = await Exam.countDocuments({ 
    title: 'Unauthorized Exam',
    createdBy: testData.student._id
  });
  
  if (examCount === 0) {
    logSuccess('✓ No exam created by student');
  } else {
    throw new Error('Exam should not be created by student');
  }
  
  log('');
}

async function testTeacherCannotStartAttempt() {
  logTest('═══════════════════════════════════════════════════════');
  logTest('TEST 6: Teacher Cannot Start Attempt');
  logTest('═══════════════════════════════════════════════════════');
  
  logInfo('Testing teacher blocked from student-only route...');
  
  // Teacher tries to start attempt
  const req = {
    user: {
      id: testData.teacher._id.toString(),
      email: testData.teacher.email,
      role: ROLES.TEACHER,
      name: testData.teacher.name
    },
    body: {
      examId: new mongoose.Types.ObjectId(),
      studentId: testData.teacher._id
    }
  };
  
  const res = {
    statusCode: null,
    body: null,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.body = data;
      return this;
    }
  };
  
  let nextCalled = false;
  const next = () => { nextCalled = true; };
  
  // Test role middleware
  await studentOnly(req, res, next);
  
  if (res.statusCode === 403 && 
      res.body.success === false &&
      res.body.error.includes('Access denied')) {
    logSuccess('✓ Teacher blocked from starting attempt with 403');
    logInfo(`   Error: "${res.body.error}"`);
  } else {
    throw new Error('Teacher should be blocked from student route');
  }
  
  if (!nextCalled) {
    logSuccess('✓ Role middleware blocked request (next() not called)');
  } else {
    throw new Error('Role middleware should block teacher from student route');
  }
  
  log('');
}

async function testJWTExpiry() {
  logTest('═══════════════════════════════════════════════════════');
  logTest('TEST 7: JWT Expiry Works');
  logTest('═══════════════════════════════════════════════════════');
  
  logInfo('Testing JWT with custom expiry...');
  
  const jwt = require('jsonwebtoken');
  const { verifyToken } = require('./utils/jwt');
  
  // Create token that expires in 1 second
  const shortLivedToken = jwt.sign(
    {
      id: testData.teacher._id.toString(),
      email: testData.teacher.email,
      role: testData.teacher.role,
      name: testData.teacher.name
    },
    process.env.JWT_SECRET || 'dev-secret-change-in-production',
    { expiresIn: '1s' }
  );
  
  // Token should be valid immediately
  const decoded = verifyToken(shortLivedToken);
  if (decoded.id === testData.teacher._id.toString()) {
    logSuccess('✓ Newly created token is valid');
    logInfo(`   User ID: ${decoded.id}`);
  } else {
    throw new Error('Token should be valid immediately');
  }
  
  // Wait for token to expire
  logInfo('Waiting for token to expire (2 seconds)...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Token should now be expired
  try {
    verifyToken(shortLivedToken);
    throw new Error('Should reject expired token');
  } catch (error) {
    if (error.message.includes('Token expired')) {
      logSuccess('✓ Expired token rejected');
      logInfo(`   Error: "${error.message}"`);
    } else {
      throw error;
    }
  }
  
  // Test default expiry (7 days)
  logInfo('Testing default token expiry (7 days)...');
  
  const normalToken = signToken(testData.teacher);
  const normalDecoded = jwt.decode(normalToken);
  
  const expiresIn = normalDecoded.exp - normalDecoded.iat;
  const expectedExpiry = 7 * 24 * 60 * 60; // 7 days in seconds
  
  if (Math.abs(expiresIn - expectedExpiry) < 5) {
    logSuccess('✓ Default token expiry is 7 days');
    logInfo(`   Expires in: ${expiresIn} seconds (${expiresIn / 86400} days)`);
  } else {
    throw new Error(`Token expiry mismatch: expected ${expectedExpiry}, got ${expiresIn}`);
  }
  
  log('');
}

async function cleanup() {
  log('🧹 Cleaning up test data...', colors.gray);
  
  try {
    await User.deleteMany({ 
      email: { 
        $regex: /(integration_|googleuser@)/ 
      } 
    });
    await Class.deleteMany({ code: 'AUTHTEST' });
    await Exam.deleteMany({ title: 'Unauthorized Exam' });
    
    log('✅ Cleanup complete\n', colors.gray);
  } catch (error) {
    log('⚠️  Cleanup warning: ' + error.message, colors.yellow);
  }
}

// Run tests
runTests();
