const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadStudentList, uploadAnswerSheet } = require('../controllers/upload.controller');
const { validateStudentListUpload, validateAnswerSheetUpload } = require('../middleware/validate.middleware');

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
router.post('/upload', upload.single('pdfFile'), validateStudentListUpload, uploadStudentList);

// POST /upload-answer - Upload student answer sheet
router.post('/upload-answer', answerUpload.single('answerSheet'), validateAnswerSheetUpload, uploadAnswerSheet);

module.exports = router;
