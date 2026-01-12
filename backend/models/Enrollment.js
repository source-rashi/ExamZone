const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rollNumber: {
    type: Number,
    required: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'blocked'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Individual indexes for foreign key lookups
enrollmentSchema.index({ classId: 1 });
enrollmentSchema.index({ studentId: 1 });

// Compound unique index to ensure a student can only enroll once per class
enrollmentSchema.index({ classId: 1, studentId: 1 }, { unique: true });

// Unique index to ensure rollNumber is unique within a class
enrollmentSchema.index({ classId: 1, rollNumber: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
