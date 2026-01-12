import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { teacherAPI } from '../../api/teacher.api';
import StudentTable from '../../components/teacher/StudentTable';
import ExamCard from '../../components/teacher/ExamCard';
import InviteModal from '../../components/teacher/InviteModal';
import ViewSetsModal from '../../components/teacher/ViewSetsModal';
import ViewPapersModal from '../../components/teacher/ViewPapersModal';

/**
 * ClassDetails - Show class info, students, exams, and actions
 * PHASE 6.3 - Added Question Paper Generation and Review
 */
export default function ClassDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [generatingExamId, setGeneratingExamId] = useState(null);
  const [viewingSetsExamId, setViewingSetsExamId] = useState(null);
  const [viewingPapersExamId, setViewingPapersExamId] = useState(null);

  useEffect(() => {
    loadClassDetails();
  }, [id]);

  const loadClassDetails = async () => {
    try {
      setLoading(true);
      const data = await teacherAPI.getClassDetails(id);
      setClassData(data.class);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load class details');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (email) => {
    await teacherAPI.inviteStudent(id, email);
    // Reload class to get updated data
    await loadClassDetails();
  };

  const handlePublishExam = async (examId) => {
    try {
      await teacherAPI.publishExam(examId);
      await loadClassDetails();
      alert('Exam published successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to publish exam');
    }
  };

  const handleGeneratePapers = async (examId) => {
    if (!confirm('Generate question papers for this exam? This may take a few moments.')) {
      return;
    }

    try {
      setGeneratingExamId(examId);
      const result = await teacherAPI.generatePapers(examId);
      
      alert(`Success! Generated ${result.data?.numberOfSets || result.numberOfSets} question sets with ${result.data?.totalQuestions || result.totalQuestions} total questions.`);
      await loadClassDetails();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to generate papers';
      alert(errorMsg);
    } finally {
      setGeneratingExamId(null);
    }
  };

  const handleViewSets = (examId) => {
    setViewingSetsExamId(examId);
  };

  const closeViewSets = () => {
    setViewingSetsExamId(null);
  };

  const handleGenerateStudentPapers = async (examId) => {
    if (!confirm('Generate student-specific PDF papers? This may take a few moments.')) {
      return;
    }

    try {
      setGeneratingExamId(examId);
      const result = await teacherAPI.generateStudentPapers(examId);
      
      alert(`Success! Generated ${result.data?.papersGenerated || result.papersGenerated} student papers.`);
      await loadClassDetails();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to generate student papers';
      alert(errorMsg);
    } finally {
      setGeneratingExamId(null);
    }
  };

  const handleViewPapers = (examId) => {
    setViewingPapersExamId(examId);
  };

  const handleReset = async (examId) => {
    if (!confirm('Reset exam to draft? This will clear all generated sets and papers. This cannot be undone.')) {
      return;
    }

    try {
      await teacherAPI.resetExam(examId);
      alert('Exam reset to draft successfully');
      await loadClassDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reset exam');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="p-4 bg-red-50 text-red-700 rounded">
          {error || 'Class not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Class Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{classData.name}</h1>
            <p className="text-gray-600 mt-1">{classData.subject}</p>
            {classData.description && (
              <p className="text-sm text-gray-500 mt-2">{classData.description}</p>
            )}
          </div>
          <Link
            to="/teacher/dashboard"
            className="text-blue-600 hover:underline text-sm"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Students Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Students ({classData.students?.length || 0})
          </h2>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 bg-green-600 text-white font-medium rounded hover:bg-green-700"
          >
            Invite Student
          </button>
        </div>
        <StudentTable students={classData.students || []} />
      </div>

      {/* Exams Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Exams ({classData.exams?.length || 0})
          </h2>
          <Link
            to={`/teacher/class/${id}/create-exam`}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700"
          >
            Create Exam
          </Link>
        </div>

        {!classData.exams || classData.exams.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No exams created yet
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classData.exams.map((exam) => (
              <ExamCard
                key={exam._id}
                exam={exam}
                onPublish={handlePublishExam}
                onGeneratePapers={handleGeneratePapers}
                onGenerateStudentPapers={handleGenerateStudentPapers}
                onViewSets={handleViewSets}
                onViewPapers={handleViewPapers}
                onReset={handleReset}
              />
            ))}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInvite={handleInvite}
      />

      {/* PHASE 6.3 - View Generated Sets Modal */}
      {viewingSetsExamId && (
        <ViewSetsModal
          examId={viewingSetsExamId}
          onClose={closeViewSets}
        />
      )}


      {/* TASK 5 - View Student Papers Modal */}
      {viewingPapersExamId && (
        <ViewPapersModal
          examId={viewingPapersExamId}
          onClose={() => setViewingPapersExamId(null)}
        />
      )}
      {/* Generating Overlay */}
      {generatingExamId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Generating Question Papers
            </h3>
            <p className="text-gray-600">
              Please wait while AI generates your exam sets...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
