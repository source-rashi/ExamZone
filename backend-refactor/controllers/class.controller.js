const classService = require('../services/class.service');

// Create a new class with derived title and icon
exports.createClass = async (req, res) => {
  const { code } = req.body;
  
  // Validate request
  if (!code) return res.status(400).json({ error: 'Class code is required' });

  try {
    // Call service to create class
    const newClass = await classService.createClass(code);

    // Return response
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
    
    if (err.message === 'Class already exists') {
      return res.status(409).json({ error: 'Class already exists' });
    }
    
    res.status(500).json({ error: 'Server error' });
  }
};

// Student joins a class
exports.joinClass = async (req, res) => {
  const { classCode, rollNumber, name } = req.body;

  try {
    // Find class
    const classDoc = await classService.findClassByCode(classCode);

    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Class not found!' });
    }

    // Add student to class
    const result = await classService.addStudent(classDoc, rollNumber, name || '');

    if (result.alreadyExists) {
      return res.json({ success: true, message: 'You have already joined this class!' });
    }

    // Return response
    res.json({ success: true, message: `Successfully joined class ${classCode}!` });
  } catch (error) {
    console.error('Error joining class:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
