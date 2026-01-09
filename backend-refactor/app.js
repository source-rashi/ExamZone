const express = require('express');
const path = require('path');
const session = require('express-session');
const connectDB = require('./config/db');

// Import route modules
const pdfRoutes = require('./routes/pdf.routes');
const classRoutes = require('./routes/class.routes');
const uploadRoutes = require('./routes/upload.routes');
const studentRoutes = require('./routes/student.routes');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving
app.use(express.static(path.join(__dirname, 'public')));
app.use('/pdfs', express.static(path.join(__dirname, 'pdfs')));
app.use('/answersheets', express.static(path.join(__dirname, 'answersheets')));

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

// Register API route modules
app.use('/', pdfRoutes);
app.use('/', classRoutes);
app.use('/', uploadRoutes);
app.use('/', studentRoutes);

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
  res.sendFile(path.join(__dirname, '/original/QA/templates', 'index.html'));
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

// 404 handler for undefined routes
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

module.exports = app;
