const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// FastAPI server configuration
const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || 'http://127.0.0.1:8000';
const QUESTION_GEN_URL = process.env.QUESTION_GEN_URL || `${FASTAPI_BASE_URL}/generate-questions`;
const EVALUATION_URL = process.env.EVALUATION_URL || `${FASTAPI_BASE_URL}/evaluate`;

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

/**
 * Generate question papers for multiple students (Phase 3.6)
 * @param {Object} exam - Exam document with aiConfig
 * @param {Array} students - Array of student objects
 * @param {Object} inputs - Additional generation inputs (sourceType, difficulty, instructions)
 * @returns {Promise<Array>} Array of { studentId, pdfBuffer, setCode }
 */
exports.generateQuestionPapers = async (exam, students, inputs = {}) => {
  try {
    // Validate inputs
    if (!exam || !students || students.length === 0) {
      throw new Error('exam and students array are required');
    }

    // Prepare request payload
    const payload = {
      examId: exam._id.toString(),
      examTitle: exam.title,
      totalMarks: inputs.totalMarks || exam.totalMarks || 100,
      sourceType: inputs.sourceType || exam.aiConfig?.sourceType || 'auto',
      difficulty: inputs.difficulty || exam.aiConfig?.difficulty || 'medium',
      instructions: inputs.instructions || exam.aiConfig?.instructions || '',
      students: students.map(s => ({
        studentId: s._id.toString(),
        name: s.name,
        email: s.email
      }))
    };

    console.log(`🤖 Calling AI service to generate ${students.length} question papers...`);

    // Call FastAPI service
    const response = await axios.post(QUESTION_GEN_URL, payload, {
      timeout: 60000, // 60 seconds for generation
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status !== 200 || !response.data) {
      throw new Error('Invalid response from AI service');
    }

    // Expected response format: { success: true, papers: [{ studentId, pdfBuffer, setCode }] }
    const { success, papers, message } = response.data;

    if (!success || !papers) {
      throw new Error(message || 'Failed to generate papers');
    }

    console.log(`✅ Generated ${papers.length} question papers`);

    // Convert base64 PDF data to buffers if needed
    const processedPapers = papers.map(paper => ({
      studentId: paper.studentId,
      pdfBuffer: Buffer.isBuffer(paper.pdfBuffer) 
        ? paper.pdfBuffer 
        : Buffer.from(paper.pdfBuffer, 'base64'),
      setCode: paper.setCode || `SET-${Date.now()}`
    }));

    return processedPapers;

  } catch (error) {
    console.error('❌ Error generating question papers:', error.message);
    
    // Safe failure - return structured error
    if (error.response) {
      throw new Error(`AI service error: ${error.response.data?.message || error.response.statusText}`);
    }
    
    throw new Error(`Failed to generate question papers: ${error.message}`);
  }
};

/**
 * Evaluate an attempt using AI (Phase 3.6)
 * @param {String} attemptId - Attempt ID
 * @param {String} answerSheetPath - Path to answer sheet PDF
 * @returns {Promise<Object>} { score, feedback, evaluatedAt }
 */
exports.evaluateAttempt = async (attemptId, answerSheetPath) => {
  try {
    // Validate inputs
    if (!attemptId || !answerSheetPath) {
      throw new Error('attemptId and answerSheetPath are required');
    }

    // Check if file exists
    if (!fs.existsSync(answerSheetPath)) {
      throw new Error(`Answer sheet not found: ${answerSheetPath}`);
    }

    console.log(`🤖 Calling AI service to evaluate attempt ${attemptId}...`);

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('attemptId', attemptId);
    formData.append('answerSheet', fs.createReadStream(answerSheetPath));

    // Call FastAPI service
    const response = await axios.post(EVALUATION_URL, formData, {
      timeout: 120000, // 2 minutes for evaluation
      headers: {
        ...formData.getHeaders()
      }
    });

    if (response.status !== 200 || !response.data) {
      throw new Error('Invalid response from AI service');
    }

    // Expected response format: { success: true, score, feedback, evaluatedAt }
    const { success, score, feedback, message } = response.data;

    if (!success) {
      throw new Error(message || 'Evaluation failed');
    }

    console.log(`✅ Evaluation complete: score=${score}`);

    return {
      score: score || 0,
      feedback: feedback || '',
      evaluatedAt: new Date()
    };

  } catch (error) {
    console.error('❌ Error evaluating attempt:', error.message);
    
    // Safe failure - return structured error
    if (error.response) {
      throw new Error(`AI service error: ${error.response.data?.message || error.response.statusText}`);
    }
    
    throw new Error(`Failed to evaluate attempt: ${error.message}`);
  }
};
