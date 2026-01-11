/**
 * Class Controller
 * Handles HTTP requests for class management
 */

const classService = require('../services/class.service');
const { AppError } = require('../middleware/error.middleware');

// ===== LEGACY ROUTES (V1) =====
// Create a new class with derived title and icon
const createClass = async (req, res, next) => {
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

// ===== V2 ROUTES =====
/**
 * Create a new class
 * @route POST /api/v2/classes
 */
async function createClassV2(req, res) {
  try {
    const { title, description, subject, teacherId } = req.body;

    if (!title || !teacherId) {
      return res.status(400).json({
        success: false,
        message: 'Title and teacherId are required'
      });
    }

    const classDoc = await classService.createClassV2({
      title,
      description,
      subject,
      teacherId
    });

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: classDoc
    });
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('does not exist')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('not authorized') || error.message.includes('not a teacher')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Class code already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create class',
      error: error.message
    });
  }
}

/**
 * Get class by code
 * @route GET /api/v2/classes/:code
 */
async function getClassByCode(req, res) {
  try {
    const { code } = req.params;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Class code is required'
      });
    }

    const classDoc = await classService.getClassByCode(code);

    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    res.status(200).json({
      success: true,
      data: classDoc
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve class',
      error: error.message
    });
  }
}

/**
 * Get all classes for a teacher
 * @route GET /api/v2/classes/teacher
 */
async function getTeacherClasses(req, res) {
  try {
    const teacherId = req.user.id; // From authenticate middleware
    
    const Class = require('../models/Class');
    const classes = await Class.find({ 
      $or: [
        { teacherId: teacherId },
        { teacher: teacherId }
      ]
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      classes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve classes',
      error: error.message
    });
  }
}

/**
 * Get all classes for a student
 * @route GET /api/v2/classes/student
 */
async function getStudentClasses(req, res) {
  try {
    const studentEmail = req.user.email; // From authenticate middleware
    
    const Class = require('../models/Class');
    // Find classes where student's email is in the students array
    const classes = await Class.find({
      'students.email': studentEmail
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      classes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve classes',
      error: error.message
    });
  }
}

/**
 * Join a class (student)
 * @route POST /api/v2/classes/join
 */
async function joinClassV2(req, res) {
  try {
    const { classCode, name, email } = req.body;
    const studentUserId = req.user.id;
    const studentEmail = email || req.user.email;
    const studentName = name || req.user.name;

    if (!classCode) {
      return res.status(400).json({
        success: false,
        message: 'Class code is required'
      });
    }

    const Class = require('../models/Class');
    
    // Find class by code (case-insensitive)
    const classDoc = await Class.findOne({ 
      code: classCode.toUpperCase() 
    });

    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Class not found. Please check the code and try again.'
      });
    }

    // Check if student already joined
    const alreadyJoined = classDoc.students.some(
      student => student.email === studentEmail || 
                 (student.userId && student.userId.toString() === studentUserId)
    );

    if (alreadyJoined) {
      return res.status(400).json({
        success: false,
        message: 'You have already joined this class'
      });
    }

    // Add student to class
    classDoc.students.push({
      name: studentName,
      email: studentEmail,
      userId: studentUserId,
      roll: `STU${classDoc.students.length + 1}` // Auto-generate roll number
    });

    await classDoc.save();

    res.status(200).json({
      success: true,
      message: 'Successfully joined class!',
      class: classDoc
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to join class',
      error: error.message
    });
  }
}

// ===== LEGACY ROUTES (V1) =====
// Student joins a class
const joinClass = async (req, res, next) => {
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

// Export all functions
module.exports = {
  // V2 functions
  createClassV2,
  getClassByCode,
  getTeacherClasses,
  getStudentClasses,
  joinClassV2,
  // V1 legacy functions
  createClass,
  joinClass
};
