// PHASE 6.9 — STUDENT TEST DATA FACTORY
// Stage 1: DB connection + user lookup
// Only setup DB connection and find the student by email. Abort if not found.

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });


const User = require('../models/User');
const Class = require('../models/Class');
const Exam = require('../models/Exam');

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

    // 5. Generate fake exams and question banks for each class
    const subjects = [
      { subject: 'Machine Learning', topics: ['Regression', 'Classification', 'Clustering', 'SVM', 'Neural Networks'] },
      { subject: 'Data Structures', topics: ['Arrays', 'Linked Lists', 'Trees', 'Graphs', 'Hash Tables'] },
      { subject: 'Probability', topics: ['Random Variables', 'Distributions', 'Bayes Theorem', 'Markov Chains'] },
      { subject: 'DBMS', topics: ['SQL', 'Normalization', 'Transactions', 'Indexing', 'ER Diagrams'] },
      { subject: 'OS', topics: ['Processes', 'Threads', 'Memory', 'Scheduling', 'File Systems'] },
    ];

    function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

    async function createFakeExam({ classId, teacherId, subject, status, examIndex }) {
      const examTitle = `FAKE - ${subject} ${['Quiz','Midterm','Practice','Final','Test'][examIndex%5]}`;
      const topics = subjects.find(s => s.subject === subject)?.topics || ['General'];
      const numberOfSets = randomInt(3, 5);
      const questionsPerSet = randomInt(8, 15);
      const totalMarks = questionsPerSet * 2;
      const sets = [];
      for (let i = 0; i < numberOfSets; i++) {
        const setId = `SET${i+1}`;
        const questions = [];
        for (let q = 0; q < questionsPerSet; q++) {
          questions.push({
            questionText: `Q${q+1}: [${randomFrom(topics)}] Explain concept ${randomInt(1, 100)}?`,
            marks: 2,
            topic: randomFrom(topics),
            difficulty: randomFrom(['easy','medium','hard']),
            options: [
              `Option A${q}`,
              `Option B${q}`,
              `Option C${q}`,
              `Option D${q}`
            ],
            correctAnswer: `Option ${['A','B','C','D'][randomInt(0,3)]}${q}`
          });
        }
        sets.push({ setId, questions, totalMarks });
      }
      // Exam status mix
      const statusOptions = ['published','running','closed','draft','prepared'];
      const examStatus = status || randomFrom(statusOptions);
      const exam = await Exam.create({
        classId,
        createdBy: teacherId,
        title: examTitle,
        description: `FAKE - ${subject} exam for test data`,
        mode: 'online',
        duration: randomInt(30, 120),
        attemptsAllowed: 1,
        setsPerStudent: 1,
        numberOfSets,
        totalMarks,
        paperConfig: {
          subject,
          difficulty: 'mixed',
          questionsPerSet,
          totalMarksPerSet: totalMarks,
          marksMode: 'auto',
          instructions: 'Answer all questions.'
        },
        questionsPerSet,
        totalMarksPerSet: totalMarks,
        subject,
        difficultyLevel: 'mixed',
        questionMode: 'teacher_provided',
        generatedSets: sets,
        status: examStatus,
        publishedAt: examStatus === 'published' ? new Date() : undefined,
        closedAt: examStatus === 'closed' ? new Date() : undefined,
      });
      return exam;
    }

    // For each class, create at least 5 exams
    const allClasses = [class1, class2];
    for (const [i, cls] of allClasses.entries()) {
      const subj = cls.subject || randomFrom(subjects).subject;
      for (let e = 0; e < 5; e++) {
        const exam = await createFakeExam({
          classId: cls._id,
          teacherId: cls.teacher,
          subject: subj,
          examIndex: e
        });
        console.log(`[OK] Created exam: ${exam.title} (${exam._id}) for class ${cls.name}`);
      }
    }

    // Stage 3 complete
    process.exit(0);
  } catch (err) {
    console.error('[FATAL]', err);
    process.exit(1);
  }
}

main();
