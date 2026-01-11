import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as classAPI from '../../api/class.api';
import * as classroomAPI from '../../api/classroom.api';

export default function Classroom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stream');

  useEffect(() => {
    loadClassData();
  }, [id]);

  const loadClassData = async () => {
    try {
      setLoading(true);
      const data = await classAPI.getClassById(id);
      setClassData(data.class);
    } catch (error) {
      console.error('Failed to load class:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load classroom';
      alert(errorMessage);
      navigate(user?.role === 'teacher' ? '/teacher/classes' : '/student/classes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#1f3c88] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading classroom...</p>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Classroom not found</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-[#1f3c88] text-white rounded-lg hover:bg-[#152a5e]"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isTeacher = user.role === 'teacher';
  const tabs = [
    { id: 'stream', label: 'Stream' },
    { id: 'exams', label: 'Exams' },
    { id: 'assignments', label: 'Assignments' },
    { id: 'members', label: 'Members' }
  ];

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      {/* Header */}
      <div className="bg-[#1f3c88] text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{classData.title}</h1>
              <p className="text-blue-200 mb-1">{classData.subject}</p>
              <p className="text-sm text-blue-300">
                Teacher: {classData.teacherName || 'Unknown'}
              </p>
            </div>
            <div className="text-right">
              <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                <p className="text-xs text-blue-200 mb-1">Class Code</p>
                <p className="text-2xl font-mono font-bold">{classData.code}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 border-b border-white/20">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#f4f7fb] text-[#1f3c88] rounded-t-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'stream' && (
          <StreamTab classId={id} isTeacher={isTeacher} />
        )}
        {activeTab === 'exams' && (
          <ExamsTab classId={id} isTeacher={isTeacher} />
        )}
        {activeTab === 'assignments' && (
          <AssignmentsTab classId={id} isTeacher={isTeacher} />
        )}
        {activeTab === 'members' && (
          <MembersTab classId={id} classData={classData} />
        )}
      </div>
    </div>
  );
}

// Stream Tab Component
function StreamTab({ classId, isTeacher }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [content, setContent] = useState('');

  useEffect(() => {
    loadAnnouncements();
  }, [classId]);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await classroomAPI.getAnnouncements(classId);
      setAnnouncements(data.announcements || []);
    } catch (error) {
      console.error('Failed to load announcements:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load announcements';
      if (error.response?.status === 403) {
        alert('You do not have access to this classroom');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      await classroomAPI.createAnnouncement(classId, { content });
      setContent('');
      setShowCreateModal(false);
      loadAnnouncements();
    } catch (error) {
      console.error('Failed to create announcement:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create announcement';
      alert(errorMessage);
    }
  };

  const handleDelete = async (announcementId) => {
    if (!confirm('Delete this announcement?')) return;

    try {
      await classroomAPI.deleteAnnouncement(classId, announcementId);
      loadAnnouncements();
    } catch (error) {
      console.error('Failed to delete announcement:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete announcement';
      alert(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-[#1f3c88] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading announcements...</p>
      </div>
    );
  }

  return (
    <div>
      {isTeacher && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="mb-6 px-6 py-3 bg-[#1f3c88] text-white rounded-lg hover:bg-[#152a5e] font-medium"
        >
          + Create Announcement
        </button>
      )}

      {announcements.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map(announcement => (
            <div key={announcement._id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1f3c88] text-white flex items-center justify-center font-bold">
                    {announcement.teacherName?.[0] || 'T'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{announcement.teacherName}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(announcement.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
                    Teacher
                  </span>
                </div>
                {isTeacher && (
                  <button
                    onClick={() => handleDelete(announcement._id)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{announcement.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Announcement</h2>
            <form onSubmit={handleCreate}>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your announcement..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1f3c88] focus:border-transparent resize-none"
                rows="6"
                required
              />
              <div className="flex gap-3 mt-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#1f3c88] text-white rounded-lg hover:bg-[#152a5e] font-medium"
                >
                  Post
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setContent('');
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Exams Tab Component
function ExamsTab({ classId, isTeacher }) {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    duration: ''
  });

  useEffect(() => {
    loadExams();
  }, [classId]);

  const loadExams = async () => {
    try {
      setLoading(true);
      const data = await classroomAPI.getExams(classId);
      setExams(data.exams || []);
    } catch (error) {
      console.error('Failed to load exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      await classroomAPI.createExam(classId, formData);
      setFormData({ title: '', date: '', duration: '' });
      setShowCreateModal(false);
      loadExams();
    } catch (error) {
      console.error('Failed to create exam:', error);
      alert('Failed to create exam');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-[#1f3c88] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading exams...</p>
      </div>
    );
  }

  return (
    <div>
      {isTeacher && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="mb-6 px-6 py-3 bg-[#1f3c88] text-white rounded-lg hover:bg-[#152a5e] font-medium"
        >
          + Create Exam
        </button>
      )}

      {exams.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">No exams scheduled yet</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {exams.map(exam => (
            <div key={exam._id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{exam.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {new Date(exam.date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {exam.duration} minutes
                    </span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  new Date(exam.date) > new Date()
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {new Date(exam.date) > new Date() ? 'Upcoming' : 'Past'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Exam</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1f3c88] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1f3c88] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({...formData, duration: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1f3c88] focus:border-transparent"
                  required
                  min="1"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 px-6 py-2 bg-[#1f3c88] text-white rounded-lg hover:bg-[#152a5e] font-medium"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ title: '', date: '', duration: '' });
                  }}
                  className="flex-1 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Assignments Tab Component
function AssignmentsTab({ classId, isTeacher }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    deadline: ''
  });

  useEffect(() => {
    loadAssignments();
  }, [classId]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const data = await classroomAPI.getAssignments(classId);
      setAssignments(data.assignments || []);
    } catch (error) {
      console.error('Failed to load assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      await classroomAPI.createAssignment(classId, formData);
      setFormData({ title: '', deadline: '' });
      setShowCreateModal(false);
      loadAssignments();
    } catch (error) {
      console.error('Failed to create assignment:', error);
      alert('Failed to create assignment');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-[#1f3c88] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading assignments...</p>
      </div>
    );
  }

  return (
    <div>
      {isTeacher && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="mb-6 px-6 py-3 bg-[#1f3c88] text-white rounded-lg hover:bg-[#152a5e] font-medium"
        >
          + Create Assignment
        </button>
      )}

      {assignments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">No assignments yet</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {assignments.map(assignment => (
            <div key={assignment._id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{assignment.title}</h3>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Due: {new Date(assignment.deadline).toLocaleString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  new Date(assignment.deadline) > new Date()
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {new Date(assignment.deadline) > new Date() ? 'Open' : 'Closed'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Assignment</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1f3c88] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deadline *
                </label>
                <input
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1f3c88] focus:border-transparent"
                  required
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 px-6 py-2 bg-[#1f3c88] text-white rounded-lg hover:bg-[#152a5e] font-medium"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ title: '', deadline: '' });
                  }}
                  className="flex-1 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Members Tab Component
function MembersTab({ classId, classData }) {
  const [members, setMembers] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMembers();
  }, [classId]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await classroomAPI.getMembers(classId);
      setMembers(data);
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-[#1f3c88] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading members...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">Total Students</p>
          <p className="text-3xl font-bold text-gray-900">
            {members?.students?.length || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">Class Code</p>
          <p className="text-3xl font-bold font-mono text-[#1f3c88]">
            {classData.code}
          </p>
        </div>
      </div>

      {/* Teacher */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Teacher</h3>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#1f3c88] text-white flex items-center justify-center font-bold text-lg">
            {members?.teacher?.name?.[0] || 'T'}
          </div>
          <div>
            <p className="font-medium text-gray-900">{members?.teacher?.name || 'Unknown'}</p>
            <p className="text-sm text-gray-500">{members?.teacher?.email}</p>
          </div>
        </div>
      </div>

      {/* Students */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Students ({members?.students?.length || 0})
        </h3>
        {!members?.students || members.students.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No students enrolled yet</p>
        ) : (
          <div className="space-y-3">
            {members.students.map((student, index) => (
              <div key={index} className="flex items-center gap-3 py-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  {student.name?.[0] || 'S'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{student.name}</p>
                  <p className="text-sm text-gray-500">{student.email}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
