const express = require('express');
const router = express.Router();
const { generatePDF, getPDF } = require('../controllers/pdf.controller');

// POST /generate-pdf - Fetch PDF from FastAPI server and store in database
router.post('/generate-pdf', generatePDF);

// GET /get-pdf - Retrieve PDF from database
router.get('/get-pdf', getPDF);

module.exports = router;
