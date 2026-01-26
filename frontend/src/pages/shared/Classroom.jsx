import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as classAPI from '../../api/class.api';
import * as classroomAPI from '../../api/classroom.api';
import * as announcementAPI from '../../api/announcement.api';
import * as assignmentAPI from '../../api/assignment.api';
import examAPI from '../../api/exam.api';
import ViewPapersModal from '../../components/teacher/ViewPapersModal';
import ExamDetailsModal from '../../components/teacher/ExamDetailsModal';
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
  Loader2,
  Paperclip,
  Trash2,
  Send,
  Plus,
  CheckCircle,
  Trophy,
  Download
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
      const data = await classAPI.getClassById(id);      console.log('Loaded class data:', data);      setClassData(data.class);
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
    { id: 'people', label: 'People', icon: Users }
  ];

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      <header className="bg-white shadow-sm">
        {/* Top Banner */}
        <div className="max-w-7xl mx-auto px-6 pt-10 pb-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-[#1f2933] leading-tight">
                {classData.name || classData.title || 'Untitled Class'}
              </h1>
              {classData.subject && (
                <p className="text-lg text-gray-500 mt-2">{classData.subject}</p>
              )}
            </div>
            <div className="space-y-3 text-right">
              <div className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-2">
                <p className="text-xs text-gray-600 uppercase tracking-wider font-semibold">Class Code</p>
                <p className="text-2xl font-mono font-bold text-[#1f3c88] tracking-widest">{classData.code}</p>
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <GraduationCap className="w-5 h-5 text-gray-400" />
              <span className="font-medium">Teacher:</span>
              <span className="font-semibold text-[#1f2933]">{classData.teacher?.name || classData.teacherName || 'Unknown'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Users className="w-5 h-5 text-gray-400" />
              <span className="font-semibold text-[#1f2933]">{studentCount}</span>
              <span>{studentCount === 1 ? 'Student' : 'Students'}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex gap-1" aria-label="Tabs">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`shrink-0 flex items-center gap-2 px-5 py-3 font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'text-[#1f3c88] border-[#1f3c88]'
                        : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'stream' && (
          <StreamTab classId={id} isTeacher={isTeacher} user={user} />
        )}
        {activeTab === 'assignments' && (
          <AssignmentsTab classId={id} isTeacher={isTeacher} />
        )}
        {activeTab === 'exams' && (
          <ExamsTab classId={id} isTeacher={isTeacher} />
        )}
        {activeTab === 'people' && (
          <PeopleTab classData={classData} />
        )}
      </div>
    </div>
  );
}

// Stream Tab - Feed Style
function StreamTab({ classId, isTeacher, user }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, [classId]);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      // PHASE 5.2: Use announcement API
      const data = await announcementAPI.getAnnouncements(classId);
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

    const tempId = `temp-${Date.now()}`;
    const newAnnouncement = {
      _id: tempId,
      content: content.trim(),
      author: { name: user.name, _id: user._id },
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    // Optimistic update
    setAnnouncements(prev => [newAnnouncement, ...prev]);
    setContent('');
    setIsFocused(false);
    setCreating(true);

    try {
      // PHASE 5.2: Use announcement API
      const created = await announcementAPI.createAnnouncement(classId, { 
        content: newAnnouncement.content 
      });
      
      // Replace optimistic announcement with real one
      setAnnouncements(prev => 
        prev.map(a => a._id === tempId ? created.announcement : a)
      );
    } catch (error) {
      console.error('Failed to create announcement:', error);
      alert(error.response?.data?.message || 'Failed to create announcement');
      // Remove optimistic announcement on error
      setAnnouncements(prev => prev.filter(a => a._id !== tempId));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (announcementId) => {
    if (!confirm('Delete this announcement?')) return;

    const originalAnnouncements = [...announcements];
    // Optimistic update
    setAnnouncements(prev => prev.filter(a => a._id !== announcementId));

    try {
      // PHASE 5.2: Use announcement API
      await announcementAPI.deleteAnnouncement(announcementId);
    } catch (error) {
      console.error('Failed to delete announcement:', error);
      alert(error.response?.data?.message || 'Failed to delete announcement');
      // Restore on error
      setAnnouncements(originalAnnouncements);
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
    <div className="max-w-3xl mx-auto">
      {isTeacher && (
        <div className="mb-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm transition-all">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsFocused(true)}
              placeholder="Announce something to your class"
              className={`w-full px-4 py-3 bg-transparent border-none rounded-t-lg focus:outline-none resize-none transition-all ${isFocused ? 'h-28' : 'h-16'}`}
            />
            {isFocused && (
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end items-center gap-3">
                <button
                  onClick={() => {
                    setIsFocused(false);
                    setContent('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating || !content.trim()}
                  className="px-4 py-2 bg-[#1f3c88] text-white rounded-lg hover:bg-[#152a5e] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Post
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {announcements.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800">No announcements yet</h3>
          <p className="text-gray-500 mt-2">
            {isTeacher ? "Post your first announcement to get started." : "Your teacher has not posted any announcements yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {announcements.map(announcement => (
            <div key={announcement._id} className={`bg-white rounded-xl border border-gray-200 p-5 transition-all ${announcement.isOptimistic ? 'opacity-60' : 'opacity-100'}`}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#1f3c88] text-white flex items-center justify-center font-bold text-base flex-shrink-0">
                  {announcement.teacherName?.[0] || 'T'}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{announcement.teacherName || 'Teacher'}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(announcement.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    {isTeacher && (
                      <button
                        onClick={() => handleDelete(announcement._id)}
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors"
                        title="Delete announcement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed mt-3">{announcement.content}</p>
                </div>
              </div>
            </div>
          ))}
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
    dueDate: '',
    file: null,
  });
  const [creating, setCreating] = useState(false);
  const [submittingId, setSubmittingId] = useState(null);
  const [submissionFile, setSubmissionFile] = useState(null);
  const fileInputRef = useRef(null);
  const submissionFileRef = useRef(null);

  useEffect(() => {
    loadAssignments();
  }, [classId]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const data = await assignmentAPI.getAssignments(classId);
      setAssignments(data.assignments || []);
    } catch (error) {
      console.error('Failed to load assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', dueDate: '', file: null });
    if(fileInputRef.current) fileInputRef.current.value = '';
  }

  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!formData.file) {
      alert('Please attach a PDF file');
      return;
    }

    const assignmentData = new FormData();
    assignmentData.append('title', formData.title);
    assignmentData.append('description', formData.description);
    assignmentData.append('dueDate', formData.dueDate);
    assignmentData.append('file', formData.file);

    try {
      setCreating(true);
      await assignmentAPI.createAssignment(classId, assignmentData);
      resetForm();
      setShowCreateModal(false);
      loadAssignments();
    } catch (error) {
      console.error('Failed to create assignment:', error);
      alert(error.response?.data?.message || 'Failed to create assignment');
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = async (assignmentId, title) => {
    try {
      const blob = await assignmentAPI.downloadAssignment(assignmentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download assignment:', error);
      alert('Failed to download assignment');
    }
  };

  const handleSubmit = async (assignmentId) => {
    if (!submissionFile) {
      alert('Please select a file to submit');
      return;
    }

    const formData = new FormData();
    formData.append('file', submissionFile);

    try {
      await assignmentAPI.submitAssignment(assignmentId, formData);
      setSubmissionFile(null);
      if (submissionFileRef.current) submissionFileRef.current.value = '';
      setSubmittingId(null);
      loadAssignments();
      alert('Assignment submitted successfully!');
    } catch (error) {
      console.error('Failed to submit assignment:', error);
      alert(error.response?.data?.message || 'Failed to submit assignment');
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
    <div className="max-w-4xl mx-auto">
      {isTeacher && (
        <div className="text-right mb-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-[#1f3c88] text-white rounded-lg hover:bg-[#152a5e] transition-colors font-medium flex items-center gap-2 inline-flex"
          >
            <ClipboardList className="w-5 h-5" />
            Create Assignment
          </button>
        </div>
      )}

      {assignments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800">No assignments yet</h3>
          <p className="text-gray-500 mt-2">
            {isTeacher ? "Create your first assignment to get started." : "Your teacher has not posted any assignments yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map(assignment => {
            const dueDate = new Date(assignment.dueDate);
            const isOverdue = dueDate < new Date();
            const mySubmission = !isTeacher && assignment.mySubmission;
            
            return (
              <div key={assignment._id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-full bg-[#4b7bec] bg-opacity-10 flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="w-5 h-5 text-[#4b7bec]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{assignment.title}</h3>
                    {assignment.description && (
                      <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span>Posted: {new Date(assignment.createdAt).toLocaleDateString()}</span>
                      <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                        Due: {dueDate.toLocaleDateString()}
                      </span>
                      {isTeacher && (
                        <span className="text-blue-600">
                          {assignment.submissionCount || 0} submission{assignment.submissionCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="mt-4 flex items-center gap-3">
                      <button
                        onClick={() => handleDownload(assignment._id, assignment.title)}
                        className="px-4 py-2 bg-[#1f3c88] text-white rounded-lg hover:bg-[#152a5e] transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <Paperclip className="w-4 h-4" />
                        Download Assignment
                      </button>
                      
                      {!isTeacher && (
                        <>
                          {mySubmission ? (
                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                                mySubmission.status === 'graded' 
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {mySubmission.status === 'graded' 
                                  ? `Graded: ${mySubmission.grade || 'N/A'}`
                                  : 'Submitted'}
                              </span>
                              <button
                                onClick={() => setSubmittingId(submittingId === assignment._id ? null : assignment._id)}
                                className="text-sm text-blue-600 hover:text-blue-800"
                              >
                                Resubmit
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setSubmittingId(submittingId === assignment._id ? null : assignment._id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                            >
                              Submit Assignment
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    {/* Submission Form */}
                    {!isTeacher && submittingId === assignment._id && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                          <input
                            type="file"
                            accept=".pdf"
                            ref={submissionFileRef}
                            onChange={(e) => setSubmissionFile(e.target.files[0])}
                            className="hidden"
                            id={`submission-${assignment._id}`}
                          />
                          <label 
                            htmlFor={`submission-${assignment._id}`}
                            className="cursor-pointer px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium flex items-center gap-2"
                          >
                            <Paperclip className="w-4 h-4" />
                            Choose File
                          </label>
                          {submissionFile && (
                            <span className="text-sm text-gray-600">{submissionFile.name}</span>
                          )}
                          <button
                            onClick={() => handleSubmit(assignment._id)}
                            disabled={!submissionFile}
                            className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Submit
                          </button>
                          <button
                            onClick={() => {
                              setSubmittingId(null);
                              setSubmissionFile(null);
                              if (submissionFileRef.current) submissionFileRef.current.value = '';
                            }}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
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
                  resetForm();
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f3c88] focus:border-transparent"
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f3c88] focus:border-transparent resize-none"
                  rows="4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignment PDF <span className="text-red-500">*</span>
                </label>
                <div className="mt-2 flex items-center gap-4">
                  <input
                    type="file"
                    accept=".pdf"
                    ref={fileInputRef}
                    onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    Choose PDF File
                  </label>
                  {formData.file && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{formData.file.name}</span>
                      <button type="button" onClick={() => {
                        setFormData({...formData, file: null});
                        if(fileInputRef.current) fileInputRef.current.value = '';
                      }} className="text-red-500 hover:text-red-700">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f3c88] focus:border-transparent"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
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

// ExamsTab - Phase 6.2 Exam Display
function ExamsTab({ classId, isTeacher }) {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingPapers, setGeneratingPapers] = useState({}); // Track generation per exam
  const [viewPapersModal, setViewPapersModal] = useState({ open: false, examId: null });
  const [examDetailsModal, setExamDetailsModal] = useState({ open: false, examId: null });

  useEffect(() => {
    loadExams();
  }, [classId]);

  const loadExams = async () => {
    try {
      setLoading(true);
      // PHASE 7.3.5: Use classroom API for role-based filtering
      const data = await classroomAPI.getExams(classId);
      setExams(data.exams || []);
    } catch (error) {
      console.error('Failed to load exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePapers = async (examId) => {
    const confirm = window.confirm('Generate question papers? This will create question sets and distribute students.');
    if (!confirm) return;

    try {
      setGeneratingPapers(prev => ({ ...prev, [examId]: true }));
      
      console.log('🚀 Calling generateQuestionPapers for exam:', examId);
      const result = await examAPI.generateQuestionPapers(examId);
      
      console.log('✅ Generation response:', result);
      console.log('📊 Updated exam status:', result.data?.exam?.status);
      
      // CRITICAL: Update exam in state immediately without reload
      if (result.data?.exam) {
        setExams(prev => 
          prev.map(e => e._id === examId ? result.data.exam : e)
        );
        console.log('✅ Exam state updated in UI');
      }
      
      alert(`Success! Generated ${result.data?.numberOfSets || 0} question sets.\nExam is now in "${result.data?.exam?.status}" status.`);
    } catch (error) {
      console.error('❌ Failed to generate papers:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to generate papers';
      alert(`Error: ${errorMsg}`);
    } finally {
      setGeneratingPapers(prev => ({ ...prev, [examId]: false }));
    }
  };

  const handleGenerateStudentPapers = async (examId) => {
    const confirm = window.confirm('Generate student-specific PDF papers? This may take a few moments.');
    if (!confirm) return;

    try {
      setGeneratingPapers(prev => ({ ...prev, [examId]: true }));
      
      console.log('🚀 Generating student papers for exam:', examId);
      const result = await examAPI.generateStudentPapers(examId);
      
      console.log('✅ Student papers generated:', result);
      
      // Update exam state if exam object is returned
      if (result.data?.exam) {
        setExams(prev => 
          prev.map(e => e._id === examId ? result.data.exam : e)
        );
      } else {
        // Fallback: reload exams
        loadExams();
      }
      
      alert(`Success! Generated ${result.data?.papersGenerated || 0} student papers.`);
    } catch (error) {
      console.error('❌ Failed to generate student papers:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to generate student papers';
      alert(`Error: ${errorMsg}`);
    } finally {
      setGeneratingPapers(prev => ({ ...prev, [examId]: false }));
    }
  };

  const handlePublishExam = async (examId) => {
    const confirm = window.confirm('Publish this exam? Students will be able to see and download their papers.');
    if (!confirm) return;

    try {
      console.log('🚀 Publishing exam:', examId);
      const result = await examAPI.publishExam(examId);
      
      console.log('✅ Exam published:', result);
      
      // Update exam state
      if (result.data?.exam || result.exam) {
        const updatedExam = result.data?.exam || result.exam;
        setExams(prev => 
          prev.map(e => e._id === examId ? updatedExam : e)
        );
      } else {
        loadExams();
      }
      
      alert('Exam published successfully!');
    } catch (error) {
      console.error('❌ Failed to publish exam:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to publish exam';
      alert(`Error: ${errorMsg}`);
    }
  };

  const getStatusBadge = (exam) => {
    if (exam.status === 'draft') {
      return <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">Draft</span>;
    }
    
    const now = new Date();
    const startTime = new Date(exam.startTime);
    const endTime = new Date(exam.endTime);
    
    if (now < startTime) {
      return <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">Upcoming</span>;
    }
    if (now >= startTime && now <= endTime) {
      return <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Active</span>;
    }
    return <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">Ended</span>;
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
    <div className="max-w-4xl mx-auto">
      {isTeacher && (
        <div className="mb-6">
          <button
            onClick={() => navigate(`/teacher/class/${classId}/create-exam`)}
            className="px-6 py-3 bg-[#1f3c88] text-white rounded-lg hover:bg-[#152a5e] transition-colors font-medium flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Exam
          </button>
        </div>
      )}

      {exams.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No exams yet</p>
          {isTeacher && (
            <p className="text-gray-400 text-sm mt-2">Create your first exam to get started</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {exams.map(exam => (
            <div 
              key={exam._id} 
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{exam.title}</h3>
                    {getStatusBadge(exam)}
                    {!isTeacher && exam.attemptsExhausted && (
                      <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                        Attempts Used
                      </span>
                    )}
                  </div>
                  {exam.description && (
                    <p className="text-gray-600 text-sm line-clamp-2">{exam.description}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Marks</p>
                  <p className="font-semibold text-gray-900">{exam.totalMarks}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Duration</p>
                  <p className="font-semibold text-gray-900">{exam.duration} min</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    {isTeacher ? 'Submissions' : 'Attempts'}
                  </p>
                  {isTeacher ? (
                    <div>
                      <p className="font-semibold text-gray-900">
                        {exam.totalSubmissions || 0} total
                      </p>
                      {exam.pendingEvaluation > 0 && (
                        <p className="text-xs text-orange-600 font-medium">
                          {exam.pendingEvaluation} pending ⏳
                        </p>
                      )}
                    </div>
                  ) : exam.studentAttemptCount !== undefined ? (
                    <p className={`font-semibold ${
                      exam.attemptsExhausted ? 'text-red-600' : 
                      exam.studentAttemptCount > 0 ? 'text-amber-600' : 
                      'text-green-600'
                    }`}>
                      {exam.studentAttemptCount}/{exam.attemptsAllowed || 1}
                      {exam.attemptsExhausted && ' ✓'}
                    </p>
                  ) : (
                    <p className="font-semibold text-gray-900">{exam.attemptsAllowed || 1}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Mode</p>
                  <p className="font-semibold text-gray-900 capitalize">{exam.mode || 'Online'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(exam.startTime).toLocaleDateString()} - {new Date(exam.endTime).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>
                    {new Date(exam.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {isTeacher ? (
                  <>
                    {/* PHASE 6 - Draft Status: Generate Question Papers */}
                    {exam.status === 'draft' && (
                      <>
                        <button 
                          onClick={() => handleGeneratePapers(exam._id)}
                          disabled={generatingPapers[exam._id]}
                          className="px-4 py-2 bg-[#1f3c88] text-white rounded-lg hover:bg-[#152a5e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2"
                        >
                          {generatingPapers[exam._id] ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <FileText className="w-4 h-4" />
                              Generate Question Papers
                            </>
                          )}
                        </button>
                      </>
                    )}

                    {/* PHASE 6 - Prepared Status: Generate Student Papers */}
                    {exam.status === 'prepared' && (
                      <>
                        <button 
                          onClick={() => {
                            console.log('[Classroom] Opening ViewPapersModal for exam:', exam._id);
                            setViewPapersModal({ open: true, examId: exam._id });
                          }}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center gap-2 border border-gray-300"
                        >
                          <FileText className="w-4 h-4" />
                          View Sets
                        </button>
                        <button 
                          onClick={() => handleGenerateStudentPapers(exam._id)}
                          disabled={generatingPapers[exam._id]}
                          className="px-4 py-2 bg-[#1f3c88] text-white rounded-lg hover:bg-[#152a5e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2"
                        >
                          {generatingPapers[exam._id] ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Generating Papers...
                            </>
                          ) : (
                            <>
                              <FileText className="w-4 h-4" />
                              Generate Student Papers
                            </>
                          )}
                        </button>
                      </>
                    )}

                    {/* PHASE 6 - Generated Status: Publish */}
                    {exam.status === 'generated' && (
                      <>
                        <button 
                          onClick={() => {
                            console.log('[Classroom] Opening ViewPapersModal for exam:', exam._id);
                            setViewPapersModal({ open: true, examId: exam._id });
                          }}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center gap-2 border border-gray-300"
                        >
                          <FileText className="w-4 h-4" />
                          View Papers
                        </button>
                        <button 
                          onClick={() => handlePublishExam(exam._id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
                        >
                          Publish Exam
                        </button>
                      </>
                    )}

                    {/* Published Status */}
                    {exam.status === 'published' && (
                      <span className="px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-200 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Exam Live
                      </span>
                    )}

                    {/* Evaluate Submissions button - TEACHER ONLY */}
                    {['published', 'running', 'closed'].includes(exam.status) && (
                      <button 
                        onClick={() => navigate(`/teacher/exam/${exam._id}/results`)}
                        className="relative px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Evaluate Submissions
                        {exam.pendingEvaluation > 0 && (
                          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
                            {exam.pendingEvaluation}
                          </span>
                        )}
                      </button>
                    )}

                    <button 
                      onClick={() => {
                        console.log('[Classroom] Opening ExamDetailsModal for exam:', exam._id);
                        setExamDetailsModal({ open: true, examId: exam._id });
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      View Details
                    </button>
                  </>
                ) : (
                  // PHASE 7.3.5: Student exam access
                  <>
                    {/* Show exam details button */}
                    <button 
                      onClick={() => {
                        console.log('[Classroom] Opening ExamDetailsModal for exam:', exam._id);
                        setExamDetailsModal({ open: true, examId: exam._id });
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      View Details
                    </button>
                    
                    {/* Download paper button - only if exam has papers generated and attempts not exhausted */}
                    {!exam.attemptsExhausted &&
                     ['published', 'running', 'closed'].includes(exam.status) && 
                     (exam.generationStatus === 'generated' || exam.status === 'published') && (
                      <button 
                        onClick={async () => {
                          try {
                            const blob = await examAPI.downloadMyPaper(exam._id);
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${exam.title}_Paper.pdf`;
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                            document.body.removeChild(a);
                          } catch (error) {
                            console.error('Download error:', error);
                            const errorMsg = error.response?.data?.message || 
                                           error.message || 
                                           'Paper not available yet. Please contact your teacher.';
                            alert(errorMsg);
                          }
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download Paper
                      </button>
                    )}

                    {/* Start/Resume exam for active exams - STUDENTS ONLY */}
                    {!isTeacher && 
                      exam.status === 'published' && 
                      new Date() >= new Date(exam.startTime) && 
                      new Date() <= new Date(exam.endTime) && (
                        <>
                          {exam.attemptsExhausted ? (
                            <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium cursor-default flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              Attempted
                            </div>
                          ) : (
                            <button 
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
                              onClick={() => {
                                navigate(`/student/exam/${exam._id}/attempt`);
                              }}
                            >
                              <Clock className="w-4 h-4" />
                              {exam.studentAttemptCount > 0 ? 'Resume' : 'Start'} Exam
                              {exam.attemptsAllowed > 1 && ` (${exam.attemptsRemaining || 0} left)`}
                            </button>
                          )}
                        </>
                      )}

                    {/* View Results button for students - after exam ends or if evaluated */}
                    {!isTeacher && exam.studentAttemptCount > 0 && (
                      <button 
                        onClick={async () => {
                          try {
                            // Fetch student's latest attempt for this exam
                            const token = localStorage.getItem('token');
                            const response = await fetch(
                              `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v2'}/attempts/exam/${exam._id}/my-attempts`,
                              { headers: { Authorization: `Bearer ${token}` } }
                            );
                            const data = await response.json();
                            
                            if (data.success && data.data.attempts.length > 0) {
                              // Find latest evaluated attempt
                              const evaluatedAttempt = data.data.attempts.find(a => a.evaluationStatus === 'evaluated');
                              if (evaluatedAttempt) {
                                navigate(`/student/attempt/${evaluatedAttempt._id}/result`);
                              } else {
                                alert('Your submission is under evaluation. Results will be available soon!');
                              }
                            }
                          } catch (error) {
                            console.error('Error fetching attempts:', error);
                            alert('Unable to fetch results. Please try again.');
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <Trophy className="w-4 h-4" />
                        View My Result
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Papers Modal */}
      {viewPapersModal.open && (
        <>
          {console.log('[Classroom] Rendering ViewPapersModal:', viewPapersModal)}
          <ViewPapersModal
            examId={viewPapersModal.examId}
            isOpen={viewPapersModal.open}
            onClose={() => {
              console.log('[Classroom] Closing ViewPapersModal');
              setViewPapersModal({ open: false, examId: null });
            }}
          />
        </>
      )}

      {/* Exam Details Modal */}
      {examDetailsModal.open && (
        <ExamDetailsModal
          examId={examDetailsModal.examId}
          isOpen={examDetailsModal.open}
          onClose={() => {
            console.log('[Classroom] Closing ExamDetailsModal');
            setExamDetailsModal({ open: false, examId: null });
          }}
          onUpdate={(updatedExam) => {
            console.log('[Classroom] Exam updated:', updatedExam);
            // Update the exam in the list
            setExams(prev =>
              prev.map(e => e._id === updatedExam._id ? updatedExam : e)
            );
          }}
        />
      )}
    </div>
  );
}

// People Tab - Teacher and Students
function PeopleTab({ classData }) {
  const teacher = classData.teacher;
  const students = classData.students || [];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Teacher Section */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-lg font-bold text-[#1f3c88]">
            Teacher
          </h3>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-[#1f3c88] text-white flex items-center justify-center font-bold text-base flex-shrink-0">
              {teacher?.name?.[0] || 'T'}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{teacher?.name || 'Unknown'}</p>
              <p className="text-sm text-gray-500">{teacher?.email || 'No email'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Students Section */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-5 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-bold text-[#1f3c88]">
            Students
          </h3>
          <span className="text-gray-500 font-medium">{students.length}</span>
        </div>

        {students.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No students have joined this class yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-5 font-semibold text-gray-600">Name</th>
                  <th className="text-left py-3 px-5 font-semibold text-gray-600">Email</th>
                  <th className="text-left py-3 px-5 font-semibold text-gray-600">Roll Number</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr key={student._id || index} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-semibold text-xs">
                          {student.name?.[0] || 'S'}
                        </div>
                        <span className="font-medium text-gray-900">{student.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-5 text-gray-600">{student.email || 'No email'}</td>
                    <td className="py-3 px-5 text-gray-600">{student.rollNumber || student.roll || '-'}</td>
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
