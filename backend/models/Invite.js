/**
 * Invite Model
 * Manages class invitations
 */

const mongoose = require('mongoose');
const { ROLES } = require('../utils/roles');

const inviteSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Please provide a valid email address'
    }
  },
  
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class ID is required']
  },
  
  role: {
    type: String,
    enum: {
      values: [ROLES.STUDENT, ROLES.TEACHER],
      message: '{VALUE} is not a valid role for invite'
    },
    required: [true, 'Role is required'],
    default: ROLES.STUDENT
  },
  
  token: {
    type: String,
    required: [true, 'Token is required'],
    unique: true,
    index: true
  },
  
  expiresAt: {
    type: Date,
    required: [true, 'Expiration date is required'],
    index: true
  },
  
  accepted: {
    type: Boolean,
    default: false
  },
  
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  acceptedAt: {
    type: Date,
    default: null
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

/**
 * Index for efficient queries
 */
inviteSchema.index({ email: 1, classId: 1 });
inviteSchema.index({ token: 1 });
inviteSchema.index({ expiresAt: 1 });
inviteSchema.index({ accepted: 1 });

/**
 * Instance method to check if invite is expired
 * @returns {Boolean}
 */
inviteSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

/**
 * Instance method to check if invite is valid (not expired, not accepted)
 * @returns {Boolean}
 */
inviteSchema.methods.isValid = function() {
  return !this.accepted && !this.isExpired();
};

/**
 * Static method to find valid invite by token
 * @param {String} token
 * @returns {Promise<Invite>}
 */
inviteSchema.statics.findValidInvite = function(token) {
  return this.findOne({
    token,
    accepted: false,
    expiresAt: { $gt: new Date() }
  }).populate('classId createdBy');
};

/**
 * Static method to find pending invites for a class
 * @param {String} classId
 * @returns {Promise<Invite[]>}
 */
inviteSchema.statics.findPendingInvites = function(classId) {
  return this.find({
    classId,
    accepted: false,
    expiresAt: { $gt: new Date() }
  }).populate('createdBy');
};

module.exports = mongoose.model('Invite', inviteSchema);
