const express = require('express');
const router = express.Router();
const { studentAccess, getAnswers } = require('../controllers/student.controller');
const { validateStudentAccess, validateGetAnswers } = require('../middleware/validate.middleware');

// POST /student - Get student PDF link
router.post('/student', validateStudentAccess, studentAccess);

// POST /get-answers - Retrieve answer sheets for class or specific student
router.post('/get-answers', validateGetAnswers, getAnswers);

module.exports = router;
