/**
 * PHASE 6.3.5 — CONTROLLED FAKE EXAM DATA SEEDING SCRIPT
 * 
 * Purpose: Create safe testing environment for:
 * - Teacher question parsing (LaTeX + plain text)
 * - Set generation
 * - Student paper creation
 * - PDF mapping
 * 
 * Usage: node backend/scripts/seedFakeExamData.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Class = require('../models/Class');
const Exam = require('../models/Exam');
const Enrollment = require('../models/Enrollment');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/classDB', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// Clean old fake data
const cleanFakeData = async () => {
  console.log('\n🧹 Cleaning old fake data...');
  
  // Find fake classes
  const fakeClasses = await Class.find({ code: /^FAKE_/i });
  const fakeClassIds = fakeClasses.map(c => c._id);
  
  // Delete enrollments for fake classes
  if (fakeClassIds.length > 0) {
    await Enrollment.deleteMany({ classId: { $in: fakeClassIds } });
    console.log(`   Deleted enrollments for fake classes`);
  }
  
  // Delete fake exams
  const deletedExams = await Exam.deleteMany({ title: /^FAKE/i });
  console.log(`   Deleted ${deletedExams.deletedCount} fake exams`);
  
  // Delete fake classes
  const deletedClasses = await Class.deleteMany({ code: /^FAKE_/i });
  console.log(`   Deleted ${deletedClasses.deletedCount} fake classes`);
  
  // Delete fake students
  const deletedStudents = await User.deleteMany({ name: /^Fake Student/i });
  console.log(`   Deleted ${deletedStudents.deletedCount} fake students`);
  
  console.log('✅ Cleanup complete');
};

// Get existing teacher
const getTeacher = async () => {
  console.log('\n👨‍🏫 Finding teacher account...');
  
  const teacher = await User.findOne({ email: 'rashiagrawal082005@gmail.com' });
  
  if (!teacher) {
    throw new Error('Teacher account rashiagrawal082005@gmail.com not found. Please ensure the account exists.');
  }
  
  console.log(`✅ Using teacher account: ${teacher.name} (${teacher.email})`);
  return teacher;
};

// Create fake class
const createFakeClass = async (teacherId) => {
  console.log('\n📚 Creating fake class...');
  
  const fakeClass = await Class.create({
    code: 'FAKE_CSE_01',
    title: 'Fake CSE Test Class',
    subject: 'Machine Learning',
    teacher: teacherId
  });
  
  console.log(`✅ Class created: ${fakeClass.code} - ${fakeClass.title}`);
  return fakeClass;
};

// Create fake students and enroll them
const createFakeStudents = async (classId) => {
  console.log('\n👥 Creating fake students...');
  
  const hashedPassword = await bcrypt.hash('student123', 10);
  const students = [];
  
  for (let i = 1; i <= 6; i++) {
    const rollNumber = 100 + i;
    
    const student = await User.create({
      name: `Fake Student ${i}`,
      email: `fake.student${i}@examzone.ai`,
      password: hashedPassword,
      role: 'student'
    });
    
    // Enroll student in class
    await Enrollment.create({
      studentId: student._id,
      classId: classId,
      rollNumber: rollNumber,
      status: 'active'
    });
    
    students.push(student);
    console.log(`   ✓ Created: Fake Student ${i} (Roll: ${rollNumber})`);
  }
  
  console.log(`✅ ${students.length} students created and enrolled`);
  return students;
};

// Create Exam 1: LaTeX validation exam
const createLatexExam = async (classId, teacherId) => {
  console.log('\n📝 Creating Exam 1: LaTeX Mid Term...');
  
  const latexContent = `\\documentclass{article}
\\usepackage{amsmath}
\\begin{document}

\\section*{Linear Algebra Mid Term}

\\textbf{Question 1:} [10 marks]

Find the eigenvalues and eigenvectors of the matrix:
\\[
A = \\begin{bmatrix}
2 & 1 \\\\
1 & 2
\\end{bmatrix}
\\]

\\textbf{Question 2:} [10 marks]

Prove that for any square matrix $A$, the matrix $AA^T$ is symmetric.

\\textbf{Question 3:} [15 marks]

Given the vector space $\\mathbb{R}^3$, determine whether the following vectors are linearly independent:
\\[
v_1 = \\begin{bmatrix} 1 \\\\ 2 \\\\ 3 \\end{bmatrix}, \\quad
v_2 = \\begin{bmatrix} 4 \\\\ 5 \\\\ 6 \\end{bmatrix}, \\quad
v_3 = \\begin{bmatrix} 7 \\\\ 8 \\\\ 9 \\end{bmatrix}
\\]

\\textbf{Question 4:} [15 marks]

Compute the determinant of:
\\[
B = \\begin{bmatrix}
1 & 2 & 3 \\\\
0 & 4 & 5 \\\\
0 & 0 & 6
\\end{bmatrix}
\\]
And explain the geometric interpretation of this determinant.

\\textbf{Question 5:} [20 marks]

Consider the linear transformation $T: \\mathbb{R}^2 \\to \\mathbb{R}^2$ defined by:
\\[
T\\begin{bmatrix} x \\\\ y \\end{bmatrix} = \\begin{bmatrix} 3x + 2y \\\\ x - y \\end{bmatrix}
\\]

(a) Find the matrix representation of $T$.

(b) Determine if $T$ is invertible. If yes, find $T^{-1}$.

\\textbf{Question 6:} [15 marks]

Find the rank and nullity of the matrix:
\\[
C = \\begin{bmatrix}
1 & 2 & 3 & 4 \\\\
2 & 4 & 6 & 8 \\\\
3 & 6 & 9 & 12
\\end{bmatrix}
\\]

\\textbf{Question 7:} [15 marks]

Use the Gram-Schmidt process to orthogonalize the vectors:
\\[
u_1 = \\begin{bmatrix} 1 \\\\ 1 \\\\ 0 \\end{bmatrix}, \\quad
u_2 = \\begin{bmatrix} 1 \\\\ 0 \\\\ 1 \\end{bmatrix}
\\]

\\end{document}`;

  const exam = await Exam.create({
    title: 'FAKE Mid Term – Linear Algebra',
    description: 'LaTeX validation exam for testing question parsing and PDF generation',
    classId: classId,
    createdBy: teacherId,
    totalMarks: 100,
    duration: 180,
    numberOfSets: 3,
    maxAttempts: 1,
    questionSource: {
      type: 'latex',
      content: latexContent
    },
    status: 'draft',
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week from now
  });
  
  console.log(`✅ Exam created: ${exam.title}`);
  console.log(`   ID: ${exam._id}`);
  console.log(`   Sets: ${exam.numberOfSets}`);
  console.log(`   Type: ${exam.questionSource.type}`);
  
  return exam;
};

// Create Exam 2: Plain text validation exam
const createTextExam = async (classId, teacherId) => {
  console.log('\n📝 Creating Exam 2: Plain Text Quiz...');
  
  const textContent = `Machine Learning Basics Quiz

Question 1: [10 marks]
Define supervised learning and provide two real-world examples where it is commonly used.

Question 2: [10 marks]
Explain the difference between classification and regression problems in machine learning.

Question 3: [15 marks]
What is overfitting? Describe three techniques to prevent overfitting in machine learning models.

Question 4: [15 marks]
Compare and contrast decision trees and random forests. What are the advantages of using random forests?

Question 5: [20 marks]
Explain the k-means clustering algorithm:
(a) Describe the algorithm steps
(b) What are the limitations of k-means?
(c) How do you choose the optimal value of k?

Question 6: [15 marks]
What is cross-validation? Explain k-fold cross-validation and why it is important in model evaluation.

Question 7: [15 marks]
Describe the bias-variance tradeoff in machine learning. How does model complexity affect bias and variance?`;

  const exam = await Exam.create({
    title: 'FAKE Quiz – ML Basics',
    description: 'Plain text validation exam for testing question parsing and paper generation',
    classId: classId,
    createdBy: teacherId,
    totalMarks: 100,
    duration: 120,
    numberOfSets: 2,
    maxAttempts: 2,
    questionSource: {
      type: 'text',
      content: textContent
    },
    status: 'draft',
    startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    endTime: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000) // 9 days from now
  });
  
  console.log(`✅ Exam created: ${exam.title}`);
  console.log(`   ID: ${exam._id}`);
  console.log(`   Sets: ${exam.numberOfSets}`);
  console.log(`   Type: ${exam.questionSource.type}`);
  
  return exam;
};

// Main seeding function
const seedFakeExamData = async () => {
  try {
    console.log('🌱 Starting fake exam data seeding...\n');
    console.log('=' .repeat(60));
    
    // Connect to database
    await connectDB();
    
    // Clean old fake data
    await cleanFakeData();
    
    // Get existing teacher
    const teacher = await getTeacher();
    
    // Create class
    const fakeClass = await createFakeClass(teacher._id);
    
    // Create students
    const students = await createFakeStudents(fakeClass._id);
    
    // Create exams
    const exam1 = await createLatexExam(fakeClass._id, teacher._id);
    const exam2 = await createTextExam(fakeClass._id, teacher._id);
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ SEEDING COMPLETE\n');
    console.log('📊 Summary:');
    console.log(`   Teacher: ${teacher.name} (${teacher.email})`);
    console.log(`   Class: ${fakeClass.code} - ${fakeClass.title}`);
    console.log(`   Students: ${students.length} enrolled`);
    console.log(`   Exam 1: ${exam1.title} (${exam1.numberOfSets} sets, LaTeX)`);
    console.log(`   Exam 2: ${exam2.title} (${exam2.numberOfSets} sets, Text)`);
    console.log('\n🎯 Next Steps:');
    console.log(`   1. Login as ${teacher.email}`);
    console.log('   2. Open FAKE_CSE_01 class');
    console.log('   3. Click "Generate Question Papers" on exams');
    console.log('   4. Verify sets are created with different questions');
    console.log('   5. Click "Generate Student Papers"');
    console.log('   6. Verify 6 student papers created with roll numbers');
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the script
seedFakeExamData();
