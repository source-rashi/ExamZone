# User Model & Role System - Quick Reference

## Import the Model

```javascript
const User = require('./models/User');
const { ROLES, isValidRole, getRoleDisplayName } = require('./utils/roles');
```

---

## Creating Users

### Create a Teacher
```javascript
const teacher = new User({
  name: 'John Smith',
  email: 'john@school.com',
  password: 'securePassword123', // Will be hashed later
  role: ROLES.TEACHER
});
await teacher.save();
```

### Create a Student
```javascript
const student = new User({
  name: 'Jane Doe',
  email: 'jane@school.com',
  password: 'studentPass456',
  role: ROLES.STUDENT,
  profilePicture: 'https://example.com/photo.jpg'
});
await student.save();
```

---

## Querying Users

### Find by Email
```javascript
const user = await User.findByEmail('john@school.com');
```

### Find All Teachers
```javascript
const teachers = await User.findByRole(ROLES.TEACHER);
```

### Find All Students
```javascript
const students = await User.findByRole(ROLES.STUDENT);
```

### Find Active Users
```javascript
const activeUsers = await User.find({ isActive: true });
```

### Find User by ID (without password)
```javascript
const user = await User.findById(userId); // password excluded by default
```

### Find User with Password (for authentication)
```javascript
const user = await User.findOne({ email: 'user@school.com' }).select('+password');
```

---

## Using Instance Methods

### Check if Teacher
```javascript
const user = await User.findById(userId);
if (user.isTeacher()) {
  console.log('User is a teacher');
}
```

### Check if Student
```javascript
if (user.isStudent()) {
  console.log('User is a student');
}
```

### Convert to JSON (password removed)
```javascript
const userObject = user.toJSON(); // No password field
res.json({ user: userObject });
```

---

## Role System

### Available Roles
```javascript
console.log(ROLES.TEACHER); // 'teacher'
console.log(ROLES.STUDENT); // 'student'
```

### Validate Role
```javascript
if (isValidRole('teacher')) {
  console.log('Valid role');
}

if (!isValidRole('admin')) {
  console.log('Invalid role');
}
```

### Get Display Name
```javascript
console.log(getRoleDisplayName('teacher')); // 'Teacher'
console.log(getRoleDisplayName('student')); // 'Student'
```

---

## Updating Users

### Update Profile
```javascript
const user = await User.findById(userId);
user.name = 'New Name';
user.profilePicture = 'https://example.com/new-photo.jpg';
await user.save();
```

### Soft Delete (Deactivate)
```javascript
const user = await User.findById(userId);
user.isActive = false;
await user.save();
```

### Reactivate User
```javascript
const user = await User.findById(userId);
user.isActive = true;
await user.save();
```

---

## Linking Users to Classes

### Create Class with Teacher
```javascript
const Class = require('./models/Class');

const newClass = new Class({
  code: 'MATH101',
  title: 'Mathematics',
  teacher: teacherId, // User ObjectId
  students: []
});
await newClass.save();
```

### Add Student with User ID
```javascript
const classDoc = await Class.findOne({ code: 'MATH101' });
classDoc.students.push({
  roll: '12345',
  name: 'Jane Doe',
  userId: studentId // User ObjectId
});
await classDoc.save();
```

### Populate Teacher Info
```javascript
const classDoc = await Class.findOne({ code: 'MATH101' })
  .populate('teacher', 'name email role');

console.log(classDoc.teacher.name); // Teacher's name
```

### Populate Student User Info
```javascript
const classDoc = await Class.findOne({ code: 'MATH101' })
  .populate('students.userId', 'name email');

classDoc.students.forEach(student => {
  if (student.userId) {
    console.log(student.userId.name); // Student's name from User
  }
});
```

---

## Common Patterns

### Check if Email Exists
```javascript
const existingUser = await User.findByEmail(email);
if (existingUser) {
  throw new Error('Email already registered');
}
```

### Get User's Classes (as Teacher)
```javascript
const Class = require('./models/Class');
const classes = await Class.find({ teacher: userId });
```

### Get User's Classes (as Student)
```javascript
const classes = await Class.find({ 'students.userId': userId });
```

### Get All Active Teachers
```javascript
const activeTeachers = await User.find({ 
  role: ROLES.TEACHER,
  isActive: true 
}).select('name email profilePicture');
```

---

## Validation Examples

### Email Validation
```javascript
// Valid emails
'user@example.com' ✓
'test.user@school.edu' ✓

// Invalid emails
'notanemail' ✗
'@example.com' ✗
```

### Password Validation
```javascript
// Valid passwords
'password123' ✓ (6+ characters)
'securePass!' ✓

// Invalid passwords
'pass' ✗ (too short)
'' ✗ (required)
```

### Role Validation
```javascript
// Valid roles
ROLES.TEACHER ✓
ROLES.STUDENT ✓

// Invalid roles
'admin' ✗ (not in enum)
'parent' ✗ (not in enum)
```

---

## Error Handling

### Duplicate Email
```javascript
try {
  const user = new User({
    name: 'Test',
    email: 'existing@email.com', // Already exists
    password: 'password'
  });
  await user.save();
} catch (error) {
  if (error.code === 11000) {
    console.error('Email already registered');
  }
}
```

### Validation Error
```javascript
try {
  const user = new User({
    name: 'T', // Too short (min 2 chars)
    email: 'invalid-email', // Invalid format
    password: '123' // Too short (min 6 chars)
  });
  await user.save();
} catch (error) {
  if (error.name === 'ValidationError') {
    console.error(error.errors);
  }
}
```

---

## Security Best Practices

### 1. Never Send Password in Response
```javascript
// ✗ BAD
const user = await User.findById(userId).select('+password');
res.json({ user });

// ✓ GOOD
const user = await User.findById(userId); // password excluded
res.json({ user });
```

### 2. Use toJSON() for Safe Output
```javascript
// ✓ GOOD
const user = await User.findById(userId);
res.json({ user: user.toJSON() }); // Password removed
```

### 3. Validate Role Before Saving
```javascript
if (!isValidRole(req.body.role)) {
  throw new Error('Invalid role');
}
```

### 4. Check User is Active
```javascript
const user = await User.findByEmail(email);
if (!user.isActive) {
  throw new Error('Account is deactivated');
}
```

---

## Testing Examples

### Create Test User
```javascript
const testUser = new User({
  name: 'Test User',
  email: `test${Date.now()}@example.com`, // Unique email
  password: 'testpass123',
  role: ROLES.STUDENT
});
await testUser.save();
```

### Clean Up Test Data
```javascript
await User.deleteMany({ email: /^test.*@example\.com$/ });
```

---

## Next Steps (When Adding Authentication)

1. **Password Hashing**
   ```javascript
   const bcrypt = require('bcrypt');
   userSchema.pre('save', async function(next) {
     if (!this.isModified('password')) return next();
     this.password = await bcrypt.hash(this.password, 10);
   });
   ```

2. **Compare Password Method**
   ```javascript
   userSchema.methods.comparePassword = async function(candidatePassword) {
     return await bcrypt.compare(candidatePassword, this.password);
   };
   ```

3. **JWT Token Generation**
   ```javascript
   userSchema.methods.generateAuthToken = function() {
     return jwt.sign(
       { _id: this._id, role: this.role },
       process.env.JWT_SECRET,
       { expiresIn: '7d' }
     );
   };
   ```

---

**For full implementation details, see:**
- [models/User.js](models/User.js) - User model
- [utils/roles.js](utils/roles.js) - Role system
- [models/Class.js](models/Class.js) - Class model with auth fields
- [USER_MODEL_VERIFICATION.md](USER_MODEL_VERIFICATION.md) - Full verification report
