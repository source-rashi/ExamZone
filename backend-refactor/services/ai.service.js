const axios = require('axios');

// FastAPI server configuration
const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || 'http://127.0.0.1:8000';

/**
 * Generate PDF via FastAPI server
 * @param {Array} questions - Array of questions
 * @returns {Promise<Buffer>} PDF buffer
 */
exports.generatePDFFromQuestions = async (questions) => {
  try {
    const response = await axios.post(`${FASTAPI_BASE_URL}/generate-pdf`, {
      questions
    }, {
      responseType: 'arraybuffer'
    });
    
    const pdfBuffer = Buffer.from(response.data);
    return pdfBuffer;
  } catch (error) {
    console.error('❌ Error calling FastAPI:', error.message);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
};

/**
 * Health check for FastAPI server
 * @returns {Promise<boolean>} True if server is reachable
 */
exports.checkFastAPIHealth = async () => {
  try {
    const response = await axios.get(`${FASTAPI_BASE_URL}/health`, {
      timeout: 5000
    });
    return response.status === 200;
  } catch (error) {
    console.error('❌ FastAPI health check failed:', error.message);
    return false;
  }
};
