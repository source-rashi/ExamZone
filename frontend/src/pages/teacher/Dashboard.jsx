import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import classAPI from '../../api/class.api';

/**
 * Teacher Dashboard - Phase 4.2
 * University portal style with real data
 */
export default function Dashboard() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const data = await classAPI.getTeacherClasses();
      setClasses(data.classes || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const totalStudents = classes.reduce((sum, cls) => sum + (cls.students?.length || 0), 0);

  return (
    <div className="p-6">
      {/* Welcome Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-slate-900">
          Welcome back, {user?.name?.split(' ')[0]}! 👋
        </h2>
        <p className="text-slate-600 mt-1">Here's what's happening in your classes today</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Total Classes</h3>
              <span className="text-2xl">📚</span>
            </div>
            <p className="text-4xl font-bold text-slate-900">{classes.length}</p>
          </div>
        </Card>
        
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Active Exams</h3>
              <span className="text-2xl">📝</span>
            </div>
            <p className="text-4xl font-bold text-slate-900">0</p>
            <p className="text-xs text-slate-500 mt-1">Coming soon</p>
          </div>
        </Card>
        
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Total Students</h3>
              <span className="text-2xl">👥</span>
            </div>
            <p className="text-4xl font-bold text-slate-900">{totalStudents}</p>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mb-8">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
          <div className="flex gap-4">
            <Link to="/teacher/classes">
              <Button variant="primary">Create New Class</Button>
            </Link>
            <Button variant="outline" disabled>Create Exam (Coming Soon)</Button>
          </div>
        </div>
      </Card>

      {/* My Classes */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">My Classes</h3>
            <Link to="/teacher/classes">
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
              <p className="text-slate-600 mb-4">You haven't created any classes yet</p>
              <Link to="/teacher/classes">
                <Button variant="primary">Create Your First Class</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {classes.slice(0, 3).map((cls) => (
                <div
                  key={cls._id}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{cls.icon || '📚'}</span>
                    <div>
                      <h4 className="font-medium text-slate-900">{cls.title}</h4>
                      <p className="text-sm text-slate-500">
                        {cls.students?.length || 0} students • Code: {cls.code}
                      </p>
                    </div>
                  </div>
                  <Link to={`/teacher/classes`}>
                    <Button variant="ghost" size="sm">View</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Recent Activity - Placeholder */}
      <Card className="mt-8">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
          <p className="text-slate-600 text-sm">No recent activity to show</p>
        </div>
      </Card>
    </div>
  );
}
