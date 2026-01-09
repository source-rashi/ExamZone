const classService = require('../services/class.service');
const pdfService = require('../services/pdf.service');

// Upload student list PDF and extract students
exports.uploadStudentList = async (req, res) => {
  const classCode = req.body.classCode;
  const filePath = req.file.path;

  try {
    // Find class
    const classDoc = await classService.findClassByCode(classCode);
    if (!classDoc) return res.status(404).send("❌ Class not found");

    // Parse PDF and extract students
    const data = await pdfService.parsePDF(filePath);
    const students = pdfService.extractStudentsFromPDF(data.text);

    // Add students to class
    await classService.addMultipleStudents(classDoc, students);

    // Return response
    res.send("✅ Students added successfully!");
  } catch (err) {
    console.error("❌ PDF Error:", err);
    res.status(500).send("❌ Failed to process PDF");
  }
};

// Upload student answer sheet
exports.uploadAnswerSheet = async (req, res) => {
  const { classCode, roll } = req.body;
  const filePath = `answersheets/${req.file.filename}`;

  try {
    // Find class
    const classDoc = await classService.findClassByCode(classCode);
    if (!classDoc) return res.status(404).send("❌ Class not found");

    // Update student's answer sheet
    await classService.updateStudentAnswerSheet(classDoc, roll, filePath);

    console.log(`✅ Answer sheet path saved: ${filePath}`);
    
    // Return response
    res.send("✅ Answer sheet uploaded and saved successfully!");
  } catch (error) {
    console.error("❌ Upload Error:", error);
    
    if (error.message === 'Student not found') {
      return res.status(404).send("❌ Student not found");
    }
    
    res.status(500).send("Something went wrong while uploading.");
  }
};
