const mongoose = require('mongoose');

/**
 * PHASE 6.1 — ExamPaper Model
 * Tracks generated exam papers for students
 */

const examPaperSchema = new mongoose.Schema({
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
  setNumber: {
    type: Number,
    required: true,
    min: 1
  },
  pdfPath: {
    type: String,
    required: [true, 'PDF path is required']
  },
  generatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
examPaperSchema.index({ exam: 1, student: 1, setNumber: 1 }, { unique: true });
examPaperSchema.index({ exam: 1 });

module.exports = mongoose.model('ExamPaper', examPaperSchema);
