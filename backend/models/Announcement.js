const mongoose = require('mongoose');

/**
 * PHASE 5.2 — Announcement Model
 * Real announcement system for classroom communication
 * Teacher → Class → Students
 */

const announcementSchema = new mongoose.Schema({
  // Announcement content
  content: {
    type: String,
    required: true,
    trim: true
  },
  
  // Class reference (required)
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  
  // Author (teacher) reference
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Timestamp
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
announcementSchema.index({ class: 1, createdAt: -1 });
announcementSchema.index({ author: 1 });

module.exports = mongoose.model('Announcement', announcementSchema);
