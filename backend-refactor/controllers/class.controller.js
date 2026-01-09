const Class = require('../models/Class');

// Create a new class with derived title and icon
exports.createClass = async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Class code is required' });

  try {
    const existing = await Class.findOne({ code });
    if (existing) return res.status(409).json({ error: 'Class already exists' });

    // Derive class title and icon based on code prefix
    let title = 'New Subject';
    let icon = '📚';
    if (code.startsWith('PHY')) {
      title = 'Physics';
      icon = '⚛️';
    } else if (code.startsWith('CHEM')) {
      title = 'Chemistry';
      icon = '🧪';
    } else if (code.startsWith('BIO')) {
      title = 'Biology';
      icon = '🧬';
    } else if (code.startsWith('HIST')) {
      title = 'History';
      icon = '🌎';
    } else if (code.startsWith('MATH')) {
      title = 'Mathematics';
      icon = '🧮';
    } else if (code.startsWith('CSE')) {
      title = 'Computer Science';
      icon = '💻';
    }

    const newClass = new Class({
      code,
      title: `${title} - ${code}`,
      description: `New ${title.toLowerCase()} class section`,
      icon,
      students: [],
      assignments: 0,
      lastActive: new Date().toLocaleString()
    });

    await newClass.save();

    res.json({
      icon: newClass.icon,
      title: newClass.title,
      description: newClass.description,
      students: newClass.students.length,
      assignments: newClass.assignments,
      lastActive: newClass.lastActive
    });
  } catch (err) {
    console.error('🚨 Backend error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Student joins a class
exports.joinClass = async (req, res) => {
  const { classCode, rollNumber, name } = req.body;

  try {
    const classDoc = await Class.findOne({ code: classCode });

    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Class not found!' });
    }

    const existingStudent = classDoc.students.find(
      (student) => student.roll === rollNumber
    );

    if (existingStudent) {
      return res.json({ success: true, message: 'You have already joined this class!' });
    }

    classDoc.students.push({
      roll: rollNumber,
      name: name || '',
      pdfPath: `/pdfs/${rollNumber}.pdf`,
      answerPdf: '',
    });

    await classDoc.save();

    res.json({ success: true, message: `Successfully joined class ${classCode}!` });
  } catch (error) {
    console.error('Error joining class:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
