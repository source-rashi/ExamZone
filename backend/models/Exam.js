const mongoose = require('mongoose');

/**
 * PHASE 6.1 — Exam Model (Updated)
 * Foundation for exam management system
 */

const examSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  mode: {
    type: String,
    enum: ['online', 'offline', 'hybrid'],
    default: 'online'
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // in minutes
    required: true,
    default: 60,
    min: 1
  },
  attemptsAllowed: {
    type: Number,
    default: 1,
    min: 1
  },
  setsPerStudent: {
    type: Number,
    default: 1,
    min: 1
  },
  totalMarks: {
    type: Number,
    default: 100,
    min: 0
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'running', 'closed', 'evaluated'],
    default: 'draft'
  },
  publishedAt: {
    type: Date
  },
  closedAt: {
    type: Date
  },
  // Phase 3.6 - AI integration
  questionPapers: [
    {
      studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      filePath: {
        type: String,
        required: true
      },
      setCode: {
        type: String
      },
      generatedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  aiConfig: {
    sourceType: {
      type: String,
      enum: ['auto', 'manual', 'bank'],
      default: 'auto'
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    instructions: {
      type: String,
      default: ''
    },
    totalMarks: {
      type: Number
    }
  },
  settings: {
    tabSwitchLimit: {
      type: Number,
      default: 3
    },
    allowPdfUpload: {
      type: Boolean,
      default: true
    },
    allowEditor: {
      type: Boolean,
      default: false
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
examSchema.index({ classId: 1 });
examSchema.index({ createdBy: 1 });
examSchema.index({ status: 1 });
examSchema.index({ startTime: 1, endTime: 1 });

module.exports = mongoose.model('Exam', examSchema);
