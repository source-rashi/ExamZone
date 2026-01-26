/**
 * PHASE 7.5.4 — Teacher Results Dashboard
 * View and evaluate student exam attempts
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Bot,
  Save 
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v2';

export default function ExamResults() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [attemptDetails, setAttemptDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [aiChecking, setAIChecking] = useState(false);

  // Evaluation form state
  const [totalScore, setTotalScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [questionScores, setQuestionScores] = useState({});

  useEffect(() => {
    fetchAttempts();
  }, [examId]);

  const fetchAttempts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/evaluation/exams/${examId}/attempts`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setExam(response.data.data.exam);
        setAttempts(response.data.data.attempts);
      }
    } catch (error) {
      console.error('Failed to fetch attempts:', error);
      alert(error.response?.data?.error || 'Failed to load attempts');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttemptDetails = async (attemptId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/evaluation/attempts/${attemptId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const details = response.data.data;
        setAttemptDetails(details);
        setSelectedAttempt(attemptId);
        
        // Initialize scores
        setTotalScore(details.attempt.score || 0);
        setFeedback(details.attempt.feedback || '');
        
        // Initialize per-question scores
        const scores = {};
        if (details.attempt.perQuestionMarks && details.attempt.perQuestionMarks.length > 0) {
          details.attempt.perQuestionMarks.forEach(q => {
            scores[q.questionId] = {
              marks: q.marksAwarded || 0,
              feedback: q.feedback || ''
            };
          });
        } else {
          // Initialize with empty scores
          details.questions.forEach(q => {
            scores[q.id] = { marks: 0, feedback: '' };
          });
        }
        setQuestionScores(scores);
      }
    } catch (error) {
      console.error('Failed to fetch attempt details:', error);
      alert(error.response?.data?.error || 'Failed to load attempt details');
    } finally {
      setLoading(false);
    }
  };

  const requestAIChecking = async () => {
    try {
      setAIChecking(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/evaluation/attempts/${selectedAttempt}/ai-check`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const aiData = response.data.data;
        
        // Update with AI suggestions
        setTotalScore(aiData.aiSuggestedScore || 0);
        setFeedback(aiData.aiFeedback || '');
        
        // Update per-question scores with AI suggestions
        const newScores = { ...questionScores };
        if (aiData.perQuestionFeedback) {
          aiData.perQuestionFeedback.forEach(qf => {
            if (newScores[qf.questionId]) {
              newScores[qf.questionId] = {
                marks: qf.suggestedMarks || 0,
                feedback: qf.feedback || ''
              };
            }
          });
        }
        setQuestionScores(newScores);
        
        alert('✨ AI checking complete! Review and adjust scores as needed.');
        
        // Refresh attempt details to show AI data
        fetchAttemptDetails(selectedAttempt);
      }
    } catch (error) {
      console.error('AI checking failed:', error);
      alert(error.response?.data?.error || 'AI checking failed');
    } finally {
      setAIChecking(false);
    }
  };

  const handleQuestionScoreChange = (questionId, field, value) => {
    setQuestionScores(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value
      }
    }));

    // Recalculate total if marks changed
    if (field === 'marks') {
      const newTotal = Object.values({
        ...questionScores,
        [questionId]: { ...questionScores[questionId], marks: parseFloat(value) || 0 }
      }).reduce((sum, q) => sum + (parseFloat(q.marks) || 0), 0);
      setTotalScore(newTotal);
    }
  };

  const submitEvaluation = async () => {
    try {
      // Validate total score
      if (totalScore > exam.totalMarks) {
        alert(`Total score (${totalScore}) cannot exceed maximum marks (${exam.totalMarks})`);
        return;
      }

      if (!window.confirm(`Submit evaluation with score ${totalScore}/${exam.totalMarks}?`)) {
        return;
      }

      setEvaluating(true);
      const token = localStorage.getItem('token');

      // Build per-question marks array
      const perQuestionMarks = Object.entries(questionScores).map(([questionId, data]) => {
        const question = attemptDetails.questions.find(q => q.id === questionId);
        return {
          questionId,
          marksAwarded: parseFloat(data.marks) || 0,
          maxMarks: question?.marks || 0,
          feedback: data.feedback || ''
        };
      });

      const response = await axios.post(
        `${API_URL}/evaluation/attempts/${selectedAttempt}/score`,
        {
          score: totalScore,
          feedback,
          perQuestionMarks
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert('✅ Evaluation submitted successfully!');
        setSelectedAttempt(null);
        setAttemptDetails(null);
        fetchAttempts(); // Refresh list
      }
    } catch (error) {
      console.error('Failed to submit evaluation:', error);
      alert(error.response?.data?.error || 'Failed to submit evaluation');
    } finally {
      setEvaluating(false);
    }
  };

  const finalizeExam = async () => {
    try {
      if (!window.confirm('Finalize this exam? This will mark evaluation as complete.')) {
        return;
      }

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/evaluation/exams/${examId}/finalize`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert('✅ Exam finalized successfully!');
        fetchAttempts(); // Refresh to show finalized status
      }
    } catch (error) {
      console.error('Failed to finalize exam:', error);
      alert(error.response?.data?.error || 'Failed to finalize exam');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending': { color: 'bg-yellow-100 text-yellow-700', icon: Clock, text: 'Pending' },
      'ai-checked': { color: 'bg-blue-100 text-blue-700', icon: Bot, text: 'AI Checked' },
      'evaluated': { color: 'bg-green-100 text-green-700', icon: CheckCircle, text: 'Evaluated' }
    };
    
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon size={12} />
        {badge.text}
      </span>
    );
  };

  const getIntegrityBadge = (score) => {
    if (score >= 80) {
      return <span className="text-green-600 text-sm">✓ Clean</span>;
    } else if (score >= 60) {
      return <span className="text-yellow-600 text-sm">⚠ Minor Issues</span>;
    } else {
      return <span className="text-red-600 text-sm">⚠ Review Required</span>;
    }
  };

  if (loading && !attemptDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  // Detailed evaluation view
  if (selectedAttempt && attemptDetails) {
    const { attempt, student, questions, rollNumber } = attemptDetails;
    
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => {
              setSelectedAttempt(null);
              setAttemptDetails(null);
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            Back to Attempts List
          </button>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{exam.title}</h1>
                <p className="text-gray-600 mt-1">
                  Student: {student.name} (Roll: {rollNumber})
                </p>
                <p className="text-sm text-gray-500">
                  Submitted: {new Date(attempt.submittedAt).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                {getStatusBadge(attempt.evaluationStatus)}
                <p className="text-sm text-gray-500 mt-2">
                  Integrity: {getIntegrityBadge(attempt.integrityScore)}
                </p>
                <p className="text-xs text-gray-400">Score: {attempt.integrityScore}/100</p>
              </div>
            </div>

            {/* AI Suggestion Display */}
            {attempt.aiSuggestedScore !== null && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <Bot size={16} className="text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">AI Suggestion</span>
                </div>
                <p className="text-sm text-blue-700">
                  Score: {attempt.aiSuggestedScore}/{exam.totalMarks} • {attempt.aiFeedback}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Questions and Answers */}
        <div className="space-y-6">
          {questions.map((question, idx) => {
            const studentAnswer = attempt.answers.find(a => a.questionId === question.id);
            const qScore = questionScores[question.id] || { marks: 0, feedback: '' };

            return (
              <div key={question.id} className="bg-white rounded-lg shadow p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Question {idx + 1} ({question.marks} marks)
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{question.text}</p>
                  
                  {question.answer && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-xs font-medium text-green-900 mb-1">Expected Answer:</p>
                      <p className="text-sm text-green-700 whitespace-pre-wrap">{question.answer}</p>
                    </div>
                  )}
                </div>

                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-600 mb-2">Student's Answer:</p>
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {studentAnswer?.answer || <em className="text-gray-400">No answer provided</em>}
                  </p>
                  {studentAnswer?.answeredAt && (
                    <p className="text-xs text-gray-400 mt-2">
                      Answered at: {new Date(studentAnswer.answeredAt).toLocaleTimeString()}
                    </p>
                  )}
                </div>

                {/* Scoring */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Marks Awarded (Max: {question.marks})
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={question.marks}
                      step="0.5"
                      value={qScore.marks}
                      onChange={(e) => handleQuestionScoreChange(question.id, 'marks', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Feedback (optional)
                    </label>
                    <input
                      type="text"
                      value={qScore.feedback}
                      onChange={(e) => handleQuestionScoreChange(question.id, 'feedback', e.target.value)}
                      placeholder="e.g., Good answer, minor errors"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Evaluation Summary */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Evaluation Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Score
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max={exam.totalMarks}
                  step="0.5"
                  value={totalScore}
                  onChange={(e) => setTotalScore(parseFloat(e.target.value) || 0)}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-600">/ {exam.totalMarks}</span>
                <span className="ml-2 text-sm text-gray-500">
                  ({Math.round((totalScore / exam.totalMarks) * 100)}%)
                </span>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Overall Feedback
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide overall feedback for the student..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={requestAIChecking}
              disabled={aiChecking || attempt.evaluationStatus === 'evaluated'}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Bot size={20} />
              {aiChecking ? 'AI Checking...' : 'Get AI Suggestion'}
            </button>

            <button
              onClick={submitEvaluation}
              disabled={evaluating || totalScore > exam.totalMarks}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Save size={20} />
              {evaluating ? 'Submitting...' : 'Submit Evaluation'}
            </button>
          </div>

          {totalScore > exam.totalMarks && (
            <p className="mt-2 text-sm text-red-600">
              ⚠ Total score exceeds maximum marks
            </p>
          )}
        </div>
      </div>
    );
  }

  // Attempts list view
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          Back to Exam
        </button>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{exam?.title}</h1>
              <div className="mt-2 flex gap-4 text-sm text-gray-600">
                <span>Total Marks: {exam?.totalMarks}</span>
                <span>Duration: {exam?.duration} minutes</span>
              </div>
            </div>
            
            {/* Finalize button */}
            {attempts.length > 0 && 
             attempts.filter(a => a.evaluationStatus === 'evaluated').length === attempts.length && (
              <button
                onClick={finalizeExam}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <CheckCircle size={20} />
                Finalize Exam
              </button>
            )}
          </div>

          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-gray-600">Total Attempts:</span>
              <span className="ml-2 font-semibold">{attempts.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Evaluated:</span>
              <span className="ml-2 font-semibold text-green-600">
                {attempts.filter(a => a.evaluationStatus === 'evaluated').length}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Pending:</span>
              <span className="ml-2 font-semibold text-yellow-600">
                {attempts.filter(a => a.evaluationStatus === 'pending' || a.evaluationStatus === 'ai-checked').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Attempts Table */}
      {attempts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Clock size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600">No submitted attempts yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
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
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Integrity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attempts.map((attempt) => (
                <tr key={attempt._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {attempt.student.name}
                    </div>
                    <div className="text-sm text-gray-500">{attempt.student.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {attempt.rollNumber || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(attempt.submittedAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {attempt.evaluationStatus === 'evaluated' ? (
                      <span className="text-sm font-medium text-gray-900">
                        {attempt.score}/{exam.totalMarks}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">Not graded</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(attempt.evaluationStatus)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {getIntegrityBadge(attempt.integrityScore)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => fetchAttemptDetails(attempt._id)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {attempt.evaluationStatus === 'evaluated' ? 'Review' : 'Evaluate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
