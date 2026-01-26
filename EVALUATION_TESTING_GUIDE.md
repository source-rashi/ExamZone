# 🎓 Evaluation System - Testing Guide

## ✅ What's New - PHASE 7.5 Complete!

The evaluation system is now fully integrated. Here's how to use it:

---

## 👨‍🏫 For TEACHERS

### 1. **View Submissions** (Classroom Page)
- Go to any classroom
- Click on "Exams" tab
- Each exam card now shows:
  - **"X total"** - Total student submissions
  - **"X pending ⏳"** - Submissions waiting for evaluation (orange badge)
- Click **"📝 Evaluate Submissions"** button (purple)
  - Badge shows number of pending evaluations

### 2. **Evaluate Students** (Results Dashboard)
**Path:** Click "📝 Evaluate Submissions" on any exam

**You'll see:**
- List of all submitted attempts with:
  - Student name & roll number
  - Submission time
  - Current score (if evaluated)
  - Status: Pending/AI-Checked/Evaluated
  - Integrity score
- Click **"Evaluate"** on any student

### 3. **Grading Interface**
**Features:**
- View student's answers question-by-question
- See expected answers (if available)
- Award marks per question
- Add feedback for each question
- **"Get AI Suggestion"** button - AI analyzes answers and suggests scores
- Total score auto-calculates
- Add overall feedback
- **"Submit Evaluation"** to save

### 4. **Re-evaluation**
- Click **"Review"** on already-evaluated attempts
- Modify scores/feedback
- Submit again (overwrites previous evaluation)

### 5. **Finalize Exam**
- When ALL attempts are evaluated, a **"Finalize Exam"** button appears
- Click to mark evaluation as complete
- System auto-finalizes when 100% evaluated

---

## 👨‍🎓 For STUDENTS

### 1. **Take Exam** (Classroom Page)
- Go to classroom → Exams tab
- Click **"🚀 Start Exam"** or **"Resume Exam"**
- Complete and submit

### 2. **View Results**
**Path:** Classroom → Exams → Click **"📊 View My Result"**

**You'll see:**
- Your score, percentage, and grade
- Integrity score
- Question-wise breakdown:
  - Your answer vs expected answer
  - Marks awarded per question
  - Teacher's feedback
- Overall teacher feedback
- Violations (if any)

**Status Messages:**
- "Your submission is under evaluation" - if not graded yet
- Otherwise, full result page opens

---

## 🎯 Testing Workflow

### Complete Flow:
1. **Teacher:** Create exam → Generate papers → Publish
2. **Student:** Take exam → Submit
3. **Teacher:** Go to classroom → See "1 pending ⏳"
4. **Teacher:** Click "📝 Evaluate Submissions"
5. **Teacher:** Click "Evaluate" on student
6. **Teacher:** (Optional) Click "Get AI Suggestion" to see AI scores
7. **Teacher:** Enter/adjust marks → Add feedback → Submit
8. **Student:** Click "📊 View My Result" to see scores
9. **Teacher:** When all done, click "Finalize Exam"

---

## 🔍 Where to Find Things

### Teacher Navigation:
```
Classroom → Exams Tab → "📝 Evaluate Submissions" (purple button)
└─> Results Dashboard
    ├─> Student List (with submission stats)
    └─> Click "Evaluate" → Grading Interface
        ├─> View answers
        ├─> Get AI suggestions
        └─> Submit scores
```

### Student Navigation:
```
Classroom → Exams Tab → "📊 View My Result" (blue button)
└─> Result Page
    ├─> Score & Grade
    ├─> Question-wise marks
    └─> Teacher feedback
```

---

## 🎨 Visual Indicators

### In Exam Cards:
- **Teacher sees:** "5 total, 2 pending ⏳" (orange)
- **Student sees:** "1/2 ✓" (attempts used)

### Buttons:
- 🟣 **Purple "📝 Evaluate Submissions"** - Teacher evaluation (with red badge for pending count)
- 🔵 **Blue "📊 View My Result"** - Student results
- 🟢 **Green "🚀 Start/Resume Exam"** - Active exam
- ✅ **Green "Attempted"** badge - Student used all attempts

### Status Badges:
- 🟡 **Pending** - Awaiting evaluation
- 🔵 **AI-Checked** - AI scored (teacher review pending)
- 🟢 **Evaluated** - Teacher graded

---

## ⚙️ Backend Endpoints

All working and tested:

### Teacher:
- `GET /api/v2/evaluation/exams/:examId/attempts` - List submissions
- `GET /api/v2/evaluation/attempts/:attemptId` - Get attempt details
- `POST /api/v2/evaluation/attempts/:attemptId/score` - Submit scores
- `POST /api/v2/evaluation/attempts/:attemptId/ai-check` - AI evaluation
- `POST /api/v2/evaluation/exams/:examId/finalize` - Finalize exam

### Student:
- `GET /api/v2/attempts/:attemptId/result` - View result
- `GET /api/v2/attempts/exam/:examId/my-attempts` - My attempts list

### AI Service:
- `POST http://localhost:5002/check-answers` - Batch answer checking

---

## 🚀 Quick Start

1. **Start Backend:** `cd backend && npm start` (port 5000)
2. **Start Frontend:** `cd frontend && npm run dev` (port 5173)
3. **Start AI Service:** `cd ai-services/answer-checker && python main.py` (port 5002)
4. **Login as Teacher** → Create/Publish Exam
5. **Login as Student** → Take Exam
6. **Login as Teacher** → Evaluate
7. **Login as Student** → View Result

---

## 💡 Tips

- **AI is optional** - Teachers can grade manually without AI
- **Re-evaluation is allowed** - Click "Review" to change scores
- **Pending badge** - Shows count of ungraded submissions
- **Integrity tracking** - All violations shown in results
- **Per-question feedback** - Helps students learn

---

## 🐛 Known Limitations

- AI service must be running for "Get AI Suggestion" to work
- Students can only view results for **evaluated** attempts
- Teachers can only evaluate **submitted** attempts

---

**All features are now live! Test in your classroom and let me know if you find any issues! 🎉**
