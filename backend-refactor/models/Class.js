const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  roll: String,
  name: String,
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
  code: { type: String, required: true, unique: true },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  icon: { type: String, default: '📚' },
  assignments: { type: Number, default: 0 },
  lastActive: { type: String, default: () => new Date().toLocaleString() },
  
  // Future: reference to teacher (User model)
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
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
classSchema.index({ code: 1 });
classSchema.index({ teacher: 1 });
classSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Class', classSchema);