import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as classAPI from '../../api/class.api';
import * as classroomAPI from '../../api/classroom.api';
import { 
  BookOpen, 
  Users, 
  GraduationCap, 
  Megaphone, 
  ClipboardList, 
  FileText,
  X,
  Clock,
  Calendar,
  Loader2
} from 'lucide-react';

/**
 * Classroom Page - Phase 4.RE-FINAL
 * Google Classroom inspired design
 */
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
      <div className="flex items-center justify-center min-h-screen bg-[#f4f7fb]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#1f3c88] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading classroom...</p>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f4f7fb]">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Classroom not found</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-[#1f3c88] text-white rounded-lg hover:bg-[#152a5e] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isTeacher = user.role === 'teacher';
  const studentCount = classData.students?.length || 0;
  
  const tabs = [
    { id: 'stream', label: 'Stream', icon: Megaphone },
    { id: 'assignments', label: 'Assignments', icon: ClipboardList },
    { id: 'exams', label: 'Exams', icon: FileText },
    { id: 'members', label: 'Members', icon: Users }
  ];

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      {/* Top Banner - Google Classroom Style */}
      <div className="bg-gradient-to-br from-[#1f3c88] to-[#2d4a9e] text-white">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-3">{classData.title}</h1>
              {classData.subject && (
                <p className="text-lg text-blue-100 mb-2">{classData.subject}</p>
              )}
              {classData.description && (
                <p className="text-blue-200 text-sm">{classData.description}</p>
              )}
            </div>
            
            <div className="bg-white/15 backdrop-blur-sm px-5 py-4 rounded-xl border border-white/20">
              <p className="text-xs text-blue-100 uppercase tracking-wide mb-1">Class Code</p>
              <p className="text-3xl font-mono font-bold tracking-wider">{classData.code}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
              <GraduationCap className="w-4 h-4" />
              <span className="text-blue-100">Teacher:</span>
              <span className="font-medium">{classData.teacherName || classData.teacherId?.name || 'Unknown'}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
              <Users className="w-4 h-4" />
              <span className="font-medium">{studentCount} {studentCount === 1 ? 'Student' : 'Students'}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex gap-1 -mb-px">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 ${
                      activeTab === tab.id
                        ? 'text-[#1f3c88] border-[#1f3c88]'
                        : 'text-gray-600 border-transparent hover:text-[#1f3c88] hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'stream' && (
          <StreamTab classId={id} isTeacher={isTeacher} />
        )}
        {activeTab === 'assignments' && (
          <AssignmentsTab classId={id} isTeacher={isTeacher} />
        )}
        {activeTab === 'exams' && (
          <ExamsTab classId={id} isTeacher={isTeacher} />
        )}
        {activeTab === 'members' && (
          <MembersTab classId={id} classData={classData} isTeacher={isTeacher} />
        )}
      </div>
    </div>
  );
}

// Stream Tab - Feed Style
function StreamTab({ classId, isTeacher }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [content, setContent] = useState('');
  const [creating, setCreating] = useState(false);

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
      setCreating(true);
      await classroomAPI.createAnnouncement(classId, { content: content.trim() });
      setContent('');
      setShowCreateModal(false);
      loadAnnouncements();
    } catch (error) {
      console.error('Failed to create announcement:', error);
      alert(error.response?.data?.message || 'Failed to create announcement');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (announcementId) => {
    if (!confirm('Delete this announcement?')) return;

    try {
      await classroomAPI.deleteAnnouncement(classId, announcementId);
      setAnnouncements(prev => prev.filter(a => a._id !== announcementId));
    } catch (error) {
      console.error('Failed to delete announcement:', error);
      alert(error.response?.data?.message || 'Failed to delete announcement');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <Loader2 className="w-10 h-10 text-[#1f3c88] animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading stream...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {isTeacher && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="mb-6 w-full px-6 py-4 bg-white border-2 border-[#1f3c88] text-[#1f3c88] rounded-lg hover:bg-[#1f3c88] hover:text-white transition-colors font-medium flex items-center justify-center gap-2"
        >
          <Megaphone className="w-5 h-5" />
          Create Announcement
        </button>
      )}

      {announcements.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No announcements yet</p>
          {isTeacher && (
            <p className="text-gray-400 text-sm mt-2">Create your first announcement to get started</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map(announcement => (
            <div key={announcement._id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#1f3c88] text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                  {announcement.teacherName?.[0] || 'T'}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900">{announcement.teacherName || 'Teacher'}</p>
                        <span className="px-2 py-0.5 bg-[#1f3c88] bg-opacity-10 text-[#1f3c88] text-xs font-medium rounded">
                          Teacher
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(announcement.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    {isTeacher && (
                      <button
                        onClick={() => handleDelete(announcement._id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded transition-colors text-sm font-medium"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{announcement.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Announcement Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create Announcement</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setContent('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share something with your class..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f3c88] focus:border-transparent resize-none"
                rows="6"
                required
              />
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setContent('');
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !content.trim()}
                  className="flex-1 px-6 py-3 bg-[#1f3c88] text-white rounded-lg hover:bg-[#152a5e] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Post Announcement'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Assignments Tab
function AssignmentsTab({ classId, isTeacher }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: ''
  });
  const [creating, setCreating] = useState(false);

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
      setCreating(true);
      await classroomAPI.createAssignment(classId, formData);
      setFormData({ title: '', description: '', deadline: '' });
      setShowCreateModal(false);
      loadAssignments();
    } catch (error) {
      console.error('Failed to create assignment:', error);
      alert(error.response?.data?.message || 'Failed to create assignment');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <Loader2 className="w-10 h-10 text-[#1f3c88] animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading assignments...</p>
      </div>
    );
  }

  return (
    <div>
      {isTeacher && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="mb-6 px-6 py-3 bg-[#1f3c88] text-white rounded-lg hover:bg-[#152a5e] transition-colors font-medium flex items-center gap-2"
        >
          <ClipboardList className="w-5 h-5" />
          Create Assignment
        </button>
      )}

      {assignments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No assignments yet</p>
          {isTeacher && (
            <p className="text-gray-400 text-sm mt-2">Create your first assignment</p>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {assignments.map(assignment => {
            const deadline = new Date(assignment.deadline);
            const isOverdue = deadline < new Date();
            
            return (
              <div key={assignment._id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <ClipboardList className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{assignment.title}</h3>
                      {assignment.description && (
                        <p className="text-gray-600 mb-3 text-sm">{assignment.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
                          Due: {deadline.toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isOverdue
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {isOverdue ? 'Closed' : 'Open'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create Assignment</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ title: '', description: '', deadline: '' });
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f3c88] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f3c88] focus:border-transparent resize-none"
                  rows="4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deadline <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f3c88] focus:border-transparent"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ title: '', description: '', deadline: '' });
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-6 py-3 bg-[#1f3c88] text-white rounded-lg hover:bg-[#152a5e] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Assignment'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Exams Tab
function ExamsTab({ classId, isTeacher }) {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    duration: ''
  });
  const [creating, setCreating] = useState(false);

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
      setCreating(true);
      await classroomAPI.createExam(classId, formData);
      setFormData({ title: '', date: '', duration: '' });
      setShowCreateModal(false);
      loadExams();
    } catch (error) {
      console.error('Failed to create exam:', error);
      alert(error.response?.data?.message || 'Failed to create exam');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <Loader2 className="w-10 h-10 text-[#1f3c88] animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading exams...</p>
      </div>
    );
  }

  return (
    <div>
      {isTeacher && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="mb-6 px-6 py-3 bg-[#1f3c88] text-white rounded-lg hover:bg-[#152a5e] transition-colors font-medium flex items-center gap-2"
        >
          <FileText className="w-5 h-5" />
          Create Exam
        </button>
      )}

      {exams.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No exams yet</p>
          {isTeacher && (
            <p className="text-gray-400 text-sm mt-2">Create your first exam</p>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {exams.map(exam => {
            const examDate = new Date(exam.date);
            const isUpcoming = examDate > new Date();
            
            return (
              <div key={exam._id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-3">{exam.title}</h3>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {examDate.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {exam.duration} minutes
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isUpcoming
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {isUpcoming ? 'Upcoming' : 'Past'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Exam Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create Exam</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ title: '', date: '', duration: '' });
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exam Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f3c88] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f3c88] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f3c88] focus:border-transparent"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ title: '', date: '', duration: '' });
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-6 py-3 bg-[#1f3c88] text-white rounded-lg hover:bg-[#152a5e] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Exam'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Members Tab - Professional Table
function MembersTab({ classId, classData, isTeacher }) {
  const teacher = classData.teacherId;
  const students = classData.students || [];

  return (
    <div className="space-y-6">
      {/* Teacher Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-[#1f3c88]" />
          Teacher
        </h3>
        <div className="flex items-center gap-4 p-4 bg-[#1f3c88] bg-opacity-5 rounded-lg">
          <div className="w-12 h-12 rounded-full bg-[#1f3c88] text-white flex items-center justify-center font-bold text-lg">
            {classData.teacherName?.[0] || teacher?.name?.[0] || 'T'}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{classData.teacherName || teacher?.name || 'Unknown'}</p>
            <p className="text-sm text-gray-600">{teacher?.email || 'No email'}</p>
          </div>
        </div>
      </div>

      {/* Students Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-[#1f3c88]" />
          Students ({students.length})
        </h3>

        {students.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No students enrolled yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Roll Number</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr key={student._id || index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-semibold text-sm">
                          {student.name?.[0] || 'S'}
                        </div>
                        <span className="font-medium text-gray-900">{student.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm">{student.email || 'No email'}</td>
                    <td className="py-3 px-4 text-gray-600 text-sm">{student.rollNumber || student.roll || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
