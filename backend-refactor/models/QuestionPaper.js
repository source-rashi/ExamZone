const mongoose = require('mongoose');

const questionPaperSchema = new mongoose.Schema({
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
  setNumber: {
    type: Number,
    default: 1
  },
  pdfUrl: {
    type: String,
    default: ''
  },
  questions: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
questionPaperSchema.index({ examId: 1 });
questionPaperSchema.index({ studentId: 1 });
questionPaperSchema.index({ examId: 1, studentId: 1 });

module.exports = mongoose.model('QuestionPaper', questionPaperSchema);
