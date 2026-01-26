/**
 * PHASE 7.5.5 — Student Result Viewing
 * Students can view their exam results after evaluation
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Trophy,
  FileText 
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v2';

export default function StudentResult() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResult();
  }, [attemptId]);

  const fetchResult = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/attempts/${attemptId}/result`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setResult(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch result:', error);
      alert(error.response?.data?.error || 'Failed to load result');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-blue-600';
    if (percentage >= 60) return 'text-yellow-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getGrade = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    if (percentage >= 33) return 'D';
    return 'F';
  };

  const getIntegrityBadge = (score) => {
    if (score >= 80) {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle size={20} />
          <span>Clean Attempt</span>
        </div>
      );
    } else if (score >= 60) {
      return (
        <div className="flex items-center gap-2 text-yellow-600">
          <AlertTriangle size={20} />
          <span>Minor Issues Detected</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle size={20} />
          <span>Integrity Concerns</span>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your result...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <XCircle size={48} className="mx-auto text-red-500 mb-4" />
          <p className="text-gray-600">Result not found</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { exam, attempt, questions } = result;
  // Use exam.totalMarks as the max score for percentage and grade calculation
  const maxMarks = exam.totalMarks || attempt.maxMarks || 100;
  const percentage = ((attempt.score / maxMarks) * 100).toFixed(1);
  const grade = getGrade(attempt.score, maxMarks);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        {/* Score Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-4">
              <Trophy className="text-blue-600" size={40} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{exam.title}</h1>
            <p className="text-gray-600">Exam Result</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Score */}
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Your Score</p>
              <p className={`text-4xl font-bold ${getScoreColor(attempt.score, maxMarks)}`}>
                {attempt.score}
              </p>
              <p className="text-gray-600 mt-1">out of {maxMarks}</p>
            </div>

            {/* Percentage */}
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Percentage</p>
              <p className={`text-4xl font-bold ${getScoreColor(attempt.score, maxMarks)}`}>
                {percentage}%
              </p>
              <p className="text-gray-600 mt-1">Grade: {grade}</p>
            </div>

            {/* Integrity */}
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Integrity Score</p>
              <p className="text-4xl font-bold text-gray-900">
                {attempt.integrityScore}
              </p>
              <p className="text-gray-600 mt-1">out of 100</p>
            </div>
          </div>

          {/* Integrity Status */}
          <div className="flex justify-center mb-6">
            {getIntegrityBadge(attempt.integrityScore)}
          </div>

          {/* Evaluation Info */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Submitted:</span>{' '}
                {new Date(attempt.submittedAt).toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Evaluated:</span>{' '}
                {new Date(attempt.evaluatedAt).toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Time Taken:</span>{' '}
                {Math.floor((new Date(attempt.submittedAt) - new Date(attempt.startedAt)) / 60000)} minutes
              </div>
              <div>
                <span className="font-medium">Violations:</span>{' '}
                {attempt.violations?.length || 0}
              </div>
            </div>
          </div>

          {/* Overall Feedback */}
          {attempt.feedback && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-900 mb-2">Teacher's Feedback</p>
              <p className="text-blue-700">{attempt.feedback}</p>
            </div>
          )}
        </div>

        {/* Question-wise Breakdown */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Question-wise Performance</h2>

          <div className="space-y-4">
            {questions.map((question, idx) => {
              // Match questionId formats: q0, q1, q2... or 1, 2, 3...
              const questionMarks = attempt.perQuestionMarks?.find(
                q => q.questionId === question.id || 
                     q.questionId === question.number?.toString() ||
                     q.questionId === `q${idx}`
              );
              const studentAnswer = attempt.answers?.find(
                a => a.questionId === `q${idx}` || // q0, q1, q2...
                     a.questionId === question.id ||
                     a.questionId === question.number?.toString()
              );

              return (
                <div
                  key={question.id}
                  className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                >
                  {/* Question Header */}
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Question {idx + 1}
                    </h3>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        questionMarks 
                          ? getScoreColor(questionMarks.marksAwarded, questionMarks.maxMarks)
                          : 'text-gray-400'
                      }`}>
                        {questionMarks ? questionMarks.marksAwarded : 0} / {question.marks}
                      </p>
                      <p className="text-xs text-gray-500">marks</p>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="mb-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{question.text}</p>
                  </div>

                  {/* Your Answer */}
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-600 mb-2">Your Answer:</p>
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {question.studentAnswer || studentAnswer?.answer || <em className="text-gray-400">No answer provided</em>}
                    </p>
                  </div>

                  {/* Expected Answer (if available) */}
                  {question.answer && (
                    <div className="mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-xs font-medium text-green-900 mb-2">Expected Answer:</p>
                      <p className="text-sm text-green-700 whitespace-pre-wrap">
                        {question.answer}
                      </p>
                    </div>
                  )}

                  {/* Question Feedback */}
                  {questionMarks?.feedback && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs font-medium text-blue-900 mb-1">Feedback:</p>
                      <p className="text-sm text-blue-700">{questionMarks.feedback}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Integrity Details */}
        {attempt.violations && attempt.violations.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="text-yellow-600" size={24} />
              Integrity Violations
            </h2>
            <div className="space-y-2">
              {attempt.violations.map((violation, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                >
                  <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={16} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-900">
                      {violation.type === 'tab-switch' && 'Tab Switch Detected'}
                      {violation.type === 'fullscreen-exit' && 'Exited Fullscreen'}
                      {violation.type === 'copy-paste' && 'Copy/Paste Attempt'}
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      {new Date(violation.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
