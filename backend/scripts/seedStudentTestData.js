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

    // Stage 1 complete
    process.exit(0);
  } catch (err) {
    console.error('[FATAL]', err);
    process.exit(1);
  }
}

main();
