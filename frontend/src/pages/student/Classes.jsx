import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import classAPI from '../../api/class.api';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Users, Loader2, X } from 'lucide-react';

/**
 * Student Classes Page - Phase 4.RE
 * Professional class enrollment interface
 */
export default function StudentClasses() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
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
      await classAPI.joinClass(trimmedCode, {
        name: user.name,
        email: user.email,
      });
      
      setClassCode('');
      setShowModal(false);
      loadClasses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to join class');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Classes</h1>
          <p className="text-gray-600 mt-2">All your enrolled classes</p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          Join Class
        </Button>
      </div>

      {/* Error */}
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

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-48 bg-gray-100 rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : classes.length === 0 ? (
        /* Empty State */
        <Card className="border border-gray-200">
          <div className="p-12 text-center">
            <BookOpen className="w-24 h-24 text-gray-300 mx-auto mb-6" strokeWidth={1.5} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No classes yet</h3>
            <p className="text-gray-600 mb-6">Join your first class using a code from your teacher</p>
            <Button variant="primary" onClick={() => setShowModal(true)}>
              Join Your First Class
            </Button>
          </div>
        </Card>
      ) : (
        /* Classes Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <Card 
              key={cls._id} 
              className="border border-gray-200 hover:border-emerald-600 hover:shadow-lg transition-all cursor-pointer"
              onClick={() => navigate(`/class/${cls._id}`)}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-emerald-600 bg-opacity-10 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-emerald-600" />
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full">
                    {cls.code}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{cls.title}</h3>
                
                {cls.subject && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-1">{cls.subject}</p>
                )}
                
                {cls.description && (
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[2.5rem]">{cls.description}</p>
                )}
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Users className="w-5 h-5 text-gray-400" />
                    <span>{cls.students?.length || 0} students</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Join Class Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Join a Class</h3>
                <button
                  onClick={() => {
                    setShowModal(false);
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
                      setShowModal(false);
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
                    {joining ? 'Joining...' : 'Join Class'}
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
