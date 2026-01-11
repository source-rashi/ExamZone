/**
 * Phase 5.3 Assignment System Verification Script
 * Tests file upload/download functionality for assignments
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 PHASE 5.3: ASSIGNMENT SYSTEM VERIFICATION\n');
console.log('=' .repeat(60));

let passCount = 0;
let totalChecks = 0;

function check(description, condition, details = '') {
  totalChecks++;
  if (condition) {
    console.log(`✅ ${description}`);
    if (details) console.log(`   ${details}`);
    passCount++;
    return true;
  } else {
    console.log(`❌ ${description}`);
    if (details) console.log(`   ${details}`);
    return false;
  }
}

function section(title) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📋 ${title}`);
  console.log('─'.repeat(60));
}

// 1. FILE STRUCTURE CHECKS
section('File Structure');

const requiredFiles = [
  'models/Assignment.js',
  'config/upload.config.js',
  'controllers/assignment.controller.js',
  'routes/assignment.routes.js',
];

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  check(`File exists: ${file}`, fs.existsSync(filePath));
});

// 2. MODEL VERIFICATION
section('Assignment Model');

try {
  const modelPath = path.join(__dirname, 'models', 'Assignment.js');
  const modelContent = fs.readFileSync(modelPath, 'utf8');
  
  check('Has attachmentPath field', modelContent.includes('attachmentPath'));
  check('attachmentPath is required', /attachmentPath:\s*\{[^}]*required:\s*true/s.test(modelContent));
  check('Has submissions subdocument', modelContent.includes('submissionSchema'));
  check('Submission has filePath', /submissionSchema[^}]*filePath/s.test(modelContent));
  check('Submission has status field', /submissionSchema[^}]*status.*enum.*\[.*submitted.*graded.*\]/s.test(modelContent));
  check('Submission has grade field', /submissionSchema[^}]*grade/s.test(modelContent));
  check('Has class reference', modelContent.includes("ref: 'Class'"));
  check('Has teacher reference', modelContent.includes("ref: 'User'"));
  check('Has dueDate field', modelContent.includes('dueDate'));
  check('Has indexes', modelContent.includes('.index('));
} catch (error) {
  check('Model file readable', false, error.message);
}

// 3. UPLOAD CONFIG VERIFICATION
section('Upload Configuration');

try {
  const configPath = path.join(__dirname, 'config', 'upload.config.js');
  const configContent = fs.readFileSync(configPath, 'utf8');
  
  check('Has assignmentStorage configuration', configContent.includes('assignmentStorage'));
  check('Has submissionStorage configuration', configContent.includes('submissionStorage'));
  check('Uses diskStorage', configContent.includes('diskStorage'));
  check('Has fileFilter for PDF only', configContent.includes('.pdf'));
  check('Has file size limit', configContent.includes('limits'));
  check('Exports uploadAssignment middleware', configContent.includes('uploadAssignment'));
  check('Exports uploadSubmission middleware', configContent.includes('uploadSubmission'));
  check('Creates upload directories', configContent.includes('mkdirSync'));
} catch (error) {
  check('Config file readable', false, error.message);
}

// 4. CONTROLLER VERIFICATION
section('Assignment Controller');

try {
  const controllerPath = path.join(__dirname, 'controllers', 'assignment.controller.js');
  const controllerContent = fs.readFileSync(controllerPath, 'utf8');
  
  check('Has createAssignment function', /exports\.createAssignment\s*=/.test(controllerContent));
  check('Has getAssignments function', /exports\.getAssignments\s*=/.test(controllerContent));
  check('Has downloadAssignment function', /exports\.downloadAssignment\s*=/.test(controllerContent));
  check('Has submitAssignment function', /exports\.submitAssignment\s*=/.test(controllerContent));
  check('Has getSubmissions function', /exports\.getSubmissions\s*=/.test(controllerContent));
  check('Has downloadSubmission function', /exports\.downloadSubmission\s*=/.test(controllerContent));
  check('Uses req.file for upload', controllerContent.includes('req.file'));
  check('Uses res.download for file serving', controllerContent.includes('res.download'));
  check('Handles file cleanup on error', /unlink|unlinkSync/.test(controllerContent));
  check('Validates class membership', /Class\.findById.*students.*teacher/.test(controllerContent));
  check('Checks for existing submissions', /submissions\.find/.test(controllerContent));
  check('Handles resubmission', /unlink.*existingSubmission\.filePath/s.test(controllerContent));
} catch (error) {
  check('Controller file readable', false, error.message);
}

// 5. ROUTES VERIFICATION
section('Assignment Routes');

try {
  const routesPath = path.join(__dirname, 'routes', 'assignment.routes.js');
  const routesContent = fs.readFileSync(routesPath, 'utf8');
  
  check('POST /classes/:classId/assignments', /post.*\/classes\/:classId\/assignments/.test(routesContent));
  check('GET /classes/:classId/assignments', /get.*\/classes\/:classId\/assignments/.test(routesContent));
  check('GET /assignments/:id/download', /get.*\/assignments\/:id\/download/.test(routesContent));
  check('POST /assignments/:id/submit', /post.*\/assignments\/:id\/submit/.test(routesContent));
  check('GET /assignments/:id/submissions', /get.*\/assignments\/:id\/submissions/.test(routesContent));
  check('GET /submissions/:submissionId/download', /get.*\/submissions\/:submissionId\/download/.test(routesContent));
  check('Uses authenticate middleware', routesContent.includes('authenticate'));
  check('Uses uploadAssignment middleware', routesContent.includes('uploadAssignment'));
  check('Uses uploadSubmission middleware', routesContent.includes('uploadSubmission'));
  check('Exports router', /module\.exports\s*=\s*router/.test(routesContent));
} catch (error) {
  check('Routes file readable', false, error.message);
}

// 6. APP.JS INTEGRATION
section('App.js Integration');

try {
  const appPath = path.join(__dirname, 'app.js');
  const appContent = fs.readFileSync(appPath, 'utf8');
  
  check('Imports assignment routes', /require.*assignment\.routes/.test(appContent));
  check('Registers assignment routes', /app\.use.*assignmentRoutes/.test(appContent));
  check('Has /uploads static serving', /express\.static.*uploads/.test(appContent));
} catch (error) {
  check('App.js readable', false, error.message);
}

// 7. FRONTEND API CLIENT
section('Frontend API Client');

try {
  const apiPath = path.join(__dirname, '..', 'frontend', 'src', 'api', 'assignment.api.js');
  const apiContent = fs.readFileSync(apiPath, 'utf8');
  
  check('Has createAssignment function', /export.*createAssignment/.test(apiContent));
  check('Has getAssignments function', /export.*getAssignments/.test(apiContent));
  check('Has downloadAssignment function', /export.*downloadAssignment/.test(apiContent));
  check('Has submitAssignment function', /export.*submitAssignment/.test(apiContent));
  check('Has getSubmissions function', /export.*getSubmissions/.test(apiContent));
  check('Has downloadSubmission function', /export.*downloadSubmission/.test(apiContent));
  check('Uses multipart/form-data for uploads', /multipart\/form-data/.test(apiContent));
  check('Uses responseType: blob for downloads', /responseType.*blob/.test(apiContent));
} catch (error) {
  check('API client readable', false, error.message);
}

// 8. FRONTEND COMPONENT
section('Frontend Classroom Component');

try {
  const componentPath = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'shared', 'Classroom.jsx');
  const componentContent = fs.readFileSync(componentPath, 'utf8');
  
  check('Imports assignment API', /import.*assignmentAPI.*assignment\.api/.test(componentContent));
  check('Has AssignmentsTab component', /function AssignmentsTab/.test(componentContent));
  check('Loads assignments on mount', /useEffect.*loadAssignments/.test(componentContent));
  check('Has file upload input', /<input[^>]*type="file"/.test(componentContent));
  check('Accepts PDF only', /accept="\.pdf"/.test(componentContent));
  check('Has download handler', /handleDownload/.test(componentContent));
  check('Has submit handler', /handleSubmit/.test(componentContent));
  check('Shows submission status', /mySubmission.*status/.test(componentContent));
  check('Supports resubmission', /Resubmit/.test(componentContent));
  check('Uses FormData for uploads', /new FormData/.test(componentContent));
  check('Creates blob URL for downloads', /URL\.createObjectURL/.test(componentContent));
} catch (error) {
  check('Classroom component readable', false, error.message);
}

// 9. DIRECTORY STRUCTURE
section('Upload Directories');

const uploadDir = path.join(__dirname, 'uploads');
const assignmentsDir = path.join(uploadDir, 'assignments');
const submissionsDir = path.join(uploadDir, 'submissions');

check('uploads/ directory exists', fs.existsSync(uploadDir));
check('uploads/assignments/ directory exists', fs.existsSync(assignmentsDir));
check('uploads/submissions/ directory exists', fs.existsSync(submissionsDir));

// FINAL SUMMARY
console.log('\n' + '='.repeat(60));
console.log(`📊 VERIFICATION COMPLETE: ${passCount}/${totalChecks} checks passed`);
console.log('='.repeat(60));

if (passCount === totalChecks) {
  console.log('\n✅ Phase 5.3 implementation is complete and ready for testing!');
  console.log('\nNext steps:');
  console.log('1. Start the backend server');
  console.log('2. Test teacher upload workflow');
  console.log('3. Test student download workflow');
  console.log('4. Test student submission workflow');
  console.log('5. Verify file access controls');
} else {
  console.log(`\n⚠️  ${totalChecks - passCount} check(s) failed. Please review the issues above.`);
  process.exit(1);
}
