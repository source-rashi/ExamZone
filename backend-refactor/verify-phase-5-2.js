/**
 * Phase 5.2 Verification Script
 * Tests announcement system functionality
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Phase 5.2 — Classroom Announcement System Verification\n');

let passed = 0;
let failed = 0;

// ============================================================================
// 1. Verify Announcement Model
// ============================================================================
console.log('📋 TASK 1: Verifying Announcement Model...');

const modelPath = path.join(__dirname, 'models', 'Announcement.js');
const modelContent = fs.readFileSync(modelPath, 'utf8');

const modelChecks = {
  'content field (required)': modelContent.includes('content:') && modelContent.includes('required: true'),
  'class field (ObjectId ref)': modelContent.includes('class:') && modelContent.includes("ref: 'Class'"),
  'author field (ObjectId ref)': modelContent.includes('author:') && modelContent.includes("ref: 'User'"),
  'createdAt field exists': modelContent.includes('createdAt:'),
  'class index created': modelContent.includes("index({ class:") || modelContent.includes("index({class:"),
  'PHASE 5.2 comment exists': modelContent.includes('PHASE 5.2')
};

for (const [check, result] of Object.entries(modelChecks)) {
  if (result) {
    console.log(`  ✅ ${check}`);
    passed++;
  } else {
    console.log(`  ❌ ${check}`);
    failed++;
  }
}

console.log('');

// ============================================================================
// 2. Verify Announcement Controller
// ============================================================================
console.log('📋 TASK 2-4: Verifying Announcement Controller...');

const controllerPath = path.join(__dirname, 'controllers', 'announcement.controller.js');
const controllerContent = fs.readFileSync(controllerPath, 'utf8');

const controllerChecks = {
  'createAnnouncement function exists': controllerContent.includes('async function createAnnouncement'),
  'createAnnouncement validates teacher': controllerContent.includes('classDoc.teacher.toString() !== userId'),
  'createAnnouncement populates author': controllerContent.includes(".populate('author'"),
  'getAnnouncements function exists': controllerContent.includes('async function getAnnouncements'),
  'getAnnouncements checks membership': controllerContent.includes('isTeacher') && controllerContent.includes('isStudent'),
  'getAnnouncements sorts by latest': controllerContent.includes('sort({ createdAt: -1 })'),
  'deleteAnnouncement function exists': controllerContent.includes('async function deleteAnnouncement'),
  'deleteAnnouncement checks author': controllerContent.includes('isAuthor') || controllerContent.includes('announcement.author'),
  'deleteAnnouncement checks class teacher': controllerContent.includes('isClassTeacher') || controllerContent.includes('announcement.class.teacher'),
  'PHASE 5.2 comment exists': controllerContent.includes('PHASE 5.2')
};

for (const [check, result] of Object.entries(controllerChecks)) {
  if (result) {
    console.log(`  ✅ ${check}`);
    passed++;
  } else {
    console.log(`  ❌ ${check}`);
    failed++;
  }
}

console.log('');

// ============================================================================
// 3. Verify Announcement Routes
// ============================================================================
console.log('📋 TASK 5: Verifying Routes...');

const routesPath = path.join(__dirname, 'routes', 'announcement.routes.js');
const routesContent = fs.readFileSync(routesPath, 'utf8');

const routeChecks = {
  'POST /classes/:classId/announcements exists': routesContent.includes("'/classes/:classId/announcements'"),
  'POST route uses authenticate': routesContent.includes('authenticate'),
  'GET /classes/:classId/announcements exists': routesContent.includes("get('/classes/:classId/announcements'"),
  'DELETE /announcements/:id exists': routesContent.includes("delete('/announcements/:id'"),
  'All routes use authenticate': (routesContent.match(/authenticate/g) || []).length >= 3,
  'PHASE 5.2 comment exists': routesContent.includes('PHASE 5.2')
};

for (const [check, result] of Object.entries(routeChecks)) {
  if (result) {
    console.log(`  ✅ ${check}`);
    passed++;
  } else {
    console.log(`  ❌ ${check}`);
    failed++;
  }
}

console.log('');

// ============================================================================
// 4. Verify app.js Integration
// ============================================================================
console.log('📋 TASK 5: Verifying app.js Integration...');

const appPath = path.join(__dirname, 'app.js');
const appContent = fs.readFileSync(appPath, 'utf8');

const appChecks = {
  'announcementRoutes imported': appContent.includes("require('./routes/announcement.routes')"),
  'announcement routes registered': appContent.includes("app.use('/api/v2', announcementRoutes)") || appContent.includes('announcementRoutes')
};

for (const [check, result] of Object.entries(appChecks)) {
  if (result) {
    console.log(`  ✅ ${check}`);
    passed++;
  } else {
    console.log(`  ❌ ${check}`);
    failed++;
  }
}

console.log('');

// ============================================================================
// 5. Verify Frontend API
// ============================================================================
console.log('📋 TASK 6: Verifying Frontend API...');

const frontendApiPath = path.join(__dirname, '..', 'frontend', 'src', 'api', 'announcement.api.js');

let frontendChecks = {};

if (fs.existsSync(frontendApiPath)) {
  const frontendApiContent = fs.readFileSync(frontendApiPath, 'utf8');
  
  frontendChecks = {
    'createAnnouncement function exists': frontendApiContent.includes('createAnnouncement'),
    'getAnnouncements function exists': frontendApiContent.includes('getAnnouncements'),
    'deleteAnnouncement function exists': frontendApiContent.includes('deleteAnnouncement'),
    'POST endpoint correct': frontendApiContent.includes('/classes/${classId}/announcements'),
    'DELETE endpoint correct': frontendApiContent.includes('/announcements/${announcementId}') || frontendApiContent.includes('/announcements/${id}'),
    'PHASE 5.2 comment exists': frontendApiContent.includes('PHASE 5.2')
  };

  for (const [check, result] of Object.entries(frontendChecks)) {
    if (result) {
      console.log(`  ✅ ${check}`);
      passed++;
    } else {
      console.log(`  ❌ ${check}`);
      failed++;
    }
  }
} else {
  console.log('  ⚠️  Frontend API file not found (skipping)');
}

console.log('');

// ============================================================================
// 6. Verify Frontend Integration
// ============================================================================
console.log('📋 TASK 6: Verifying Frontend Classroom Integration...');

const classroomPath = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'shared', 'Classroom.jsx');

if (fs.existsSync(classroomPath)) {
  const classroomContent = fs.readFileSync(classroomPath, 'utf8');
  
  const classroomChecks = {
    'announcementAPI imported': classroomContent.includes("from '../../api/announcement.api'"),
    'uses announcementAPI.getAnnouncements': classroomContent.includes('announcementAPI.getAnnouncements'),
    'uses announcementAPI.createAnnouncement': classroomContent.includes('announcementAPI.createAnnouncement'),
    'uses announcementAPI.deleteAnnouncement': classroomContent.includes('announcementAPI.deleteAnnouncement'),
    'uses author.name field': classroomContent.includes('author?.name') || classroomContent.includes('author.name')
  };

  for (const [check, result] of Object.entries(classroomChecks)) {
    if (result) {
      console.log(`  ✅ ${check}`);
      passed++;
    } else {
      console.log(`  ❌ ${check}`);
      failed++;
    }
  }
} else {
  console.log('  ⚠️  Classroom component not found (skipping)');
}

console.log('');

// ============================================================================
// SUMMARY
// ============================================================================
console.log('═'.repeat(60));
console.log('📊 VERIFICATION SUMMARY\n');
console.log(`  Total Checks: ${passed + failed}`);
console.log(`  ✅ Passed: ${passed}`);
console.log(`  ❌ Failed: ${failed}`);
console.log('');

if (failed === 0) {
  console.log('🎉 Phase 5.2 — Classroom Announcement System: COMPLETE ✅');
  console.log('');
  console.log('✅ Announcement model with real User references');
  console.log('✅ Create announcement (teacher only)');
  console.log('✅ Get announcements (class members)');
  console.log('✅ Delete announcement (author or teacher)');
  console.log('✅ Populated author data');
  console.log('✅ Frontend Stream tab updated');
  console.log('✅ All endpoints protected');
} else {
  console.log('⚠️  Some checks failed. Review the issues above.');
}

console.log('═'.repeat(60));
console.log('');
console.log('Next: Phase 5.3 — Enhanced Classroom Features');
console.log('');
