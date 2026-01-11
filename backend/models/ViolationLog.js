const mongoose = require('mongoose');

const violationLogSchema = new mongoose.Schema({
  attemptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attempt',
    required: true
  },
  type: {
    type: String,
    required: true
  },
  count: {
    type: Number,
    default: 1
  },
  timestamps: {
    type: [Date],
    default: []
  }
}, {
  timestamps: true
});

// Index for performance
violationLogSchema.index({ attemptId: 1 });
violationLogSchema.index({ type: 1 });

module.exports = mongoose.model('ViolationLog', violationLogSchema);
