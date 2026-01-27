/**
 * Exam Details Modal - View and Edit Exam Information
 * Teachers can view full exam details and edit if exam is in draft/prepared status
 */
import { useState, useEffect } from 'react';
import { examAPI } from '../../api/exam.api';
import { 
  X, Edit2, Save, Calendar, Clock, FileText, Users, 
  CheckCircle, AlertCircle, Loader 
} from 'lucide-react';

export default function ExamDetailsModal({ examId, isOpen, onClose, onUpdate }) {
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    totalMarks: '',
    duration: '',
    startTime: '',
    endTime: '',
    numberOfSets: '',
    attemptsAllowed: ''
  });

  useEffect(() => {
    if (isOpen && examId) {
      loadExamDetails();
    }
  }, [examId, isOpen]);

  const loadExamDetails = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('[ExamDetailsModal] Loading exam:', examId);
      
      const examData = await examAPI.getExamById(examId);
      
      console.log('[ExamDetailsModal] Loaded exam data:', examData);
      
      setExam(examData);
      setFormData({
        title: examData.title || '',
        description: examData.description || '',
        totalMarks: examData.totalMarks || '',
        duration: examData.duration || '',
        startTime: examData.startTime ? new Date(examData.startTime).toISOString().slice(0, 16) : '',
        endTime: examData.endTime ? new Date(examData.endTime).toISOString().slice(0, 16) : '',
        numberOfSets: examData.numberOfSets || 1,
        attemptsAllowed: examData.attemptsAllowed || 1
      });
    } catch (err) {
      console.error('[ExamDetailsModal] Error:', err);
      setError(err.response?.data?.message || 'Failed to load exam details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      
      console.log('[ExamDetailsModal] Saving updates:', formData);
      
      const updateData = {
        ...formData,
        totalMarks: parseInt(formData.totalMarks),
        duration: parseInt(formData.duration),
        numberOfSets: parseInt(formData.numberOfSets),
        attemptsAllowed: parseInt(formData.attemptsAllowed)
      };
      
      const result = await examAPI.updateExam(examId, updateData);
      const examData = result.data || result;
      
      console.log('[ExamDetailsModal] Update successful:', examData);
      
      setExam(examData);
      setIsEditing(false);
      
      // Notify parent component
      if (onUpdate) {
        onUpdate(examData);
      }
      
      alert('Exam updated successfully!');
    } catch (err) {
      console.error('[ExamDetailsModal] Save error:', err);
      setError(err.response?.data?.message || 'Failed to update exam');
    } finally {
      setSaving(false);
    }
  };

  const canEdit = exam && ['draft', 'prepared'].includes(exam.status);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#1f3c88] to-[#2d5aa0]">
          <div>
            <h2 className="text-xl font-bold text-white">
              {isEditing ? 'Edit Exam Details' : 'Exam Details'}
            </h2>
            {exam && (
              <p className="text-sm text-blue-100 mt-1">
                Status: <span className="capitalize font-medium">{exam.status}</span>
              </p>
            )}
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
              <Loader className="w-12 h-12 text-[#1f3c88] animate-spin mb-4" />
              <p className="text-gray-600">Loading exam details...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 mb-2">
                <AlertCircle className="w-5 h-5" />
                <p className="font-medium">Error</p>
              </div>
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={loadExamDetails}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
              >
                Retry
              </button>
            </div>
          ) : exam ? (
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#1f3c88]" />
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1f3c88] focus:border-transparent"
                      />
                    ) : (
                      <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                        {exam.title}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <div className="px-3 py-2 bg-gray-50 rounded-lg">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        exam.status === 'published' ? 'bg-green-100 text-green-800' :
                        exam.status === 'generated' ? 'bg-blue-100 text-blue-800' :
                        exam.status === 'prepared' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        <CheckCircle className="w-3 h-3" />
                        {exam.status}
                      </span>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    {isEditing ? (
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1f3c88] focus:border-transparent"
                      />
                    ) : (
                      <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-700">
                        {exam.description || 'No description provided'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Exam Configuration */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#1f3c88]" />
                  Exam Configuration
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Marks Per Set
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        name="totalMarks"
                        value={formData.totalMarks}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1f3c88] focus:border-transparent"
                      />
                    ) : (
                      <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900 font-semibold">
                        {exam.paperConfig?.totalMarksPerSet || exam.totalMarks}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (min)
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        name="duration"
                        value={formData.duration}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1f3c88] focus:border-transparent"
                      />
                    ) : (
                      <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900 font-semibold">
                        {exam.duration}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sets
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        name="numberOfSets"
                        value={formData.numberOfSets}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1f3c88] focus:border-transparent"
                      />
                    ) : (
                      <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900 font-semibold">
                        {exam.numberOfSets || 1}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Attempts
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        name="attemptsAllowed"
                        value={formData.attemptsAllowed}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1f3c88] focus:border-transparent"
                      />
                    ) : (
                      <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900 font-semibold">
                        {exam.attemptsAllowed || 1}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* PHASE 6.3.11: Paper Configuration Display */}
              {exam.paperConfig && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#1f3c88]" />
                    Paper Configuration
                    <span className="text-xs font-normal text-blue-600 ml-2">(Teacher-Specified)</span>
                  </h3>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Subject
                        </label>
                        <p className="px-3 py-2 bg-white rounded-lg text-gray-900 font-semibold">
                          {exam.paperConfig.subject}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Difficulty Level
                        </label>
                        <p className="px-3 py-2 bg-white rounded-lg text-gray-900 font-semibold capitalize">
                          {exam.paperConfig.difficulty}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Questions Per Set
                        </label>
                        <p className="px-3 py-2 bg-white rounded-lg text-gray-900 font-semibold">
                          {exam.paperConfig.questionsPerSet}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Total Marks Per Set
                        </label>
                        <p className="px-3 py-2 bg-white rounded-lg text-gray-900 font-semibold">
                          {exam.paperConfig.totalMarksPerSet}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Marks Distribution
                        </label>
                        <p className="px-3 py-2 bg-white rounded-lg text-gray-900 font-semibold">
                          {exam.paperConfig.marksMode === 'auto' ? 'Auto (Equal)' : 'Manual (Preserved)'}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Marks Per Question
                        </label>
                        <p className="px-3 py-2 bg-white rounded-lg text-gray-900 font-semibold">
                          {exam.paperConfig.marksMode === 'auto' 
                            ? `~${Math.floor(exam.paperConfig.totalMarksPerSet / exam.paperConfig.questionsPerSet)}` 
                            : 'Variable'}
                        </p>
                      </div>

                      {exam.paperConfig.instructions && (
                        <div className="md:col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Instructions
                          </label>
                          <p className="px-3 py-2 bg-white rounded-lg text-gray-700">
                            {exam.paperConfig.instructions}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3 text-xs text-blue-700 bg-blue-100 rounded px-3 py-2">
                      ✓ All values teacher-specified • No default values used • AI strictly follows this configuration
                    </div>
                  </div>
                </div>
              )}

              {/* Schedule */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#1f3c88]" />
                  Schedule
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    {isEditing ? (
                      <input
                        type="datetime-local"
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1f3c88] focus:border-transparent"
                      />
                    ) : (
                      <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                        {exam.startTime ? new Date(exam.startTime).toLocaleString() : 'Not set'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                    {isEditing ? (
                      <input
                        type="datetime-local"
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1f3c88] focus:border-transparent"
                      />
                    ) : (
                      <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                        {exam.endTime ? new Date(exam.endTime).toLocaleString() : 'Not set'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Generation Stats */}
              {(exam.generatedSets?.length > 0 || exam.studentPapers?.length > 0) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#1f3c88]" />
                    Generation Stats
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-600 mb-1">Question Sets</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {exam.generatedSets?.length || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-600 mb-1">Student Papers</p>
                      <p className="text-2xl font-bold text-green-900">
                        {exam.studentPapers?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No exam data available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div>
            {canEdit && !isEditing && (
              <p className="text-sm text-gray-600">
                This exam can be edited (Status: {exam?.status})
              </p>
            )}
            {!canEdit && exam && (
              <p className="text-sm text-amber-600">
                Exam cannot be edited once prepared/generated
              </p>
            )}
          </div>
          
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    // Reset form data
                    setFormData({
                      title: exam.title || '',
                      description: exam.description || '',
                      totalMarks: exam.totalMarks || '',
                      duration: exam.duration || '',
                      startTime: exam.startTime ? new Date(exam.startTime).toISOString().slice(0, 16) : '',
                      endTime: exam.endTime ? new Date(exam.endTime).toISOString().slice(0, 16) : '',
                      numberOfSets: exam.numberOfSets || 1,
                      attemptsAllowed: exam.attemptsAllowed || 1
                    });
                  }}
                  disabled={saving}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-[#1f3c88] text-white rounded-lg hover:bg-[#152a5e] transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                {canEdit && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-[#1f3c88] text-white rounded-lg hover:bg-[#152a5e] transition-colors flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Exam
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
