const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * PHASE 5.3 — File Upload Configuration
 * Handles assignment and submission file uploads
 */

// Ensure upload directories exist
const assignmentsDir = path.join(__dirname, '..', '..', 'uploads', 'assignments');
const submissionsDir = path.join(__dirname, '..', '..', 'uploads', 'submissions');

[assignmentsDir, submissionsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage configuration for teacher assignment uploads
const assignmentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, assignmentsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'assignment-' + uniqueSuffix + ext);
  }
});

// Storage configuration for student submission uploads
const submissionStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, submissionsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'submission-' + uniqueSuffix + ext);
  }
});

// File filter - only allow PDFs
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf' || path.extname(file.originalname).toLowerCase() === '.pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

// Multer instances
const uploadAssignment = multer({
  storage: assignmentStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
}).single('file');

const uploadSubmission = multer({
  storage: submissionStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
}).single('file');

module.exports = {
  uploadAssignment,
  uploadSubmission,
  assignmentsDir,
  submissionsDir
};
