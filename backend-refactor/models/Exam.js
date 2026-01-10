const mongoose = require('mongoose');
const { EXAM_STATUS } = require('../utils/constants');

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
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  duration: {
    type: Number, // in minutes (legacy field)
    default: 60
  },
  durationMinutes: {
    type: Number, // Phase 3.4 - standardized duration field
    default: 60
  },
  totalMarks: {
    type: Number,
    default: 100
  },
  maxAttempts: {
    type: Number,
    default: 1
  },
  evaluationMode: {
    type: String,
    enum: ['manual', 'ai', 'hybrid'],
    default: 'manual'
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  status: {
    type: String,
    enum: Object.values(EXAM_STATUS),
    default: EXAM_STATUS.DRAFT
  },
  publishedAt: {
    type: Date
  },
  closedAt: {
    type: Date
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
