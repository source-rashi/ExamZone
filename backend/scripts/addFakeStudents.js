/**
 * Script to add fake students for testing
 */
const mongoose = require('mongoose');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Exam = require('../models/Exam');
const Class = require('../models/Class');
const bcrypt = require('bcryptjs');

const EXAM_ID = '6964f65ce02e10769e60a918';

async function addFakeStudents() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/classDB');
    console.log('✅ Connected to MongoDB');

    // Get the exam and class
    const exam = await Exam.findById(EXAM_ID).populate('classId');
    if (!exam) {
      console.error('❌ Exam not found');
      process.exit(1);
    }

    console.log('📝 Exam:', exam.title);
    console.log('🏫 Class:', exam.classId.name, '(', exam.classId._id, ')');

    const classId = exam.classId._id;

    // Check existing enrollments
    const existingEnrollments = await Enrollment.find({ classId });
    console.log('📊 Existing enrollments:', existingEnrollments.length);

    // Create 5 fake students
    const fakeStudents = [
      { name: 'Alice Johnson', email: 'alice@student.com', rollNumber: 101 },
      { name: 'Bob Smith', email: 'bob@student.com', rollNumber: 102 },
      { name: 'Charlie Brown', email: 'charlie@student.com', rollNumber: 103 },
      { name: 'Diana Prince', email: 'diana@student.com', rollNumber: 104 },
      { name: 'Eve Wilson', email: 'eve@student.com', rollNumber: 105 }
    ];

    console.log('\n🔄 Creating fake students...');

    for (const studentData of fakeStudents) {
      // Check if user already exists
      let user = await User.findOne({ email: studentData.email });
      
      if (!user) {
        // Create user
        const hashedPassword = await bcrypt.hash('student123', 10);
        user = await User.create({
          name: studentData.name,
          email: studentData.email,
          password: hashedPassword,
          role: 'student'
        });
        console.log('✅ Created user:', studentData.name);
      } else {
        console.log('ℹ️  User already exists:', studentData.name);
      }

      // Check if already enrolled
      const existingEnrollment = await Enrollment.findOne({
        classId: classId,
        studentId: user._id
      });

      if (!existingEnrollment) {
        // Create enrollment
        await Enrollment.create({
          classId: classId,
          studentId: user._id,
          rollNumber: studentData.rollNumber,
          status: 'active'
        });
        console.log('✅ Enrolled:', studentData.name, '(Roll:', studentData.rollNumber + ')');
      } else {
        console.log('ℹ️  Already enrolled:', studentData.name);
      }
    }

    // Verify enrollments
    const finalEnrollments = await Enrollment.find({ classId }).populate('studentId', 'name email');
    console.log('\n📊 Final enrollment count:', finalEnrollments.length);
    console.log('\n👥 Enrolled students:');
    finalEnrollments.forEach(e => {
      console.log(`  - Roll ${e.rollNumber}: ${e.studentId?.name || 'Unknown'} (${e.studentId?.email || 'N/A'})`);
    });

    console.log('\n✅ Done! You can now generate student papers.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addFakeStudents();
