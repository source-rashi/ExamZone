# TESTING GUIDE — Phase 6.3.6 Question Authority Fix

## 🧪 Quick Test Scenarios

### Scenario 1: Teacher-Provided Mode (Default) ✅

**Steps:**
1. Go to Create Exam page
2. Fill in exam details
3. **Do NOT check** "Use AI to generate questions"
4. In Step 3 (Question Source):
   - Select "Plain Text"
   - Enter questions:
     ```
     1. What is the capital of France?
     2. Explain photosynthesis
     3. Solve: 2x + 5 = 15
     ```
5. Complete exam creation
6. Generate exam sets

**Expected Result:**
- ✅ Questions appear EXACTLY as you typed them
- ✅ AI does NOT add new questions
- ✅ AI does NOT modify your questions
- ✅ Console log: `[Question Mode] Teacher-provided — AI will ONLY format, NOT invent`

**What Changed:**
- Before: AI might "improve" or "complete" your questions
- After: AI respects your questions verbatim

---

### Scenario 2: AI-Generated Mode 🤖

**Steps:**
1. Go to Create Exam page
2. Fill in exam details
3. **CHECK** "Use AI to generate questions" ✓
4. Question input should be disabled/hidden
5. Complete exam creation
6. Generate exam sets

**Expected Result:**
- ✅ AI generates new questions from scratch
- ✅ Questions are based on exam configuration
- ✅ Console log: `[Question Mode] AI-generated — AI can create questions`

**Note:** This is opt-in behavior, not default

---

### Scenario 3: Validation Guard 🛡️

**Steps:**
1. Create exam in teacher-provided mode
2. **Leave question field EMPTY**
3. Try to generate sets

**Expected Result:**
- ❌ Error thrown
- ❌ Message: "VALIDATION ERROR: Teacher-provided mode requires question source"
- ✅ Exam cannot be generated without questions

**What Changed:**
- Before: AI might generate questions even without input
- After: Strict validation prevents this

---

### Scenario 4: Mock Mode Testing 🎭

**Setup:**
```bash
# In backend/.env
AI_MOCK_MODE=true
```

**Steps:**
1. Restart backend server
2. Create exam with teacher-provided questions
3. Generate sets

**Expected Result:**
- ✅ Mock parses your questions
- ✅ Doesn't invent new ones
- ✅ Returns formatted versions of YOUR questions

---

## 🔍 What to Check

### Console Logs (Backend)
Look for these messages:

**Teacher-Provided Mode:**
```
[Question Mode] Mode: teacher_provided
[Question Mode] Teacher-provided questions used — AI will ONLY format, NOT invent
[AI Normalize] Processing text source in teacher_provided mode
```

**AI-Generated Mode:**
```
[Question Mode] Mode: ai_generated
[Question Mode] AI-generated questions used — AI can create new questions
[AI Normalize] Processing text source in ai_generated mode
```

### Python Service Logs
```
[Normalize] Processing text source in teacher_provided mode
[Question Mode] Teacher-provided — AI will ONLY format, NOT invent
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Old exams not working
**Solution:** Old exams default to `teacher_provided` mode. No action needed.

### Issue 2: Validation error on generation
**Cause:** Teacher-provided mode without questions
**Solution:** Either provide questions OR switch to AI-generated mode

### Issue 3: Questions still being modified
**Debug:**
1. Check exam document: `exam.questionMode` should be `'teacher_provided'`
2. Check console logs for mode confirmation
3. Verify Python service received `question_mode` in request

---

## 📊 Verification Checklist

After implementing changes:

- [ ] Backend server starts without errors
- [ ] Frontend builds without errors
- [ ] Python AI service starts without errors
- [ ] Can create exam with teacher questions
- [ ] Teacher questions appear unchanged in generated sets
- [ ] Can create exam with AI generation enabled
- [ ] AI generates questions when enabled
- [ ] Validation blocks generation without questions
- [ ] Console logs show correct mode
- [ ] Old exams still work

---

## 🚨 Rollback If Needed

If critical issues arise:

1. **Backend Service:**
   ```bash
   git checkout backend/services/aiGeneration.service.js
   git checkout backend/services/exam.service.js
   ```

2. **Python Service:**
   ```bash
   git checkout ai-services/question-generator/main.py
   ```

3. **Frontend:**
   ```bash
   git checkout frontend/src/pages/teacher/CreateExam.jsx
   ```

4. Restart all services

---

## 📝 Manual Test Results Template

```
Test Date: _____________
Tester: _____________

| Test Case | Status | Notes |
|-----------|--------|-------|
| Teacher-provided (default) | ⬜ Pass ⬜ Fail | |
| AI-generated mode | ⬜ Pass ⬜ Fail | |
| Validation guard | ⬜ Pass ⬜ Fail | |
| Mock mode | ⬜ Pass ⬜ Fail | |
| Old exams compatibility | ⬜ Pass ⬜ Fail | |
| Console logging | ⬜ Pass ⬜ Fail | |

Overall Status: ⬜ Ready for Production ⬜ Needs Fixes

Additional Notes:
_________________________________
_________________________________
```

---

## 🎯 Success Criteria

✅ Teacher questions remain unchanged  
✅ AI doesn't invent questions by default  
✅ Clear UI/UX for both modes  
✅ Proper validation and error messages  
✅ Backward compatibility maintained  
✅ No regression in other features  

---

**Priority:** CRITICAL  
**Impact:** HIGH (security fix)  
**Difficulty:** EASY (follow scenarios above)  

---

_For questions or issues, refer to: PHASE_6.3.6_QUESTION_AUTHORITY_FIX.md_
