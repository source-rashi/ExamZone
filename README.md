# ExamZone

A comprehensive exam management platform with AI-powered question paper generation and answer sheet evaluation.

## 🏗️ Architecture

```
ExamZone/
├── backend/              # Node.js/Express API server
├── frontend/             # React + TypeScript + Tailwind UI
├── ai-services/
│   ├── question-generator/  # FastAPI service (port 8000)
│   └── answer-checker/      # FastAPI service (port 7000)
├── pdfs/                # Generated question papers
├── uploads/             # Student lists and assignments
└── answersheets/        # Uploaded answer sheets
```

## 🚀 Tech Stack

### Backend
- **Framework**: Express.js 5.1.0
- **Database**: MongoDB with Mongoose 8.13.2
- **Authentication**: JWT + bcryptjs
- **File Upload**: Multer

### Frontend
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 6.0.11
- **Styling**: Tailwind CSS 3.4.17
- **State Management**: React Context API
- **HTTP Client**: Axios

### AI Services
- **Framework**: FastAPI (Python)
- **AI Model**: Google Gemini API
- **OCR**: Tesseract (answer-checker)
- **PDF Processing**: pdfplumber, reportlab

## 📋 Prerequisites

- Node.js (v18 or higher)
- Python 3.8+
- MongoDB
- Google Gemini API Key ([Get one here](https://makersuite.google.com/app/apikey))

## ⚙️ Installation

### 1. Clone Repository
```bash
git clone <repository-url>
cd ExamZone
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create .env file from example
cp .env.example .env
# Edit .env and add your MongoDB URI, session secret, and API keys
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install

# Create .env file from example
cp .env.example .env
# Edit .env to set backend URL (default: http://localhost:3000)
```

### 4. AI Services Setup

#### Question Generator
```bash
cd ../ai-services/question-generator
pip install -r requirements.txt

# Create .env file
echo "GOOGLE_API_KEY=your-gemini-api-key" > .env
```

#### Answer Checker
```bash
cd ../answer-checker
pip install -r requirements.txt

# Create .env file
echo "GEMINI_API_KEY=your-gemini-api-key" > .env
```

## 🏃 Running the Application

You'll need **4 terminal windows**:

### Terminal 1: MongoDB
```bash
mongod
```

### Terminal 2: Backend Server
```bash
cd backend
npm start
# Runs on http://localhost:3000
```

### Terminal 3: Question Generator Service
```bash
cd ai-services/question-generator
uvicorn main:app --reload --port 8000
# Runs on http://localhost:8000
```

### Terminal 4: Answer Checker Service
```bash
cd ai-services/answer-checker
uvicorn main:app --reload --port 7000
# Runs on http://localhost:7000
```

### Terminal 5: Frontend Development Server
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

## 🎯 Features

### Teacher Dashboard
- Create and manage classes
- Upload student lists via PDF
- Generate AI-powered question papers
- Create assignments
- Evaluate answer sheets with AI assistance

### Student Dashboard
- View enrolled classes
- Access assignments and exams
- Submit answers
- View grades and feedback

### AI-Powered Features
1. **Question Paper Generation**
   - Upload question bank (PDF/DOCX)
   - Automatic question shuffling per student
   - Bulk PDF generation
   - Download individual or ZIP files

2. **Answer Sheet Evaluation**
   - OCR-based text extraction
   - AI-powered answer evaluation
   - Automated grading
   - Detailed feedback generation

## 📁 Key Files

### Backend
- [backend/server.js](backend/server.js) - Entry point
- [backend/app.js](backend/app.js) - Express app configuration
- [backend/models/](backend/models/) - MongoDB schemas
- [backend/routes/](backend/routes/) - API route handlers
- [backend/controllers/](backend/controllers/) - Business logic
- [backend/services/](backend/services/) - External service integrations

### Frontend
- [frontend/src/main.tsx](frontend/src/main.tsx) - Entry point
- [frontend/src/pages/](frontend/src/pages/) - Page components
- [frontend/src/components/](frontend/src/components/) - Reusable components
- [frontend/src/api/](frontend/src/api/) - API client functions

### AI Services
- [ai-services/question-generator/main.py](ai-services/question-generator/main.py) - Question generation logic
- [ai-services/answer-checker/main.py](ai-services/answer-checker/main.py) - Answer evaluation logic

## 🔒 Environment Variables

### Backend (.env)
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/classDB
SESSION_SECRET=your-strong-secret-key
FASTAPI_BASE_URL=http://127.0.0.1:8000
FASTAPI_AI_URL=http://127.0.0.1:8000
GOOGLE_API_KEY=your-gemini-api-key
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:3000
```

### AI Services (.env)
```env
GOOGLE_API_KEY=your-gemini-api-key  # question-generator
GEMINI_API_KEY=your-gemini-api-key  # answer-checker
```

## 🛠️ Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-reload
```

### Frontend Development
```bash
cd frontend
npm run dev  # Vite hot module replacement
```

### Linting & Formatting
```bash
# Frontend
cd frontend
npm run lint
```

## 📦 Build for Production

### Frontend
```bash
cd frontend
npm run build
# Output in frontend/dist/
```

### Backend
The backend runs directly with Node.js. Ensure environment variables are properly set in production.

## 🚨 Known Issues

1. **16MB MongoDB Document Limit**: Large assignments/exams may exceed this. Consider GridFS for large files.
2. **Hardcoded Ports**: Services must run on specified ports (3000, 5173, 8000, 7000).
3. **API Key Security**: Ensure `.env` files are never committed to version control.

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Classes
- `GET /api/classes` - Get user's classes
- `POST /api/classes` - Create new class
- `GET /api/classes/:id` - Get class details
- `POST /api/classes/:id/students` - Add students to class

### Exams
- `POST /api/exams` - Create exam
- `GET /api/exams/:id` - Get exam details
- `POST /api/exams/:id/submit` - Submit exam answers

### Assignments
- `POST /api/assignments` - Create assignment
- `GET /api/assignments/:id` - Get assignment details
- `POST /api/assignments/:id/submit` - Submit assignment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues or questions:
1. Check existing [GitHub Issues](https://github.com/your-repo/issues)
2. Create a new issue with detailed description
3. Include error logs and environment details

## 🙏 Acknowledgments

- Google Gemini API for AI capabilities
- FastAPI for Python microservices
- Express.js community
- React and Vite teams
