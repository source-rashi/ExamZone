const fs = require('fs');
const path = require('path');

/**
 * Create directory if it doesn't exist
 * @param {string} dirPath - Directory path to create
 */
exports.ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

/**
 * Get file path for upload
 * @param {string} folder - Folder name (e.g., 'uploads', 'answersheets')
 * @param {string} filename - File name
 * @returns {string} Full file path
 */
exports.getUploadPath = (folder, filename) => {
  return path.join(folder, filename);
};

/**
 * Save file buffer to disk
 * @param {string} filePath - Path to save file
 * @param {Buffer} buffer - File buffer
 */
exports.saveFile = (filePath, buffer) => {
  const dir = path.dirname(filePath);
  exports.ensureDirectoryExists(dir);
  fs.writeFileSync(filePath, buffer);
};

/**
 * Read file from disk
 * @param {string} filePath - Path to read file from
 * @returns {Buffer} File buffer
 */
exports.readFile = (filePath) => {
  return fs.readFileSync(filePath);
};

/**
 * Delete file from disk
 * @param {string} filePath - Path to file to delete
 */
exports.deleteFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};
