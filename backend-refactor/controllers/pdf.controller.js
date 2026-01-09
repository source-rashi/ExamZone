const classService = require('../services/class.service');
const pdfService = require('../services/pdf.service');
const aiService = require('../services/ai.service');
const { AppError } = require('../middleware/error.middleware');

// Fetch PDF from FastAPI server and store in database
exports.generatePDF = async (req, res, next) => {
  const { classCode, roll, questions } = req.body;

  try {
    // Generate PDF via AI service
    const pdfBuffer = await aiService.generatePDFFromQuestions(questions);

    // Find class
    const classDoc = await classService.findClassByCode(classCode);
    if (!classDoc) {
      return next(new AppError('Class not found', 404));
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
    if (error.message === 'Student not found') {
      return next(new AppError('Student not found', 404));
    }
    next(error);
  }
};

// Retrieve PDF from database
exports.getPDF = async (req, res, next) => {
  const { classCode, roll } = req.query;

  try {
    // Find class
    const classDoc = await classService.findClassByCode(classCode);
    if (!classDoc) {
      return next(new AppError('Class not found', 404));
    }

    // Get PDF buffer from service
    const pdfBuffer = pdfService.getPDFBuffer(classDoc, roll);

    // Set headers and send response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=${roll}.pdf`);
    res.send(pdfBuffer);

  } catch (err) {
    if (err.message === 'Student not found') {
      return next(new AppError('Student not found', 404));
    }
    
    if (err.message === 'PDF not yet generated') {
      return next(new AppError('PDF not yet generated', 404));
    }
    
    next(err);
  }
};
