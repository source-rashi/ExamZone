import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import classAPI from '../../api/class.api';
import { BookOpen, FileText, CheckCircle, Users, Loader2, X, ChevronRight } from 'lucide-react';

/**
 * Student Dashboard - Phase 4.RE-FINAL
 * Professional academic portal with lucide-react icons
 */
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [classCode, setClassCode] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await classAPI.getStudentClasses();
      console.log('Student dashboard - classes loaded:', data);
      setClasses(data.classes || []);
    } catch (err) {
      console.error('Load classes error:', err);
      setError(err.response?.data?.message || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = async (e) => {
    e.preventDefault();
    const trimmedCode = classCode.trim();
    
    if (!trimmedCode) {
      alert('Please enter a class code');
      return;
    }

    if (trimmedCode.length !== 6) {
      alert('Class code must be exactly 6 characters');
      return;
    }

    try {
      setJoining(true);
      // PHASE 5.1: No need to pass user data, extracted from JWT
      await classAPI.joinClass(trimmedCode);
      
      setClassCode('');
      setShowJoinModal(false);
      loadClasses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to join class');
    } finally {
      setJoining(false);
    }
  };

  const displayClasses = classes.slice(0, 3);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-gray-600 mt-2">Track your enrolled classes and upcoming assignments</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border border-gray-200">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Enrolled Classes</p>
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
                <p className="text-sm font-medium text-gray-600 mb-2">Pending Assignments</p>
                <p className="text-4xl font-bold text-gray-900">0</p>
                <p className="text-xs text-gray-500 mt-1">Coming soon</p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="border border-gray-200">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Completed</p>
                <p className="text-4xl font-bold text-gray-900">0</p>
                <p className="text-xs text-gray-500 mt-1">Coming soon</p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
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
          <div onClick={() => setShowJoinModal(true)}>
            <Card className="border border-gray-200 hover:border-emerald-600 hover:shadow-lg transition-all cursor-pointer">
              <div className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-7 h-7 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Join a Class</h3>
                  <p className="text-sm text-gray-600">Enter class code to join</p>
                </div>
              </div>
            </Card>
          </div>
          
          <Link to="/student/classes">
            <Card className="border border-gray-200 hover:border-emerald-600 hover:shadow-lg transition-all cursor-pointer">
              <div className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center">
                  <Users className="w-7 h-7 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">View All Classes</h3>
                  <p className="text-sm text-gray-600">See all your enrolled classes</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* My Classes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">My Classes</h2>
          {classes.length > 3 && (
            <Link to="/student/classes" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
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
              <p className="text-gray-600 mb-6">Join your first class using a code from your teacher</p>
              <Button variant="primary" onClick={() => setShowJoinModal(true)}>
                Join Your First Class
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayClasses.map((cls) => (
              <Card 
                key={cls._id} 
                className="border border-gray-200 hover:border-[#4b7bec] hover:shadow-lg transition-all cursor-pointer flex flex-col"
                onClick={() => navigate(`/class/${cls._id}`)}
              >
                <div className="p-6 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 flex-grow">
                      {cls.name || cls.title || 'Untitled Class'}
                    </h3>
                    <span className="flex-shrink-0 ml-4 px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                      {cls.code}
                    </span>
                  </div>
                  
                  {cls.subject && (
                    <p className="text-sm text-gray-600 mb-3">{cls.subject}</p>
                  )}
                  
                  <div className="text-sm text-gray-600 mb-4">
                    <span className="font-medium text-gray-800">Teacher:</span> {cls.teacher?.name || 'N/A'}
                  </div>
                  
                  <div className="flex-grow"></div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-auto">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Users className="w-5 h-5 text-gray-400" />
                      <span>{cls.studentCount || cls.students?.length || 0} students</span>
                    </div>
                    <div className="flex items-center text-sm text-[#4b7bec] font-medium">
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

      {/* Join Class Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Join a Class</h3>
                <button
                  onClick={() => {
                    setShowJoinModal(false);
                    setClassCode('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleJoinClass} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                    placeholder="e.g., ABC123"
                    maxLength={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent uppercase text-lg tracking-wider font-semibold"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Enter the 6-character code provided by your teacher
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Your information:</p>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Name:</span> {user.name}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Email:</span> {user.email}
                    </p>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    This information will be visible to your teacher
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowJoinModal(false);
                      setClassCode('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1"
                    disabled={joining || classCode.trim().length !== 6}
                  >
                    {joining ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Joining...
                      </span>
                    ) : (
                      'Join Class'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
