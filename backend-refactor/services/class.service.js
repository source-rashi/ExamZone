const Class = require('../models/Class');
const User = require('../models/User');

/**
 * Class Service
 * Business logic for class management
 * Includes legacy functions for backward compatibility
 */

// ============================================================================
// LEGACY FUNCTIONS (Preserved for backward compatibility with old routes)
// ============================================================================

/**
 * Derive class title and icon from class code prefix
 * @param {string} code - Class code
 * @returns {Object} Object with title and icon
 */
exports.deriveClassInfo = (code) => {
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
  
  return { title, icon };
};

/**
 * Check if class exists by code (Legacy)
 * @param {string} code - Class code
 * @returns {Promise<Object|null>} Class document or null
 */
exports.findClassByCode = async (code) => {
  return await Class.findOne({ code });
};

/**
 * Create a new class
 * @param {string} code - Class code
 * @returns {Promise<Object>} Created class document
 */
exports.createClass = async (code) => {
  const existing = await exports.findClassByCode(code);
  if (existing) {
    throw new Error('Class already exists');
  }
  
  const { title, icon } = exports.deriveClassInfo(code);
  
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
  return newClass;
};

/**
 * Find student in class by roll number
 * @param {Object} classDoc - Class document
 * @param {string} roll - Student roll number
 * @returns {Object|undefined} Student object or undefined
 */
exports.findStudent = (classDoc, roll) => {
  return classDoc.students.find(student => student.roll === roll);
};

/**
 * Add student to class
 * @param {Object} classDoc - Class document
 * @param {string} rollNumber - Student roll number
 * @param {string} name - Student name
 * @returns {Promise<Object>} Updated class document
 */
exports.addStudent = async (classDoc, rollNumber, name = '') => {
  const existingStudent = exports.findStudent(classDoc, rollNumber);
  
  if (existingStudent) {
    return { alreadyExists: true, classDoc };
  }
  
  classDoc.students.push({
    roll: rollNumber,
    name: name,
    pdfPath: `/pdfs/${rollNumber}.pdf`,
    answerPdf: '',
  });
  
  await classDoc.save();
  return { alreadyExists: false, classDoc };
};

/**
 * Add multiple students to class
 * @param {Object} classDoc - Class document
 * @param {Array} students - Array of student objects
 * @returns {Promise<Object>} Updated class document
 */
exports.addMultipleStudents = async (classDoc, students) => {
  classDoc.students.push(...students);
  await classDoc.save();
  return classDoc;
};

/**
 * Update student's answer sheet path
 * @param {Object} classDoc - Class document
 * @param {string} roll - Student roll number
 * @param {string} answerPdfPath - Path to answer sheet
 * @returns {Promise<Object>} Updated class document
 */
exports.updateStudentAnswerSheet = async (classDoc, roll, answerPdfPath) => {
  const studentIndex = classDoc.students.findIndex(s => s.roll === roll);
  
  if (studentIndex === -1) {
    throw new Error('Student not found');
  }
  
  classDoc.students[studentIndex].answerPdf = answerPdfPath;
  await classDoc.save();
  
  return classDoc;
};

/**
 * Get students with answer sheets
 * @param {Object} classDoc - Class document
 * @param {string} roll - Optional roll number to filter
 * @returns {Array} Array of students with answer sheets
 */
exports.getStudentsWithAnswerSheets = (classDoc, roll = null) => {
  let students = classDoc.students.filter(s => s.answerPdf && s.answerPdf !== '');
  
  if (roll) {
    students = students.filter(s => s.roll === roll);
  }
  
  return students;
};

// ============================================================================
// PHASE 5.1 FUNCTIONS (Real classroom data with User references)
// ============================================================================

/**
 * Create a new class with real User references — PHASE 5.1
 * @param {Object} data - Class data including teacherId
 * @returns {Promise<Object>} Created class
 */
exports.createClassV2 = async (data) => {
  const { teacherId, name, title, description, subject } = data;

  if (!teacherId) {
    throw new Error('teacherId is required');
  }

  const className = name || title;
  
  if (!className) {
    throw new Error('Class name/title is required');
  }

  // Validate teacher exists
  const teacher = await User.findById(teacherId);
  if (!teacher) {
    throw new Error('Teacher not found');
  }

  if (teacher.role !== 'teacher') {
    throw new Error('Only teachers can create classes');
  }

  // Generate unique 6-character class code
  const classCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  // Create new class with User reference
  const classData = {
    name: className,
    title: className,
    code: classCode,
    description: description || '',
    subject: subject || '',
    teacher: teacherId, // User reference
    students: [], // Will store User references only
    icon: '📚',
    assignments: 0,
    createdAt: new Date()
  };

  const newClass = await Class.create(classData);
  return newClass;
};

/**
 * Get class by code (Phase 3)
 * @param {String} code - Class code
 * @returns {Promise<Object>} Class document
 */
exports.getClassByCode = async (code) => {
  const classDoc = await Class.findOne({ code });
  
  if (!classDoc) {
    throw new Error('Class not found');
  }

  return classDoc;
};

/**
 * Get class by ID (Phase 3)
 * @param {ObjectId} classId - Class ID
 * @returns {Promise<Object>} Class document
 */
exports.getClassById = async (classId) => {
  const classDoc = await Class.findById(classId);
  
  if (!classDoc) {
    throw new Error('Class not found');
  }

  return classDoc;
};

/**
 * Get all classes for a teacher (Phase 3)
 * @param {ObjectId} teacherId - Teacher ID
 * @returns {Promise<Array>} Array of classes
 */
exports.getTeacherClasses = async (teacherId) => {
  const classes = await Class.find({ teacherId })
    .sort({ createdAt: -1 })
    .lean();
  
  return classes;
};

/**
 * Update class details (Phase 3)
 * @param {ObjectId} classId - Class ID
 * @param {ObjectId} teacherId - Teacher ID (for authorization)
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated class
 */
exports.updateClass = async (classId, teacherId, updates) => {
  const classDoc = await Class.findById(classId);
  
  if (!classDoc) {
    throw new Error('Class not found');
  }

  // Verify teacher owns this class
  if (classDoc.teacherId?.toString() !== teacherId.toString() && 
      classDoc.teacher?.toString() !== teacherId.toString()) {
    throw new Error('Unauthorized: You do not own this class');
  }

  // Apply updates (whitelist allowed fields)
  const allowedUpdates = ['title', 'description', 'subject', 'icon'];
  Object.keys(updates).forEach(key => {
    if (allowedUpdates.includes(key)) {
      classDoc[key] = updates[key];
    }
  });

  await classDoc.save();
  return classDoc;
};

/**
 * Delete class (Phase 3)
 * @param {ObjectId} classId - Class ID
 * @param {ObjectId} teacherId - Teacher ID (for authorization)
 * @returns {Promise<Boolean>} Success status
 */
exports.deleteClass = async (classId, teacherId) => {
  const classDoc = await Class.findById(classId);
  
  if (!classDoc) {
    throw new Error('Class not found');
  }

  // Verify teacher owns this class
  if (classDoc.teacherId?.toString() !== teacherId.toString() && 
      classDoc.teacher?.toString() !== teacherId.toString()) {
    throw new Error('Unauthorized: You do not own this class');
  }

  await Class.findByIdAndDelete(classId);
  return true;
};
