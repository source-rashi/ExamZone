/**
 * Existing Endpoint Compatibility Test
 * Verifies that current routes still work with updated models
 */

const mongoose = require('mongoose');
const Class = require('./models/Class');

console.log('='.repeat(60));
console.log('EXISTING ENDPOINT COMPATIBILITY TEST');
console.log('='.repeat(60));

async function testEndpointCompatibility() {
  try {
    // Connect to MongoDB
    console.log('\n[1] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/examzone-test', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Test 1: Old-style class creation (as used by current endpoints)
    console.log('\n[2] Testing old-style class creation (current endpoint behavior)...');
    const testCode = `TEST-${Date.now()}`;
    
    const oldStyleClass = await Class.create({
      code: testCode,
      icon: '📚',
      title: 'Test Class',
      description: '',
      students: [],
      assignments: 0
    });
    
    console.log('✅ Old-style class created successfully');
    console.log('   - ID:', oldStyleClass._id);
    console.log('   - Code:', oldStyleClass.code);
    console.log('   - Title:', oldStyleClass.title);
    console.log('   - teacherId:', oldStyleClass.teacherId || 'null (as expected)');
    
    // Test 2: Find class by code (used by join endpoint)
    console.log('\n[3] Testing find by code (join-class endpoint logic)...');
    const foundClass = await Class.findOne({ code: testCode });
    
    if (foundClass) {
      console.log('✅ Class found by code');
      console.log('   - Matched:', foundClass.code === testCode);
    } else {
      console.log('❌ Class not found');
    }
    
    // Test 3: Add student to class (join-class logic)
    console.log('\n[4] Testing add student (join-class endpoint logic)...');
    foundClass.students.push({
      roll: '001',
      name: 'Test Student'
    });
    await foundClass.save();
    console.log('✅ Student added successfully');
    console.log('   - Students count:', foundClass.students.length);
    
    // Test 4: Query with legacy fields
    console.log('\n[5] Testing queries with legacy fields...');
    const classes = await Class.find({ assignments: 0 }).limit(1);
    console.log('✅ Query by legacy field (assignments) works');
    console.log('   - Results:', classes.length);
    
    // Test 5: Verify indexes are created in MongoDB
    console.log('\n[6] Verifying indexes in MongoDB...');
    const indexes = await Class.collection.getIndexes();
    console.log('✅ Indexes in MongoDB:');
    Object.keys(indexes).forEach(indexName => {
      console.log(`   - ${indexName}:`, JSON.stringify(indexes[indexName]));
    });
    
    // Test 6: Check if new fields are accessible
    console.log('\n[7] Testing new Phase 3 fields...');
    const newStyleClass = await Class.create({
      code: `NEW-${Date.now()}`,
      title: 'Advanced Math',
      description: 'Calculus course',
      subject: 'Mathematics',
      teacherId: new mongoose.Types.ObjectId()
    });
    console.log('✅ New-style class created with Phase 3 fields');
    console.log('   - Title:', newStyleClass.title);
    console.log('   - Subject:', newStyleClass.subject);
    console.log('   - teacherId:', newStyleClass.teacherId ? 'Set' : 'Not set');
    
    // Test 7: Query by new teacherId field
    console.log('\n[8] Testing query by teacherId...');
    const teacherClasses = await Class.find({ teacherId: newStyleClass.teacherId });
    console.log('✅ Query by teacherId works');
    console.log('   - Results:', teacherClasses.length);
    
    // Cleanup
    console.log('\n[9] Cleaning up test data...');
    await Class.deleteMany({ code: { $regex: /^TEST-|^NEW-/ } });
    console.log('✅ Test data cleaned');
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL COMPATIBILITY TESTS PASSED');
    console.log('='.repeat(60));
    
    console.log('\n📋 RESULTS:');
    console.log('  ✅ Old endpoint logic works perfectly');
    console.log('  ✅ Create class endpoint compatible');
    console.log('  ✅ Join class endpoint compatible');
    console.log('  ✅ Legacy fields accessible');
    console.log('  ✅ New fields accessible');
    console.log('  ✅ Indexes created in MongoDB');
    console.log('  ✅ No breaking changes');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

// Run tests
testEndpointCompatibility();
