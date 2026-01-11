import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';

/**
 * TeacherLayout
 * Main layout for teacher app with sidebar navigation
 */
export default function TeacherLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/teacher/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/teacher/classes', label: 'Classes', icon: '👥' },
    { path: '/teacher/exams', label: 'Exams', icon: '📝' },
    { path: '/teacher/profile', label: 'Profile', icon: '👤' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-200">
          <Link to="/app" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">E</span>
            </div>
            <span className="text-xl font-bold text-slate-900">ExamZone</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-indigo-50 text-indigo-600 font-medium'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User info at bottom */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <span className="inline-block px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded mb-3">
            Teacher
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="w-full"
          >
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">
              Teacher Portal
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600">
                Welcome back, {user?.name?.split(' ')[0]}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
