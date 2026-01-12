/**
 * ExamCard - Display exam with status badge and actions
 * PHASE 6.3 - Added Question Paper Generation
 */
export default function ExamCard({ exam, onPublish, onGeneratePapers, onViewSets }) {
  const getStatusBadge = (status) => {
    const statusStyles = {
      draft: 'bg-gray-100 text-gray-800',
      ready: 'bg-yellow-100 text-yellow-800',
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

  const getGenerationBadge = (generationStatus) => {
    const badges = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Not Generated' },
      ready: { bg: 'bg-yellow-100', text: 'text-yellow-600', label: 'Ready' },
      generated: { bg: 'bg-green-100', text: 'text-green-600', label: 'Papers Generated' }
    };

    const badge = badges[generationStatus] || badges.draft;

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const canGenerate = ['draft', 'ready'].includes(exam.status) && exam.generationStatus !== 'generated';
  const canPublish = exam.status === 'draft' && exam.generationStatus === 'generated';
  const canViewSets = exam.generationStatus === 'generated';

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h4 className="text-lg font-bold text-gray-900">{exam.title}</h4>
          {exam.description && (
            <p className="text-sm text-gray-600 mt-1">{exam.description}</p>
          )}
        </div>
        <div className="flex flex-col gap-2 items-end">
          {getStatusBadge(exam.status)}
          {getGenerationBadge(exam.generationStatus)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
        <div>
          <span className="font-medium">Duration:</span> {exam.duration} min
        </div>
        <div>
          <span className="font-medium">Total Marks:</span> {exam.totalMarks}
        </div>
        <div>
          <span className="font-medium">Number of Sets:</span> {exam.numberOfSets || 1}
        </div>
        {exam.generatedSets && exam.generatedSets.length > 0 && (
          <div>
            <span className="font-medium">Generated Sets:</span> {exam.generatedSets.length}
          </div>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {/* PHASE 6.3 - Generate Question Papers Button */}
        {canGenerate && onGeneratePapers && (
          <button
            onClick={() => onGeneratePapers(exam._id)}
            className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700 transition-colors"
          >
            Generate Question Papers
          </button>
        )}

        {/* View Generated Sets Button */}
        {canViewSets && onViewSets && (
          <button
            onClick={() => onViewSets(exam._id)}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 transition-colors"
          >
            View Sets
          </button>
        )}

        {/* Publish Button - Only when papers are generated */}
        {canPublish && onPublish && (
          <button
            onClick={() => onPublish(exam._id)}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors"
          >
            Publish Exam
          </button>
        )}
      </div>
    </div>
  );
}
