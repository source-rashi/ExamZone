import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TeacherLayout = () => {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold">ExamZone - Teacher</span>
              </div>
              <div className="ml-6 flex space-x-8">
                <Link to="/teacher" className="inline-flex items-center px-1 pt-1 text-gray-900">
                  Dashboard
                </Link>
                <Link to="/teacher/classes" className="inline-flex items-center px-1 pt-1 text-gray-500 hover:text-gray-900">
                  Classes
                </Link>
                <Link to="/teacher/exams" className="inline-flex items-center px-1 pt-1 text-gray-500 hover:text-gray-900">
                  Exams
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default TeacherLayout;
