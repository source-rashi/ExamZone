/**
 * Validation middleware for Express routes
 * Validates request data before passing to controllers
 */

/**
 * Validate class creation request
 * Required: code (string, non-empty)
 */
exports.validateCreateClass = (req, res, next) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Class code is required' });
  }

  if (typeof code !== 'string') {
    return res.status(400).json({ error: 'Class code must be a string' });
  }

  if (code.trim().length === 0) {
    return res.status(400).json({ error: 'Class code cannot be empty' });
  }

  if (code.length > 50) {
    return res.status(400).json({ error: 'Class code must be less than 50 characters' });
  }

  // Sanitize: trim whitespace
  req.body.code = code.trim();

  next();
};

/**
 * Validate join class request
 * Required: classCode (string), rollNumber (string), name (string, optional)
 */
exports.validateJoinClass = (req, res, next) => {
  const { classCode, rollNumber, name } = req.body;

  if (!classCode) {
    return res.status(400).json({ success: false, message: 'Class code is required' });
  }

  if (!rollNumber) {
    return res.status(400).json({ success: false, message: 'Roll number is required' });
  }

  if (typeof classCode !== 'string' || typeof rollNumber !== 'string') {
    return res.status(400).json({ success: false, message: 'Class code and roll number must be strings' });
  }

  if (classCode.trim().length === 0 || rollNumber.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Class code and roll number cannot be empty' });
  }

  if (name && typeof name !== 'string') {
    return res.status(400).json({ success: false, message: 'Name must be a string' });
  }

  // Sanitize: trim whitespace
  req.body.classCode = classCode.trim();
  req.body.rollNumber = rollNumber.trim();
  if (name) req.body.name = name.trim();

  next();
};

/**
 * Validate student access request
 * Required: classCode (string), roll (string)
 */
exports.validateStudentAccess = (req, res, next) => {
  const { classCode, roll } = req.body;

  if (!classCode || !roll) {
    return res.status(400).send("❌ Class code and roll number are required");
  }

  if (typeof classCode !== 'string' || typeof roll !== 'string') {
    return res.status(400).send("❌ Class code and roll number must be strings");
  }

  if (classCode.trim().length === 0 || roll.trim().length === 0) {
    return res.status(400).send("❌ Class code and roll number cannot be empty");
  }

  // Sanitize: trim whitespace
  req.body.classCode = classCode.trim();
  req.body.roll = roll.trim();

  next();
};

/**
 * Validate get answers request
 * Required: classCode (string), roll (string, optional)
 */
exports.validateGetAnswers = (req, res, next) => {
  const { classCode, roll } = req.body;

  if (!classCode) {
    return res.status(400).send("❌ Class code is required");
  }

  if (typeof classCode !== 'string') {
    return res.status(400).send("❌ Class code must be a string");
  }

  if (classCode.trim().length === 0) {
    return res.status(400).send("❌ Class code cannot be empty");
  }

  if (roll) {
    if (typeof roll !== 'string') {
      return res.status(400).send("❌ Roll number must be a string");
    }
    if (roll.trim().length === 0) {
      return res.status(400).send("❌ Roll number cannot be empty");
    }
    req.body.roll = roll.trim();
  }

  // Sanitize: trim whitespace
  req.body.classCode = classCode.trim();

  next();
};

/**
 * Validate student list upload request
 * Required: classCode (string), file (PDF)
 */
exports.validateStudentListUpload = (req, res, next) => {
  const { classCode } = req.body;

  if (!classCode) {
    return res.status(400).send("❌ Class code is required");
  }

  if (typeof classCode !== 'string') {
    return res.status(400).send("❌ Class code must be a string");
  }

  if (classCode.trim().length === 0) {
    return res.status(400).send("❌ Class code cannot be empty");
  }

  if (!req.file) {
    return res.status(400).send("❌ PDF file is required");
  }

  // Validate file type
  if (req.file.mimetype !== 'application/pdf') {
    return res.status(400).send("❌ Only PDF files are allowed");
  }

  // Validate file size (max 10MB)
  if (req.file.size > 10 * 1024 * 1024) {
    return res.status(400).send("❌ File size must be less than 10MB");
  }

  // Sanitize: trim whitespace
  req.body.classCode = classCode.trim();

  next();
};

/**
 * Validate answer sheet upload request
 * Required: classCode (string), roll (string), file (PDF)
 */
exports.validateAnswerSheetUpload = (req, res, next) => {
  const { classCode, roll } = req.body;

  if (!classCode || !roll) {
    return res.status(400).send("❌ Class code and roll number are required");
  }

  if (typeof classCode !== 'string' || typeof roll !== 'string') {
    return res.status(400).send("❌ Class code and roll number must be strings");
  }

  if (classCode.trim().length === 0 || roll.trim().length === 0) {
    return res.status(400).send("❌ Class code and roll number cannot be empty");
  }

  if (!req.file) {
    return res.status(400).send("❌ Answer sheet file is required");
  }

  // Validate file type
  if (req.file.mimetype !== 'application/pdf') {
    return res.status(400).send("❌ Only PDF files are allowed");
  }

  // Validate file size (max 10MB)
  if (req.file.size > 10 * 1024 * 1024) {
    return res.status(400).send("❌ File size must be less than 10MB");
  }

  // Sanitize: trim whitespace
  req.body.classCode = classCode.trim();
  req.body.roll = roll.trim();

  next();
};

/**
 * Validate PDF generation request
 * Required: classCode (string), roll (string), questions (array)
 */
exports.validateGeneratePDF = (req, res, next) => {
  const { classCode, roll, questions } = req.body;

  if (!classCode || !roll) {
    return res.status(400).json({ error: 'Class code and roll number are required' });
  }

  if (typeof classCode !== 'string' || typeof roll !== 'string') {
    return res.status(400).json({ error: 'Class code and roll number must be strings' });
  }

  if (!questions) {
    return res.status(400).json({ error: 'Questions array is required' });
  }

  if (!Array.isArray(questions)) {
    return res.status(400).json({ error: 'Questions must be an array' });
  }

  if (questions.length === 0) {
    return res.status(400).json({ error: 'At least one question is required' });
  }

  // Sanitize: trim whitespace
  req.body.classCode = classCode.trim();
  req.body.roll = roll.trim();

  next();
};

/**
 * Validate get PDF request
 * Required: classCode (query string), roll (query string)
 */
exports.validateGetPDF = (req, res, next) => {
  const { classCode, roll } = req.query;

  if (!classCode || !roll) {
    return res.status(400).send("❌ Class code and roll number are required");
  }

  if (typeof classCode !== 'string' || typeof roll !== 'string') {
    return res.status(400).send("❌ Class code and roll number must be strings");
  }

  if (classCode.trim().length === 0 || roll.trim().length === 0) {
    return res.status(400).send("❌ Class code and roll number cannot be empty");
  }

  // Sanitize: trim whitespace
  req.query.classCode = classCode.trim();
  req.query.roll = roll.trim();

  next();
};
