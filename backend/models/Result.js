const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  attemptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attempt',
    required: true
  },
  totalMarks: {
    type: Number,
    required: true
  },
  feedback: {
    type: String,
    default: ''
  },
  published: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for performance
resultSchema.index({ attemptId: 1 });
resultSchema.index({ published: 1 });

module.exports = mongoose.model('Result', resultSchema);
