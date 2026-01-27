/**
 * PHASE 7.3.5 — Student Exam Papers View
 * Shows upcoming exams with Start/Resume Exam buttons and paper download
 */
import { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import { studentAPI } from '../../api/student.api';
import examAPI from '../../api/exam.api';

export default function StudentExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(null);
  const [myPapers, setMyPapers] = useState({}); // examId -> paper metadata
  const [activeAttempts, setActiveAttempts] = useState({}); // examId -> attempt data
  const [startingExam, setStartingExam] = useState(null);

  useEffect(() => {
    loadExams();
  }, []);

  // Fetch real student exams (all classes)
  const loadExams = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('[Exams] Loading exams from API...');
      
      // Use apiClient for proper auth headers
      const token = localStorage.getItem('token');
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v2';
      const res = await fetch(`${baseURL}/student/exams/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('[Exams] Response status:', res.status);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('[Exams] Response data:', data);
      
      const examList = Array.isArray(data) ? data : (data.exams || []);
      console.log('[Exams] Exam list:', examList.length, 'exams');
      setExams(examList);
      
      // PHASE 7.1: Check for active attempts for each exam
      for (const exam of examList) {
        try {
          const attempt = await studentAPI.getActiveAttempt(exam._id);
          if (attempt) {
            setActiveAttempts(prev => ({ ...prev, [exam._id]: attempt }));
          }
        } catch (err) {
          // No active attempt, that's fine
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  // PHASE 7.1: Start exam attempt
  const handleStartExam = async (examId, examTitle) => {
    try {
      setStartingExam(examId);
      console.log('[PHASE 7.1] Starting exam:', examId, examTitle);
      
      const attemptData = await studentAPI.startExamAttempt(examId);
      console.log('[PHASE 7.1] Attempt started:', attemptData);
      
      // Store attemptId
      setActiveAttempts(prev => ({ ...prev, [examId]: attemptData }));
      
      // Fetch paper through attempt
      const paper = await studentAPI.getAttemptPaper(attemptData.attemptId);
      console.log('[PHASE 7.1] Paper loaded:', paper);
      
      alert(`Exam Started!\nAttempt ID: ${attemptData.attemptId}\nQuestions: ${paper.questions?.length || 0}\n\n(UI not implemented yet - check console)`);
      
    } catch (err) {
      console.error('[PHASE 7.1] Start exam error:', err);
      alert(err.response?.data?.error || err.message || 'Failed to start exam');
    } finally {
      setStartingExam(null);
    }
  };

  // PHASE 7.1: Resume exam attempt
  const handleResumeExam = async (examId, attemptData) => {
    try {
      console.log('[PHASE 7.1] Resuming exam:', examId, attemptData);
      
      // Fetch paper through attempt
      const paper = await studentAPI.getAttemptPaper(attemptData.attemptId);
      console.log('[PHASE 7.1] Paper loaded:', paper);
      
      alert(`Exam Resumed!\nAttempt ID: ${attemptData.attemptId}\nStarted: ${new Date(attemptData.startedAt).toLocaleString()}\nQuestions: ${paper.questions?.length || 0}\n\n(UI not implemented yet - check console)`);
      
    } catch (err) {
      console.error('[PHASE 7.1] Resume exam error:', err);
      alert(err.response?.data?.error || err.message || 'Failed to resume exam');
    }
  };

  // Fetch my paper metadata for a given examId
  const fetchMyPaper = async (examId) => {
    try {
      const paper = await studentAPI.getMyPaper(examId);
      setMyPapers((prev) => ({ ...prev, [examId]: paper }));
    } catch (err) {
      // Optionally handle error
    }
  };

  const handleDownloadPaper = async (examId, examTitle) => {
    try {
      setDownloading(examId);
      // PHASE 7.3.5: Use proper exam API
      const blob = await examAPI.downloadMyPaper(examId);
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
                  {exams.filter(e => ['published', 'running', 'closed', 'ended'].includes((e.status || '').toLowerCase())).map((exam) => {
                    const activeAttempt = activeAttempts[exam._id];
                    
                    return (
                      <div key={exam._id} className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900">{exam.title}</h4>
                            {exam.description && (
                              <p className="text-sm text-slate-600 mt-1">{exam.description}</p>
                            )}
                            <div className="flex gap-4 mt-2 text-sm text-slate-500">
                              <span>Duration: {exam.duration} min</span>
                              <span>Marks Per Set: {exam.paperConfig?.totalMarksPerSet || exam.totalMarks}</span>
                              <span className="uppercase font-medium">{exam.status}</span>
                            </div>
                            {activeAttempt && (
                              <div className="mt-2 text-sm text-blue-600">
                                ⚡ Active Attempt #{activeAttempt.attemptNo} - Started {new Date(activeAttempt.startedAt).toLocaleTimeString()}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            {activeAttempt ? (
                              // Resume button
                              <button
                                onClick={() => handleResumeExam(exam._id, activeAttempt)}
                                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700"
                              >
                                ▶ Resume Exam
                              </button>
                            ) : (
                              // Start button
                              <button
                                onClick={() => handleStartExam(exam._id, exam.title)}
                                disabled={startingExam === exam._id}
                                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:bg-gray-400"
                              >
                                {startingExam === exam._id ? 'Starting...' : '🚀 Start Exam'}
                              </button>
                            )}
                            
                            <button
                              onClick={async () => {
                                if (!myPapers[exam._id]) await fetchMyPaper(exam._id);
                                handleDownloadPaper(exam._id, exam.title);
                              }}
                              disabled={downloading === exam._id}
                              className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded hover:bg-slate-200 disabled:bg-gray-100"
                            >
                              {downloading === exam._id ? 'Downloading...' : '📄 Download PDF'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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

