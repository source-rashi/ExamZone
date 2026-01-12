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
  // PHASE 6.2.5 - Exam Preparation Layer
  numberOfSets: {
    type: Number,
    default: 1,
    min: 1
  },
  questionSource: {
    type: {
      type: String,
      enum: ['latex', 'text', 'pdf'],
      default: 'text'
    },
    content: {
      type: String,
      default: ''
    },
    filePath: {
      type: String,
      default: ''
    }
  },
  generationStatus: {
    type: String,
    enum: ['draft', 'ready', 'generating', 'generated'],
    default: 'draft'
  },
  setMap: [{
    setId: {
      type: String,
      required: true
    },
    assignedRollNumbers: [{
      type: Number
    }]
  }],
  lockedAfterGeneration: {
    type: Boolean,
    default: false
  },
  // PHASE 6.3 - AI-generated question papers (alias for backward compatibility)
  generatedSets: [{
    setId: {
      type: String,
      required: true
    },
    questions: [{
      questionText: String,
      marks: Number,
      topic: String,
      difficulty: String,
      options: [String],
      correctAnswer: String
    }],
    totalMarks: Number,
    instructions: {
      type: String,
      default: ''
    },
    generatedAt: {
      type: Date,
      default: Date.now
    }
  }],
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

// Virtual field: generatedPapers (alias for generatedSets)
examSchema.virtual('generatedPapers').get(function() {
  return this.generatedSets;
});

examSchema.set('toJSON', { virtuals: true });
examSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Exam', examSchema);
