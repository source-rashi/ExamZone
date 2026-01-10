const mongoose = require('mongoose');
const { ATTEMPT_STATUS } = require('../utils/constants');

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
    type: Date, // Legacy field
    default: Date.now
  },
  startedAt: {
    type: Date, // Phase 3.4 - standardized field
    default: Date.now
  },
  endTime: {
    type: Date // Legacy field
  },
  submittedAt: {
    type: Date // Phase 3.4 - when student submits
  },
  evaluatedAt: {
    type: Date // Phase 3.4 - when evaluation completes
  },
  status: {
    type: String,
    enum: Object.values(ATTEMPT_STATUS),
    default: ATTEMPT_STATUS.IN_PROGRESS
  },
  score: {
    type: Number, // Phase 3.4 - final score after evaluation
    min: 0
  },
  // Phase 3.5 - Integrity tracking
  integrity: {
    tabSwitches: {
      type: Number,
      default: 0
    },
    focusLostCount: {
      type: Number,
      default: 0
    },
    fullscreenExitCount: {
      type: Number,
      default: 0
    },
    copyEvents: {
      type: Number,
      default: 0
    },
    pasteEvents: {
      type: Number,
      default: 0
    },
    violations: [
      {
        type: {
          type: String,
          enum: ['tab_switch', 'focus_lost', 'fullscreen_exit', 'copy', 'paste', 'suspicious_activity']
        },
        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ],
    lastActiveAt: {
      type: Date,
      default: Date.now
    },
    autoSubmitted: {
      type: Boolean,
      default: false
    }
  },
  // Legacy fields (Phase 3.3)
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
