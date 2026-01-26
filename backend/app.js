const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const helmet = require('helmet');
const connectDB = require('./config/db');
const { apiLimiter } = require('./middleware/rateLimit.middleware');

// Import V1 route modules (legacy)
const pdfRoutes = require('./routes/pdf.routes');
const classRoutes = require('./routes/class.routes');
const uploadRoutes = require('./routes/upload.routes');
const studentRoutes = require('./routes/student.routes');

// Import V2 route modules
const authRoutes = require('./routes/auth.routes');
const classRoutesV2 = require('./routes/class.routes.v2');
const enrollmentRoutes = require('./routes/enrollment.routes');
const examRoutes = require('./routes/exam.routes');
const examRoutesV2 = require('./routes/exam.routes.v2');
const attemptRoutes = require('./routes/attempt.routes');
const inviteRoutes = require('./routes/invite.routes');
const classroomRoutes = require('./routes/classroom.routes');
const announcementRoutes = require('./routes/announcement.routes');
const assignmentRoutes = require('./routes/assignment.routes');
const evaluationRoutes = require('./routes/evaluation.routes');

const studentExamPaperRoutes = require('./routes/student.exam.paper.routes');
const studentExamPdfRoutes = require('./routes/student.exam.pdf.routes');
const studentDashboardRoutes = require('./routes/studentDashboard.routes');
const studentExamRoutes = require('./routes/student.exam.routes');
const paperRoutes = require('./routes/paper.routes');
const healthRoutes = require('./routes/health.routes');

const app = express();

// Connect to MongoDB
connectDB();

// ==================================================================
// PHASE 8.8: SECURITY HEADERS
// ==================================================================
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for now (can be configured later)
  crossOriginEmbedderPolicy: false // Allow embedding
}));

// ==================================================================
// PHASE 8.8: CORS CONFIGURATION WITH ENVIRONMENT CONTROL
// ==================================================================
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:5174'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ==================================================================
// PHASE 8.8: RATE LIMITING FOR API ROUTES
// ==================================================================
app.use('/api', apiLimiter);

// ==================================================================
// MIDDLEWARE
// ==================================================================
// Body parser with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving
app.use(express.static(path.join(__dirname, 'public')));
app.use('/pdfs', express.static(path.join(__dirname, '../pdfs')));
app.use('/answersheets', express.static(path.join(__dirname, '../answersheets')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Register V1 API routes (legacy)
app.use('/', pdfRoutes);
app.use('/', classRoutes);
app.use('/', uploadRoutes);
app.use('/', studentRoutes);

// Register new student exam paper and PDF routes
app.use('/api/v2/student', studentExamPaperRoutes);
app.use('/api/v2/student', studentExamPdfRoutes);
app.use('/api/v2/student', studentDashboardRoutes);
app.use('/api/v2/student', studentExamRoutes);

// Register V2 API routes
app.use('/api/v2/auth', authRoutes);
app.use('/api/v2/classes', classRoutesV2);
app.use('/api/v2/enrollments', enrollmentRoutes);
app.use('/api/v2/exams-legacy', examRoutes); // Old exam routes
app.use('/api/v2', examRoutesV2); // Phase 6.1 exam routes
app.use('/api/v2/attempts', attemptRoutes);
app.use('/api/v2/invites', inviteRoutes);
app.use('/api/v2/classroom', classroomRoutes);
app.use('/api/v2', announcementRoutes); // Announcement routes
app.use('/api/v2', assignmentRoutes); // Assignment routes
app.use('/api/papers', paperRoutes); // PHASE 6.4 paper download routes
app.use('/api/v2/evaluation', evaluationRoutes); // PHASE 7.5 evaluation routes
app.use('/api/health', healthRoutes); // PHASE 8.7 health check routes

// Static page routes

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/student-interface', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'student-interface.html'));
});
app.get('/setup_examT.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'setup_examT.html'));
});
app.get('/set', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'teacher-interface.html'));
});

app.get('/create-class', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'create-class.html'));
});

// Serve the login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/upload', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'upload.html'));
});

app.get('/student', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'student.html'));
});

app.get('/upload-answer', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'upload-answer.html'));
});

app.get('/get-answers', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'get-answers.html'));
});

// Serve teacher dashboard
app.get('/teacher-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'teacher-dashboard.html'));
});
app.get('/teacher-login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'teacher-login.html'));
});
app.get('/original/QA/templates/index', (req, res) => {
  res.sendFile(path.join(__dirname, '../ai-services/question-generator/templates', 'index.html'));
});
app.get('/student-login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'student-login.html'));
});

// Serve student dashboard
app.get('/student-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'student-dashboard.html'));
});

// Handle login form submission
app.post('/login', (req, res) => {
  const { email, password, role } = req.body;

  console.log(`📥 Login attempt - Email: ${email}, Role: ${role}`);

  if (role === 'teacher') {
    return res.redirect('/teacher-login');
  } else if (role === 'student') {
    return res.redirect('/student-login');
  } else {
    return res.status(400).send("❌ Invalid role selected.");
  }
});

// Error handling middleware (must be last)
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');

// PHASE 7.2: JSON-only error handler for /api routes
app.use('/api', (err, req, res, next) => {
  console.error('[API Error]', {
    path: req.path,
    method: req.method,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Always return JSON for API routes
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler for undefined routes
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

module.exports = app;
