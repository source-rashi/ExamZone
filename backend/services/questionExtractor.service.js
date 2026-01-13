/**
 * CRITICAL MODULE — TEACHER QUESTION EXTRACTION
 * 
 * This module is responsible for PURE EXTRACTION ONLY.
 * 
 * ABSOLUTE RULES:
 * - NO question generation
 * - NO paraphrasing
 * - NO summarization
 * - NO AI calls
 * - ONLY parsing and cleaning
 */

/**
 * Extract questions from plain text
 * 
 * @param {string} text - Plain text content
 * @returns {Array} Array of extracted questions
 */
function extractFromText(text) {
  console.log('[Text Extractor] Starting extraction from plain text');
  
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    console.log('[Text Extractor] No text provided or empty');
    return [];
  }

  const questions = [];
  
  // Pattern 1: Numbered questions (1. 2. 3. or 1) 2) 3))
  const numberedPattern = /(?:^|\n)\s*(\d+[\.\):])\s*(.+?)(?=\n\s*\d+[\.\):]|$)/gs;
  let matches = [...text.matchAll(numberedPattern)];
  
  if (matches.length > 0) {
    console.log(`[Text Extractor] Found ${matches.length} numbered questions`);
    matches.forEach((match, idx) => {
      const cleanText = match[2].trim();
      if (cleanText.length > 5) { // Minimum question length
        questions.push({
          rawText: match[0].trim(),
          cleanText: cleanText,
          source: 'teacher',
          marks: null,
          topic: null,
          difficulty: null,
          extractionIndex: idx
        });
      }
    });
  }
  
  // Pattern 2: Q1, Q2, Question 1, etc.
  if (questions.length === 0) {
    const qPattern = /(?:^|\n)\s*(?:Q\d+|Question\s+\d+)[\.\):]?\s*(.+?)(?=\n\s*(?:Q\d+|Question\s+\d+)|$)/gis;
    matches = [...text.matchAll(qPattern)];
    
    if (matches.length > 0) {
      console.log(`[Text Extractor] Found ${matches.length} Q-style questions`);
      matches.forEach((match, idx) => {
        const cleanText = match[1].trim();
        if (cleanText.length > 5) {
          questions.push({
            rawText: match[0].trim(),
            cleanText: cleanText,
            source: 'teacher',
            marks: null,
            topic: null,
            difficulty: null,
            extractionIndex: idx
          });
        }
      });
    }
  }
  
  // Pattern 3: Line-by-line fallback (each non-empty line is a question)
  if (questions.length === 0) {
    console.log('[Text Extractor] Using line-by-line fallback');
    const lines = text.split('\n')
      .map(line => line.trim())
      .filter(line => {
        // Filter out headers, sections, etc.
        if (line.length < 5) return false;
        if (/^(chapter|section|part|unit)/i.test(line)) return false;
        if (/^[=-]{3,}$/.test(line)) return false; // Separators
        return true;
      });
    
    lines.forEach((line, idx) => {
      questions.push({
        rawText: line,
        cleanText: line,
        source: 'teacher',
        marks: null,
        topic: null,
        difficulty: null,
        extractionIndex: idx
      });
    });
  }
  
  console.log(`[Text Extractor] ✅ Extracted ${questions.length} questions from text`);
  return questions;
}

/**
 * Extract questions from LaTeX
 * 
 * @param {string} latex - LaTeX content
 * @returns {Array} Array of extracted questions
 */
function extractFromLatex(latex) {
  console.log('[LaTeX Extractor] Starting extraction from LaTeX');
  
  if (!latex || typeof latex !== 'string' || latex.trim().length === 0) {
    console.log('[LaTeX Extractor] No LaTeX provided or empty');
    return [];
  }

  const questions = [];
  
  // Pattern 1: \item within enumerate/itemize
  const itemPattern = /\\item\s+(.+?)(?=\\item|\\end\{enumerate\}|\\end\{itemize\}|$)/gs;
  let matches = [...latex.matchAll(itemPattern)];
  
  if (matches.length > 0) {
    console.log(`[LaTeX Extractor] Found ${matches.length} \\item entries`);
    matches.forEach((match, idx) => {
      const cleanText = match[1]
        .replace(/\\[a-zA-Z]+/g, '') // Remove LaTeX commands
        .replace(/[{}]/g, '') // Remove braces
        .trim();
      
      if (cleanText.length > 5) {
        questions.push({
          rawText: match[0].trim(),
          cleanText: cleanText,
          source: 'teacher',
          marks: null,
          topic: null,
          difficulty: null,
          extractionIndex: idx
        });
      }
    });
  }
  
  // Pattern 2: Numbered questions in LaTeX
  if (questions.length === 0) {
    const numberedPattern = /(?:^|\n)\s*(\d+[\.\):])\s*(.+?)(?=\n\s*\d+[\.\):]|$)/gs;
    matches = [...latex.matchAll(numberedPattern)];
    
    if (matches.length > 0) {
      console.log(`[LaTeX Extractor] Found ${matches.length} numbered questions`);
      matches.forEach((match, idx) => {
        const cleanText = match[2]
          .replace(/\\[a-zA-Z]+/g, '')
          .replace(/[{}]/g, '')
          .trim();
        
        if (cleanText.length > 5) {
          questions.push({
            rawText: match[0].trim(),
            cleanText: cleanText,
            source: 'teacher',
            marks: null,
            topic: null,
            difficulty: null,
            extractionIndex: idx
          });
        }
      });
    }
  }
  
  // Fallback: treat as plain text
  if (questions.length === 0) {
    console.log('[LaTeX Extractor] Falling back to text extraction');
    return extractFromText(latex);
  }
  
  console.log(`[LaTeX Extractor] ✅ Extracted ${questions.length} questions from LaTeX`);
  return questions;
}

/**
 * Extract questions from PDF
 * 
 * @param {string} filePath - Path to PDF file
 * @returns {Promise<Array>} Array of extracted questions
 */
async function extractFromPDF(filePath) {
  console.log('[PDF Extractor] Starting extraction from PDF');
  console.log('[PDF Extractor] File path:', filePath);
  
  if (!filePath || typeof filePath !== 'string' || filePath.trim().length === 0) {
    console.log('[PDF Extractor] No PDF path provided');
    return [];
  }

  // TODO: Implement actual PDF extraction
  // For now, return empty array
  // Future: Use pdf-parse or call AI service for OCR
  
  console.log('[PDF Extractor] ⚠️ PDF extraction not yet implemented');
  console.log('[PDF Extractor] Returning empty array - teacher must use text/LaTeX for now');
  
  return [];
}

/**
 * Main extraction router
 * 
 * @param {string} type - Source type: 'text', 'latex', 'pdf'
 * @param {string} content - Content or file path
 * @returns {Promise<Array>} Array of extracted questions
 */
async function extractTeacherQuestions(type, content) {
  console.log('[Question Extractor] ========================================');
  console.log('[Question Extractor] STARTING TEACHER QUESTION EXTRACTION');
  console.log('[Question Extractor] Type:', type);
  console.log('[Question Extractor] Content length:', content ? content.length : 0);
  console.log('[Question Extractor] ========================================');
  
  try {
    let questions = [];
    
    switch (type) {
      case 'text':
        questions = extractFromText(content);
        break;
        
      case 'latex':
        questions = extractFromLatex(content);
        break;
        
      case 'pdf':
        questions = await extractFromPDF(content);
        break;
        
      default:
        console.log('[Question Extractor] ⚠️ Unknown type, treating as text');
        questions = extractFromText(content);
    }
    
    // Add sequential IDs for tracking
    questions = questions.map((q, idx) => ({
      ...q,
      teacherQuestionId: `TQ-${String(idx + 1).padStart(3, '0')}`
    }));
    
    console.log('[Question Extractor] ========================================');
    console.log('[Question Extractor] ✅ EXTRACTION COMPLETE');
    console.log('[Question Extractor] Total questions extracted:', questions.length);
    console.log('[Question Extractor] ========================================');
    
    return questions;
    
  } catch (error) {
    console.error('[Question Extractor] ❌ ERROR:', error.message);
    console.error('[Question Extractor] Stack:', error.stack);
    return [];
  }
}

module.exports = {
  extractFromText,
  extractFromLatex,
  extractFromPDF,
  extractTeacherQuestions
};
