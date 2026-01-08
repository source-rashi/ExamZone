# Backend Refactor - ExamZone

## Overview
This is a clean, isolated backend workspace extracted from the main ExamZone project for safe refactoring.

## What's Included
- **server.js** - Express backend (fixed bugs, stable baseline)
- **models/** - MongoDB schemas (Class model)
- **public/** - Frontend HTML/JS/CSS files
- **package.json** - Node.js dependencies

## Storage Folders
- **uploads/** - PDF file uploads
- **pdfs/** - Generated question paper PDFs
- **answersheets/** - Student answer sheet uploads

## Setup

### Prerequisites
- Node.js 14+ installed
- MongoDB running on `localhost:27017`

### Installation
```bash
cd backend-refactor
npm install
```

### Running the Server
```bash
node server.js
# Server runs at http://localhost:3000
```

Or with auto-reload during development:
```bash
npx nodemon server.js
```

## Database
- **MongoDB**: `mongodb://localhost:27017/classDB`
- **Collections**: `classes` (with embedded student documents)

## Key Endpoints
- `GET /` - Root page
- `GET /create-class` - Create class page
- `POST /create-class` - Create new class
- `POST /join-class` - Student joins class
- `POST /upload` - Upload student list PDF
- `POST /upload-answer` - Upload answer sheet
- `GET /student-dashboard` - Student dashboard
- `GET /teacher-dashboard` - Teacher dashboard

## Known Issues & Future Work
1. **MongoDB Deprecation Warnings** - Remove `useNewUrlParser` and `useUnifiedTopology` (non-critical)
2. **Python Service Route** - Line 108 references missing `/original/QA/templates/` (to be removed)
3. **FastAPI Integration** - `/generate-pdf` endpoint requires external Python service (separate concern)

## Bugs Fixed (Baseline)
- ✅ Removed undefined `next()` calls in `/student-interface` and `/setup_examT.html` routes
- ✅ All paths now use `__dirname` for portability
- ✅ Server starts and runs stably

## What's NOT Included
- Python AI services (`Ans/`, `original/`)
- Test/debug files (`test-server.js`, `wrapper.js`)
- Node modules (install via `npm install`)
- User-uploaded files (generated at runtime)

## Baseline Status
**✅ STABLE** - Ready for architecture refactoring

**Date Created:** January 9, 2026  
**Purpose:** Safe refactoring workspace with zero production dependencies on old project structure
