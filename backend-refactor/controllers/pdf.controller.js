const classService = require('../services/class.service');
const pdfService = require('../services/pdf.service');
const aiService = require('../services/ai.service');

// Fetch PDF from FastAPI server and store in database
exports.generatePDF = async (req, res) => {
  const { classCode, roll, questions } = req.body;

  try {
    // Generate PDF via AI service
    const pdfBuffer = await aiService.generatePDFFromQuestions(questions);

    // Find class
    const classDoc = await classService.findClassByCode(classCode);
    if (!classDoc) {
      return res.status(404).send('❌ Class not found');
    }

    // Store PDF buffer in database
    await pdfService.storePDFBuffer(classDoc, roll, pdfBuffer);

    console.log(`✅ PDF generated and stored for roll ${roll} in database`);

    // Return response
    res.status(200).json({
      message: '✅ PDF generated and stored in database',
      pdfUrl: `/get-pdf?classCode=${classCode}&roll=${roll}`
    });

  } catch (error) {
    console.error('❌ Error generating PDF:', error.message);
    
    if (error.message === 'Student not found') {
      return res.status(404).send('❌ Student not found');
    }
    
    res.status(500).json({
      error: 'Failed to generate PDF',
      details: error.message
    });
  }
};

// Retrieve PDF from database
exports.getPDF = async (req, res) => {
  const { classCode, roll } = req.query;

  try {
    // Find class
    const classDoc = await classService.findClassByCode(classCode);
    if (!classDoc) {
      return res.status(404).send("❌ Class not found");
    }

    // Get PDF buffer from service
    const pdfBuffer = pdfService.getPDFBuffer(classDoc, roll);

    // Set headers and send response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=${roll}.pdf`);
    res.send(pdfBuffer);

  } catch (err) {
    console.error("❌ Error retrieving PDF:", err);
    
    if (err.message === 'Student not found') {
      return res.status(404).send("❌ Student not found");
    }
    
    if (err.message === 'PDF not yet generated') {
      return res.status(404).send("❌ PDF not yet generated");
    }
    
    res.status(500).send("❌ Server error");
  }
};
