import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import classAPI from '../../api/class.api';
import { BookOpen, FileText, Users, Loader2, ChevronRight } from 'lucide-react';

/**
 * Teacher Dashboard - Phase 4.RE-FINAL
 * Professional academic portal with lucide-react icons
 */
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await classAPI.getTeacherClasses();
      setClasses(data.classes || []);
    } catch (err) {
      console.error('Load classes error:', err);
      setError(err.response?.data?.message || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const totalStudents = classes.reduce((sum, cls) => sum + (cls.students?.length || 0), 0);
  const displayClasses = classes.slice(0, 3);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-gray-600 mt-2">Here's an overview of your classes and activities</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border border-gray-200">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Total Classes</p>
                <p className="text-4xl font-bold text-gray-900">{classes.length}</p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-indigo-600" />
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="border border-gray-200">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Total Students</p>
                <p className="text-4xl font-bold text-gray-900">{totalStudents}</p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="border border-gray-200">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Active Exams</p>
                <p className="text-4xl font-bold text-gray-900">0</p>
                <p className="text-xs text-gray-500 mt-1">Coming soon</p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center">
                <FileText className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
          <button 
            onClick={loadClasses}
            className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/teacher/classes">
            <Card className="border border-gray-200 hover:border-[#1f3c88] hover:shadow-lg transition-all cursor-pointer">
              <div className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-7 h-7 text-[#1f3c88]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Manage Classes</h3>
                  <p className="text-sm text-gray-600">Create and manage your classes</p>
                </div>
              </div>
            </Card>
          </Link>
          
          <Link to="/teacher/exams">
            <Card className="border border-gray-200 hover:border-[#1f3c88] hover:shadow-lg transition-all cursor-pointer">
              <div className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center">
                  <FileText className="w-7 h-7 text-[#1f3c88]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Create Exam</h3>
                  <p className="text-sm text-gray-600">Design and schedule exams</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* Recent Classes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Recent Classes</h2>
          {classes.length > 3 && (
            <Link to="/teacher/classes" className="text-[#1f3c88] hover:text-[#152a5e] text-sm font-medium">
              View all {classes.length} classes →
            </Link>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-48 bg-gray-100 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : classes.length === 0 ? (
          <Card className="border border-gray-200">
            <div className="p-12 text-center">
              <BookOpen className="w-24 h-24 text-gray-300 mx-auto mb-6" strokeWidth={1.5} />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No classes yet</h3>
              <p className="text-gray-600 mb-6">Create your first class to get started</p>
              <Link to="/teacher/classes">
                <Button variant="primary">Create Your First Class</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayClasses.map((cls) => (
              <Card 
                key={cls._id} 
                className="border border-gray-200 hover:border-[#1f3c88] hover:shadow-lg transition-all cursor-pointer flex flex-col"
                onClick={() => navigate(`/class/${cls._id}`)}
              >
                <div className="p-6 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 flex-grow">{cls.title}</h3>
                    <span className="flex-shrink-0 ml-4 px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                      {cls.code}
                    </span>
                  </div>
                  
                  {cls.subject && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-1">{cls.subject}</p>
                  )}
                  
                  <div className="flex-grow"></div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-auto">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Users className="w-5 h-5 text-gray-400" />
                      <span>{cls.students?.length || 0} students</span>
                    </div>
                    <div className="flex items-center text-sm text-[#1f3c88] font-medium">
                      <span>View Class</span>
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
