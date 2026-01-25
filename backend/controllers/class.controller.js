/**
 * Class Controller
 * Handles HTTP requests for class management
 */

const classService = require('../services/class.service');
const { AppError } = require('../middleware/error.middleware');
const { isStudentInClass } = require('../utils/enrollmentResolver');

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
 * Create a new class (PHASE 5.1)
 * @route POST /api/v2/classes
 */
async function createClassV2(req, res) {
  try {
    const { name, title, description, subject } = req.body;
    const teacherId = req.user.id; // From authenticate middleware

    console.log('Creating class - Request body:', { name, title, description, subject });

    // Accept either name or title
    const className = (name || title || '').trim();
    
    if (!className) {
      return res.status(400).json({
        success: false,
        message: 'Class name/title is required'
      });
    }

    // Verify user is a teacher
    if (req.user.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Only teachers can create classes'
      });
    }

    const classDoc = await classService.createClassV2({
      name: className,
      title: className,
      description,
      subject,
      teacherId
    });

    console.log('Class created successfully:', {
      _id: classDoc._id,
      name: classDoc.name,
      title: classDoc.title,
      code: classDoc.code
    });

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: classDoc
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Class code already exists. Please try again.'
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
 * Get class by ID (with populated data) — PHASE 7.0 FIXED
 * @route GET /api/v2/classes/:id
 */
/**
 * PHASE 7.2 — Get Class By ID
 * Works for both teachers and enrolled students
 * 
 * @route GET /api/v2/classes/:id
 */
async function getClassById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    console.log('[Get Class By ID] Request:', {
      classId: id,
      userId,
      userRole: req.user.role
    });
    
    const Class = require('../models/Class');
    const classDoc = await Class.findById(id)
      .populate('teacher', 'name email role')
      .populate('students', 'name email role');

    if (!classDoc) {
      console.log('[Get Class By ID] Class not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Check if user has access (teacher or enrolled student)
    const isTeacher = classDoc.teacher?._id.toString() === userId;
    
    // PHASE 7.0: Use enrollment resolver for students
    let hasAccess = isTeacher;
    if (!isTeacher && req.user.role === 'student') {
      hasAccess = await isStudentInClass(id, userId);
      console.log('[Get Class By ID] Student access check:', hasAccess);
    }

    if (!hasAccess) {
      console.log('[Get Class By ID] Access denied for user:', userId);
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this class'
      });
    }

    console.log('[Get Class By ID] Success - returning class data');

    // Return populated class data with consistent shape
    res.status(200).json({
      success: true,
      class: {
        _id: classDoc._id,
        name: classDoc.name || classDoc.title,
        title: classDoc.title || classDoc.name,
        code: classDoc.code,
        description: classDoc.description,
        subject: classDoc.subject,
        teacher: classDoc.teacher,
        students: classDoc.students,
        studentCount: classDoc.students.length,
        createdAt: classDoc.createdAt
      }
    });
  } catch (error) {
    console.error('[Get Class By ID] Error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid class ID format'
      });
    }
    // PHASE 7.2: Ensure JSON error response
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve class',
      error: error.message
    });
  }
}

/**
 * Get all classes for a teacher — PHASE 5.1
 * @route GET /api/v2/classes/teacher
 */
async function getTeacherClasses(req, res) {
  try {
    const teacherId = req.user.id;
    
    const Class = require('../models/Class');
    const classes = await Class.find({ teacher: teacherId })
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 });

    // Add student count to each class
    const classesWithCounts = classes.map(cls => ({
      _id: cls._id,
      name: cls.name || cls.title,
      title: cls.title || cls.name,
      code: cls.code,
      description: cls.description,
      subject: cls.subject,
      teacher: cls.teacher,
      studentCount: cls.students.length,
      createdAt: cls.createdAt
    }));

    res.status(200).json({
      success: true,
      classes: classesWithCounts
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
 * Get all classes for a student — PHASE 7.0 FIXED
 * Uses Enrollment as source of truth
 * @route GET /api/v2/classes/student
 */
/**
 * PHASE 7.2 — Get Student Classes
 * Source of truth: Enrollment → Class
 * 
 * @route GET /api/v2/classes/student
 */
async function getStudentClasses(req, res) {
  try {
    const studentId = req.user.id;
    
    // PHASE 7.2: Log incoming request
    console.log('[Student Classes API] Request from:', {
      userId: studentId,
      userRole: req.user.role,
      userEmail: req.user.email
    });
    
    const Enrollment = require('../models/Enrollment');
    const Class = require('../models/Class');
    
    // PHASE 7.0: Query via Enrollment (source of truth)
    const enrollments = await Enrollment.find({
      studentId,
      status: 'active'
    })
    .populate({
      path: 'classId',
      populate: {
        path: 'teacher',
        select: 'name email'
      }
    })
    .sort({ joinedAt: -1 });

    console.log('[Student Classes API] Found enrollments:', enrollments.length);

    // Format response with consistent shape
    const classes = enrollments
      .filter(e => e.classId) // Only include if class still exists
      .map(e => ({
        _id: e.classId._id,
        name: e.classId.name || e.classId.title,
        title: e.classId.title || e.classId.name,
        code: e.classId.code,
        description: e.classId.description,
        subject: e.classId.subject,
        teacher: e.classId.teacher,
        studentCount: e.classId.students.length,
        createdAt: e.classId.createdAt,
        // Student-specific fields
        enrolledAt: e.joinedAt,
        rollNumber: e.rollNumber
      }));

    console.log('[Student Classes API] Returning classes:', classes.length);

    res.status(200).json({
      success: true,
      classes
    });
  } catch (error) {
    console.error('[Student Classes API] Error:', error);
    // PHASE 7.2: Ensure JSON error response
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve classes',
      error: error.message
    });
  }
}

/**
 * Join a class (student) — PHASE 5.1
 * @route POST /api/v2/classes/join
 */
async function joinClassV2(req, res) {
  try {
    const { classCode } = req.body;
    const studentUserId = req.user.id;

    if (!classCode) {
      return res.status(400).json({
        success: false,
        message: 'Class code is required'
      });
    }

    // Verify user is a student
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can join classes'
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

    // Check if student already joined (using ObjectId reference)
    const alreadyJoined = classDoc.students.some(
      studentId => studentId.toString() === studentUserId
    );

    if (alreadyJoined) {
      return res.status(400).json({
        success: false,
        message: 'You have already joined this class'
      });
    }

    // Add student User reference to class
    classDoc.students.push(studentUserId);
    await classDoc.save();

    res.status(200).json({
      success: true,
      message: 'Successfully joined class!',
      class: {
        _id: classDoc._id,
        name: classDoc.name || classDoc.title,
        title: classDoc.title || classDoc.name,
        code: classDoc.code
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to join class',
      error: error.message
    });
  }
}

/**
 * Get my classes (works for both teachers and students) — PHASE 5.1
 * @route GET /api/v2/classes/my
 */
async function getMyClasses(req, res) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const Class = require('../models/Class');
    let classes;

    if (userRole === 'teacher') {
      // Get classes where user is the teacher
      classes = await Class.find({ teacher: userId })
        .populate('teacher', 'name email')
        .sort({ createdAt: -1 });
    } else if (userRole === 'student') {
      // Get classes where user is in students array
      classes = await Class.find({ students: userId })
        .populate('teacher', 'name email')
        .sort({ createdAt: -1 });
    } else {
      return res.status(403).json({
        success: false,
        message: 'Invalid user role'
      });
    }

    // Format response
    const classesWithInfo = classes.map(cls => ({
      _id: cls._id,
      name: cls.name,
      code: cls.code,
      description: cls.description,
      subject: cls.subject,
      teacher: cls.teacher,
      studentCount: cls.students.length,
      createdAt: cls.createdAt
    }));

    res.status(200).json({
      success: true,
      classes: classesWithInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve classes',
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
  getClassById,
  getTeacherClasses,
  getStudentClasses,
  getMyClasses,
  joinClassV2,
  // V1 legacy functions
  createClass,
  joinClass
};
