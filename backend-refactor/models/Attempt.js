const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  questionPaperId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuestionPaper'
  },
  attemptNumber: {
    type: Number,
    required: true
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['started', 'submitted', 'evaluated'],
    default: 'started'
  },
  tabSwitchCount: {
    type: Number,
    default: 0
  },
  focusLossCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for performance
attemptSchema.index({ examId: 1 });
attemptSchema.index({ studentId: 1 });
attemptSchema.index({ status: 1 });

// Compound unique index for attempt tracking
attemptSchema.index({ examId: 1, studentId: 1, attemptNumber: 1 }, { unique: true });

module.exports = mongoose.model('Attempt', attemptSchema);
