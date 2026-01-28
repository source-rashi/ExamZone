/**
 * PHASE 7.0 — Centralized Enrollment Resolution
 * Single source of truth for student-class relationship queries
 */

const Enrollment = require('../models/Enrollment');
const Class = require('../models/Class');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Resolve student's enrollment and relationship to a class
 * This is the CANONICAL way to verify a student belongs to a class
 * 
 * @param {string|ObjectId} classId - Class ID
 * @param {string|ObjectId} studentId - Student ID (User._id)
 * @returns {Promise<Object>} Resolution result
 * @throws {Error} If validation fails
 */
async function resolveStudentInClass(classId, studentId) {
  // Validate inputs
  if (!classId || !studentId) {
    throw new Error('classId and studentId are required');
  }

  // Convert to ObjectId if needed
  const classObjectId = mongoose.Types.ObjectId.isValid(classId) 
    ? classId 
    : null;
  const studentObjectId = mongoose.Types.ObjectId.isValid(studentId) 
    ? studentId 
    : null;

  if (!classObjectId) {
    throw new Error('Invalid classId format');
  }

  if (!studentObjectId) {
    throw new Error('Invalid studentId format');
  }

  // 1. Verify class exists
  const classDoc = await Class.findById(classObjectId);
  if (!classDoc) {
    throw new Error('Class not found');
  }

  // 2. Verify student exists
  const student = await User.findById(studentObjectId);
  if (!student) {
    throw new Error('Student user not found');
  }

  if (student.role !== 'student') {
    throw new Error('User is not a student');
  }

  // 3. Find enrollment (CRITICAL: This is the source of truth)
  const enrollment = await Enrollment.findOne({
    classId: classObjectId,
    studentId: studentObjectId
  });

  if (!enrollment) {
    throw new Error('Student is not enrolled in this class');
  }

  // 4. Verify enrollment is active
  if (enrollment.status !== 'active') {
    throw new Error(`Enrollment is ${enrollment.status}. Student cannot access class.`);
  }

  // 5. Verify student is in Class.students[] (double-check integrity)
  const isInStudentsList = classDoc.students.some(
    s => s.toString() === studentObjectId.toString()
  );

  if (!isInStudentsList) {
    console.warn('[Enrollment Integrity Warning] Student has enrollment but not in Class.students[]', {
      classId: classObjectId,
      studentId: studentObjectId,
      enrollmentId: enrollment._id
    });
    
    // FIXED: Don't throw error - Enrollment table is source of truth
    // Auto-fix by adding student to class
    console.log('[Enrollment Auto-Fix] Adding student to Class.students[] array');
    classDoc.students.push(studentObjectId);
    await classDoc.save();
  }

  // Return validated resolution
  return {
    // Enrollment data
    enrollment: {
      _id: enrollment._id,
      rollNumber: enrollment.rollNumber,
      joinedAt: enrollment.joinedAt,
      status: enrollment.status
    },
    
    // Roll number (quick access)
    rollNumber: enrollment.rollNumber,
    
    // Class reference
    class: {
      _id: classDoc._id,
      name: classDoc.name || classDoc.title,
      code: classDoc.code,
      teacher: classDoc.teacher
    },
    
    // Student reference
    student: {
      _id: student._id,
      name: student.name,
      email: student.email,
      role: student.role
    },
    
    // Verification flags
    isVerified: true,
    verifiedAt: new Date()
  };
}

/**
 * Quick check if student is enrolled in class (boolean only)
 * Use this for simple authorization checks
 * 
 * @param {string|ObjectId} classId - Class ID
 * @param {string|ObjectId} studentId - Student ID
 * @returns {Promise<boolean>} True if enrolled and active
 */
async function isStudentInClass(classId, studentId) {
  try {
    const enrollment = await Enrollment.findOne({
      classId,
      studentId,
      status: 'active'
    });
    return !!enrollment;
  } catch (error) {
    console.error('[Enrollment Check] Error:', error);
    return false;
  }
}

/**
 * Get student's roll number in a class
 * Returns null if not enrolled
 * 
 * @param {string|ObjectId} classId - Class ID
 * @param {string|ObjectId} studentId - Student ID
 * @returns {Promise<number|null>} Roll number or null
 */
async function getStudentRollNumber(classId, studentId) {
  try {
    const enrollment = await Enrollment.findOne({
      classId,
      studentId,
      status: 'active'
    }).select('rollNumber');
    
    return enrollment ? enrollment.rollNumber : null;
  } catch (error) {
    console.error('[Roll Number Lookup] Error:', error);
    return null;
  }
}

/**
 * Get all enrollments for a student
 * 
 * @param {string|ObjectId} studentId - Student ID
 * @returns {Promise<Array>} Array of enrollment resolutions
 */
async function getStudentEnrollments(studentId) {
  const enrollments = await Enrollment.find({
    studentId,
    status: 'active'
  }).populate('classId');

  return enrollments.map(e => ({
    enrollment: e,
    rollNumber: e.rollNumber,
    class: e.classId,
    joinedAt: e.joinedAt
  }));
}

/**
 * Resolve multiple students in a class (batch operation)
 * 
 * @param {string|ObjectId} classId - Class ID
 * @param {Array<string|ObjectId>} studentIds - Array of student IDs
 * @returns {Promise<Array>} Array of resolution results
 */
async function resolveMultipleStudentsInClass(classId, studentIds) {
  const enrollments = await Enrollment.find({
    classId,
    studentId: { $in: studentIds },
    status: 'active'
  }).populate('studentId', 'name email role');

  return enrollments.map(e => ({
    enrollment: e,
    rollNumber: e.rollNumber,
    student: e.studentId,
    classId: e.classId
  }));
}

module.exports = {
  resolveStudentInClass,
  isStudentInClass,
  getStudentRollNumber,
  getStudentEnrollments,
  resolveMultipleStudentsInClass
};
