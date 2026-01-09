const Class = require('../models/Class');

// Get student PDF link
exports.studentAccess = async (req, res) => {
  const { classCode, roll } = req.body;

  try {
    const classDoc = await Class.findOne({ code: classCode });
    if (!classDoc) return res.status(404).send("❌ Class not found");

    const student = classDoc.students.find(s => s.roll === roll);
    if (!student) return res.status(404).send("❌ Student not found");

    if (!student.pdfData) {
      return res.status(404).send("❌ PDF not generated yet. Please generate the PDF first.");
    }

    res.send(`✅ <a href="/get-pdf?classCode=${classCode}&roll=${roll}" target="_blank">${roll}.pdf</a>`);
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).send("❌ Server error");
  }
};

// Retrieve answer sheets for class or specific student
exports.getAnswers = async (req, res) => {
  const { classCode, roll } = req.body;

  try {
    const classDoc = await Class.findOne({ code: classCode });
    if (!classDoc) return res.status(404).send("❌ Class not found");

    let resultHtml = `<h2>📚 Answer Sheets for Class ${classCode}</h2><ul>`;

    if (roll) {
      const student = classDoc.students.find(s => s.roll === roll && s.answerPdf);
      if (!student) return res.send("❌ No answer sheet for this roll number");
      resultHtml += `<li><a href="/${student.answerPdf}" target="_blank">${roll}.pdf</a></li>`;
    } else {
      const submitted = classDoc.students.filter(s => s.answerPdf);
      if (submitted.length === 0) return res.send("❌ No answer sheets submitted yet.");
      submitted.forEach(s => {
        resultHtml += `<li><a href="/${s.answerPdf}" target="_blank">${s.roll}.pdf</a></li>`;
      });
    }

    resultHtml += `</ul><br><a href="/">🔙 Back to Home</a>`;
    res.send(resultHtml);
  } catch (err) {
    console.error("❌ Fetch Error:", err);
    res.status(500).send("❌ Server error");
  }
};
