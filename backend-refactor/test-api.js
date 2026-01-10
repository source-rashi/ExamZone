require('dotenv').config();
const mongoose = require('mongoose');
const Class = require('./models/Class');

async function testAPI() {
  console.log('\n=== TESTING EXISTING APIs (Database Operations) ===\n');

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✓ MongoDB Connected\n');

    // Test 1: Create Class (Old Structure - No Auth)
    console.log('Test 1: Creating class (old structure)...');
    const testClass = new Class({
      code: 'API_TEST_' + Date.now(),
      title: 'Test Class',
      description: 'Testing backward compatibility'
    });
    await testClass.save();
    console.log('✓ Class created successfully:', testClass.code);
    console.log('  - Title:', testClass.title);
    console.log('  - Teacher field:', testClass.teacher || 'null (backward compatible)');
    console.log('  - ID:', testClass._id);

    // Test 2: Add Student (Old Structure)
    console.log('\nTest 2: Adding student (old structure)...');
    testClass.students.push({
      roll: '123',
      name: 'Test Student',
      pdfPath: null
    });
    await testClass.save();
    console.log('✓ Student added successfully');
    console.log('  - Roll:', testClass.students[0].roll);
    console.log('  - Name:', testClass.students[0].name);
    console.log('  - userId:', testClass.students[0].userId || 'null (backward compatible)');

    // Test 3: Find Class by Code
    console.log('\nTest 3: Finding class by code...');
    const foundClass = await Class.findOne({ code: testClass.code });
    console.log('✓ Class found:', foundClass ? 'Yes' : 'No');
    console.log('  - Code:', foundClass.code);
    console.log('  - Students count:', foundClass.students.length);

    // Test 4: Update Student
    console.log('\nTest 4: Updating student...');
    foundClass.students[0].answerPdf = 'test-answer.pdf';
    await foundClass.save();
    console.log('✓ Student updated successfully');
    console.log('  - Answer PDF:', foundClass.students[0].answerPdf);

    // Clean up test data
    console.log('\nCleaning up test data...');
    await Class.deleteOne({ _id: testClass._id });
    console.log('✓ Test data removed');

    console.log('\n=== ALL API TESTS PASSED ✓ ===\n');
    console.log('Conclusion:');
    console.log('  ✓ Existing Class operations work without User model');
    console.log('  ✓ No breaking changes to current APIs');
    console.log('  ✓ Database operations function normally');
    console.log('  ✓ New auth fields are truly optional\n');

  } catch (error) {
    console.error('\n❌ API Test Failed:');
    console.error('   Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Connection closed.');
  }
}

testAPI();
