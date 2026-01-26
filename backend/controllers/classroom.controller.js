const Announcement = require('../models/Announcement');
const Exam = require('../models/Exam');
const Assignment = require('../models/Assignment');
const Class = require('../models/Class');
const { isStudentInClass } = require('../utils/enrollmentResolver');

// ==================== ANNOUNCEMENTS ====================

async function createAnnouncement(req, res) {
  try {
    const { id: classId } = req.params;
    const { content } = req.body;
    const teacherId = req.user.id;
    const teacherName = req.user.name;

    // Verify teacher owns this class
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    if (classDoc.teacherId?.toString() !== teacherId && classDoc.teacher?.toString() !== teacherId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const announcement = await Announcement.create({
      classId,
      teacherId,
      teacherName,
      content
    });

    res.status(201).json({ success: true, announcement });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ success: false, message: 'Failed to create announcement' });
  }
}

async function getAnnouncements(req, res) {
  try {
    const { id: classId } = req.params;
    const userId = req.user.id;

    // Verify user has access to this class
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    // Check if user is teacher or student in this class
    const isTeacher = classDoc.teacherId?.toString() === userId || classDoc.teacher?.toString() === userId;
    
    // PHASE 7.0: Use enrollment resolver for students
    let hasAccess = isTeacher;
    if (!isTeacher && req.user.role === 'student') {
      hasAccess = await isStudentInClass(classId, userId);
    }

    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const announcements = await Announcement.find({ classId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, announcements });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ success: false, message: 'Failed to get announcements' });
  }
}

async function deleteAnnouncement(req, res) {
  try {
    const { id: classId, announcementId } = req.params;
    const teacherId = req.user.id;

    // Verify teacher owns this class
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    if (classDoc.teacherId?.toString() !== teacherId && classDoc.teacher?.toString() !== teacherId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Delete announcement by ID and classId only (don't check teacherId on announcement)
    const announcement = await Announcement.findOneAndDelete({
      _id: announcementId,
      classId
    });

    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    res.json({ success: true, message: 'Announcement deleted' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid announcement ID' });
    }
    res.status(500).json({ success: false, message: 'Failed to delete announcement' });
  }
}

// ==================== EXAMS ====================

async function createExam(req, res) {
  try {
    const { id: classId } = req.params;
    const { title, date, duration } = req.body;
    const teacherId = req.user.id;

    // Verify teacher owns this class
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    if (classDoc.teacherId?.toString() !== teacherId && classDoc.teacher?.toString() !== teacherId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const exam = await Exam.create({
      classId,
      teacherId,
      createdBy: teacherId,
      title,
      date: new Date(date),
      duration: parseInt(duration),
      durationMinutes: parseInt(duration)
    });

    res.status(201).json({ success: true, exam });
  } catch (error) {
    console.error('Create exam error:', error);
    res.status(500).json({ success: false, message: 'Failed to create exam' });
  }
}

async function getExams(req, res) {
  try {
    const { id: classId } = req.params;
    const userId = req.user.id;

    // Verify user has access to this class
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    const isTeacher = classDoc.teacherId?.toString() === userId || classDoc.teacher?.toString() === userId;
    
    // PHASE 7.3.1: Use enrollment resolver for students
    let hasAccess = isTeacher;
    if (!isTeacher && req.user.role === 'student') {
      hasAccess = await isStudentInClass(classId, userId);
    }

    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // PHASE 7.3.1: Students only see published/running/closed exams
    const query = { classId };
    if (req.user.role === 'student') {
      query.status = { $in: ['published', 'running', 'closed'] };
    }

    const exams = await Exam.find(query)
      .sort({ startTime: -1 })
      .select('title description status totalMarks duration startTime endTime attemptsAllowed')
      .lean();
    
    // Add attempt information for students OR submission stats for teachers
    let examsWithAttempts = exams;
    
    if (req.user.role === 'student') {
      const mongoose = require('mongoose');
      const ExamAttempt = require('../models/ExamAttempt');
      
      examsWithAttempts = await Promise.all(
        exams.map(async (exam) => {
          const attemptCount = await ExamAttempt.countDocuments({
            exam: exam._id,
            student: new mongoose.Types.ObjectId(userId)
          });
          
          exam.studentAttemptCount = attemptCount;
          exam.attemptsRemaining = Math.max(0, (exam.attemptsAllowed || 1) - attemptCount);
          exam.attemptsExhausted = attemptCount >= (exam.attemptsAllowed || 1);
          
          return exam;
        })
      );
    } else if (isTeacher) {
      // For teachers, add submission stats
      const ExamAttempt = require('../models/ExamAttempt');
      
      examsWithAttempts = await Promise.all(
        exams.map(async (exam) => {
          const totalSubmissions = await ExamAttempt.countDocuments({
            exam: exam._id,
            status: 'submitted'
          });
          
          const evaluatedSubmissions = await ExamAttempt.countDocuments({
            exam: exam._id,
            status: 'submitted',
            evaluationStatus: 'evaluated'
          });
          
          exam.totalSubmissions = totalSubmissions;
          exam.evaluatedSubmissions = evaluatedSubmissions;
          exam.pendingEvaluation = totalSubmissions - evaluatedSubmissions;
          
          return exam;
        })
      );
    }

    res.json({ success: true, exams: examsWithAttempts });
  } catch (error) {
    console.error('Get exams error:', error);
    res.status(500).json({ success: false, message: 'Failed to get exams' });
  }
}

// ==================== ASSIGNMENTS ====================

async function createAssignment(req, res) {
  try {
    const { id: classId } = req.params;
    const { title, deadline } = req.body;
    const teacherId = req.user.id;

    // Verify teacher owns this class
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    if (classDoc.teacherId?.toString() !== teacherId && classDoc.teacher?.toString() !== teacherId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const assignment = await Assignment.create({
      classId,
      teacherId,
      title,
      deadline: new Date(deadline)
    });

    res.status(201).json({ success: true, assignment });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ success: false, message: 'Failed to create assignment' });
  }
}

async function getAssignments(req, res) {
  try {
    const { id: classId } = req.params;
    const userId = req.user.id;

    // Verify user has access to this class
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    const isTeacher = classDoc.teacherId?.toString() === userId || classDoc.teacher?.toString() === userId;
    
    // PHASE 7.0: Use enrollment resolver for students
    let hasAccess = isTeacher;
    if (!isTeacher && req.user.role === 'student') {
      hasAccess = await isStudentInClass(classId, userId);
    }

    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const assignments = await Assignment.find({ classId })
      .sort({ deadline: 1 })
      .lean();

    res.json({ success: true, assignments });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ success: false, message: 'Failed to get assignments' });
  }
}

// ==================== MEMBERS ====================

async function getMembers(req, res) {
  try {
    const { id: classId } = req.params;
    const userId = req.user.id;

    // Verify user has access to this class
    const classDoc = await Class.findById(classId).populate('teacherId', 'name email');
    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    const isTeacher = classDoc.teacherId?._id?.toString() === userId || classDoc.teacher?.toString() === userId;
    const isStudent = classDoc.students.some(s => s.email === req.user.email);

    if (!isTeacher && !isStudent) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const teacher = classDoc.teacherId || { name: classDoc.teacherName, email: 'N/A' };
    const students = classDoc.students.map(s => ({
      name: s.name,
      email: s.email,
      roll: s.roll
    }));

    res.json({
      success: true,
      teacher,
      students,
      totalStudents: students.length
    });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ success: false, message: 'Failed to get members' });
  }
}

module.exports = {
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
  createExam,
  getExams,
  createAssignment,
  getAssignments,
  getMembers
};
