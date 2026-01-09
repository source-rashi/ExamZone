const express = require('express');
const router = express.Router();
const { generatePDF, getPDF } = require('../controllers/pdf.controller');
const { validateGeneratePDF, validateGetPDF } = require('../middleware/validate.middleware');

// POST /generate-pdf - Fetch PDF from FastAPI server and store in database
router.post('/generate-pdf', validateGeneratePDF, generatePDF);

// GET /get-pdf - Retrieve PDF from database
router.get('/get-pdf', validateGetPDF, getPDF);

module.exports = router;
