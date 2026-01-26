/**
 * PHASE 7.4 — Student Exam Attempt Page
 * Real-time exam taking interface with timer, autosave, and integrity monitoring
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Clock, 
  AlertTriangle, 
  Save, 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight,
  Send
} from 'lucide-react';
import * as attemptAPI from '../../api/attempt.api';

export default function ExamAttempt() {
  const { examId } = useParams();
  const navigate = useNavigate();
  
  // State
  const [loading, setLoading] = useState(true);
  const [attemptData, setAttemptData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [saving, setSaving] = useState(false);
  const [violations, setViolations] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  
  // Refs
  const saveTimeoutRef = useRef(null);
  const timerIntervalRef = useRef(null);
  
  // Start attempt on mount
  useEffect(() => {
    startExam();
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [examId]);
  
  // Start exam
  const startExam = async () => {
    try {
      setLoading(true);
      console.log('[ExamAttempt] Starting exam:', examId);
      const result = await attemptAPI.startAttempt(examId);
      
      console.log('[ExamAttempt] Start response:', result);
      
      if (result.success) {
        setAttemptData(result.data);
        setTimeRemaining(result.data.remainingMinutes * 60); // Convert to seconds
        
        // Load previous answers
        const previousAnswers = {};
        result.data.previousAnswers?.forEach(ans => {
          previousAnswers[ans.questionId] = ans.answer;
        });
        setAnswers(previousAnswers);
        
        // Start timer
        startTimer();
      }
    } catch (error) {
      console.error('[ExamAttempt] Failed to start exam:', error);
      console.error('[ExamAttempt] Error response:', error.response);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to start exam';
      alert(errorMsg);
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };
  
  // Timer
  const startTimer = () => {
    timerIntervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  // Format time
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Answer change handler with autosave
  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
    
    // Debounced autosave
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveAnswerToServer(questionId, value);
    }, 1000);
  };
  
  // Save answer to server
  const saveAnswerToServer = async (questionId, answer) => {
    try {
      setSaving(true);
      await attemptAPI.saveAnswer(
        attemptData.attemptId,
        questionId,
        answer,
        currentQuestionIndex
      );
    } catch (error) {
      console.error('Failed to save answer:', error);
      if (error.response?.data?.autoSubmitted) {
        handleAutoSubmit();
      }
    } finally {
      setSaving(false);
    }
  };
  
  // Integrity monitoring
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && attemptData) {
        logViolation('tab-switch');
      }
    };
    
    const handleWindowBlur = () => {
      if (attemptData) {
        logViolation('window-blur');
      }
    };
    
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && attemptData) {
        logViolation('fullscreen-exit');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [attemptData]);
  
  // Log violation
  const logViolation = async (type) => {
    try {
      const result = await attemptAPI.logViolation(attemptData.attemptId, type);
      if (result.success) {
        setViolations(result.data.totalViolations);
      }
    } catch (error) {
      console.error('Failed to log violation:', error);
    }
  };
  
  // Navigation
  const goToQuestion = (index) => {
    setCurrentQuestionIndex(index);
  };
  
  const nextQuestion = () => {
    if (currentQuestionIndex < attemptData.paper.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };
  
  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };
  
  // Submit
  const handleSubmit = () => {
    setShowSubmitModal(true);
  };
  
  const confirmSubmit = async () => {
    try {
      const result = await attemptAPI.submitAttempt(attemptData.attemptId);
      if (result.success) {
        alert('Exam submitted successfully!');
        navigate(`/student/classes/${attemptData.exam.classId}`);
      }
    } catch (error) {
      console.error('Failed to submit:', error);
      alert(error.response?.data?.message || 'Failed to submit exam');
    }
  };
  
  const handleAutoSubmit = async () => {
    try {
      await attemptAPI.submitAttempt(attemptData.attemptId);
      alert('Time is up! Exam has been auto-submitted.');
      navigate(`/student/classes`);
    } catch (error) {
      console.error('Auto-submit failed:', error);
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }
  
  if (!attemptData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load exam</p>
        </div>
      </div>
    );
  }
  
  const currentQuestion = attemptData.paper.questions[currentQuestionIndex];
  const currentQuestionId = `q${currentQuestionIndex}`;
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {attemptData.exam.title}
              </h1>
              <p className="text-sm text-gray-500">
                Attempt #{attemptData.attemptNo}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Violations */}
              {violations > 0 && (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="text-sm font-medium">{violations} warnings</span>
                </div>
              )}
              
              {/* Save status */}
              {saving && (
                <div className="flex items-center gap-2 text-blue-600">
                  <Save className="h-4 w-4 animate-pulse" />
                  <span className="text-sm">Saving...</span>
                </div>
              )}
              
              {/* Timer */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                timeRemaining < 300 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
              }`}>
                <Clock className="h-5 w-5" />
                <span className="font-mono font-bold text-lg">
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question navigator */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4 sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-3">Questions</h3>
              <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
                {attemptData.paper.questions.map((q, idx) => {
                  const qId = `q${idx}`;
                  const isAnswered = answers[qId] && answers[qId].trim() !== '';
                  const isCurrent = idx === currentQuestionIndex;
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => goToQuestion(idx)}
                      className={`
                        aspect-square rounded-lg text-sm font-medium transition-all
                        ${isCurrent 
                          ? 'bg-blue-600 text-white ring-2 ring-blue-400' 
                          : isAnswered
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }
                      `}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-medium">{attemptData.paper.questions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Answered:</span>
                    <span className="font-medium text-green-600">
                      {Object.values(answers).filter(a => a && a.trim() !== '').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Question area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-6">
              {/* Question header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Question {currentQuestionIndex + 1} of {attemptData.paper.questions.length}
                  </span>
                  <h2 className="text-2xl font-bold text-gray-900 mt-1">
                    Question {currentQuestionIndex + 1}
                  </h2>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {currentQuestion.marks} marks
                </span>
              </div>
              
              {/* Question text */}
              <div className="prose max-w-none mb-6">
                <p className="text-lg text-gray-800 whitespace-pre-wrap">
                  {currentQuestion.text}
                </p>
              </div>
              
              {/* Answer area */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Answer:
                </label>
                <textarea
                  value={answers[currentQuestionId] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestionId, e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Type your answer here..."
                />
              </div>
              
              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t">
                <button
                  onClick={prevQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                  Previous
                </button>
                
                {currentQuestionIndex === attemptData.paper.questions.length - 1 ? (
                  <button
                    onClick={handleSubmit}
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Send className="h-5 w-5" />
                    Submit Exam
                  </button>
                ) : (
                  <button
                    onClick={nextQuestion}
                    className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Next
                    <ChevronRight className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Submit confirmation modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Submit Exam?
            </h3>
            <p className="text-gray-600 mb-6">
              You have answered {Object.values(answers).filter(a => a && a.trim() !== '').length} out of {attemptData.paper.questions.length} questions. 
              Are you sure you want to submit? You cannot make changes after submission.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmSubmit}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Yes, Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
