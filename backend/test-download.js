/**
 * Test download endpoint
 */

const axios = require('axios');
const fs = require('fs');

async function testDownload() {
  // For testing, we'll just verify the endpoint responds
  // In real usage, you need a valid JWT token
  
  const examId = '69660770a34410def5756fc4';
  const rollNumber = 102;
  
  // Check if PDF files exist on disk
  const studentPdfPath = `C:\\Users\\rashi\\OneDrive\\Desktop\\ExamZone\\ExamZone\\storage\\exams\\${examId}\\students\\student_${rollNumber}.pdf`;
  
  console.log('Checking if PDF exists on disk...');
  if (fs.existsSync(studentPdfPath)) {
    const stats = fs.statSync(studentPdfPath);
    console.log(`✅ PDF exists: ${studentPdfPath}`);
    console.log(`   Size: ${stats.size} bytes`);
    console.log(`   Created: ${stats.birthtime}`);
  } else {
    console.log(`❌ PDF not found: ${studentPdfPath}`);
  }
  
  // List all student PDFs
  const studentsDir = `C:\\Users\\rashi\\OneDrive\\Desktop\\ExamZone\\ExamZone\\storage\\exams\\${examId}\\students`;
  console.log(`\nAll student PDFs in ${studentsDir}:`);
  const files = fs.readdirSync(studentsDir).filter(f => f.endsWith('.pdf'));
  files.forEach(file => {
    const path = `${studentsDir}\\${file}`;
    const stats = fs.statSync(path);
    console.log(`  ${file} - ${stats.size} bytes`);
  });
  
  // List all set master PDFs
  const setsDir = `C:\\Users\\rashi\\OneDrive\\Desktop\\ExamZone\\ExamZone\\storage\\exams\\${examId}\\sets`;
  console.log(`\nAll set master PDFs in ${setsDir}:`);
  const setFiles = fs.readdirSync(setsDir).filter(f => f.endsWith('.pdf'));
  setFiles.forEach(file => {
    const path = `${setsDir}\\${file}`;
    const stats = fs.statSync(path);
    console.log(`  ${file} - ${stats.size} bytes`);
  });
}

testDownload();
