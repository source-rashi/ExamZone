/**
 * ExamCard - Display exam with status badge
 */
export default function ExamCard({ exam, onPublish, onGeneratePapers }) {
  const getStatusBadge = (status) => {
    const statusStyles = {
      draft: 'bg-gray-100 text-gray-800',
      published: 'bg-green-100 text-green-800',
      active: 'bg-blue-100 text-blue-800',
      closed: 'bg-red-100 text-red-800',
      evaluated: 'bg-purple-100 text-purple-800',
    };

    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusStyles[status] || statusStyles.draft}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-lg font-bold text-gray-900">{exam.title}</h4>
          {exam.description && (
            <p className="text-sm text-gray-600 mt-1">{exam.description}</p>
          )}
        </div>
        {getStatusBadge(exam.status)}
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
        <div>
          <span className="font-medium">Duration:</span> {exam.duration} min
        </div>
        <div>
          <span className="font-medium">Total Marks:</span> {exam.totalMarks}
        </div>
        <div>
          <span className="font-medium">Max Attempts:</span> {exam.maxAttempts}
        </div>
        <div>
          <span className="font-medium">Pass %:</span> {exam.aiConfig?.minPassPercentage}%
        </div>
      </div>

      <div className="flex gap-2">
        {exam.status === 'draft' && onPublish && (
          <button
            onClick={() => onPublish(exam._id)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
          >
            Publish
          </button>
        )}
        {exam.status === 'closed' && onGeneratePapers && (
          <button
            onClick={() => onGeneratePapers(exam._id)}
            className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700"
          >
            Generate Papers
          </button>
        )}
      </div>
    </div>
  );
}
