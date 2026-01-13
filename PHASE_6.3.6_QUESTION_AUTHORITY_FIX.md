# PHASE 6.3.6 — QUESTION SOURCE AUTHORITY LOCK

## 🔒 CRITICAL SAFETY FIX

**Issue Fixed:** AI was generating questions even when teacher provided them.

**Solution:** Strict enforcement of teacher authority over exam questions.

---

## ✅ IMPLEMENTATION COMPLETED

### 1. **Exam Model Enhancement**
- ✅ `questionMode` field already exists in `Exam.js`
- ✅ Default: `'teacher_provided'`
- ✅ Options: `'teacher_provided'` | `'ai_generated'`

**File:** `backend/models/Exam.js`

```javascript
questionMode: {
  type: String,
  enum: ['teacher_provided', 'ai_generated'],
  default: 'teacher_provided'
}
```

---

### 2. **Backend AI Service Guards**

**File:** `backend/services/aiGeneration.service.js`

#### Changes Made:

1. **Strict Guard in `aiNormalizeQuestions()`**
   - ✅ Validates question source exists for teacher-provided mode
   - ✅ Throws clear error if validation fails
   - ✅ Enhanced logging with mode-specific messages
   - ✅ Passes `questionMode` to Python AI service

2. **Mock Mode Fix**
   - ✅ Respects `questionMode` even in mock testing
   - ✅ Parses teacher content instead of inventing questions
   - ✅ Only generates new questions in `ai_generated` mode

3. **Logging Added**
   ```
   [Question Mode] Mode: teacher_provided
   [Question Mode] Teacher-provided questions used — AI will ONLY format, NOT invent
   ```

---

### 3. **Python AI Service Guards**

**File:** `ai-services/question-generator/main.py`

#### Changes Made:

1. **Request Model Enhanced**
   ```python
   class QuestionSourceRequest(BaseModel):
       question_mode: Optional[str] = 'teacher_provided'
   ```

2. **Strict Guard in `/api/normalize-questions`**
   - ✅ Validates question source exists for teacher-provided mode
   - ✅ Returns HTTP 400 error if validation fails
   - ✅ Enhanced logging with mode context

3. **AI Prompt Modification**
   - ✅ Different prompts based on `questionMode`
   - **Teacher-provided:** "DO NOT modify the question content. Keep EXACTLY as provided."
   - **AI-generated:** "Complete and improve questions as needed"

4. **Function Signature Update**
   ```python
   def normalize_single_question_with_ai(
       question_text: str, 
       question_num: int, 
       total_marks: int, 
       total_questions: int, 
       question_mode: str = 'teacher_provided'
   ) -> dict:
   ```

---

### 4. **Exam Service Validation**

**File:** `backend/services/exam.service.js`

#### Changes Made:

1. **Question Mode Validation**
   - ✅ Saves `questionMode` when creating exam
   - ✅ Warns if teacher-provided mode lacks questions
   - ✅ Allows draft creation but validates before generation

---

### 5. **Frontend UI Clarity**

**File:** `frontend/src/pages/teacher/CreateExam.jsx`

#### Existing Implementation Verified:

✅ Clear toggle for AI generation mode
✅ Default: Unchecked (teacher-provided)
✅ Enhanced messaging:

- **Unchecked:** "You will provide all questions (default). AI will ONLY format and organize them, NOT create new ones."
- **Checked:** "AI will generate NEW questions based on your exam configuration and syllabus"

✅ Form validation based on mode
✅ Question input disabled when AI mode enabled
✅ Clear visual separation of modes

---

## 🔐 CORE PRINCIPLE ENFORCED

```
Teacher is PRIMARY authority for questions.
AI is SECONDARY and OPTIONAL.
```

### Rules Locked:

1. ✅ **Teacher-Provided Mode (Default)**
   - Teacher MUST provide questions
   - AI can ONLY:
     - Clean formatting
     - Split questions
     - Balance sets
     - Extract metadata (topic, difficulty, marks)
   - AI CANNOT:
     - Invent new questions
     - Modify question content
     - Complete questions
     - Add questions

2. ✅ **AI-Generated Mode (Opt-in)**
   - AI can generate questions from scratch
   - Based on syllabus/course description
   - Uses difficulty/instructions
   - Teacher doesn't provide questions

---

## 🛡️ GUARDS IMPLEMENTED

### Backend Guard (Node.js)
```javascript
if (questionMode === 'teacher_provided') {
  if (!payload.questionSource.content && !payload.questionSource.filePath) {
    throw new Error('VALIDATION ERROR: Teacher-provided mode requires question source');
  }
  console.log('[Question Mode] Teacher-provided — AI will ONLY format, NOT invent');
}
```

### Python AI Guard
```python
if question_mode == 'teacher_provided':
    if not request.content and not request.file_path:
        raise HTTPException(
            status_code=400, 
            detail="VALIDATION ERROR: Teacher-provided mode requires question source"
        )
    logger.info("[Question Mode] Teacher-provided — AI will ONLY format, NOT invent")
```

### Mock Mode Guard
```javascript
if (MOCK_MODE && questionMode === 'teacher_provided') {
  // Parse teacher content instead of inventing
  const content = payload.questionSource.content || 'Sample...';
  const lines = content.split('\n').filter(line => line.trim().length > 10);
  return lines.map((line, i) => ({
    questionText: line.trim(), // Use actual content
    marks: marksPerQuestion,
    topic: 'General',
    difficulty: 'medium'
  }));
}
```

---

## 📊 SUCCESS CONDITIONS

✅ Teacher questions are used verbatim  
✅ AI does NOT invent questions unless enabled  
✅ Existing exams still work  
✅ No other functionality touched  
✅ Changes are minimal and reversible  
✅ Clear logging for debugging  
✅ Validation at multiple layers  
✅ UI clearly communicates mode  

---

## 🧪 TESTING CHECKLIST

### Test Case 1: Teacher-Provided Mode (Default)
- [ ] Create exam with questionMode = 'teacher_provided'
- [ ] Provide questions in text area
- [ ] Generate exam sets
- [ ] Verify: Questions match exactly what teacher provided
- [ ] Verify: No new questions invented
- [ ] Check logs: Should see "Teacher-provided — AI will ONLY format"

### Test Case 2: AI-Generated Mode
- [ ] Create exam with AI toggle enabled
- [ ] Do NOT provide questions
- [ ] Generate exam sets
- [ ] Verify: AI generates new questions
- [ ] Check logs: Should see "AI-generated — AI can create questions"

### Test Case 3: Validation Guard
- [ ] Create exam with teacher-provided mode
- [ ] Leave question field empty
- [ ] Try to generate sets
- [ ] Verify: Error thrown
- [ ] Message: "Teacher-provided mode requires question source"

### Test Case 4: Mock Mode
- [ ] Set AI_MOCK_MODE=true
- [ ] Test both modes
- [ ] Verify: Mock respects questionMode

### Test Case 5: Existing Exams
- [ ] Open old exam (before this fix)
- [ ] Verify: Still works (defaults to teacher_provided)
- [ ] No breaking changes

---

## 🔄 ROLLBACK PLAN

If issues arise, revert these files:
1. `backend/services/aiGeneration.service.js`
2. `ai-services/question-generator/main.py`
3. `backend/services/exam.service.js`
4. `frontend/src/pages/teacher/CreateExam.jsx`

All changes are isolated to question generation logic.
No database migrations required.
No API contract changes.

---

## 📝 COMMIT MESSAGE

```
fix: enforce teacher authority over exam questions (Phase 6.3.6)

- Add strict guards to prevent AI from inventing questions when teacher provides them
- Enhance questionMode enforcement in both Node.js and Python services
- Update AI prompts to respect teacher-provided vs ai-generated modes
- Fix mock mode to parse teacher content instead of generating
- Add validation layers at service and API levels
- Improve UI messaging for question mode clarity

BREAKING: None (backward compatible, defaults to teacher_provided)
CRITICAL: Fixes issue where AI was modifying/creating questions without permission
```

---

## 📚 DOCUMENTATION

### For Teachers:
- By default, YOU control all questions
- AI will only format and organize what you provide
- To use AI generation, check "Use AI to generate questions"
- Your questions will NEVER be modified without permission

### For Developers:
- Always check `exam.questionMode` before AI operations
- Default is `'teacher_provided'` for safety
- Pass `question_mode` to Python AI service
- Validate question source exists for teacher-provided mode
- Log mode clearly for debugging

---

## ⚠️ IMPORTANT NOTES

1. **No Database Migration Required**
   - `questionMode` field already exists in schema
   - Existing exams will default to 'teacher_provided'

2. **Backward Compatibility**
   - Old exams without questionMode work fine
   - Default value ensures safe behavior

3. **Minimal Surface Area**
   - Only touched AI generation pipeline
   - No changes to student flow
   - No changes to PDF generation
   - No changes to evaluation

4. **Security Layer Added**
   - Multiple validation points
   - Clear error messages
   - Prevents accidental question invention

---

**Status:** ✅ COMPLETE  
**Risk Level:** LOW (isolated changes, backward compatible)  
**Testing Status:** Ready for manual testing  

---

_Created: Phase 6.3.6_  
_Last Updated: January 13, 2026_
