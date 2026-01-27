/**
 * Assignment Submissions Modal
 * Teacher view to see all submissions with marks and download student files
 */
import React, { useState, useEffect } from 'react';
import { X, Download, Loader2, User, CheckCircle, Clock, Edit2, Save } from 'lucide-react';
import * as assignmentAPI from '../../api/assignment.api';

export default function AssignmentSubmissionsModal({ assignmentId, assignmentTitle, isOpen, onClose }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState('');
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [gradeForm, setGradeForm] = useState({ grade: '', feedback: '', totalMarks: 100 });

  useEffect(() => {
    if (isOpen && assignmentId) {
      loadSubmissions();
    }
  }, [isOpen, assignmentId]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await assignmentAPI.getSubmissions(assignmentId);
      setSubmissions(data.submissions || []);
    } catch (err) {
      console.error('Failed to load submissions:', err);
      setError(err.response?.data?.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSubmission = async (submissionId, studentName) => {
    try {
      setDownloading(submissionId);
      const blob = await assignmentAPI.downloadSubmission(submissionId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${studentName}_${assignmentTitle}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download submission:', error);
      alert('Failed to download submission');
    } finally {
      setDownloading(null);
    }
  };

  const handleGradeSubmission = async (submissionId) => {
    try {
      if (!gradeForm.grade || gradeForm.grade === '') {
        alert('Please enter a grade');
        return;
      }

      const grade = parseFloat(gradeForm.grade);
      const totalMarks = parseFloat(gradeForm.totalMarks);

      if (isNaN(grade) || grade < 0 || grade > totalMarks) {
        alert(`Grade must be between 0 and ${totalMarks}`);
        return;
      }

      await assignmentAPI.gradeSubmission(submissionId, {
        grade,
        feedback: gradeForm.feedback,
        totalMarks
      });

      // Refresh submissions
      await loadSubmissions();
      setGradingSubmission(null);
      setGradeForm({ grade: '', feedback: '', totalMarks: 100 });
    } catch (error) {
      console.error('Failed to grade submission:', error);
      alert(error.response?.data?.message || 'Failed to grade submission');
    }
  };

  const startGrading = (submission) => {
    setGradingSubmission(submission._id);
    setGradeForm({
      grade: submission.grade !== undefined ? submission.grade : '',
      feedback: submission.feedback || '',
      totalMarks: gradeForm.totalMarks
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#1f3c88] to-[#2d5aa0]">
          <div>
            <h2 className="text-xl font-bold text-white">Assignment Submissions</h2>
            <p className="text-sm text-blue-100 mt-1">{assignmentTitle}</p>
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
              <p className="text-gray-600">Loading submissions...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
              <p className="text-red-700">{error}</p>
              <button
                onClick={loadSubmissions}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
              >
                Retry
              </button>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-16">
              <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800">No Submissions Yet</h3>
              <p className="text-gray-500 mt-2">No students have submitted this assignment</p>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-sm text-gray-600">Total Submissions</p>
                    <p className="text-2xl font-bold text-[#1f3c88]">{submissions.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Graded</p>
                    <p className="text-2xl font-bold text-green-600">
                      {submissions.filter(s => s.status === 'graded').length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {submissions.filter(s => s.status === 'submitted').length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Submissions Table */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {/* Total Marks Input */}
                <div className="px-6 py-3 bg-gray-100 border-b border-gray-200">
                  <label className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">Total Marks:</span>
                    <input
                      type="number"
                      min="0"
                      value={gradeForm.totalMarks}
                      onChange={(e) => setGradeForm({ ...gradeForm, totalMarks: e.target.value })}
                      className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f3c88] text-sm"
                    />
                    <span className="text-xs text-gray-500">Set the maximum marks for this assignment</span>
                  </label>
                </div>
                
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Grade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {submissions.map((submission) => (
                      <React.Fragment key={submission._id}>
                        <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#1f3c88] bg-opacity-10 flex items-center justify-center">
                              <User className="h-5 w-5 text-[#1f3c88]" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {submission.student?.name || 'Unknown'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {submission.student?.email || ''}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(submission.submittedAt).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(submission.submittedAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            submission.status === 'graded'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {submission.status === 'graded' ? (
                              <span className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Graded
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Pending
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {gradingSubmission === submission._id ? (
                            <input
                              type="number"
                              min="0"
                              max={gradeForm.totalMarks}
                              value={gradeForm.grade}
                              onChange={(e) => setGradeForm({ ...gradeForm, grade: e.target.value })}
                              className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1f3c88] text-sm"
                              placeholder="0"
                            />
                          ) : submission.status === 'graded' && submission.grade !== undefined ? (
                            <span className="text-lg font-bold text-[#1f3c88]">
                              {submission.grade} / {gradeForm.totalMarks}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">Not graded</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            {gradingSubmission === submission._id ? (
                              <>
                                <button
                                  onClick={() => handleGradeSubmission(submission._id)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                >
                                  <Save className="w-4 h-4" />
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setGradingSubmission(null);
                                    setGradeForm({ ...gradeForm, grade: '', feedback: '' });
                                  }}
                                  className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition-colors"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startGrading(submission)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                  {submission.status === 'graded' ? 'Edit' : 'Grade'}
                                </button>
                                <button
                                  onClick={() => handleDownloadSubmission(submission._id, submission.student?.name)}
                                  disabled={downloading === submission._id}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#1f3c88] text-white rounded hover:bg-[#152a5e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {downloading === submission._id ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      Downloading...
                                    </>
                                  ) : (
                                    <>
                                      <Download className="w-4 h-4" />
                                      Download
                                    </>
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                      {/* Grading Form Row */}
                      {gradingSubmission === submission._id && (
                        <tr key={`${submission._id}-grade`} className="bg-blue-50">
                          <td colSpan="5" className="px-6 py-4">
                            <div className="space-y-2">
                              <label className="block">
                                <span className="text-sm font-medium text-gray-700">Feedback (Optional):</span>
                                <textarea
                                  value={gradeForm.feedback}
                                  onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f3c88] text-sm"
                                  rows="2"
                                  placeholder="Enter feedback for the student..."
                                />
                              </label>
                            </div>
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Feedback Section if available */}
              {submissions.some(s => s.feedback) && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Feedback Given</h3>
                  <div className="space-y-3">
                    {submissions.filter(s => s.feedback).map((submission) => (
                      <div key={submission._id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {submission.student?.name}
                        </p>
                        <p className="text-sm text-gray-700">{submission.feedback}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
