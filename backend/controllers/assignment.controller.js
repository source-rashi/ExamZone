/**
 * PHASE 5.3 — Assignment Controller
 * Handles assignment CRUD and file operations
 */

const Assignment = require('../models/Assignment');
const Class = require('../models/Class');
const path = require('path');
const fs = require('fs');

/**
 * Create assignment with file upload (Teacher only)
 * POST /api/classes/:classId/assignments
 */
async function createAssignment(req, res) {
  try {
    const { classId } = req.params;
    const { title, description, dueDate } = req.body;
    const userId = req.user.id;

    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Assignment file (PDF) is required'
      });
    }

    // Validate required fields
    if (!title || !dueDate) {
      // Clean up uploaded file if validation fails
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Title and due date are required'
      });
    }

    // Verify class exists
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Verify user is the teacher
    if (classDoc.teacher.toString() !== userId) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(403).json({
        success: false,
        message: 'Only the class teacher can create assignments'
      });
    }

    // Create assignment
    const assignment = await Assignment.create({
      title: title.trim(),
      description: description || '',
      attachmentPath: req.file.path,
      class: classId,
      teacher: userId,
      dueDate: new Date(dueDate),
      submissions: []
    });

    // Populate teacher for response
    await assignment.populate('teacher', 'name email');

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: { assignment }
    });
  } catch (error) {
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Create assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create assignment',
      error: error.message
    });
  }
}

/**
 * Get all assignments for a class
 * GET /api/classes/:classId/assignments
 */
async function getAssignments(req, res) {
  try {
    const { classId } = req.params;
    const userId = req.user.id;

    // Verify class exists
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Verify user is a member of the class
    const isTeacher = classDoc.teacher.toString() === userId;
    const isStudent = classDoc.students.some(s => s.toString() === userId);

    if (!isTeacher && !isStudent) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this class'
      });
    }

    // Fetch assignments
    const assignments = await Assignment.find({ class: classId })
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 });

    // Add submission status for students
    const assignmentsWithStatus = assignments.map(assignment => {
      const assignmentObj = assignment.toObject();
      if (!isTeacher) {
        // Find student's submission
        const submission = assignment.submissions.find(
          sub => sub.student.toString() === userId
        );
        assignmentObj.hasSubmitted = !!submission;
        assignmentObj.submissionStatus = submission ? submission.status : null;
        // Don't send all submissions to students
        delete assignmentObj.submissions;
      } else {
        // Teacher gets submission count
        assignmentObj.submissionCount = assignment.submissions.length;
      }
      return assignmentObj;
    });

    res.status(200).json({
      success: true,
      message: 'Assignments fetched successfully',
      data: { assignments: assignmentsWithStatus }
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignments',
      error: error.message
    });
  }
}

/**
 * Download assignment file
 * GET /api/assignments/:id/download
 */
async function downloadAssignment(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find assignment
    const assignment = await Assignment.findById(id).populate('class');
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Verify user is a member of the class
    const isTeacher = assignment.class.teacher.toString() === userId;
    const isStudent = assignment.class.students.some(s => s.toString() === userId);

    if (!isTeacher && !isStudent) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this assignment'
      });
    }

    // Check if file exists
    if (!fs.existsSync(assignment.attachmentPath)) {
      return res.status(404).json({
        success: false,
        message: 'Assignment file not found'
      });
    }

    // Send file
    res.download(assignment.attachmentPath, `${assignment.title}.pdf`);
  } catch (error) {
    console.error('Download assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download assignment',
      error: error.message
    });
  }
}

/**
 * Submit assignment (Student only)
 * POST /api/assignments/:id/submit
 */
async function submitAssignment(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Submission file (PDF) is required'
      });
    }

    // Find assignment
    const assignment = await Assignment.findById(id).populate('class');
    if (!assignment) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Verify user is a student in the class
    const isStudent = assignment.class.students.some(s => s.toString() === userId);
    if (!isStudent) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(403).json({
        success: false,
        message: 'Only enrolled students can submit assignments'
      });
    }

    // Check if already submitted
    const existingSubmission = assignment.submissions.find(
      sub => sub.student.toString() === userId
    );

    if (existingSubmission) {
      // Delete old submission file
      if (fs.existsSync(existingSubmission.filePath)) {
        fs.unlinkSync(existingSubmission.filePath);
      }
      // Remove old submission
      assignment.submissions = assignment.submissions.filter(
        sub => sub.student.toString() !== userId
      );
    }

    // Add new submission
    assignment.submissions.push({
      student: userId,
      filePath: req.file.path,
      submittedAt: new Date(),
      status: 'submitted'
    });

    await assignment.save();

    res.status(200).json({
      success: true,
      message: 'Assignment submitted successfully',
      data: null
    });
  } catch (error) {
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Submit assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit assignment',
      error: error.message
    });
  }
}

/**
 * Get assignment submissions (Teacher only)
 * GET /api/assignments/:id/submissions
 */
async function getSubmissions(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find assignment with populated submissions
    const assignment = await Assignment.findById(id)
      .populate('submissions.student', 'name email')
      .populate('class');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Verify user is the teacher
    if (assignment.teacher.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the teacher can view submissions'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Submissions fetched successfully',
      data: { submissions: assignment.submissions }
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch submissions',
      error: error.message
    });
  }
}

/**
 * Download student submission (Teacher only)
 * GET /api/submissions/:submissionId/download
 */
async function downloadSubmission(req, res) {
  try {
    const { submissionId } = req.params;
    const userId = req.user.id;

    // Find assignment containing this submission
    const assignment = await Assignment.findOne({
      'submissions._id': submissionId
    }).populate('submissions.student', 'name');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Verify user is the teacher
    if (assignment.teacher.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the teacher can download submissions'
      });
    }

    // Find the specific submission
    const submission = assignment.submissions.find(
      sub => sub._id.toString() === submissionId
    );

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Check if file exists
    if (!fs.existsSync(submission.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Submission file not found'
      });
    }

    // Send file with student name
    const studentName = submission.student.name.replace(/\s+/g, '_');
    res.download(submission.filePath, `${studentName}_${assignment.title}.pdf`);
  } catch (error) {
    console.error('Download submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download submission',
      error: error.message
    });
  }
}

module.exports = {
  createAssignment,
  getAssignments,
  downloadAssignment,
  submitAssignment,
  getSubmissions,
  downloadSubmission
};
