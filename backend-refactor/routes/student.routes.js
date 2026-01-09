const express = require('express');
const router = express.Router();
const { studentAccess, getAnswers } = require('../controllers/student.controller');

// POST /student - Get student PDF link
router.post('/student', studentAccess);

// POST /get-answers - Retrieve answer sheets for class or specific student
router.post('/get-answers', getAnswers);

module.exports = router;
