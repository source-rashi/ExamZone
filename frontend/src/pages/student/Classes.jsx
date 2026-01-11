import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import classAPI from '../../api/class.api';
import { useAuth } from '../../context/AuthContext';

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
      setShowModal(false);
      loadClasses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to join class');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">My Classes</h2>
          <p className="text-slate-600 mt-1">All your enrolled classes</p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          + Join Class
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <Card>
          <div className="p-12 text-center">
            <p className="text-slate-600">Loading classes...</p>
          </div>
        </Card>
      ) : classes.length === 0 ? (
        /* Empty State */
        <Card>
          <div className="p-12 text-center">
            <span className="text-6xl mb-4 block">🎓</span>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No classes yet</h3>
            <p className="text-slate-600 mb-6">Join your first class using a code from your teacher</p>
            <Button variant="primary" onClick={() => setShowModal(true)}>
              Join Your First Class
            </Button>
          </div>
        </Card>
      ) : (
        /* Classes Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <Card key={cls._id} hover>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl">{cls.icon || '📚'}</span>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded">
                    {cls.code}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 mb-2">{cls.title}</h3>
                
                {cls.subject && (
                  <p className="text-sm text-slate-600 mb-3">{cls.subject}</p>
                )}
                
                {cls.description && (
                  <p className="text-sm text-slate-500 mb-3 line-clamp-2">{cls.description}</p>
                )}
                
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <span>👥</span>
                    <span>{cls.students?.length || 0} students</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate(`/class/${cls._id}`)}
                  >
                    View
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Join Class Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Join a Class</h3>
                <button
                  onClick={() => setShowModal(false)}
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
                    onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                    placeholder="e.g., ABC123"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Enter the 6-character code provided by your teacher
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-600">
                    <strong>Your info:</strong>
                  </p>
                  <p className="text-sm text-slate-600 mt-1">Name: {user.name}</p>
                  <p className="text-sm text-slate-600">Email: {user.email}</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowModal(false)}
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
