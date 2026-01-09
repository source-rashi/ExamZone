const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const Class = require('../models/Class');

// Multer storage for student list PDFs
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Multer storage for answer sheets
const answerStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'answersheets/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const answerUpload = multer({ storage: answerStorage });

// POST /upload - Upload student list PDF and extract students
router.post('/upload', upload.single('pdfFile'), async (req, res) => {
  const classCode = req.body.classCode;
  const filePath = req.file.path;

  try {
    const classDoc = await Class.findOne({ code: classCode });
    if (!classDoc) return res.status(404).send("❌ Class not found");

    const data = await pdfParse(fs.readFileSync(filePath));
    const lines = data.text.split('\n');

    const students = lines.map(line => {
      const parts = line.trim().split(/\s+/);
      return {
        roll: parts[0],
        name: parts.slice(1).join(' '),
        pdfPath: `pdfs/${parts[0]}.pdf`
      };
    }).filter(s => s.roll && s.name);

    classDoc.students.push(...students);
    await classDoc.save();

    res.send("✅ Students added successfully!");
  } catch (err) {
    console.error("❌ PDF Error:", err);
    res.status(500).send("❌ Failed to process PDF");
  }
});

// POST /upload-answer - Upload student answer sheet
router.post('/upload-answer', answerUpload.single('answerSheet'), async (req, res) => {
  const { classCode, roll } = req.body;
  const filePath = `answersheets/${req.file.filename}`;

  try {
    const classDoc = await Class.findOne({ code: classCode });
    if (!classDoc) return res.status(404).send("❌ Class not found");

    const studentIndex = classDoc.students.findIndex(s => s.roll === roll);
    if (studentIndex === -1) return res.status(404).send("❌ Student not found");

    // Update answerPdf field
    classDoc.students[studentIndex].answerPdf = filePath;
    await classDoc.save();

    console.log(`✅ Answer sheet path saved: ${filePath}`);
    res.send("✅ Answer sheet uploaded and saved successfully!");
  } catch (error) {
    console.error("❌ Upload Error:", error);
    res.status(500).send("Something went wrong while uploading.");
  }
});

module.exports = router;
