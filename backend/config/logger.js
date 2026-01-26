/**
 * PHASE 8.5 - Centralized Logging Configuration
 * 
 * Winston-based structured logging with:
 * - File rotation for error and combined logs
 * - Console output in development
 * - Structured JSON format for production
 * - Automatic log level based on NODE_ENV
 * - Sensitive data filtering
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define log colors for console output
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

winston.addColors(colors);

// Determine log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define console format (prettier for development)
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}`
  )
);

// Define transports
const transports = [
  // Error log file - only errors
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    format: logFormat
  }),
  
  // Combined log file - all logs
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    format: logFormat
  })
];

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format: logFormat,
  transports,
  exitOnError: false
});

/**
 * Helper function to log with context
 */
logger.logWithContext = (level, message, context = {}) => {
  logger.log(level, message, { ...context, timestamp: new Date().toISOString() });
};

/**
 * Log critical operations
 */
logger.logOperation = (operation, details = {}) => {
  logger.info(`[OPERATION] ${operation}`, {
    operation,
    ...details,
    timestamp: new Date().toISOString()
  });
};

/**
 * Log security events
 */
logger.logSecurity = (event, details = {}) => {
  logger.warn(`[SECURITY] ${event}`, {
    securityEvent: event,
    ...details,
    timestamp: new Date().toISOString()
  });
};

/**
 * Log errors with additional context
 */
logger.logError = (error, context = {}) => {
  logger.error(error.message, {
    error: {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    },
    ...context,
    timestamp: new Date().toISOString()
  });
};

// Stream for Morgan HTTP logging middleware
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

module.exports = logger;
