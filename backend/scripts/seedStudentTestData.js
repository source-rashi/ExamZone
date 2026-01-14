// PHASE 6.9 — STUDENT TEST DATA FACTORY
// Stage 1: DB connection + user lookup
// Only setup DB connection and find the student by email. Abort if not found.

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');

const STUDENT_EMAIL = 'rashiagrawal1801@gmail.com';

async function main() {
  try {
    // 1. Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/examzone';
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('[DB] Connected to MongoDB:', mongoUri);

    // 2. Find student by email
    const student = await User.findOne({ email: STUDENT_EMAIL, role: 'student' });
    if (!student) {
      console.error(`[ERROR] Student not found: ${STUDENT_EMAIL}`);
      process.exit(1);
    }
    console.log(`[OK] Found student: ${student.name} (${student.email}) [${student._id}]`);

    // 3. Create fake teachers if needed
    const teacher1 = await User.findOneAndUpdate(
      { email: 'fake.teacher1@examzone.com' },
      { $setOnInsert: { name: 'FAKE - Dr. ML Teacher', role: 'teacher', password: 'test1234' } },
      { upsert: true, new: true }
    );
    const teacher2 = await User.findOneAndUpdate(
      { email: 'fake.teacher2@examzone.com' },
      { $setOnInsert: { name: 'FAKE - Prof. DS Teacher', role: 'teacher', password: 'test1234' } },
      { upsert: true, new: true }
    );
    console.log(`[OK] Teachers ready: ${teacher1.name}, ${teacher2.name}`);

    // 4. Create 2 fake classes
    const class1 = await Class.create({
      name: 'FAKE - ML Practice Class',
      code: 'FAKE-ML-' + Math.floor(Math.random()*10000),
      teacher: teacher1._id,
      students: [student._id],
      description: 'FAKE - Machine Learning practice class for test data',
      subject: 'Machine Learning',
    });
    const class2 = await Class.create({
      name: 'FAKE - DS/Algo Class',
      code: 'FAKE-DS-' + Math.floor(Math.random()*10000),
      teacher: teacher2._id,
      students: [student._id],
      description: 'FAKE - Data Structures and Algorithms class for test data',
      subject: 'Data Structures',
    });
    console.log(`[OK] Created classes: ${class1.name} (${class1.code}), ${class2.name} (${class2.code})`);

    // Stage 2 complete
    process.exit(0);
  } catch (err) {
    console.error('[FATAL]', err);
    process.exit(1);
  }
}

main();
