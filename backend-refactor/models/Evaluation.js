const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema({
  attemptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attempt',
    required: true
  },
  mode: {
    type: String,
    enum: ['manual', 'ai', 'hybrid'],
    required: true
  },
  aiResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  teacherOverride: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  checkedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for performance
evaluationSchema.index({ attemptId: 1 });
evaluationSchema.index({ mode: 1 });

module.exports = mongoose.model('Evaluation', evaluationSchema);
