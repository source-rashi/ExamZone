const Class = require('../models/Class');

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
 * Check if class exists by code
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
exports.getStudentsWithAnswers = (classDoc, roll = null) => {
  if (roll) {
    const student = classDoc.students.find(s => s.roll === roll && s.answerPdf);
    return student ? [student] : [];
  }
  
  return classDoc.students.filter(s => s.answerPdf);
};
