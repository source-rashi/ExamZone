import { useParams, useNavigate } from 'react-router-dom';
import { teacherAPI } from '../../api/teacher.api';
import ExamForm from '../../components/teacher/ExamForm';

/**
 * CreateExam - Page to create a new exam for a class
 */
export default function CreateExam() {
  const { id } = useParams(); // class ID
  const navigate = useNavigate();

  const handleSubmit = async (formData) => {
    await teacherAPI.createExam(id, formData);
    // Redirect back to class details
    navigate(`/teacher/class/${id}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Exam</h1>
        <p className="text-gray-600 mt-2">Set up a new exam for your class</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <ExamForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
