const classService = require('../services/class.service');
const pdfService = require('../services/pdf.service');
const { AppError } = require('../middleware/error.middleware');

// Upload student list PDF and extract students
exports.uploadStudentList = async (req, res, next) => {
  const classCode = req.body.classCode;
  const filePath = req.file.path;

  try {
    // Find class
    const classDoc = await classService.findClassByCode(classCode);
    if (!classDoc) return next(new AppError('Class not found', 404));

    // Parse PDF and extract students
    const data = await pdfService.parsePDF(filePath);
    const students = pdfService.extractStudentsFromPDF(data.text);

    // Add students to class
    await classService.addMultipleStudents(classDoc, students);

    // Return response
    res.send("✅ Students added successfully!");
  } catch (err) {
    next(err);
  }
};

// Upload student answer sheet
exports.uploadAnswerSheet = async (req, res, next) => {
  const { classCode, roll } = req.body;
  const filePath = `answersheets/${req.file.filename}`;

  try {
    // Find class
    const classDoc = await classService.findClassByCode(classCode);
    if (!classDoc) return next(new AppError('Class not found', 404));

    // Update student's answer sheet
    await classService.updateStudentAnswerSheet(classDoc, roll, filePath);

    console.log(`✅ Answer sheet path saved: ${filePath}`);
    
    // Return response
    res.send("✅ Answer sheet uploaded and saved successfully!");
  } catch (error) {
    if (error.message === 'Student not found') {
      return next(new AppError('Student not found', 404));
    }
    next(error);
  }
};
