import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import examAPI from '../../api/exam.api';
import classAPI from '../../api/class.api';
import { Check, ChevronRight, ChevronLeft, Save, Send, Loader2, Calendar, Clock, Settings, FileText } from 'lucide-react';

/**
 * CreateExam - Phase 6.2 Multi-step Exam Creation Wizard
 * 4-Step Process: Basic Info → Configuration → Scheduling → Review
 */
export default function CreateExam() {
  const { id } = useParams(); // class ID
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [classData, setClassData] = useState(null);
  const [draftId, setDraftId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    title: '',
    description: '',
    classId: id,
    
    // Step 2: Configuration
    mode: 'online', // online, offline, hybrid
    totalMarks: 100,
    duration: 60, // minutes
    attemptsAllowed: 1,
    numberOfSets: 1, // Manual input instead of dropdown
    
    // PHASE 6.3.6: Question Authority Mode
    questionMode: 'teacher_provided', // 'teacher_provided' or 'ai_generated'
    
    // Step 3: Question Source (PHASE 6.2.5)
    questionSourceType: 'text', // 'latex', 'text', 'pdf'
    questionContent: '', // For latex/text
    questionFile: null, // For PDF
    
    // Step 4: Scheduling
    startTime: '',
    endTime: '',
    autoCalculateDuration: false,
  });

  const steps = [
    { number: 1, name: 'Basic Info', icon: FileText },
    { number: 2, name: 'Configuration', icon: Settings },
    { number: 3, name: 'Question Source', icon: FileText },
    { number: 4, name: 'Scheduling', icon: Calendar },
    { number: 5, name: 'Review', icon: Check },
  ];

  useEffect(() => {
    loadClassData();
  }, [id]);

  const loadClassData = async () => {
    try {
      const data = await classAPI.getClassById(id);
      setClassData(data.class);
      setFormData(prev => ({ ...prev, classId: id }));
    } catch (err) {
      console.error('Failed to load class:', err);
      setError('Failed to load class information');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
    }));
  };

  const validateStep = (step) => {
    setError('');
    
    switch(step) {
      case 1:
        if (!formData.title.trim()) {
          setError('Exam title is required');
          return false;
        }
        if (!formData.classId) {
          setError('Class ID is missing');
          return false;
        }
        break;
      
      case 2:
        if (formData.totalMarks <= 0) {
          setError('Total marks must be greater than 0');
          return false;
        }
        if (formData.duration <= 0) {
          setError('Duration must be greater than 0');
          return false;
        }
        if (formData.attemptsAllowed < 1 || formData.attemptsAllowed > 3) {
          setError('Attempts allowed must be between 1 and 3');
          return false;
        }
        if (formData.numberOfSets < 1) {
          setError('Number of sets must be at least 1');
          return false;
        }
        break;
      
      case 3:
        if (!formData.questionSourceType) {
          setError('Question source type is required');
          return false;
        }
        // PHASE 6.3.6: Validate based on question mode
        if (formData.questionMode === 'teacher_provided') {
          if ((formData.questionSourceType === 'latex' || formData.questionSourceType === 'text') && !formData.questionContent.trim()) {
            setError('Question content is required for teacher-provided mode');
            return false;
          }
          if (formData.questionSourceType === 'pdf' && !formData.questionFile) {
            setError('PDF file is required for teacher-provided mode');
            return false;
          }
        }
        // AI-generated mode doesn't require question content
        break;
      
      case 4:
        if (!formData.startTime) {
          setError('Start time is required');
          return false;
        }
        if (!formData.endTime) {
          setError('End time is required');
          return false;
        }
        if (new Date(formData.startTime) >= new Date(formData.endTime)) {
          setError('End time must be after start time');
          return false;
        }
        break;
    }
    
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const handlePrevious = () => {
    setError('');
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      setError('');
      
      const examData = {
        ...formData,
        status: 'draft',
      };
      
      if (draftId) {
        await examAPI.updateExam(draftId, examData);
      } else {
        const response = await examAPI.createExam(examData);
        setDraftId(response.exam._id);
      }
      
      alert('Draft saved successfully!');
    } catch (err) {
      console.error('Save draft error:', err);
      setError(err.response?.data?.message || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!validateStep(3)) return;
    
    try {
      setLoading(true);
      setError('');
      
      let examId = draftId;
      
      // Create if not exists
      if (!examId) {
        const createResponse = await examAPI.createExam({
          ...formData,
          status: 'draft',
        });
        examId = createResponse.exam._id;
      }
      
      // Publish
      await examAPI.publishExam(examId);
      
      alert('Exam published successfully!');
      navigate(`/class/${id}`);
    } catch (err) {
      console.error('Publish error:', err);
      setError(err.response?.data?.message || 'Failed to publish exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/class/${id}`)}
            className="text-[#1f3c88] hover:text-[#152a5e] mb-4 flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Class
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Create New Exam</h1>
          {classData && (
            <p className="text-gray-600 mt-2">
              {classData.name || classData.title} • {classData.code}
            </p>
          )}
        </div>

        {/* Stepper */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                      isCompleted 
                        ? 'bg-green-500 border-green-500' 
                        : isActive 
                        ? 'bg-[#1f3c88] border-[#1f3c88]' 
                        : 'bg-white border-gray-300'
                    }`}>
                      {isCompleted ? (
                        <Check className="w-6 h-6 text-white" />
                      ) : (
                        <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                      )}
                    </div>
                    <p className={`mt-2 text-sm font-medium ${
                      isActive ? 'text-[#1f3c88]' : 'text-gray-500'
                    }`}>
                      {step.name}
                    </p>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 -mt-6 ${
                      currentStep > step.number ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Form Content */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Basic Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exam Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Mid-Term Mathematics Exam"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f3c88] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description / Instructions
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={6}
                  placeholder="Provide instructions for students..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f3c88] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class
                </label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="font-medium text-gray-900">
                    {classData?.name || classData?.title || 'Loading...'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Code: {classData?.code || '—'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Configuration */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Exam Configuration</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Exam Mode <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {['online', 'offline', 'hybrid'].map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, mode }))}
                      className={`px-6 py-4 border-2 rounded-lg font-medium transition-all ${
                        formData.mode === mode
                          ? 'border-[#1f3c88] bg-gradient-to-br from-[#1f3c88]/5 to-[#1f3c88]/10 text-[#1f3c88] shadow-sm'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Marks <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="totalMarks"
                    value={formData.totalMarks}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f3c88]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f3c88]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attempts Allowed <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="attemptsAllowed"
                    value={formData.attemptsAllowed}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f3c88]"
                  >
                    <option value={1}>1 Attempt</option>
                    <option value={2}>2 Attempts</option>
                    <option value={3}>3 Attempts</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Sets <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="numberOfSets"
                    value={formData.numberOfSets}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f3c88]"
                    required
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Multiple sets allow you to assign different question papers to different students.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Question Source */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Question Source</h2>
              
              {/* PHASE 6.3.6: Question Mode Toggle */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    id="aiGenerateToggle"
                    checked={formData.questionMode === 'ai_generated'}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      questionMode: e.target.checked ? 'ai_generated' : 'teacher_provided',
                      questionContent: '',
                      questionFile: null
                    }))}
                    className="mt-1 w-5 h-5 text-[#1f3c88] border-gray-300 rounded focus:ring-[#1f3c88]"
                  />
                  <div className="flex-1">
                    <label htmlFor="aiGenerateToggle" className="block font-semibold text-gray-900 cursor-pointer">
                      🤖 Use AI to generate questions
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      {formData.questionMode === 'ai_generated' 
                        ? '✓ AI will generate questions based on your exam configuration and syllabus'
                        : '✓ You will provide all questions (default). AI will only format and organize them.'}
                    </p>
                  </div>
                </div>
              </div>
              
              {formData.questionMode === 'teacher_provided' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Source Type <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: 'text', label: 'Plain Text' },
                        { value: 'latex', label: 'LaTeX' },
                        { value: 'pdf', label: 'PDF Upload' }
                      ].map(type => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, questionSourceType: type.value, questionContent: '', questionFile: null }))}
                          className={`px-6 py-4 border-2 rounded-lg font-medium transition-all ${
                            formData.questionSourceType === type.value
                              ? 'border-[#1f3c88] bg-gradient-to-br from-[#1f3c88]/5 to-[#1f3c88]/10 text-[#1f3c88] shadow-sm'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {(formData.questionSourceType === 'text' || formData.questionSourceType === 'latex') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {formData.questionSourceType === 'latex' ? 'LaTeX Content' : 'Question Text'} <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="questionContent"
                        value={formData.questionContent}
                        onChange={handleInputChange}
                        rows={12}
                        placeholder={formData.questionSourceType === 'latex' 
                          ? 'Enter LaTeX formatted questions...\n\nExample:\n\\begin{enumerate}\n  \\item Question 1\n  \\item Question 2\n\\end{enumerate}'
                          : 'Enter your questions here...\n\n1. Question 1\n2. Question 2'}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f3c88] focus:border-transparent font-mono text-sm"
                        required
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        {formData.questionSourceType === 'latex' 
                          ? '✓ Your LaTeX questions will be used verbatim. AI will only format them into sets.'
                          : '✓ Your questions will be used verbatim. AI will only format them into sets.'}
                      </p>
                    </div>
                  )}

                  {formData.questionSourceType === 'pdf' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload PDF <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setFormData(prev => ({ ...prev, questionFile: e.target.files[0] }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f3c88]"
                        required
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        ✓ Upload your question paper PDF. AI will extract and format questions.
                      </p>
                    </div>
                  )}
                </>
              )}

              {formData.questionMode === 'ai_generated' && (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>⚠️ AI Generation Mode:</strong> The system will automatically generate questions based on your exam configuration.
                      You don't need to provide question content.
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      AI Instructions (Optional)
                    </label>
                    <textarea
                      name="questionContent"
                      value={formData.questionContent}
                      onChange={handleInputChange}
                      rows={6}
                      placeholder="Provide additional instructions for AI (e.g., focus areas, question types, difficulty preferences)..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f3c88] focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Optional: Guide the AI with specific requirements or focus areas.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}                  {formData.questionFile && (
                    <p className="text-sm text-green-600 mt-2">
                      Selected: {formData.questionFile.name}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    Upload a PDF containing the question bank. This will be used to generate question sets.
                  </p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <p className="text-sm text-blue-800">
                  <strong>Important:</strong> These questions will be used to generate {formData.numberOfSets} different question sets. After generation, questions cannot be modified.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Scheduling */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Exam Scheduling</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f3c88]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f3c88]"
                  required
                />
              </div>

              {formData.startTime && formData.endTime && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-800">
                    <Clock className="w-5 h-5" />
                    <p className="font-medium">
                      Exam window: {Math.round((new Date(formData.endTime) - new Date(formData.startTime)) / (1000 * 60))} minutes
                    </p>
                  </div>
                  <p className="text-sm text-green-700 mt-2">
                    Students can start anytime within this window and will have {formData.duration} minutes to complete.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Review & Create</h2>
              
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Basic Information</h3>
                  <dl className="grid grid-cols-1 gap-3">
                    <div>
                      <dt className="text-sm text-gray-600">Title</dt>
                      <dd className="font-medium text-gray-900">{formData.title}</dd>
                    </div>
                    {formData.description && (
                      <div>
                        <dt className="text-sm text-gray-600">Description</dt>
                        <dd className="text-gray-900">{formData.description}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-sm text-gray-600">Class</dt>
                      <dd className="font-medium text-gray-900">
                        {classData?.name || classData?.title} ({classData?.code})
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="border-b pb-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Configuration</h3>
                  <dl className="grid grid-cols-2 gap-3">
                    <div>
                      <dt className="text-sm text-gray-600">Mode</dt>
                      <dd className="font-medium text-gray-900 capitalize">{formData.mode}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-600">Total Marks</dt>
                      <dd className="font-medium text-gray-900">{formData.totalMarks}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-600">Duration</dt>
                      <dd className="font-medium text-gray-900">{formData.duration} minutes</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-600">Attempts Allowed</dt>
                      <dd className="font-medium text-gray-900">{formData.attemptsAllowed}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-600">Number of Sets</dt>
                      <dd className="font-medium text-gray-900">{formData.numberOfSets}</dd>
                    </div>
                  </dl>
                </div>

                <div className="border-b pb-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Question Source</h3>
                  <dl className="grid grid-cols-1 gap-3">
                    <div>
                      <dt className="text-sm text-gray-600">Source Type</dt>
                      <dd className="font-medium text-gray-900 capitalize">{formData.questionSourceType}</dd>
                    </div>
                    {(formData.questionSourceType === 'text' || formData.questionSourceType === 'latex') && (
                      <div>
                        <dt className="text-sm text-gray-600">Content Preview</dt>
                        <dd className="text-gray-900 text-sm bg-gray-50 p-3 rounded border border-gray-200 max-h-32 overflow-y-auto font-mono">
                          {formData.questionContent.substring(0, 200)}{formData.questionContent.length > 200 ? '...' : ''}
                        </dd>
                      </div>
                    )}
                    {formData.questionSourceType === 'pdf' && formData.questionFile && (
                      <div>
                        <dt className="text-sm text-gray-600">PDF File</dt>
                        <dd className="font-medium text-gray-900">{formData.questionFile.name}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Scheduling</h3>
                  <dl className="grid grid-cols-2 gap-3">
                    <div>
                      <dt className="text-sm text-gray-600">Start Time</dt>
                      <dd className="font-medium text-gray-900">
                        {new Date(formData.startTime).toLocaleString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-600">End Time</dt>
                      <dd className="font-medium text-gray-900">
                        {new Date(formData.endTime).toLocaleString()}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                <p className="text-sm text-yellow-800">
                  <strong>Next Steps:</strong> After saving, you'll need to generate question sets before publishing the exam. Questions will be locked after generation.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevious}
                disabled={loading || saving}
                className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            {currentStep < 5 && (
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={loading || saving}
                className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Draft
                  </>
                )}
              </button>
            )}

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={loading || saving}
                className="px-6 py-3 bg-[#1f3c88] text-white rounded-lg font-medium hover:bg-[#152a5e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={loading || saving}
                className="px-8 py-3 bg-[#1f3c88] text-white rounded-lg font-medium hover:bg-[#152a5e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Draft
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
