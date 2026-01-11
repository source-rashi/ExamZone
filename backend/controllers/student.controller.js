const classService = require('../services/class.service');
const pdfService = require('../services/pdf.service');
const { AppError } = require('../middleware/error.middleware');

// Get student PDF link
exports.studentAccess = async (req, res, next) => {
  const { classCode, roll } = req.body;

  try {
    // Find class
    const classDoc = await classService.findClassByCode(classCode);
    if (!classDoc) return next(new AppError('Class not found', 404));

    // Find student
    const student = classService.findStudent(classDoc, roll);
    if (!student) return next(new AppError('Student not found', 404));

    // Check if PDF exists
    if (!pdfService.hasPDFData(student)) {
      return next(new AppError('PDF not generated yet. Please generate the PDF first.', 404));
    }

    // Return response
    res.send(`✅ <a href="/get-pdf?classCode=${classCode}&roll=${roll}" target="_blank">${roll}.pdf</a>`);
  } catch (err) {
    next(err);
  }
};

// Retrieve answer sheets for class or specific student
exports.getAnswers = async (req, res, next) => {
  const { classCode, roll } = req.body;

  try {
    // Find class
    const classDoc = await classService.findClassByCode(classCode);
    if (!classDoc) return next(new AppError('Class not found', 404));

    // Build response HTML
    let resultHtml = `<h2>📚 Answer Sheets for Class ${classCode}</h2><ul>`;

    // Get students with answer sheets
    const studentsWithAnswers = classService.getStudentsWithAnswers(classDoc, roll);

    if (studentsWithAnswers.length === 0) {
      const message = roll ? "❌ No answer sheet for this roll number" : "❌ No answer sheets submitted yet.";
      return res.send(message);
    }

    // Build HTML list
    studentsWithAnswers.forEach(s => {
      resultHtml += `<li><a href="/${s.answerPdf}" target="_blank">${s.roll}.pdf</a></li>`;
    });

    resultHtml += `</ul><br><a href="/">🔙 Back to Home</a>`;
    res.send(resultHtml);
  } catch (err) {
    next(err);
  }
};
