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
  // PHASE 6.3.11 - Teacher-Driven Exam Engine (NO DEFAULTS)
  paperConfig: {
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true
    },
    difficulty: {
      type: String,
      required: [true, 'Difficulty level is required'],
      enum: {
        values: ['easy', 'medium', 'hard', 'mixed'],
        message: '{VALUE} is not a valid difficulty level'
      }
    },
    questionsPerSet: {
      type: Number,
      required: [true, 'Questions per set is required'],
      min: [1, 'Questions per set must be at least 1']
    },
    totalMarksPerSet: {
      type: Number,
      required: [true, 'Total marks per set is required'],
      min: [1, 'Total marks per set must be at least 1']
    },
    marksMode: {
      type: String,
      enum: ['auto', 'manual'],
      default: 'auto'
    },
    instructions: {
      type: String,
      default: '',
      trim: true
    }
  },
  // PHASE 6.3.9 - Legacy per-set fields (kept for backward compatibility)
  questionsPerSet: {
    type: Number,
    default: 20,
    min: 1
  },
  totalMarksPerSet: {
    type: Number,
    default: 100,
    min: 0
  },
  subject: {
    type: String,
    default: 'General',
    trim: true
  },
  difficultyLevel: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'mixed'],
    default: 'mixed'
  },
  allowAIImprovement: {
    type: Boolean,
    default: false
  },
  // PHASE 6.3.6 - Question Authority Mode (CRITICAL SAFETY)
  questionMode: {
    type: String,
    enum: ['teacher_provided', 'ai_generated'],
    default: 'teacher_provided'
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
    enum: ['none', 'preparing', 'generated'],
    default: 'none'
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
  // PHASE 6.4 - Master set PDFs
  setMasterPapers: [{
    setId: {
      type: String,
      required: true
    },
    pdfPath: {
      type: String,
      required: true
    },
    questionCount: {
      type: Number,
      required: true
    },
    totalMarks: {
      type: Number,
      required: true
    },
    generatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'prepared', 'generated', 'published', 'running', 'closed', 'evaluated'],
    default: 'draft'
  },
  publishedAt: {
    type: Date
  },
  closedAt: {
    type: Date
  },
  // PHASE 6.4 - Student paper mapping
  studentPapers: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rollNumber: {
      type: Number,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    setId: {
      type: String,
      required: true
    },
    paperPath: {
      type: String,
      required: true
    },
    paperPreview: {
      type: mongoose.Schema.Types.Mixed, // JSON of questions for UI display
      default: null
    },
    generatedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['created', 'failed'],
      default: 'created'
    }
  }],
  // Phase 3.6 - AI integration (legacy)
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
  // PHASE 7.5.6 - Exam Finalization
  evaluationComplete: {
    type: Boolean,
    default: false
  },
  evaluationCompletedAt: {
    type: Date,
    default: null
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
