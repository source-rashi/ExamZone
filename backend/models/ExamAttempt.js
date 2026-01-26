const mongoose = require('mongoose');

/**
 * PHASE 6.1 — ExamAttempt Model
 * Tracks student exam attempts
 */

const examAttemptSchema = new mongoose.Schema({
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: [true, 'Exam reference is required']
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student reference is required']
  },
  attemptNo: {
    type: Number,
    required: true,
    min: 1
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  submittedAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['started', 'submitted', 'auto-submitted'],
    default: 'started'
  },
  integrityLogs: [{
    type: {
      type: String,
      enum: ['tab-switch', 'window-blur', 'fullscreen-exit', 'copy', 'paste', 'right-click']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: String
  }],
  answers: [{
    questionId: String,
    answer: String,
    attachmentPath: String,
    timestamp: Date
  }],
  uploadedFile: {
    type: String // Path to uploaded answer sheet PDF
  },
  
  // ==================== PHASE 7.5 — EVALUATION FIELDS ====================
  score: {
    type: Number,
    min: 0
  },
  maxMarks: {
    type: Number,
    min: 0
  },
  evaluatedAt: {
    type: Date
  },
  evaluatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  feedback: {
    type: String,
    trim: true
  },
  perQuestionMarks: [{
    questionId: String,
    marksAwarded: {
      type: Number,
      min: 0
    },
    maxMarks: {
      type: Number,
      min: 0
    },
    feedback: String
  }],
  aiSuggestedScore: {
    type: Number,
    min: 0
  },
  aiFeedback: {
    type: String
  },
  evaluationStatus: {
    type: String,
    enum: ['pending', 'ai-checked', 'evaluated', 're-evaluation'],
    default: 'pending'
  },
  // ==================== END EVALUATION FIELDS ====================
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
examAttemptSchema.index({ exam: 1, student: 1 });
examAttemptSchema.index({ student: 1, status: 1 });

// Ensure unique attempt numbers per student per exam
examAttemptSchema.index({ exam: 1, student: 1, attemptNo: 1 }, { unique: true });

module.exports = mongoose.model('ExamAttempt', examAttemptSchema);
