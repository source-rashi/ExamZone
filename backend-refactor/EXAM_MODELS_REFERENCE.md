# Phase 3.3.2 - Exam Engine Models

## ✅ Models Created

### 1. **Exam.js** - Master Exam Configuration
```javascript
{
  classId: ObjectId → Class
  createdBy: ObjectId → User
  title: String (required)
  description: String
  duration: Number (minutes)
  totalMarks: Number
  maxAttempts: Number (default: 1)
  evaluationMode: enum ['manual', 'ai', 'hybrid']
  startTime: Date
  endTime: Date
  status: enum ['draft', 'published', 'ongoing', 'closed']
  settings: {
    tabSwitchLimit: Number
    allowPdfUpload: Boolean
    allowEditor: Boolean
  }
}
```
**Indexes:** classId, createdBy, status, startTime+endTime

---

### 2. **QuestionPaper.js** - Student-Specific Question Sets
```javascript
{
  examId: ObjectId → Exam
  studentId: ObjectId → User
  setNumber: Number
  pdfUrl: String
  questions: Array<Mixed>
}
```
**Indexes:** examId, studentId, compound(examId, studentId)

---

### 3. **Attempt.js** - Individual Exam Attempts
```javascript
{
  examId: ObjectId → Exam
  studentId: ObjectId → User
  questionPaperId: ObjectId → QuestionPaper
  attemptNumber: Number (required)
  startTime: Date
  endTime: Date
  status: enum ['started', 'submitted', 'evaluated']
  tabSwitchCount: Number (default: 0)
  focusLossCount: Number (default: 0)
}
```
**Indexes:** examId, studentId, status, **UNIQUE(examId, studentId, attemptNumber)**

---

### 4. **AnswerSheet.js** - Uploaded Answers
```javascript
{
  attemptId: ObjectId → Attempt
  fileUrl: String
  extractedText: String
  uploadTime: Date
}
```
**Indexes:** attemptId

---

### 5. **Evaluation.js** - AI/Manual Evaluation
```javascript
{
  attemptId: ObjectId → Attempt
  mode: enum ['manual', 'ai', 'hybrid']
  aiResponse: Mixed
  teacherOverride: Mixed
  checkedAt: Date
}
```
**Indexes:** attemptId, mode

---

### 6. **Result.js** - Final Marks & Feedback
```javascript
{
  attemptId: ObjectId → Attempt
  totalMarks: Number (required)
  feedback: String
  published: Boolean (default: false)
  publishedAt: Date
}
```
**Indexes:** attemptId, published

---

### 7. **ViolationLog.js** - Proctoring Violations
```javascript
{
  attemptId: ObjectId → Attempt
  type: String (required)
  count: Number (default: 1)
  timestamps: Array<Date>
}
```
**Indexes:** attemptId, type

---

## 🔗 Relationship Diagram

```
Class ←─────┐
            │
User ←──────┼──────┐
            │      │
         Exam ←────┼──── createdBy
            │      │
            ├──────┴──── studentId
            │
    QuestionPaper
            │
         Attempt
         ├─ AnswerSheet
         ├─ Evaluation
         ├─ Result
         └─ ViolationLog
```

---

## 📊 Data Flow

### Exam Creation Flow
1. Teacher creates `Exam` in `Class`
2. System generates `QuestionPaper` for each enrolled student
3. Student starts exam → creates `Attempt`
4. Student uploads answer → creates `AnswerSheet`
5. System/Teacher evaluates → creates `Evaluation`
6. System publishes → creates `Result`
7. Violations tracked → `ViolationLog`

### Query Examples

**Get all exams in a class:**
```javascript
Exam.find({ classId, status: 'published' })
```

**Get student's attempts:**
```javascript
Attempt.find({ examId, studentId })
  .populate('questionPaperId')
  .sort({ attemptNumber: -1 })
```

**Get attempt result:**
```javascript
Result.findOne({ attemptId })
  .populate({
    path: 'attemptId',
    populate: { path: 'examId' }
  })
```

**Check violations:**
```javascript
ViolationLog.find({ attemptId })
  .sort({ count: -1 })
```

---

## ✅ Verification Results

All models verified:
- ✅ Load without errors
- ✅ Required fields enforced
- ✅ Enums properly configured
- ✅ Indexes created
- ✅ References working
- ✅ Default values set
- ✅ Timestamps enabled

**Status:** Production-ready for Phase 3.3.3 (Controllers)
