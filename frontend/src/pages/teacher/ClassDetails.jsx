import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { teacherAPI } from '../../api/teacher.api';
import StudentTable from '../../components/teacher/StudentTable';
import ExamCard from '../../components/teacher/ExamCard';
import InviteModal from '../../components/teacher/InviteModal';

/**
 * ClassDetails - Show class info, students, exams, and actions
 */
export default function ClassDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);

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
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to publish exam');
    }
  };

  const handleGeneratePapers = async (examId) => {
    try {
      const result = await teacherAPI.generatePapers(examId);
      alert(`Generated ${result.count} answer papers`);
      await loadClassDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate papers');
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
    </div>
  );
}
