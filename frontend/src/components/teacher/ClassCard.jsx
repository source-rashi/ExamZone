import { Link } from 'react-router-dom';

/**
 * ClassCard - Display a single class with basic info
 */
export default function ClassCard({ classData }) {
  return (
    <Link 
      to={`/teacher/class/${classData._id}`}
      className="block p-6 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow"
    >
      <h3 className="text-xl font-bold text-gray-900 mb-2">{classData.name}</h3>
      <p className="text-gray-600 mb-2">{classData.subject}</p>
      {classData.description && (
        <p className="text-sm text-gray-500 mb-4">{classData.description}</p>
      )}
      <div className="flex gap-4 text-sm text-gray-600">
        <span>{classData.students?.length || 0} students</span>
        <span>{classData.exams?.length || 0} exams</span>
      </div>
    </Link>
  );
}
