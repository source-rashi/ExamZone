/**
 * PHASE 8.4 - Orphaned PDF Cleanup Job
 * 
 * Detects and optionally removes PDF files that are not referenced in the database.
 * This helps maintain storage hygiene and prevents accumulation of unused files.
 * 
 * Run modes:
 * - Dry run (default): Lists orphaned files without deleting
 * - Delete mode: Removes orphaned files from filesystem
 * 
 * Usage:
 *   node scripts/cleanupOrphanedFiles.js              # Dry run
 *   node scripts/cleanupOrphanedFiles.js --delete     # Delete orphaned files
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const { Exam, ExamPaper, Assignment } = require('../models');

// Directories to scan
const STORAGE_DIRS = {
  exams: path.join(__dirname, '../../storage/exams'),
  pdfs: path.join(__dirname, '../../pdfs'),
  assignments: path.join(__dirname, '../../uploads/assignments'),
  submissions: path.join(__dirname, '../../uploads/submissions')
};

/**
 * Recursively get all PDF files in a directory
 */
function getAllPdfFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    console.log(`⚠️  Directory not found: ${dir}`);
    return fileList;
  }

  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getAllPdfFiles(filePath, fileList);
    } else if (path.extname(file).toLowerCase() === '.pdf') {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Get all PDF paths referenced in database
 */
async function getReferencedPdfPaths() {
  const referencedPaths = new Set();

  try {
    // Get exam PDFs (setMasterPapers and studentPapers)
    const exams = await Exam.find({}).lean();
    for (const exam of exams) {
      // Set master papers
      if (exam.setMasterPapers) {
        for (const set of exam.setMasterPapers) {
          if (set.pdfPath) {
            const absPath = path.isAbsolute(set.pdfPath) 
              ? set.pdfPath 
              : path.resolve(__dirname, '../../', set.pdfPath);
            referencedPaths.add(path.normalize(absPath));
          }
        }
      }

      // Student papers
      if (exam.studentPapers) {
        for (const paper of exam.studentPapers) {
          const pdfPath = paper.paperPath || paper.pdfPath;
          if (pdfPath) {
            const absPath = path.isAbsolute(pdfPath) 
              ? pdfPath 
              : path.resolve(__dirname, '../../', pdfPath);
            referencedPaths.add(path.normalize(absPath));
          }
        }
      }
    }

    // Get exam paper PDFs (from ExamPaper model)
    const examPapers = await ExamPaper.find({}).lean();
    for (const paper of examPapers) {
      if (paper.pdfPath) {
        const absPath = path.isAbsolute(paper.pdfPath) 
          ? paper.pdfPath 
          : path.resolve(__dirname, '../../', paper.pdfPath);
        referencedPaths.add(path.normalize(absPath));
      }
    }

    // Get assignment PDFs
    const assignments = await Assignment.find({}).lean();
    for (const assignment of assignments) {
      if (assignment.attachmentPath) {
        const absPath = path.isAbsolute(assignment.attachmentPath) 
          ? assignment.attachmentPath 
          : path.resolve(__dirname, '../../', assignment.attachmentPath);
        referencedPaths.add(path.normalize(absPath));
      }

      // Assignment submissions
      if (assignment.submissions) {
        for (const submission of assignment.submissions) {
          if (submission.filePath) {
            const absPath = path.isAbsolute(submission.filePath) 
              ? submission.filePath 
              : path.resolve(__dirname, '../../', submission.filePath);
            referencedPaths.add(path.normalize(absPath));
          }
        }
      }
    }

    console.log(`✅ Found ${referencedPaths.size} referenced PDF paths in database`);
    return referencedPaths;

  } catch (error) {
    console.error('❌ Error fetching referenced paths:', error.message);
    throw error;
  }
}

/**
 * Find orphaned files
 */
async function findOrphanedFiles() {
  console.log('🔍 Scanning for orphaned PDF files...\n');

  const referencedPaths = await getReferencedPdfPaths();
  const orphanedFiles = [];

  // Scan each storage directory
  for (const [dirName, dirPath] of Object.entries(STORAGE_DIRS)) {
    console.log(`📂 Scanning ${dirName}: ${dirPath}`);
    
    const allFiles = getAllPdfFiles(dirPath);
    console.log(`   Found ${allFiles.length} PDF files`);

    for (const filePath of allFiles) {
      const normalizedPath = path.normalize(filePath);
      
      if (!referencedPaths.has(normalizedPath)) {
        const stat = fs.statSync(filePath);
        orphanedFiles.push({
          path: filePath,
          size: stat.size,
          modified: stat.mtime,
          directory: dirName
        });
      }
    }
  }

  return orphanedFiles;
}

/**
 * Format file size for display
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

/**
 * Delete orphaned files
 */
function deleteOrphanedFiles(orphanedFiles) {
  console.log(`\n🗑️  Deleting ${orphanedFiles.length} orphaned files...\n`);

  let deletedCount = 0;
  let failedCount = 0;

  for (const file of orphanedFiles) {
    try {
      fs.unlinkSync(file.path);
      deletedCount++;
      console.log(`   ✅ Deleted: ${path.basename(file.path)}`);
    } catch (error) {
      failedCount++;
      console.error(`   ❌ Failed to delete ${path.basename(file.path)}: ${error.message}`);
    }
  }

  console.log(`\n📊 Deletion Summary:`);
  console.log(`   Deleted: ${deletedCount}`);
  console.log(`   Failed: ${failedCount}`);
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 Starting orphaned PDF cleanup job\n');

    // Check if delete mode is enabled
    const deleteMode = process.argv.includes('--delete');

    if (deleteMode) {
      console.log('⚠️  DELETE MODE ENABLED - Files will be permanently removed\n');
    } else {
      console.log('ℹ️  DRY RUN MODE - No files will be deleted\n');
      console.log('   Run with --delete flag to remove orphaned files\n');
    }

    // Connect to database
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/examzone');
    console.log('✅ Database connected\n');

    // Find orphaned files
    const orphanedFiles = await findOrphanedFiles();

    if (orphanedFiles.length === 0) {
      console.log('\n✨ No orphaned files found! Storage is clean.');
    } else {
      console.log(`\n⚠️  Found ${orphanedFiles.length} orphaned PDF files:\n`);

      // Group by directory
      const byDirectory = {};
      let totalSize = 0;

      orphanedFiles.forEach(file => {
        if (!byDirectory[file.directory]) {
          byDirectory[file.directory] = [];
        }
        byDirectory[file.directory].push(file);
        totalSize += file.size;
      });

      // Display orphaned files by directory
      for (const [dirName, files] of Object.entries(byDirectory)) {
        console.log(`\n📂 ${dirName} (${files.length} files):`);
        files.forEach(file => {
          console.log(`   - ${path.basename(file.path)} (${formatFileSize(file.size)}, modified: ${file.modified.toLocaleString()})`);
        });
      }

      console.log(`\n💾 Total orphaned storage: ${formatFileSize(totalSize)}`);

      // Delete if in delete mode
      if (deleteMode) {
        deleteOrphanedFiles(orphanedFiles);
      } else {
        console.log(`\n💡 Run with --delete flag to remove these files`);
      }
    }

    // Close database connection
    await mongoose.disconnect();
    console.log('\n✅ Cleanup job completed');

  } catch (error) {
    console.error('\n❌ Cleanup job failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { findOrphanedFiles, deleteOrphanedFiles };
