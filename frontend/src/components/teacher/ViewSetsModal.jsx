import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import examAPI from '../../api/exam.api';

/**
 * ViewSetsModal - PHASE 6.3 TASK 4
 * Teacher review panel for generated question sets
 * Read-only view of questions and student distribution
 */
export default function ViewSetsModal({ examId, onClose }) {
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSetIndex, setSelectedSetIndex] = useState(0);

  useEffect(() => {
    loadExamSets();
  }, [examId]);

  const loadExamSets = async () => {
    try {
      setLoading(true);
      // Fetch exam with generated sets
      const response = await examAPI.getExamById(examId);
      setExam(response.data || response);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load exam sets');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !exam || !exam.generatedSets || exam.generatedSets.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Error</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>
          <p className="text-red-600">{error || 'No generated sets found'}</p>
          <button
            onClick={onClose}
            className="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const currentSet = exam.generatedSets[selectedSetIndex];
  const studentsPerSet = exam.setMap ? 
    exam.setMap.find(m => m.setId === currentSet.setId)?.assignedRollNumbers.length || 0 : 
    Math.ceil(exam.students?.length / exam.generatedSets.length) || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4 my-8 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Generated Question Sets</h2>
              <p className="text-sm text-gray-600 mt-1">{exam.title}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={28} />
            </button>
          </div>
        </div>

        {/* Set Selector */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex gap-2 flex-wrap">
            {exam.generatedSets.map((set, index) => (
              <button
                key={set.setId}
                onClick={() => setSelectedSetIndex(index)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedSetIndex === index
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {set.setId}
              </button>
            ))}
          </div>
        </div>

        {/* Set Summary */}
        <div className="px-6 py-4 bg-purple-50 border-b border-purple-100">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-purple-600 font-medium">Questions</p>
              <p className="text-2xl font-bold text-purple-900">
                {currentSet.questions.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-purple-600 font-medium">Total Marks</p>
              <p className="text-2xl font-bold text-purple-900">
                {currentSet.totalMarks}
              </p>
            </div>
            <div>
              <p className="text-sm text-purple-600 font-medium">Students Assigned</p>
              <p className="text-2xl font-bold text-purple-900">
                {studentsPerSet}
              </p>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            {currentSet.questions.map((question, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-lg font-bold text-purple-600">
                    Question {index + 1}
                  </span>
                  <div className="flex gap-3 text-sm">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
                    </span>
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded capitalize">
                      {question.difficulty}
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                      {question.topic}
                    </span>
                  </div>
                </div>
                
                <div className="text-gray-900 mb-3 leading-relaxed">
                  {question.questionText}
                </div>

                {question.options && question.options.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium text-gray-700">Options:</p>
                    {question.options.map((option, optIndex) => (
                      <div 
                        key={optIndex}
                        className={`pl-4 py-1 text-gray-700 ${
                          question.correctAnswer === option 
                            ? 'font-medium text-green-700' 
                            : ''
                        }`}
                      >
                        {String.fromCharCode(65 + optIndex)}. {option}
                        {question.correctAnswer === option && (
                          <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                            Correct
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              No editing allowed after generation
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
