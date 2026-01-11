import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import classAPI from '../../api/class.api';

export default function StudentDashboard() {
  const { user } = useAuth();
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
      const data = await classAPI.getStudentClasses();
      setClasses(data.classes || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = async (e) => {
    e.preventDefault();
    if (!classCode.trim()) {
      alert('Please enter a class code');
      return;
    }

    try {
      setJoining(true);
      await classAPI.joinClass(classCode, {
        name: user.name,
        email: user.email,
      });
      
      setClassCode('');
      setShowJoinModal(false);
      loadClasses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to join class');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="p-6">
      {/* Welcome Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-slate-900">
          Welcome back, {user?.name?.split(' ')[0]}! 👋
        </h2>
        <p className="text-slate-600 mt-1">Ready to continue your learning journey?</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Enrolled Classes</h3>
              <span className="text-2xl">📚</span>
            </div>
            <p className="text-4xl font-bold text-slate-900">{classes.length}</p>
          </div>
        </Card>
        
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Pending Exams</h3>
              <span className="text-2xl">📝</span>
            </div>
            <p className="text-4xl font-bold text-slate-900">0</p>
            <p className="text-xs text-slate-500 mt-1">Coming soon</p>
          </div>
        </Card>
        
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Completed Exams</h3>
              <span className="text-2xl">✅</span>
            </div>
            <p className="text-4xl font-bold text-slate-900">0</p>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mb-8">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
          <div className="flex gap-4">
            <Button variant="primary" onClick={() => setShowJoinModal(true)}>
              Join New Class
            </Button>
            <Link to="/student/classes">
              <Button variant="outline">View All Classes</Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* My Classes */}
      <Card className="mb-8">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">My Classes</h3>
            <Link to="/student/classes">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-slate-600">Loading classes...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-600 mb-4">You haven't joined any classes yet</p>
              <Button variant="primary" onClick={() => setShowJoinModal(true)}>
                Join Your First Class
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {classes.slice(0, 3).map((cls) => (
                <Link
                  key={cls._id}
                  to={`/class/${cls._id}`}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{cls.icon || '📚'}</span>
                    <div>
                      <h4 className="font-medium text-slate-900">{cls.title}</h4>
                      <p className="text-sm text-slate-500">
                        {cls.subject || 'No subject'} • {cls.students?.length || 0} students
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">View</Button>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Upcoming Exams - Placeholder */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Upcoming Exams</h3>
          <p className="text-slate-600 text-sm">No upcoming exams</p>
        </div>
      </Card>

      {/* Join Class Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Join a Class</h3>
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleJoinClass} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Class Code
                  </label>
                  <input
                    type="text"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value)}
                    placeholder="Enter the class code from your teacher"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Ask your teacher for the class code
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowJoinModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1"
                    disabled={joining}
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
