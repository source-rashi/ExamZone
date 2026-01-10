import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import TeacherLayout from './layouts/TeacherLayout';
import StudentLayout from './layouts/StudentLayout';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ExamPage from './pages/ExamPage';
import ProtectedRoute from './auth/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Teacher routes */}
        <Route
          path="/teacher/*"
          element={
            <ProtectedRoute allowedRole="teacher">
              <TeacherLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<TeacherDashboard />} />
          <Route path="classes" element={<div>Classes placeholder</div>} />
          <Route path="exams" element={<div>Exams placeholder</div>} />
        </Route>

        {/* Student routes */}
        <Route
          path="/student/*"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<StudentDashboard />} />
          <Route path="classes" element={<div>My Classes placeholder</div>} />
          <Route path="exams" element={<div>My Exams placeholder</div>} />
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
  );
}

export default App;
