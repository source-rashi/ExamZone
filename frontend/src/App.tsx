import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import RoleRoute from './auth/RoleRoute';

// Public pages
import Landing from './pages/public/LandingNew';
import Features from './pages/public/Features';
import HowItWorks from './pages/public/HowItWorks';

// Auth pages
import Login from './pages/auth/LoginNew';
import SignUp from './pages/auth/SignUp';
import GetStarted from './pages/auth/GetStarted';

// App pages
import AppHome from './pages/app/Home';

// Teacher pages
import TeacherLayout from './layouts/TeacherLayout';
import Dashboard from './pages/teacher/Dashboard';
import CreateClass from './pages/teacher/CreateClass';
import ClassDetails from './pages/teacher/ClassDetails';
import CreateExam from './pages/teacher/CreateExam';
import TeacherClasses from './pages/teacher/Classes';
import TeacherExams from './pages/teacher/Exams';
import TeacherProfile from './pages/teacher/Profile';

// Student pages
import StudentLayout from './layouts/StudentLayout';
import StudentDashboard from './pages/student/Dashboard';
import StudentClasses from './pages/student/Classes';
import StudentExams from './pages/student/Exams';
import StudentProfile from './pages/student/Profile';
import ExamPage from './pages/ExamPage';
import ExamAttempt from './pages/student/ExamAttempt';

// Shared pages
import Classroom from './pages/shared/Classroom';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/features" element={<Features />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/get-started" element={<GetStarted />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
            
            {/* App home (protected) */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppHome />
                </ProtectedRoute>
              }
            />
            
            {/* Teacher routes */}
            <Route
              path="/teacher/*"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRole="teacher">
                    <TeacherLayout />
                  </RoleRoute>
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/teacher/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="classes" element={<TeacherClasses />} />
              <Route path="exams" element={<TeacherExams />} />
              <Route path="profile" element={<TeacherProfile />} />
              <Route path="create-class" element={<CreateClass />} />
              <Route path="class/:id" element={<ClassDetails />} />
              <Route path="class/:id/create-exam" element={<CreateExam />} />
            </Route>

            {/* Student routes */}
            <Route
              path="/student/*"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRole="student">
                    <StudentLayout />
                  </RoleRoute>
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/student/dashboard" replace />} />
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="classes" element={<StudentClasses />} />
              <Route path="class/:id" element={<StudentClasses />} />
              <Route path="exams" element={<StudentExams />} />
              <Route path="exam/:examId/attempt" element={<ExamAttempt />} />
              <Route path="assignments" element={<div>Assignments (TODO)</div>} />
              <Route path="profile" element={<StudentProfile />} />
            </Route>

            {/* Exam routes (protected but role-agnostic) */}
            <Route
              path="/exam/:examId"
              element={
                <ProtectedRoute>
                  <ExamPage />
                </ProtectedRoute>
              }
            />

            {/* Classroom routes (protected but role-agnostic) */}
            <Route
              path="/class/:id"
              element={
                <ProtectedRoute>
                  <Classroom />
                </ProtectedRoute>
              }
            />

            {/* Catch all - redirect to landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
