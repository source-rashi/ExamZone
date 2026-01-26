/**
 * PHASE 8.4 - File System & PDF Security Utilities
 * 
 * Provides secure file handling with:
 * - Path traversal prevention
 * - MIME type validation
 * - File size limits
 * - Safe path sanitization
 */

const path = require('path');
const fs = require('fs');

// Security constants
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIME_TYPES = ['application/pdf'];
const PROJECT_ROOT = path.resolve(__dirname, '../../');

/**
 * Validate and sanitize file path to prevent traversal attacks
 * @param {string} filePath - The file path to validate
 * @param {string} baseDir - The base directory (default: project root)
 * @returns {Object} { valid: boolean, safePath: string, error: string }
 */
function validateFilePath(filePath, baseDir = PROJECT_ROOT) {
  try {
    if (!filePath || typeof filePath !== 'string') {
      return {
        valid: false,
        safePath: null,
        error: 'Invalid file path'
      };
    }

    // Resolve absolute path
    const resolvedPath = path.isAbsolute(filePath) 
      ? path.resolve(filePath) 
      : path.resolve(baseDir, filePath);

    // Normalize to remove '..' and '.'
    const normalizedPath = path.normalize(resolvedPath);

    // Ensure path is within base directory (prevent traversal)
    const resolvedBase = path.resolve(baseDir);
    if (!normalizedPath.startsWith(resolvedBase)) {
      return {
        valid: false,
        safePath: null,
        error: 'Path traversal detected'
      };
    }

    return {
      valid: true,
      safePath: normalizedPath,
      error: null
    };
  } catch (error) {
    return {
      valid: false,
      safePath: null,
      error: `Path validation error: ${error.message}`
    };
  }
}

/**
 * Validate file size
 * @param {string} filePath - Path to the file
 * @param {number} maxSize - Maximum allowed size in bytes (default: 50MB)
 * @returns {Object} { valid: boolean, size: number, error: string }
 */
function validateFileSize(filePath, maxSize = MAX_FILE_SIZE) {
  try {
    if (!fs.existsSync(filePath)) {
      return {
        valid: false,
        size: 0,
        error: 'File does not exist'
      };
    }

    const stats = fs.statSync(filePath);
    const fileSize = stats.size;

    if (fileSize > maxSize) {
      return {
        valid: false,
        size: fileSize,
        error: `File size ${(fileSize / 1024 / 1024).toFixed(2)}MB exceeds limit of ${(maxSize / 1024 / 1024).toFixed(2)}MB`
      };
    }

    return {
      valid: true,
      size: fileSize,
      error: null
    };
  } catch (error) {
    return {
      valid: false,
      size: 0,
      error: `File size validation error: ${error.message}`
    };
  }
}

/**
 * Validate file MIME type
 * @param {string} filePath - Path to the file
 * @param {string[]} allowedTypes - Allowed MIME types (default: ['application/pdf'])
 * @returns {Object} { valid: boolean, mimeType: string, error: string }
 */
function validateMimeType(filePath, allowedTypes = ALLOWED_MIME_TYPES) {
  try {
    // Simple MIME type check based on file extension
    const ext = path.extname(filePath).toLowerCase();
    
    const mimeMap = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png'
    };

    const mimeType = mimeMap[ext];

    if (!mimeType) {
      return {
        valid: false,
        mimeType: null,
        error: `Unsupported file type: ${ext}`
      };
    }

    if (!allowedTypes.includes(mimeType)) {
      return {
        valid: false,
        mimeType,
        error: `File type ${mimeType} not allowed. Allowed types: ${allowedTypes.join(', ')}`
      };
    }

    return {
      valid: true,
      mimeType,
      error: null
    };
  } catch (error) {
    return {
      valid: false,
      mimeType: null,
      error: `MIME type validation error: ${error.message}`
    };
  }
}

/**
 * Comprehensive file security validation
 * @param {string} filePath - Path to validate and secure
 * @param {Object} options - Validation options
 * @returns {Object} { valid: boolean, safePath: string, errors: string[] }
 */
function secureFileAccess(filePath, options = {}) {
  const {
    baseDir = PROJECT_ROOT,
    maxSize = MAX_FILE_SIZE,
    allowedMimeTypes = ALLOWED_MIME_TYPES,
    checkExists = true
  } = options;

  const errors = [];

  // 1. Validate path (prevent traversal)
  const pathValidation = validateFilePath(filePath, baseDir);
  if (!pathValidation.valid) {
    errors.push(pathValidation.error);
    return { valid: false, safePath: null, errors };
  }

  const safePath = pathValidation.safePath;

  // 2. Check file exists
  if (checkExists && !fs.existsSync(safePath)) {
    errors.push('File does not exist');
    return { valid: false, safePath, errors };
  }

  // If file doesn't exist and checkExists is false, skip further checks
  if (!fs.existsSync(safePath)) {
    return { valid: true, safePath, errors: [] };
  }

  // 3. Validate file size
  const sizeValidation = validateFileSize(safePath, maxSize);
  if (!sizeValidation.valid) {
    errors.push(sizeValidation.error);
  }

  // 4. Validate MIME type
  const mimeValidation = validateMimeType(safePath, allowedMimeTypes);
  if (!mimeValidation.valid) {
    errors.push(mimeValidation.error);
  }

  return {
    valid: errors.length === 0,
    safePath,
    errors,
    size: sizeValidation.size,
    mimeType: mimeValidation.mimeType
  };
}

/**
 * Sanitize file path for safe response (remove absolute path exposure)
 * @param {string} filePath - Full file path
 * @returns {string} - Relative path from project root
 */
function sanitizePathForResponse(filePath) {
  if (!filePath) return null;
  
  try {
    const relativePath = path.relative(PROJECT_ROOT, filePath);
    // Return relative path with forward slashes (platform-independent)
    return relativePath.replace(/\\/g, '/');
  } catch (error) {
    return null;
  }
}

module.exports = {
  validateFilePath,
  validateFileSize,
  validateMimeType,
  secureFileAccess,
  sanitizePathForResponse,
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
  PROJECT_ROOT
};
