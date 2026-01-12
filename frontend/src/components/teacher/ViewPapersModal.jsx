/**
 * PHASE 6.4 — Enhanced Teacher Paper Management Panel
 * View generated question sets AND student papers with tabs
 */
import { useState, useEffect } from 'react';
import { examAPI } from '../../api/exam.api';
import { FileText, Users, Download, CheckCircle, AlertCircle } from 'lucide-react';

export default function ViewPapersModal({ examId, isOpen, onClose }) {
  const [examDetails, setExamDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(null);
  const [activeTab, setActiveTab] = useState('students');

  useEffect(() => {
    if (isOpen && examId) {
      loadExamDetails();
    }
  }, [examId, isOpen]);

  const loadExamDetails = async () => {
    try {
      setLoading(true);
      const result = await examAPI.getExamDetails(examId);
      setExamDetails(result.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load exam details');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (rollNumber) => {
    try {
      setDownloading(rollNumber);
      // TODO: Implement download from storage
      alert(`Download for roll ${rollNumber} - Implementation needed`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to download paper');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#1f3c88] to-[#2d5aa0]">
          <div>
            <h2 className="text-xl font-bold text-white">
              {examDetails?.title || 'Exam Papers & Details'}
            </h2>
            {examDetails && (
              <p className="text-sm text-blue-100 mt-1">
                Status: <span className="capitalize font-medium">{examDetails.status}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-3xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-80px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1f3c88]"></div>
            </div>
          ) : error ? (
            <div className="p-6">
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            </div>
          ) : examDetails ? (
            <>
              {/* Overview Stats */}
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Marks</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {examDetails.totalMarks}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {examDetails.duration} min
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Question Sets</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {examDetails.generatedSets?.length || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Student Papers</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {examDetails.studentPapers?.length || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200">
                <div className="flex px-6">
                  <button
                    onClick={() => setActiveTab('students')}
                    className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                      activeTab === 'students'
                        ? 'border-[#1f3c88] text-[#1f3c88]'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Students ({examDetails.studentPapers?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('sets')}
                    className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                      activeTab === 'sets'
                        ? 'border-[#1f3c88] text-[#1f3c88]'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Question Sets ({examDetails.generatedSets?.length || 0})
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'students' && (
                  <div className="overflow-x-auto">
                    {examDetails.studentPapers && examDetails.studentPapers.length > 0 ? (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Roll No.
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Set
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {examDetails.studentPapers.map((paper) => (
                            <tr key={paper.rollNumber} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {paper.rollNumber}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {paper.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                                  Set {paper.setId}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {paper.status === 'created' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <CheckCircle className="w-3 h-3" />
                                    Created
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    <AlertCircle className="w-3 h-3" />
                                    Failed
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <button
                                  onClick={() => handleDownload(paper.rollNumber)}
                                  disabled={downloading === paper.rollNumber}
                                  className="text-[#1f3c88] hover:text-[#152a5e] font-medium flex items-center gap-1 disabled:opacity-50"
                                >
                                  <Download className="w-4 h-4" />
                                  {downloading === paper.rollNumber ? 'Downloading...' : 'Download'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-center py-12">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No student papers generated yet</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Click "Generate Student Papers" to create individual papers
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'sets' && (
                  <div className="space-y-6">
                    {examDetails.generatedSets && examDetails.generatedSets.length > 0 ? (
                      examDetails.generatedSets.map((set) => (
                        <div
                          key={set.setId}
                          className="border border-gray-200 rounded-lg overflow-hidden"
                        >
                          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                            <h4 className="font-semibold text-gray-900">
                              Set {set.setId}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {set.questions?.length || 0} questions • {set.totalMarks} marks total
                            </p>
                          </div>
                          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                            {set.questions && set.questions.length > 0 ? (
                              set.questions.map((q, qIdx) => (
                                <div key={qIdx} className="border-l-4 border-[#1f3c88] pl-4">
                                  <div className="flex items-start justify-between mb-1">
                                    <span className="font-medium text-gray-900">
                                      Question {qIdx + 1}
                                    </span>
                                    <span className="text-sm font-medium text-gray-500">
                                      {q.marks} marks
                                    </span>
                                  </div>
                                  <p className="text-gray-700 text-sm mb-2">
                                    {q.questionText}
                                  </p>
                                  <div className="flex gap-2 text-xs">
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                      {q.topic}
                                    </span>
                                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded capitalize">
                                      {q.difficulty}
                                    </span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-gray-500">No questions in this set</p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No question sets generated yet</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
