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
import { useAuth } from '../../context/AuthContext';
import * as attemptAPI from '../../api/attempt.api';

export default function ExamAttempt() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State
  const [loading, setLoading] = useState(true);
  const [attemptData, setAttemptData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [saving, setSaving] = useState(false);
  const [violations, setViolations] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(true);
  const [examStarted, setExamStarted] = useState(false);
  
  // Refs
  const saveTimeoutRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const tabSwitchCountRef = useRef(0);
  const fullscreenExitCountRef = useRef(0);
  
  // Start attempt on mount
  useEffect(() => {
    startExam();
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [examId]);
  
  // Request fullscreen
  const requestFullscreen = async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }
      console.log('[ExamAttempt] Entered fullscreen mode');
      setIsFullscreen(true);
      setShowFullscreenPrompt(false);
      setExamStarted(true);
    } catch (error) {
      console.error('[ExamAttempt] Fullscreen request failed:', error);
      // Still allow exam to proceed if fullscreen fails
      setShowFullscreenPrompt(false);
      setExamStarted(true);
    }
  };

  // Re-enter fullscreen if exited
  const reenterFullscreen = async () => {
    try {
      const elem = document.documentElement;
      if (!document.fullscreenElement) {
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
          await elem.msRequestFullscreen();
        }
      }
    } catch (error) {
      console.error('[ExamAttempt] Failed to re-enter fullscreen:', error);
    }
  };
  
  // Start exam
  const startExam = async () => {
    try {
      setLoading(true);
      console.log('[ExamAttempt] Starting exam:', examId);
      const result = await attemptAPI.startAttempt(examId);
      
      console.log('[ExamAttempt] Start response:', result);
      
      if (result.success) {
        setAttemptData(result.data);
        
        // Calculate time remaining
        const remainingMins = result.data.remainingMinutes || 0;
        console.log('[ExamAttempt] Setting time remaining:', remainingMins, 'minutes =', remainingMins * 60, 'seconds');
        setTimeRemaining(remainingMins * 60); // Convert to seconds
        
        // Load previous answers
        const previousAnswers = {};
        if (result.data.previousAnswers && result.data.previousAnswers.length > 0) {
          result.data.previousAnswers.forEach(ans => {
            previousAnswers[ans.questionId] = ans.answer;
          });
          console.log('[ExamAttempt] Loaded', result.data.previousAnswers.length, 'previous answers');
        }
        setAnswers(previousAnswers);
        
        // Start timer
        startTimer();
        
        // Request fullscreen after data is loaded
        setTimeout(() => {
          requestFullscreen();
        }, 500);
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
    if (!examStarted || !attemptData) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        tabSwitchCountRef.current += 1;
        logViolation('tab-switch');
        
        // Warning after 3 violations
        if (tabSwitchCountRef.current >= 3) {
          alert('⚠️ Warning: Multiple tab switches detected. Continued violations may result in automatic submission.');
        }
        
        // Auto-submit after 5 violations
        if (tabSwitchCountRef.current >= 5) {
          alert('❌ Exam auto-submitted due to excessive integrity violations.');
          handleAutoSubmit();
        }
      }
    };
    
    const handleWindowBlur = () => {
      logViolation('window-blur');
    };
    
    const handleFullscreenChange = () => {
      const inFullscreen = !!document.fullscreenElement;
      setIsFullscreen(inFullscreen);
      
      if (!inFullscreen) {
        fullscreenExitCountRef.current += 1;
        logViolation('fullscreen-exit');
        
        // Force re-enter fullscreen
        setTimeout(() => {
          reenterFullscreen();
        }, 1000);
        
        // Warning after 2 exits
        if (fullscreenExitCountRef.current >= 2) {
          alert('⚠️ Warning: Exiting fullscreen is not allowed. Please stay in fullscreen mode.');
        }
        
        // Auto-submit after 5 exits
        if (fullscreenExitCountRef.current >= 5) {
          alert('❌ Exam auto-submitted due to repeated fullscreen violations.');
          handleAutoSubmit();
        }
      }
    };
    
    // Prevent right-click
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };
    
    // Prevent keyboard shortcuts (F12, Ctrl+Shift+I, etc.)
    const handleKeyDown = (e) => {
      // Prevent F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }
      
      // Prevent Ctrl+Shift+I (DevTools)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        return false;
      }
      
      // Prevent Ctrl+Shift+C (Element Inspector)
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        return false;
      }
      
      // Prevent Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        return false;
      }
      
      // Prevent Ctrl+U (View Source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        return false;
      }
    };
    
    // Prevent browser back/forward
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Are you sure you want to leave? Your exam progress will be saved but leaving may be logged as a violation.';
      return e.returnValue;
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [examStarted, attemptData]);
  
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
      // Clear timers
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      
      const result = await attemptAPI.submitAttempt(attemptData.attemptId);
      if (result.success) {
        // Exit fullscreen
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
        
        alert('✅ Exam submitted successfully!');
        navigate('/student/classes');
      }
    } catch (error) {
      console.error('Failed to submit:', error);
      alert(error.response?.data?.message || 'Failed to submit exam');
    }
  };
  
  const handleAutoSubmit = async () => {
    try {
      // Clear timers
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      
      await attemptAPI.submitAttempt(attemptData.attemptId);
      
      // Exit fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
      
      alert('⏰ Time is up! Exam has been auto-submitted.');
      navigate('/student/classes');
    } catch (error) {
      console.error('Auto-submit failed:', error);
      
      // Exit fullscreen even on error
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
      
      navigate('/student/classes');
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
    <div 
      className="min-h-screen bg-gray-50 select-none" 
      onCopy={(e) => e.preventDefault()} 
      onCut={(e) => e.preventDefault()} 
      onPaste={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}
    >
      {/* Security Watermark */}
      {examStarted && user && (
        <div className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center opacity-5">
          <div className="text-9xl font-bold text-gray-900 transform -rotate-45 whitespace-nowrap">
            {user.email} • {new Date().toLocaleDateString()}
          </div>
        </div>
      )}
      
      {/* Fullscreen warning overlay - blocks interaction */}
      {!isFullscreen && examStarted && attemptData && (
        <div className="fixed inset-0 bg-red-600 bg-opacity-95 z-50 flex items-center justify-center">
          <div className="text-center text-white px-8">
            <AlertTriangle className="h-24 w-24 mx-auto mb-6 animate-pulse" />
            <h2 className="text-3xl font-bold mb-4">⚠️ Fullscreen Mode Required</h2>
            <p className="text-xl mb-6">
              You have exited fullscreen mode. This violation has been logged.
            </p>
            <p className="text-lg mb-8">
              Fullscreen exits: {fullscreenExitCountRef.current}/5
              <br />
              <span className="text-sm opacity-90">
                (Exam will auto-submit after 5 violations)
              </span>
            </p>
            <button
              onClick={reenterFullscreen}
              className="px-8 py-4 bg-white text-red-600 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors"
            >
              Re-enter Fullscreen Mode
            </button>
            <p className="text-sm mt-4 opacity-75">Or press F11 on your keyboard</p>
          </div>
        </div>
      )}
      
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
              {/* Integrity status */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                violations === 0 
                  ? 'bg-green-100 text-green-700' 
                  : violations < 3 
                  ? 'bg-amber-100 text-amber-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                <AlertTriangle className="h-4 w-4" />
                <div className="text-xs">
                  <div className="font-medium">Violations</div>
                  <div className="font-bold">{violations}</div>
                </div>
              </div>
              
              {/* Save status */}
              {saving && (
                <div className="flex items-center gap-2 text-blue-600">
                  <Save className="h-4 w-4 animate-pulse" />
                  <span className="text-sm">Saving...</span>
                </div>
              )}
              
              {/* Timer */}
              <div className={`flex items-center gap-3 px-6 py-3 rounded-lg shadow-lg ${
                timeRemaining < 300 ? 'bg-red-600 text-white animate-pulse' : 
                timeRemaining < 600 ? 'bg-amber-500 text-white' :
                'bg-blue-600 text-white'
              }`}>
                <Clock className="h-6 w-6" />
                <div>
                  <div className="text-xs font-medium opacity-90">Time Remaining</div>
                  <div className="font-mono font-bold text-2xl">
                    {formatTime(timeRemaining)}
                  </div>
                </div>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent select-text"
                  placeholder="Type your answer here..."
                  style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
                  spellCheck="false"
                  autoComplete="off"
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
            <p className="text-gray-600 mb-4">
              You have answered {Object.values(answers).filter(a => a && a.trim() !== '').length} out of {attemptData.paper.questions.length} questions. 
              Are you sure you want to submit? You cannot make changes after submission.
            </p>
            
            {/* Show violation warning if any */}
            {violations > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-900">
                    <div className="font-semibold mb-1">Integrity Violations Detected</div>
                    <div>Total violations: {violations}</div>
                    <div className="text-xs mt-1 opacity-75">These will be reported to your instructor.</div>
                  </div>
                </div>
              </div>
            )}
            
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
      
      {/* Fullscreen prompt */}
      {showFullscreenPrompt && attemptData && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-lg w-full mx-4">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Fullscreen Mode Required
              </h3>
              <p className="text-gray-600">
                For exam integrity, you must enter fullscreen mode. Your activity will be monitored throughout the exam.
              </p>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-amber-900 mb-2">⚠️ Important Rules:</h4>
              <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                <li>Do not exit fullscreen mode</li>
                <li>Do not switch tabs or windows</li>
                <li>Do not leave the exam page</li>
                <li>Violations will be logged and reported</li>
              </ul>
            </div>
            
            <button
              onClick={requestFullscreen}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Enter Fullscreen & Start Exam
            </button>
            
            <p className="text-xs text-gray-500 text-center mt-4">
              If fullscreen doesn't work, press F11 on your keyboard
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
