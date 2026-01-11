# PHASE 6.3 — AI Question Paper Generation Integration

**Status**: ✅ COMPLETE

## Overview

Phase 6.3 safely integrates the existing FastAPI AI service with the Exam system without modifying any AI logic.

## Critical Principle

**TREAT AI AS BLACK BOX**
- ✅ NO rewriting of Gemini logic
- ✅ NO rewriting of OCR logic  
- ✅ NO rewriting of PDF generation
- ✅ ONLY bridge/integration layer added

---

## What Was Done

### 1. Backend (Node.js) ✅

#### Models
- **ExamPaper Model** (`models/ExamPaper.js`)
  - Already existed from Phase 6.1
  - Fields: `exam`, `student`, `setNumber`, `pdfPath`, `generatedAt`
  - Compound index for uniqueness per exam/student/set

#### Services
- **AI Bridge Service** (`services/aiExam.service.js`)
  - `generateExamPapers(examId, teacherId)` - Main generation function
  - `getExamPapers(examId)` - Retrieve papers for exam
  - `getStudentPaper(examId, studentId, setNumber)` - Get specific paper
  
  **Responsibilities**:
  1. Load and validate exam (must be published)
  2. Load class students
  3. Build payload for FastAPI
  4. Call FastAPI `/api/generate-papers` endpoint
  5. Store returned PDF files
  6. Create ExamPaper database records

#### Controllers & Routes
- **Controller**: `controllers/exam.controller.js`
  - Updated `generateQuestionPapers()` to use AI bridge service
  - Authorization: Only exam creator (teacher)
  - Validation: Exam must be published, no duplicate generation

- **Route**: `routes/exam.routes.js`
  - `POST /api/v2/exams/:id/generate-papers` (teacher only)

#### File Storage Structure
```
/uploads/exams/{examId}/{studentId}/set_{n}.pdf
```

---

### 2. Frontend (React) ✅

#### API Client
- **File**: `frontend/src/api/exam.api.js`
- Added `generateQuestionPapers(examId, teacherId)`

#### UI Component
- **File**: `frontend/src/pages/shared/Classroom.jsx`
- **ExamsTab Component**:
  - "Generate Question Papers" button (visible only for published exams)
  - Loading state with spinner
  - Success/error alerts
  - Auto-reload after generation

**Button Location**: Appears in exam card when teacher views published exam

---

### 3. FastAPI (Minimal Changes) ✅

#### New Endpoint
- **File**: `original/QA/main.py`
- **Endpoint**: `POST /api/generate-papers`
- **Purpose**: Accept structured JSON payload from Node.js

**Request Schema**:
```python
{
  "exam_id": "string",
  "class_id": "string", 
  "student_count": int,
  "questions_per_bank": int,
  "sets_per_student": int,
  "custom_title": "string",
  "course_name": "string",
  "section": "string",
  "total_marks": int,
  "student_details": [
    {
      "name": "string",
      "reg_no": "string",
      "student_id": "string"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Generated N question papers",
  "papers": [
    {
      "student_id": "...",
      "student_name": "...",
      "reg_no": "...",
      "set_number": 1,
      "set_code": "SET-1",
      "pdf_path": "/path/to/paper.pdf",
      "question_count": 10
    }
  ]
}
```

#### What Was NOT Changed
- ✅ Existing `/upload-and-generate/` endpoint (untouched)
- ✅ Gemini AI prompts and logic (untouched)
- ✅ OCR preprocessing and extraction (untouched)
- ✅ PDF generation with ReportLab (untouched)
- ✅ Question validation and completion (untouched)

---

## Configuration

### Backend Environment Variables
Add to `backend-refactor/.env`:

```env
# PHASE 6.3 - AI Service Configuration
FASTAPI_AI_URL=http://127.0.0.1:8000
GOOGLE_API_KEY=your-gemini-api-key-here
```

### FastAPI Environment Variables
Set before starting FastAPI:

```bash
export GOOGLE_API_KEY=your-gemini-api-key-here
export OUTPUT_DIR=./static/exam_papers  # Optional, defaults to static/exam_papers
```

---

## Usage Flow

### For Teachers

1. **Create Exam** (Phase 6.2)
   - Go to class → Create Exam
   - Configure exam details, mode, schedule
   - Set `setsPerStudent` (default: 1)

2. **Publish Exam**
   - Click "Publish" button
   - Exam status changes to "published"

3. **Generate Question Papers** (Phase 6.3)
   - Navigate to class → Exams tab
   - Find published exam
   - Click "Generate Question Papers" button
   - Confirm generation
   - Wait for completion (shows spinner)
   - Success: "Generated N question papers"

4. **View Results**
   - Papers stored in `/uploads/exams/{examId}/{studentId}/`
   - ExamPaper records created in database
   - Ready for distribution to students

---

## API Endpoints

### Node.js Backend

```http
POST /api/v2/exams/:id/generate-papers
Authorization: Bearer {token} (teacher only)
Body: { "teacherId": "..." }

Response:
{
  "success": true,
  "message": "Generated 25 question papers",
  "data": {
    "totalPapers": 25,
    "students": 25,
    "setsPerStudent": 1
  }
}
```

### FastAPI AI Service

```http
POST /api/generate-papers
Content-Type: application/json

Body: {
  "exam_id": "...",
  "student_count": 25,
  "questions_per_bank": 10,
  "sets_per_student": 1,
  "custom_title": "Math Final Exam",
  "course_name": "Mathematics",
  "section": "A",
  "total_marks": 100,
  "student_details": [...]
}

Response: {
  "success": true,
  "message": "...",
  "papers": [...]
}
```

---

## Error Handling

### Validation Errors (400)
- Exam must be published
- Papers already generated
- No students enrolled in class

### Authorization Errors (403)
- Only exam creator can generate papers
- Unauthorized teacher

### Not Found (404)
- Exam not found
- Class not found

### Server Errors (500)
- FastAPI service unavailable
- PDF generation failed
- File storage errors

---

## Database Schema

### ExamPaper Collection
```javascript
{
  exam: ObjectId (ref: 'Exam'),
  student: ObjectId (ref: 'User'),
  setNumber: Number,
  pdfPath: String,
  generatedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes
- Compound: `{ exam: 1, student: 1, setNumber: 1 }` (unique)
- Single: `{ exam: 1 }`

---

## Success Conditions

✅ Existing AI service works standalone  
✅ Exam papers generated via Exam system  
✅ PDFs created and stored correctly  
✅ Files organized: `/uploads/exams/{examId}/{studentId}/set_{n}.pdf`  
✅ ExamPaper entries created  
✅ No unrelated code modified  
✅ No regressions in AI logic  
✅ Teacher UI shows generation button  
✅ Loading states work correctly  

---

## Testing

### Manual Testing Steps

1. **Start Services**
   ```bash
   # Terminal 1: Backend
   cd backend-refactor
   npm start
   
   # Terminal 2: Frontend
   cd frontend
   npm run dev
   
   # Terminal 3: FastAPI
   cd original/QA
   python main.py
   ```

2. **Test Flow**
   - Login as teacher
   - Create class with students
   - Create exam
   - Publish exam
   - Click "Generate Question Papers"
   - Verify success message
   - Check database for ExamPaper records
   - Check file system for PDF files

### Database Verification
```javascript
// MongoDB Shell
use classDB;

// Check ExamPaper records
db.exampapers.find({ exam: ObjectId("...") }).pretty();

// Count papers per exam
db.exampapers.countDocuments({ exam: ObjectId("...") });
```

### File System Verification
```bash
# Check generated PDFs
ls -R uploads/exams/
```

---

## Known Limitations

1. **Question Sources**: Currently uses sample questions
   - Production: Integrate with question bank upload
   - TODO: Add support for PDF/DOCX question extraction

2. **Progress Tracking**: No real-time progress updates
   - TODO: Add WebSocket or polling for live progress

3. **Duplicate Prevention**: Prevents re-generation
   - TODO: Add "Regenerate" option for exam creators

4. **Set Variation**: Basic set shuffling
   - TODO: Advanced set variation with question banks

---

## Next Steps (Future Phases)

### Phase 6.4 (Optional)
- Student PDF download/view
- Question bank management UI
- Real-time generation progress
- Batch operations for multiple exams

### Phase 6.5 (Optional)
- Answer key generation
- Question tagging and categorization
- Difficulty-based question selection
- Custom question templates

---

## Files Modified/Created

### Created
- ✅ `backend-refactor/services/aiExam.service.js` (270 lines)

### Modified
- ✅ `backend-refactor/controllers/exam.controller.js` (added aiExamService import, updated generateQuestionPapers)
- ✅ `backend-refactor/routes/exam.routes.js` (updated route to /generate-papers)
- ✅ `backend-refactor/.env.example` (added FASTAPI_AI_URL, GOOGLE_API_KEY)
- ✅ `frontend/src/api/exam.api.js` (added generateQuestionPapers function)
- ✅ `frontend/src/pages/shared/Classroom.jsx` (added generation button + handlers)
- ✅ `original/QA/main.py` (added /api/generate-papers endpoint)

### Untouched (As Required)
- ✅ Gemini AI logic
- ✅ OCR preprocessing
- ✅ PDF generation algorithms
- ✅ Question validation prompts
- ✅ All other backend/frontend code

---

## Commit Message

```
feat: Phase 6.3 - AI question paper generation integration

- Create AI bridge service (BLACK BOX integration)
- Add POST /api/exams/:id/generate-papers endpoint
- Add teacher UI for paper generation
- Add minimal FastAPI JSON endpoint
- Store papers: /uploads/exams/{examId}/{studentId}/set_{n}.pdf
- Create ExamPaper database records
- NO changes to AI/Gemini/OCR/PDF logic
```

---

## Support

For issues:
1. Check FastAPI service is running (`http://localhost:8000/docs`)
2. Verify GOOGLE_API_KEY is set
3. Check backend logs for bridge service errors
4. Verify exam is published before generation
5. Ensure students are enrolled in class

---

**Phase 6.3 Complete** ✅  
**AI Integration Successful Without Breaking Existing Logic** ✅
