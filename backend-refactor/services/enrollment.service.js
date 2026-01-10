const Enrollment = require('../models/Enrollment');
const Class = require('../models/Class');
const User = require('../models/User');

/**
 * Enrollment Service
 * Business logic for student enrollment management
 */

/**
 * Enroll a student in a class
 * @param {Object} data - Enrollment data {classId, studentId, enrolledBy}
 * @returns {Promise<Object>} Enrollment document
 */
async function enrollStudent(data) {
  const { classId, studentId, enrolledBy } = data;

  // Validate class exists
  const classDoc = await Class.findById(classId);
  if (!classDoc) {
    throw new Error('Class not found');
  }

  // Validate student exists
  const student = await User.findById(studentId);
  if (!student) {
    throw new Error('Student not found');
  }

  if (student.role !== 'student') {
    throw new Error('Only students can enroll in classes');
  }

  // Validate enrolledBy (teacher authorization)
  if (enrolledBy) {
    const enrollingUser = await User.findById(enrolledBy);
    if (!enrollingUser) {
      throw new Error('Enrolling user not found');
    }
    
    // Check if enrolling user is the class teacher or an admin
    if (enrollingUser.role !== 'teacher' && enrollingUser.role !== 'admin') {
      throw new Error('Only teachers can enroll students');
    }
  }

  // Check for existing enrollment
  const existingEnrollment = await Enrollment.findOne({ classId, studentId });
  if (existingEnrollment) {
    if (existingEnrollment.status === 'blocked') {
      throw new Error('You are blocked from this class');
    }
    throw new Error('Already enrolled in this class');
  }

  // Create enrollment
  const enrollment = await Enrollment.create({
    classId,
    studentId,
    enrolledBy: enrolledBy || studentId, // Self-enrollment if no enrolledBy provided
    status: 'active'
  });

  return enrollment;
}

/**
 * Get all students enrolled in a class
 * @param {ObjectId} classId - Class ID
 * @param {Object} options - Query options (status, pagination)
 * @returns {Promise<Array>} Array of enrollments with student data
 */
async function getClassStudents(classId, options = {}) {
  const { status = 'active', page = 1, limit = 50 } = options;

  // Validate class exists
  const classDoc = await Class.findById(classId);
  if (!classDoc) {
    throw new Error('Class not found');
  }

  const query = { classId };
  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;

  const enrollments = await Enrollment.find(query)
    .populate('studentId', 'name email')
    .sort({ joinedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Enrollment.countDocuments(query);

  return {
    enrollments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Get all classes a student is enrolled in
 * @param {ObjectId} studentId - Student ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of enrollments with class data
 */
async function getStudentClasses(studentId, options = {}) {
  const { status = 'active' } = options;

  const query = { studentId };
  if (status) {
    query.status = status;
  }

  const enrollments = await Enrollment.find(query)
    .populate('classId', 'code title description subject icon teacherId')
    .sort({ joinedAt: -1 })
    .lean();

  return enrollments;
}

/**
 * Unenroll a student from a class
 * @param {ObjectId} classId - Class ID
 * @param {ObjectId} studentId - Student ID
 * @returns {Promise<Boolean>} Success status
 */
async function unenrollStudent(classId, studentId) {
  const enrollment = await Enrollment.findOne({ classId, studentId });
  
  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  await Enrollment.findByIdAndDelete(enrollment._id);
  return true;
}

/**
 * Block a student from a class
 * @param {ObjectId} classId - Class ID
 * @param {ObjectId} studentId - Student ID
 * @param {ObjectId} teacherId - Teacher ID (for authorization)
 * @returns {Promise<Object>} Updated enrollment
 */
async function blockStudent(classId, studentId, teacherId) {
  // Validate teacher owns the class
  const classDoc = await Class.findById(classId);
  if (!classDoc) {
    throw new Error('Class not found');
  }

  if (classDoc.teacherId?.toString() !== teacherId.toString() && 
      classDoc.teacher?.toString() !== teacherId.toString()) {
    throw new Error('Unauthorized: You do not own this class');
  }

  const enrollment = await Enrollment.findOne({ classId, studentId });
  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  enrollment.status = 'blocked';
  await enrollment.save();

  return enrollment;
}

/**
 * Unblock a student from a class
 * @param {ObjectId} classId - Class ID
 * @param {ObjectId} studentId - Student ID
 * @param {ObjectId} teacherId - Teacher ID (for authorization)
 * @returns {Promise<Object>} Updated enrollment
 */
async function unblockStudent(classId, studentId, teacherId) {
  // Validate teacher owns the class
  const classDoc = await Class.findById(classId);
  if (!classDoc) {
    throw new Error('Class not found');
  }

  if (classDoc.teacherId?.toString() !== teacherId.toString() && 
      classDoc.teacher?.toString() !== teacherId.toString()) {
    throw new Error('Unauthorized: You do not own this class');
  }

  const enrollment = await Enrollment.findOne({ classId, studentId });
  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  enrollment.status = 'active';
  await enrollment.save();

  return enrollment;
}

/**
 * Check if student is enrolled in class
 * @param {ObjectId} classId - Class ID
 * @param {ObjectId} studentId - Student ID
 * @returns {Promise<Boolean>} Enrollment status
 */
async function isStudentEnrolled(classId, studentId) {
  const enrollment = await Enrollment.findOne({ 
    classId, 
    studentId, 
    status: 'active' 
  });
  
  return !!enrollment;
}

/**
 * Get enrollment count for a class
 * @param {ObjectId} classId - Class ID
 * @returns {Promise<Number>} Count of active enrollments
 */
async function getClassEnrollmentCount(classId) {
  const count = await Enrollment.countDocuments({ 
    classId, 
    status: 'active' 
  });
  
  return count;
}

module.exports = {
  enrollStudent,
  getClassStudents,
  getStudentClasses,
  unenrollStudent,
  blockStudent,
  unblockStudent,
  isStudentEnrolled,
  getClassEnrollmentCount
};
