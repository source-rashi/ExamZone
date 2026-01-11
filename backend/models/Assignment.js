const mongoose = require('mongoose');

/**
 * PHASE 5.3 — Assignment Model
 * File-based assignment system with PDF upload/download
 */

const submissionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  filePath: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['submitted', 'graded'],
    default: 'submitted'
  },
  grade: {
    type: Number,
    min: 0
  },
  feedback: {
    type: String
  }
});

const assignmentSchema = new mongoose.Schema({
  // Assignment details
  title: {
    type: String,
    required: true,
    trim: true
  },
  
  description: {
    type: String,
    default: ''
  },
  
  // Teacher's uploaded assignment file (PDF)
  attachmentPath: {
    type: String,
    required: true
  },
  
  // Class reference
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  
  // Teacher reference
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Due date
  dueDate: {
    type: Date,
    required: true
  },
  
  // Student submissions
  submissions: [submissionSchema],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
assignmentSchema.index({ class: 1, createdAt: -1 });
assignmentSchema.index({ teacher: 1 });
assignmentSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
