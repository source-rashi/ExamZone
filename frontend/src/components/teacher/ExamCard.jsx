/**
 * ExamCard - Display exam with status badge and actions
 * PHASE 6.0-6.4 - Complete exam lifecycle
 */
export default function ExamCard({ exam, onPublish, onGeneratePapers, onGenerateStudentPapers, onViewSets, onViewPapers }) {
  const getStatusBadge = (status) => {
    const statusStyles = {
      draft: 'bg-gray-100 text-gray-800',
      prepared: 'bg-yellow-100 text-yellow-800',
      generated: 'bg-blue-100 text-blue-800',
      published: 'bg-green-100 text-green-800',
      running: 'bg-purple-100 text-purple-800',
      closed: 'bg-red-100 text-red-800',
      evaluated: 'bg-indigo-100 text-indigo-800',
    };

    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusStyles[status] || statusStyles.draft}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const getGenerationBadge = (generationStatus) => {
    const badges = {
      none: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Not Prepared' },
      preparing: { bg: 'bg-yellow-100', text: 'text-yellow-600', label: 'Preparing...' },
      generated: { bg: 'bg-green-100', text: 'text-green-600', label: 'Sets Ready' }
    };

    const badge = badges[generationStatus] || badges.none;

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  // PHASE 6.0 - Proper lifecycle button logic
  const isDraft = exam.status === 'draft';
  const isPrepared = exam.status === 'prepared';
  const isGenerated = exam.status === 'generated';
  const isPublished = exam.status === 'published';
  
  const hasSets = exam.generationStatus === 'generated' && exam.generatedSets?.length > 0;
  const hasPapers = exam.studentPapers?.length > 0;

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
        {/* PHASE 6.0 - Draft Status: Edit and Generate Question Papers */}
        {isDraft && (
          <>
            <button
              onClick={() => onGeneratePapers(exam._id)}
              className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700 transition-colors"
            >
              Generate Question Papers
            </button>
          </>
        )}

        {/* PHASE 6.3 - Prepared Status: View Sets and Generate Student Papers */}
        {isPrepared && (
          <>
            {hasSets && onViewSets && (
              <button
                onClick={() => onViewSets(exam._id)}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 transition-colors"
              >
                View Sets
              </button>
            )}
            {onGenerateStudentPapers && (
              <button
                onClick={() => onGenerateStudentPapers(exam._id)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
              >
                Generate Student Papers
              </button>
            )}
          </>
        )}

        {/* PHASE 6.4 - Generated Status: View Papers and Publish */}
        {isGenerated && (
          <>
            {hasPapers && onViewPapers && (
              <button
                onClick={() => onViewPapers(exam._id)}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 transition-colors"
              >
                View Papers
              </button>
            )}
            {onPublish && (
              <button
                onClick={() => onPublish(exam._id)}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors"
              >
                Publish Exam
              </button>
            )}
          </>
        )}

        {/* Published Status: View Papers and Exam Live indicator */}
        {isPublished && (
          <>
            {hasPapers && onViewPapers && (
              <button
                onClick={() => onViewPapers(exam._id)}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 transition-colors"
              >
                View Papers
              </button>
            )}
            <span className="px-4 py-2 bg-green-50 text-green-700 text-sm font-medium rounded border border-green-200">
              📡 Exam Live
            </span>
          </>
        )}
      </div>
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors"
          >
            Publish Exam
          </button>
        )}
      </div>
    </div>
  );
}
