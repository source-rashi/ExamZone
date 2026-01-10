/**
 * Phase 3.7 - Authentication & Authorization Test Suite
 * Tests JWT, Google OAuth, role-based access control
 */

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Class = require('./models/Class');
const Exam = require('./models/Exam');
const { signToken, verifyToken } = require('./utils/jwt');
const authService = require('./services/auth.service');
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
    log('      PHASE 3.7 - AUTHENTICATION & AUTHORIZATION TESTS', colors.bright);
    log('════════════════════════════════════════════════════════\n', colors.bright);
    
    await connectDB();
    logSuccess('Database connected\n');
    
    await cleanup();
    await setupTestData();
    
    // Run all test suites
    await testJwtUtility();
    await testAuthService();
    await testRoleAssignment();
    await testAuthMiddleware();
    await testRoleMiddleware();
    
    log('\n════════════════════════════════════════════════════════', colors.bright);
    log('      ALL AUTH TESTS PASSED ✅', colors.green + colors.bright);
    log('════════════════════════════════════════════════════════\n', colors.bright);
    
    await cleanup();
    process.exit(0);
  } catch (error) {
    log('\n════════════════════════════════════════════════════════', colors.bright);
    log('      AUTH TESTS FAILED ❌', colors.red + colors.bright);
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
    name: 'Auth Test Teacher',
    email: 'auth_teacher@test.com',
    password: 'password123',
    role: ROLES.TEACHER
  });
  
  testData.student = await User.create({
    name: 'Auth Test Student',
    email: 'auth_student@test.com',
    password: 'password123',
    role: ROLES.STUDENT
  });
  
  logSuccess('Test data ready\n');
}

async function testJwtUtility() {
  logTest('═══════════════════════════════════════════════════════');
  logTest('TEST 1: JWT Utility Functions');
  logTest('═══════════════════════════════════════════════════════');
  
  // Test 1a: Sign token
  logInfo('Testing token signing...');
  const token = signToken(testData.teacher);
  
  if (token && typeof token === 'string' && token.split('.').length === 3) {
    logSuccess('✓ Token signed successfully');
    logInfo(`   Token format: ${token.substring(0, 20)}...`);
  } else {
    throw new Error('Invalid token format');
  }
  
  // Test 1b: Verify valid token
  logInfo('Testing token verification...');
  const decoded = verifyToken(token);
  
  if (decoded.id === testData.teacher._id.toString() &&
      decoded.email === testData.teacher.email &&
      decoded.role === testData.teacher.role) {
    logSuccess('✓ Token verified successfully');
    logInfo(`   User ID: ${decoded.id}`);
    logInfo(`   Email: ${decoded.email}`);
    logInfo(`   Role: ${decoded.role}`);
  } else {
    throw new Error('Token payload mismatch');
  }
  
  // Test 1c: Reject invalid token
  logInfo('Testing invalid token rejection...');
  try {
    verifyToken('invalid.token.here');
    throw new Error('Should reject invalid token');
  } catch (error) {
    if (error.message.includes('Invalid token')) {
      logSuccess('✓ Invalid token rejected');
      logInfo(`   Error: "${error.message}"`);
    } else {
      throw error;
    }
  }
  
  // Test 1d: Token contains all required fields
  logInfo('Testing token payload completeness...');
  if (decoded.id && decoded.email && decoded.role && decoded.name && decoded.exp) {
    logSuccess('✓ Token contains all required fields');
    logInfo(`   Fields: id, email, role, name, exp`);
  } else {
    throw new Error('Token missing required fields');
  }
  
  log('');
}

async function testAuthService() {
  logTest('═══════════════════════════════════════════════════════');
  logTest('TEST 2: Authentication Service');
  logTest('═══════════════════════════════════════════════════════');
  
  // Test 2a: Find or create user
  logInfo('Testing findOrCreateUser...');
  
  const googleProfile = {
    email: 'newuser@gmail.com',
    name: 'New Google User',
    picture: 'https://example.com/photo.jpg',
    emailVerified: true
  };
  
  const user = await authService.findOrCreateUser(googleProfile);
  
  if (user.email === googleProfile.email &&
      user.name === googleProfile.name &&
      user.picture === googleProfile.picture &&
      user.authProvider === 'google') {
    logSuccess('✓ User created from Google profile');
    logInfo(`   Email: ${user.email}`);
    logInfo(`   Provider: ${user.authProvider}`);
    logInfo(`   Role: ${user.role}`);
  } else {
    throw new Error('User creation failed');
  }
  
  // Test 2b: Find existing user
  logInfo('Testing existing user lookup...');
  
  const existingUser = await authService.findOrCreateUser(googleProfile);
  
  if (existingUser._id.toString() === user._id.toString()) {
    logSuccess('✓ Existing user found (no duplicate created)');
    logInfo(`   User ID: ${existingUser._id}`);
  } else {
    throw new Error('Duplicate user created');
  }
  
  // Test 2c: Reject unverified email
  logInfo('Testing unverified email rejection...');
  
  const unverifiedProfile = {
    email: 'unverified@test.com',
    name: 'Unverified User',
    picture: null,
    emailVerified: false
  };
  
  try {
    await authService.findOrCreateUser(unverifiedProfile);
    throw new Error('Should reject unverified email');
  } catch (error) {
    if (error.message.includes('not verified')) {
      logSuccess('✓ Unverified email rejected');
      logInfo(`   Error: "${error.message}"`);
    } else {
      throw error;
    }
  }
  
  // Test 2d: Issue JWT
  logInfo('Testing JWT issuance...');
  
  const jwt = authService.issueJwt(user);
  
  if (jwt && typeof jwt === 'string') {
    logSuccess('✓ JWT issued successfully');
    const jwtDecoded = verifyToken(jwt);
    logInfo(`   User: ${jwtDecoded.name}`);
    logInfo(`   Role: ${jwtDecoded.role}`);
  } else {
    throw new Error('JWT issuance failed');
  }
  
  log('');
}

async function testRoleAssignment() {
  logTest('═══════════════════════════════════════════════════════');
  logTest('TEST 3: Role Assignment');
  logTest('═══════════════════════════════════════════════════════');
  
  // Test 3a: Default role is student
  logInfo('Testing default role assignment...');
  
  const studentProfile = {
    email: 'defaultrole@example.com',
    name: 'Default Role User',
    picture: null,
    emailVerified: true
  };
  
  const studentUser = await authService.findOrCreateUser(studentProfile);
  
  if (studentUser.role === ROLES.STUDENT) {
    logSuccess('✓ Default role is STUDENT');
    logInfo(`   Email: ${studentUser.email}`);
    logInfo(`   Role: ${studentUser.role}`);
  } else {
    throw new Error('Default role should be student');
  }
  
  // Test 3b: Teacher domain assignment (if configured)
  logInfo('Testing role-based domain logic...');
  
  // Note: This test is informational since we don't set TEACHER_DOMAINS in test
  const teacherDomains = process.env.TEACHER_DOMAINS?.split(',') || [];
  
  if (teacherDomains.length > 0) {
    logSuccess(`✓ Teacher domains configured: ${teacherDomains.join(', ')}`);
  } else {
    logSuccess('✓ No teacher domains configured (all users default to student)');
    logInfo('   Set TEACHER_DOMAINS env variable for domain-based role assignment');
  }
  
  // Test 3c: Role validation
  logInfo('Testing role constants...');
  
  if (ROLES.TEACHER === 'teacher' && ROLES.STUDENT === 'student') {
    logSuccess('✓ Role constants defined correctly');
    logInfo(`   TEACHER: ${ROLES.TEACHER}`);
    logInfo(`   STUDENT: ${ROLES.STUDENT}`);
  } else {
    throw new Error('Role constants mismatch');
  }
  
  log('');
}

async function testAuthMiddleware() {
  logTest('═══════════════════════════════════════════════════════');
  logTest('TEST 4: Authentication Middleware');
  logTest('═══════════════════════════════════════════════════════');
  
  const { authenticate } = require('./middleware/auth.middleware');
  
  // Test 4a: Valid token attaches user
  logInfo('Testing user attachment with valid token...');
  
  const validToken = signToken(testData.teacher);
  
  const req = {
    headers: {
      authorization: `Bearer ${validToken}`
    }
  };
  
  const res = {
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
  
  if (nextCalled && req.user && req.user.id === testData.teacher._id.toString()) {
    logSuccess('✓ Valid token attached user to request');
    logInfo(`   User ID: ${req.user.id}`);
    logInfo(`   Role: ${req.user.role}`);
  } else {
    throw new Error('Failed to attach user');
  }
  
  // Test 4b: Missing token rejected
  logInfo('Testing missing token rejection...');
  
  const reqNoToken = { headers: {} };
  const resNoToken = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.body = data;
      return this;
    }
  };
  
  await authenticate(reqNoToken, resNoToken, () => {});
  
  if (resNoToken.statusCode === 401 && resNoToken.body.error) {
    logSuccess('✓ Missing token rejected with 401');
    logInfo(`   Error: "${resNoToken.body.error}"`);
  } else {
    throw new Error('Should reject missing token');
  }
  
  // Test 4c: Invalid token rejected
  logInfo('Testing invalid token rejection...');
  
  const reqBadToken = {
    headers: { authorization: 'Bearer invalid.token.here' }
  };
  const resBadToken = {
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
  
  if (resBadToken.statusCode === 401 && resBadToken.body.error) {
    logSuccess('✓ Invalid token rejected with 401');
    logInfo(`   Error: "${resBadToken.body.error}"`);
  } else {
    throw new Error('Should reject invalid token');
  }
  
  log('');
}

async function testRoleMiddleware() {
  logTest('═══════════════════════════════════════════════════════');
  logTest('TEST 5: Role-Based Access Control');
  logTest('═══════════════════════════════════════════════════════');
  
  const { allowRoles, teacherOnly, studentOnly } = require('./middleware/role.middleware');
  
  // Test 5a: Teacher can access teacher-only route
  logInfo('Testing teacher-only access...');
  
  const teacherReq = {
    user: {
      id: testData.teacher._id.toString(),
      role: ROLES.TEACHER,
      email: testData.teacher.email,
      name: testData.teacher.name
    }
  };
  
  let teacherNextCalled = false;
  await teacherOnly(teacherReq, {}, () => { teacherNextCalled = true; });
  
  if (teacherNextCalled) {
    logSuccess('✓ Teacher accessed teacher-only route');
  } else {
    throw new Error('Teacher should access teacher-only route');
  }
  
  // Test 5b: Student blocked from teacher-only route
  logInfo('Testing student blocked from teacher-only route...');
  
  const studentReq = {
    user: {
      id: testData.student._id.toString(),
      role: ROLES.STUDENT,
      email: testData.student.email,
      name: testData.student.name
    }
  };
  
  const studentRes = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.body = data;
      return this;
    }
  };
  
  await teacherOnly(studentReq, studentRes, () => {});
  
  if (studentRes.statusCode === 403 && studentRes.body.error) {
    logSuccess('✓ Student blocked from teacher-only route with 403');
    logInfo(`   Error: "${studentRes.body.error}"`);
  } else {
    throw new Error('Should block student from teacher route');
  }
  
  // Test 5c: Student can access student-only route
  logInfo('Testing student-only access...');
  
  let studentNextCalled = false;
  await studentOnly(studentReq, {}, () => { studentNextCalled = true; });
  
  if (studentNextCalled) {
    logSuccess('✓ Student accessed student-only route');
  } else {
    throw new Error('Student should access student-only route');
  }
  
  // Test 5d: Teacher blocked from student-only route
  logInfo('Testing teacher blocked from student-only route...');
  
  const teacherRes2 = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.body = data;
      return this;
    }
  };
  
  await studentOnly(teacherReq, teacherRes2, () => {});
  
  if (teacherRes2.statusCode === 403 && teacherRes2.body.error) {
    logSuccess('✓ Teacher blocked from student-only route with 403');
    logInfo(`   Error: "${teacherRes2.body.error}"`);
  } else {
    throw new Error('Should block teacher from student route');
  }
  
  // Test 5e: allowRoles with multiple roles
  logInfo('Testing multi-role access control...');
  
  const multiRoleMiddleware = allowRoles(ROLES.TEACHER, ROLES.STUDENT);
  
  let teacherMultiNext = false;
  await multiRoleMiddleware(teacherReq, {}, () => { teacherMultiNext = true; });
  
  let studentMultiNext = false;
  await multiRoleMiddleware(studentReq, {}, () => { studentMultiNext = true; });
  
  if (teacherMultiNext && studentMultiNext) {
    logSuccess('✓ Multi-role middleware allows both teacher and student');
  } else {
    throw new Error('Multi-role middleware failed');
  }
  
  log('');
}

async function cleanup() {
  log('🧹 Cleaning up test data...', colors.gray);
  
  try {
    await User.deleteMany({ email: { $regex: /auth.*@test\.com$|@gmail\.com$|@example\.com$/ } });
    await Class.deleteMany({});
    await Exam.deleteMany({});
    
    log('✅ Cleanup complete\n', colors.gray);
  } catch (error) {
    log('⚠️  Cleanup warning: ' + error.message, colors.yellow);
  }
}

// Run tests
runTests();
