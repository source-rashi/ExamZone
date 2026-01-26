const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadStudentList, uploadAnswerSheet } = require('../controllers/upload.controller');
const { validateStudentListUpload, validateAnswerSheetUpload } = require('../middleware/validate.middleware');
const { uploadLimiter } = require('../middleware/rateLimit.middleware');

// Multer storage for student list PDFs
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads/')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Multer storage for answer sheets
const answerStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../answersheets/')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const answerUpload = multer({ storage: answerStorage });

// POST /upload - Upload student list PDF and extract students
// PHASE 8.8: Rate limited to prevent storage abuse
router.post('/upload', uploadLimiter, upload.single('pdfFile'), validateStudentListUpload, uploadStudentList);

// POST /upload-answer - Upload student answer sheet
// PHASE 8.8: Rate limited to prevent storage abuse
router.post('/upload-answer', uploadLimiter, answerUpload.single('answerSheet'), validateAnswerSheetUpload, uploadAnswerSheet);

module.exports = router;
