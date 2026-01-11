const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  roll: String,
  name: String,
  email: String, // Added for Phase 4.2
  pdfPath: String, // Optional: keeps the path for reference or fallback
  pdfData: Buffer, // Store PDF binary data
  answerPdf: String,
  // Future: reference to User model (optional, for authenticated students)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
});

const classSchema = new mongoose.Schema({
  // Legacy fields (keep for backward compatibility)
  code: { type: String, required: true, unique: true },
  icon: { type: String, default: '📚' },
  assignments: { type: Number, default: 0 },
  lastActive: { type: String, default: () => new Date().toLocaleString() },
  
  // Phase 3: Professional classroom fields
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  subject: { type: String, default: '' },
  
  // Teacher reference (Phase 3: normalized field name)
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Legacy teacher field (keep for backward compatibility)
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Legacy students array (keep for backward compatibility)
  students: [studentSchema],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for performance
// Note: code unique index created by field-level 'unique: true'
classSchema.index({ teacher: 1 });
classSchema.index({ teacherId: 1 });
classSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Class', classSchema);