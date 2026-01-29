/**
 * Migration Script: Convert absolute PDF paths to relative paths
 * 
 * This script updates existing exam records to use relative paths
 * instead of absolute paths for better portability across environments
 */

const mongoose = require('mongoose');
const Exam = require('../models/Exam');
const path = require('path');

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/examzone', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

/**
 * Convert absolute path to relative path
 */
function makeRelative(absolutePath) {
  if (!absolutePath) return null;
  
  // If already relative, return as-is
  if (!path.isAbsolute(absolutePath)) {
    return absolutePath;
  }
  
  // Extract the relevant part: storage/exams/...
  const storageIndex = absolutePath.indexOf('storage\\exams') !== -1 
    ? absolutePath.indexOf('storage\\exams')
    : absolutePath.indexOf('storage/exams');
  
  if (storageIndex !== -1) {
    let relativePath = absolutePath.substring(storageIndex);
    // Normalize to forward slashes
    relativePath = relativePath.replace(/\\/g, '/');
    return relativePath;
  }
  
  // If it's in pdfs directory
  const pdfsIndex = absolutePath.indexOf('pdfs\\') !== -1
    ? absolutePath.indexOf('pdfs\\')
    : absolutePath.indexOf('pdfs/');
  
  if (pdfsIndex !== -1) {
    let relativePath = absolutePath.substring(pdfsIndex);
    relativePath = relativePath.replace(/\\/g, '/');
    return relativePath;
  }
  
  // Otherwise, assume it's already in correct format or needs manual review
  console.warn('[Warning] Could not convert path:', absolutePath);
  return absolutePath;
}

async function migratePaths() {
  try {
    await connectDB();
    
    console.log('[Migration] Starting PDF path migration...');
    
    // Find all exams
    const exams = await Exam.find({});
    console.log(`[Migration] Found ${exams.length} exams to process`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const exam of exams) {
      let needsUpdate = false;
      
      // Process studentPapers
      if (exam.studentPapers && exam.studentPapers.length > 0) {
        for (const paper of exam.studentPapers) {
          if (paper.paperPath) {
            const newPath = makeRelative(paper.paperPath);
            if (newPath !== paper.paperPath) {
              console.log(`[Migration] Converting: ${paper.paperPath} -> ${newPath}`);
              paper.paperPath = newPath;
              needsUpdate = true;
            }
          }
          // Also check pdfPath field (legacy)
          if (paper.pdfPath) {
            const newPath = makeRelative(paper.pdfPath);
            if (newPath !== paper.pdfPath) {
              console.log(`[Migration] Converting: ${paper.pdfPath} -> ${newPath}`);
              paper.pdfPath = newPath;
              needsUpdate = true;
            }
          }
        }
      }
      
      // Process setMasterPapers
      if (exam.setMasterPapers && exam.setMasterPapers.length > 0) {
        for (const setPaper of exam.setMasterPapers) {
          if (setPaper.pdfPath) {
            const newPath = makeRelative(setPaper.pdfPath);
            if (newPath !== setPaper.pdfPath) {
              console.log(`[Migration] Converting: ${setPaper.pdfPath} -> ${newPath}`);
              setPaper.pdfPath = newPath;
              needsUpdate = true;
            }
          }
        }
      }
      
      if (needsUpdate) {
        await exam.save();
        updatedCount++;
        console.log(`[Migration] ✓ Updated exam: ${exam._id} (${exam.title})`);
      } else {
        skippedCount++;
      }
    }
    
    console.log('\n[Migration] Complete!');
    console.log(`  Updated: ${updatedCount} exams`);
    console.log(`  Skipped: ${skippedCount} exams (already relative)`);
    
    process.exit(0);
  } catch (error) {
    console.error('[Migration] Error:', error);
    process.exit(1);
  }
}

// Run migration
migratePaths();
