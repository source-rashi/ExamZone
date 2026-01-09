const pdfParse = require('pdf-parse');
const fileService = require('./file.service');

/**
 * Parse PDF file and extract text
 * @param {string} filePath - Path to PDF file
 * @returns {Promise<Object>} Parsed PDF data
 */
exports.parsePDF = async (filePath) => {
  const buffer = fileService.readFile(filePath);
  const data = await pdfParse(buffer);
  return data;
};

/**
 * Extract students from PDF text
 * @param {string} text - PDF text content
 * @returns {Array} Array of student objects with roll, name, pdfPath
 */
exports.extractStudentsFromPDF = (text) => {
  const lines = text.split('\n');
  
  const students = lines.map(line => {
    const parts = line.trim().split(/\s+/);
    return {
      roll: parts[0],
      name: parts.slice(1).join(' '),
      pdfPath: `pdfs/${parts[0]}.pdf`
    };
  }).filter(s => s.roll && s.name);
  
  return students;
};

/**
 * Store PDF buffer in database for a student
 * @param {Object} classDoc - Class document
 * @param {string} roll - Student roll number
 * @param {Buffer} pdfBuffer - PDF buffer to store
 * @returns {Promise<Object>} Updated class document
 */
exports.storePDFBuffer = async (classDoc, roll, pdfBuffer) => {
  const studentIndex = classDoc.students.findIndex(s => s.roll === roll);
  
  if (studentIndex === -1) {
    throw new Error('Student not found');
  }
  
  classDoc.students[studentIndex].pdfData = pdfBuffer;
  await classDoc.save();
  
  return classDoc;
};

/**
 * Retrieve PDF buffer from database for a student
 * @param {Object} classDoc - Class document
 * @param {string} roll - Student roll number
 * @returns {Buffer} PDF buffer
 */
exports.getPDFBuffer = (classDoc, roll) => {
  const student = classDoc.students.find(s => s.roll === roll);
  
  if (!student) {
    throw new Error('Student not found');
  }
  
  if (!student.pdfData) {
    throw new Error('PDF not yet generated');
  }
  
  return student.pdfData;
};

/**
 * Check if student has PDF data
 * @param {Object} student - Student object
 * @returns {boolean} True if PDF exists
 */
exports.hasPDFData = (student) => {
  return !!student.pdfData;
};
