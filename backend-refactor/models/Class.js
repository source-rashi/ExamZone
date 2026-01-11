const mongoose = require('mongoose');

/**
 * PHASE 5.1 — Class Model (Refactored)
 * Real classroom data with User references only
 * Legacy subdocument schema removed for new classes
 */

// ============================================================================
// LEGACY SCHEMA - kept for backward compatibility with old data
// ============================================================================
const studentSchema = new mongoose.Schema({
  roll: String,
  name: String,
  email: String,
  pdfPath: String,
  pdfData: Buffer,
  answerPdf: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
});

// ============================================================================
// CLASS SCHEMA - PHASE 5.1
// ============================================================================
const classSchema = new mongoose.Schema({
  // Core fields
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  
  code: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true,
    trim: true
  },
  
  // Teacher reference (REQUIRED for new classes)
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Students array (User references only)
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Optional fields
  description: { 
    type: String, 
    default: '' 
  },
  
  subject: { 
    type: String, 
    default: '' 
  },
  
  // Legacy fields (backward compatibility)
  icon: { 
    type: String, 
    default: '📚' 
  },
  
  title: { 
    type: String, 
    default: '' 
  },
  
  assignments: { 
    type: Number, 
    default: 0 
  },
  
  lastActive: { 
    type: String, 
    default: () => new Date().toLocaleString() 
  },
  
  // Legacy teacher field alias (deprecated, use 'teacher')
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Legacy students subdocuments (deprecated)
  // Only exists in old data, not used for new classes
  _legacyStudents: [studentSchema],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual to handle legacy 'title' field
classSchema.virtual('displayName').get(function() {
  return this.name || this.title || 'Untitled Class';
});

// Index for performance
classSchema.index({ code: 1 });
classSchema.index({ teacher: 1 });
classSchema.index({ teacherId: 1 });
classSchema.index({ students: 1 });
classSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Class', classSchema);