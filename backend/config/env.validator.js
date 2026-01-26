/**
 * PHASE 8.8 - Environment Configuration Validator
 * Validates required environment variables on startup
 */

const logger = require('../config/logger');

/**
 * Required environment variables
 */
const REQUIRED_VARS = [
  'MONGODB_URI',
  'JWT_SECRET',
  'PORT'
];

/**
 * Optional but recommended environment variables with defaults
 */
const OPTIONAL_VARS = {
  'NODE_ENV': 'development',
  'SESSION_SECRET': 'fallback-session-secret',
  'AI_SERVICE_URL': 'http://localhost:8002',
  'FRONTEND_URL': 'http://localhost:5173',
  'JWT_EXPIRES_IN': '7d'
};

/**
 * Validate environment variables
 * Throws error if required variables are missing
 */
function validateEnv() {
  const missing = [];
  const warnings = [];

  // Check required variables
  for (const varName of REQUIRED_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  // If any required variables are missing, throw error
  if (missing.length > 0) {
    const error = new Error(
      `❌ Missing required environment variables:\n` +
      missing.map(v => `   - ${v}`).join('\n') +
      `\n\nPlease create a .env file with these variables.`
    );
    
    if (logger) {
      logger.logError(error, { context: 'env_validation' });
    }
    
    throw error;
  }

  // Check optional variables and warn about defaults
  for (const [varName, defaultValue] of Object.entries(OPTIONAL_VARS)) {
    if (!process.env[varName]) {
      warnings.push(`${varName} (using default: ${defaultValue})`);
      process.env[varName] = defaultValue;
    }
  }

  // Validate specific formats
  const validationErrors = [];

  // Validate MongoDB URI format
  if (!process.env.MONGODB_URI.startsWith('mongodb://') && 
      !process.env.MONGODB_URI.startsWith('mongodb+srv://')) {
    validationErrors.push('MONGODB_URI must start with mongodb:// or mongodb+srv://');
  }

  // Validate PORT is a number
  const port = parseInt(process.env.PORT);
  if (isNaN(port) || port < 1 || port > 65535) {
    validationErrors.push('PORT must be a valid port number (1-65535)');
  }

  // Validate NODE_ENV
  const validEnvs = ['development', 'production', 'test'];
  if (!validEnvs.includes(process.env.NODE_ENV)) {
    warnings.push(`NODE_ENV should be one of: ${validEnvs.join(', ')}`);
  }

  // Validate JWT_SECRET strength (production only)
  if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET.length < 32) {
    validationErrors.push('JWT_SECRET must be at least 32 characters in production');
  }

  if (validationErrors.length > 0) {
    const error = new Error(
      `❌ Environment validation errors:\n` +
      validationErrors.map(e => `   - ${e}`).join('\n')
    );
    
    if (logger) {
      logger.logError(error, { context: 'env_validation' });
    }
    
    throw error;
  }

  // Log success
  console.log('✅ Environment validation passed');
  
  if (warnings.length > 0) {
    console.log('⚠️  Using defaults for:');
    warnings.forEach(w => console.log(`   - ${w}`));
  }

  if (logger) {
    logger.logOperation('ENV_VALIDATED', {
      nodeEnv: process.env.NODE_ENV,
      hasAllRequired: true,
      defaultsUsed: warnings.length
    });
  }
}

/**
 * Get environment configuration summary (for logging/debugging)
 * Redacts sensitive values
 */
function getEnvSummary() {
  const sensitive = ['JWT_SECRET', 'SESSION_SECRET', 'MONGODB_URI'];
  
  const summary = {};
  
  // Required vars
  for (const varName of REQUIRED_VARS) {
    if (sensitive.includes(varName)) {
      summary[varName] = process.env[varName] ? '[REDACTED]' : '[MISSING]';
    } else {
      summary[varName] = process.env[varName] || '[MISSING]';
    }
  }
  
  // Optional vars
  for (const varName of Object.keys(OPTIONAL_VARS)) {
    if (sensitive.includes(varName)) {
      summary[varName] = process.env[varName] ? '[REDACTED]' : '[DEFAULT]';
    } else {
      summary[varName] = process.env[varName] || OPTIONAL_VARS[varName];
    }
  }
  
  return summary;
}

module.exports = {
  validateEnv,
  getEnvSummary,
  REQUIRED_VARS,
  OPTIONAL_VARS
};
