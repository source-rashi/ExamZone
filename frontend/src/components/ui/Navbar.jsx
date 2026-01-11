import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from './Button';

/**
 * Navbar Component
 * Public and authenticated navigation
 */
export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <span className="text-xl font-bold text-slate-900">ExamZone</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            {!isAuthenticated ? (
              <>
                <Link to="/" className="text-slate-700 hover:text-indigo-600">
                  Home
                </Link>
                <Link to="/features" className="text-slate-700 hover:text-indigo-600">
                  Features
                </Link>
                <Link to="/how-it-works" className="text-slate-700 hover:text-indigo-600">
                  How it Works
                </Link>
                <Link to="/login">
                  <Button variant="primary" size="sm">
                    Login
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/app" className="text-slate-700 hover:text-indigo-600">
                  App Home
                </Link>
                <Link 
                  to={user?.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'}
                  className="text-slate-700 hover:text-indigo-600"
                >
                  Dashboard
                </Link>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-slate-600">{user?.name}</span>
                  <Button variant="outline" size="sm" onClick={logout}>
                    Logout
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
