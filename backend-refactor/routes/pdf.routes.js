const express = require('express');
const router = express.Router();
const axios = require('axios');
const Class = require('../models/Class');

// POST /generate-pdf - Fetch PDF from FastAPI server and store in database
router.post('/generate-pdf', async (req, res) => {
  const { classCode, roll, questions } = req.body;

  try {
    const response = await axios.post('http://127.0.0.1:8000/generate-pdf', {
      questions
    }, {
      responseType: 'arraybuffer'
    });

    const pdfBuffer = Buffer.from(response.data);

    const classDoc = await Class.findOne({ code: classCode });
    if (!classDoc) {
      return res.status(404).send('❌ Class not found');
    }

    const studentIndex = classDoc.students.findIndex(s => s.roll === roll);
    if (studentIndex === -1) {
      return res.status(404).send('❌ Student not found');
    }

    classDoc.students[studentIndex].pdfData = pdfBuffer;
    await classDoc.save();

    console.log(`✅ PDF generated and stored for roll ${roll} in database`);

    res.status(200).json({
      message: '✅ PDF generated and stored in database',
      pdfUrl: `/get-pdf?classCode=${classCode}&roll=${roll}`
    });

  } catch (error) {
    console.error('❌ Error generating PDF:', error.message);
    res.status(500).json({
      error: 'Failed to generate PDF',
      details: error.message
    });
  }
});

// GET /get-pdf - Retrieve PDF from database
router.get('/get-pdf', async (req, res) => {
  const { classCode, roll } = req.query;

  try {
    const classDoc = await Class.findOne({ code: classCode });
    if (!classDoc) {
      return res.status(404).send("❌ Class not found");
    }

    const student = classDoc.students.find(s => s.roll === roll);
    if (!student) {
      return res.status(404).send("❌ Student not found");
    }

    if (!student.pdfData) {
      return res.status(404).send("❌ PDF not yet generated");
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=${roll}.pdf`);
    res.send(student.pdfData);

  } catch (err) {
    console.error("❌ Error retrieving PDF:", err);
    res.status(500).send("❌ Server error");
  }
});

module.exports = router;
