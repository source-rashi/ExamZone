/**
 * TASK 6 - Student Exam Papers View
 * Shows upcoming exams with paper download for published exams
 */
import { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import { studentAPI } from '../../api/student.api';

export default function StudentExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      setLoading(true);
      // TODO: This should call a student API to get exams from enrolled classes
      // For now, using empty array
      setExams([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPaper = async (examId, rollNumber, examTitle) => {
    try {
      setDownloading(examId);
      const blob = await studentAPI.downloadMyPaper(examId, rollNumber);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${examTitle}_Paper.pdf`;
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

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-3xl font-bold text-slate-900 mb-6">My Exams</h2>
        <Card>
          <div className="p-6 text-center text-slate-600">Loading...</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-slate-900 mb-6">My Exams</h2>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Upcoming Exams with Paper Ready */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Upcoming Exams</h3>
          <Card>
            <div className="p-6">
              {exams.length === 0 ? (
                <p className="text-slate-600 text-center">No upcoming exams</p>
              ) : (
                <div className="space-y-4">
                  {exams.filter(e => e.status === 'published').map((exam) => (
                    <div key={exam._id} className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900">{exam.title}</h4>
                          {exam.description && (
                            <p className="text-sm text-slate-600 mt-1">{exam.description}</p>
                          )}
                          <div className="flex gap-4 mt-2 text-sm text-slate-500">
                            <span>Duration: {exam.duration} min</span>
                            <span>Total Marks: {exam.totalMarks}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                            PAPER READY
                          </span>
                          <button
                            onClick={() => handleDownloadPaper(exam._id, exam.myRollNumber, exam.title)}
                            disabled={downloading === exam._id}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:bg-gray-400"
                          >
                            {downloading === exam._id ? 'Downloading...' : 'Download Paper'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
        
        {/* Pending/Draft Exams (not visible to students) */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Preparing</h3>
          <Card>
            <div className="p-6 text-center">
              <p className="text-slate-600">
                Exams are being prepared by your teachers. They will appear here once published.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
