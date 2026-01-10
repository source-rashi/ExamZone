import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import TeacherLayout from './layouts/TeacherLayout';
import StudentLayout from './layouts/StudentLayout';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ExamPage from './pages/ExamPage';
import ProtectedRoute from './auth/ProtectedRoute';
import RoleRoute from './auth/RoleRoute';

// Teacher pages
import Dashboard from './pages/teacher/Dashboard';
import CreateClass from './pages/teacher/CreateClass';
import ClassDetails from './pages/teacher/ClassDetails';
import CreateExam from './pages/teacher/CreateExam';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            
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
              <Route index element={<StudentDashboard />} />
              <Route path="classes" element={<div className="p-4">My Classes placeholder</div>} />
              <Route path="exams" element={<div className="p-4">My Exams placeholder</div>} />
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

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
