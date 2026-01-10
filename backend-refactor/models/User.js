const mongoose = require('mongoose');
const { VALID_ROLES } = require('../utils/roles');

/**
 * User Schema
 * Stores user authentication and profile information
 */
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name must not exceed 100 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email) {
        // Basic email validation
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Please provide a valid email address'
    }
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password by default in queries
  },
  
  role: {
    type: String,
    enum: {
      values: VALID_ROLES,
      message: '{VALUE} is not a valid role'
    },
    required: [true, 'Role is required']
  },
  
  // Additional profile fields (optional for future use)
  profilePicture: {
    type: String,
    default: null
  },
  
  picture: {
    type: String,
    default: null
  },
  
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Automatically manage createdAt and updatedAt
});

/**
 * Pre-save middleware to update timestamp
 */
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

/**
 * Instance method to check if user is a teacher
 * @returns {boolean}
 */
userSchema.methods.isTeacher = function() {
  return this.role === 'teacher';
};

/**
 * Instance method to check if user is a student
 * @returns {boolean}
 */
userSchema.methods.isStudent = function() {
  return this.role === 'student';
};

/**
 * Remove password from JSON output
 */
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

/**
 * Static method to find user by email
 * @param {string} email - User email
 * @returns {Promise<User>}
 */
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

/**
 * Static method to find users by role
 * @param {string} role - User role
 * @returns {Promise<User[]>}
 */
userSchema.statics.findByRole = function(role) {
  return this.find({ role });
};

// Indexes for performance
// Note: email unique index created by field-level 'unique: true'
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);
