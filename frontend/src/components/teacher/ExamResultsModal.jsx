/**
 * Exam Results Modal - Shows all students' marks in a table
 */
import { useState, useEffect } from 'react';
import { X, Loader2, User, Award, CheckCircle, Clock } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v2';

export default function ExamResultsModal({ isOpen, examId, examTitle, onClose }) {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalMarks, setTotalMarks] = useState(0);

  useEffect(() => {
    if (isOpen && examId) {
      loadAttempts();
    }
  }, [isOpen, examId]);

  const loadAttempts = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/evaluation/exams/${examId}/attempts`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const attemptsData = response.data.data.attempts || [];
        console.log('[ExamResultsModal] Loaded attempts:', attemptsData);
        console.log('[ExamResultsModal] Exam data:', response.data.data.exam);
        setAttempts(attemptsData);
        setTotalMarks(response.data.data.exam?.paperConfig?.totalMarksPerSet || response.data.data.exam?.totalMarks || 0);
      }
    } catch (err) {
      console.error('Failed to load exam attempts:', err);
      setError(err.response?.data?.error || 'Failed to load exam results');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const evaluatedAttempts = attempts.filter(a => a.evaluationStatus === 'evaluated');
  const pendingAttempts = attempts.filter(a => a.evaluationStatus === 'pending' || a.evaluationStatus === 'ai-checked');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#1f3c88] to-[#2d5aa0]">
          <div>
            <h2 className="text-xl font-bold text-white">Exam Results</h2>
            <p className="text-sm text-blue-100 mt-1">{examTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-[#1f3c88] animate-spin mb-4" />
              <p className="text-gray-600">Loading results...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
              <p className="text-red-700">{error}</p>
              <button
                onClick={loadAttempts}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
              >
                Retry
              </button>
            </div>
          ) : attempts.length === 0 ? (
            <div className="text-center py-16">
              <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800">No Attempts Yet</h3>
              <p className="text-gray-500 mt-2">No students have attempted this exam</p>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-sm text-gray-600">Total Attempts</p>
                    <p className="text-2xl font-bold text-[#1f3c88]">{attempts.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Evaluated</p>
                    <p className="text-2xl font-bold text-green-600">{evaluatedAttempts.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-amber-600">{pendingAttempts.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Marks</p>
                    <p className="text-2xl font-bold text-[#1f3c88]">{totalMarks}</p>
                  </div>
                </div>
              </div>

              {/* Results Table */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Roll Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Marks Obtained
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attempts.map((attempt) => (
                      <tr key={attempt._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#1f3c88] bg-opacity-10 flex items-center justify-center">
                              <User className="h-5 w-5 text-[#1f3c88]" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {attempt.student?.name || 'Unknown'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {attempt.student?.email || ''}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {attempt.rollNumber || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(attempt.submittedAt).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(attempt.submittedAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            attempt.evaluationStatus === 'evaluated'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {attempt.evaluationStatus === 'evaluated' ? (
                              <span className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Evaluated
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {attempt.evaluationStatus === 'ai-checked' ? 'AI Checked' : 'Pending'}
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {attempt.evaluationStatus === 'evaluated' && (attempt.score !== undefined || attempt.score === 0) ? (
                            <div className="flex items-center gap-2">
                              <Award className="w-5 h-5 text-amber-500" />
                              <span className="text-lg font-bold text-[#1f3c88]">
                                {attempt.score} / {totalMarks}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Not evaluated</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
