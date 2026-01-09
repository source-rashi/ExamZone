const classService = require('../services/class.service');
const { AppError } = require('../middleware/error.middleware');

// Create a new class with derived title and icon
exports.createClass = async (req, res, next) => {
  const { code } = req.body;

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
    if (err.message === 'Class already exists') {
      return next(new AppError('Class already exists', 409));
    }
    next(err);
  }
};

// Student joins a class
exports.joinClass = async (req, res, next) => {
  const { classCode, rollNumber, name } = req.body;

  try {
    // Find class
    const classDoc = await classService.findClassByCode(classCode);

    if (!classDoc) {
      return next(new AppError('Class not found!', 404));
    }

    // Add student to class
    const result = await classService.addStudent(classDoc, rollNumber, name || '');

    if (result.alreadyExists) {
      return res.json({ success: true, message: 'You have already joined this class!' });
    }

    // Return response
    res.json({ success: true, message: `Successfully joined class ${classCode}!` });
  } catch (error) {
    next(error);
  }
};
