/**
 * TASK 5 — Teacher Paper Management Panel
 * View all generated student papers with download capability
 */
import { useState, useEffect } from 'react';
import { teacherAPI } from '../../api/teacher.api';

export default function ViewPapersModal({ examId, onClose }) {
  const [papers, setPapers] = useState([]);
  const [examTitle, setExamTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    loadPapers();
  }, [examId]);

  const loadPapers = async () => {
    try {
      setLoading(true);
      const result = await teacherAPI.getStudentPapers(examId);
      setPapers(result.data.papers);
      setExamTitle(result.data.examTitle);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load papers');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (rollNumber) => {
    try {
      setDownloading(rollNumber);
      const blob = await teacherAPI.downloadPaper(examId, rollNumber);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${examTitle}_Roll_${rollNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to download paper');
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadAll = async () => {
    if (!confirm(`Download all ${papers.length} papers?`)) {
      return;
    }

    for (const paper of papers) {
      await handleDownload(paper.rollNumber);
      // Small delay to prevent overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Student Papers</h2>
            <p className="text-sm text-gray-600 mt-1">{examTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600">Loading papers...</div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-700 rounded">
              {error}
            </div>
          ) : papers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No papers generated yet
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="mb-4 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Total Papers: <span className="font-semibold">{papers.length}</span>
                </div>
                <button
                  onClick={handleDownloadAll}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
                >
                  Download All
                </button>
              </div>

              {/* Papers Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Roll Number
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Student Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Set ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Generated At
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {papers.map((paper) => (
                      <tr key={paper.rollNumber} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                          {paper.rollNumber}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {paper.studentId?.name || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                            {paper.setId}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(paper.generatedAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDownload(paper.rollNumber)}
                            disabled={downloading === paper.rollNumber}
                            className="px-3 py-1 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            {downloading === paper.rollNumber ? 'Downloading...' : 'Download'}
                          </button>
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
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white font-medium rounded hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
