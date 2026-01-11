/**
 * Authentication Service
 * Handles Google OAuth and JWT issuance
 */

const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { signToken } = require('../utils/jwt');
const { ROLES } = require('../utils/roles');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

/**
 * Login with Google OAuth token
 * @param {String} googleToken - Google ID token from client
 * @returns {Object} { token, user }
 */
async function loginWithGoogle(googleToken) {
  try {
    // Verify Google token and extract profile
    const googleProfile = await verifyGoogleToken(googleToken);
    
    // Find or create user
    const user = await findOrCreateUser(googleProfile);
    
    // Issue JWT
    const token = issueJwt(user);
    
    return {
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        picture: user.picture
      }
    };
  } catch (error) {
    throw new Error(`Google login failed: ${error.message}`);
  }
}

/**
 * Verify Google ID token and extract profile
 * @param {String} token - Google ID token
 * @returns {Object} Google profile { email, name, picture }
 */
async function verifyGoogleToken(token) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    
    return {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      emailVerified: payload.email_verified
    };
  } catch (error) {
    throw new Error('Invalid Google token');
  }
}

/**
 * Find existing user or create new one from Google profile
 * @param {Object} googleProfile - { email, name, picture, emailVerified }
 * @returns {Object} User document
 */
async function findOrCreateUser(googleProfile) {
  const { email, name, picture, emailVerified } = googleProfile;
  
  // Check if email is verified
  if (!emailVerified) {
    throw new Error('Email not verified with Google');
  }
  
  // Find existing user
  let user = await User.findOne({ email });
  
  if (user) {
    // Update picture if changed
    if (user.picture !== picture) {
      user.picture = picture;
      await user.save();
    }
    return user;
  }
  
  // Create new user
  const role = determineRole(email);
  
  user = await User.create({
    email,
    name,
    picture,
    role,
    password: 'GOOGLE_OAUTH', // Not used, but required by schema
    authProvider: 'google'
  });
  
  return user;
}

/**
 * Determine user role based on email domain
 * @param {String} email - User email
 * @returns {String} Role (teacher or student)
 */
function determineRole(email) {
  // Example logic: emails with specific domain get teacher role
  // Customize based on your requirements
  
  const teacherDomains = process.env.TEACHER_DOMAINS?.split(',') || [];
  const domain = email.split('@')[1];
  
  if (teacherDomains.includes(domain)) {
    return ROLES.TEACHER;
  }
  
  // Default to student
  return ROLES.STUDENT;
}

/**
 * Issue JWT for authenticated user
 * @param {Object} user - User document
 * @returns {String} JWT token
 */
function issueJwt(user) {
  return signToken(user);
}

module.exports = {
  loginWithGoogle,
  findOrCreateUser,
  issueJwt,
  verifyGoogleToken
};
