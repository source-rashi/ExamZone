const mongoose = require('mongoose');

const answerSheetSchema = new mongoose.Schema({
  attemptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attempt',
    required: true
  },
  fileUrl: {
    type: String,
    default: ''
  },
  extractedText: {
    type: String,
    default: ''
  },
  uploadTime: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for performance
answerSheetSchema.index({ attemptId: 1 });

module.exports = mongoose.model('AnswerSheet', answerSheetSchema);
