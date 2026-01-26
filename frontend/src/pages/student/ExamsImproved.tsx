/**
 * PHASE 9.5 - Improved Student Exams Page
 * With proper error and empty states
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { theme } from '../../styles/theme';
import { EmptyState, Loading } from '../../components/ui';
import { ErrorDisplay } from '../../components/error';
import { StudentExamCard } from '../../components/student';
import { studentAPI } from '../../api/student.api';
import { 
  GraduationCap, 
  Calendar,
  Clock,
  CheckCircle,
} from 'lucide-react';

export default function StudentExamsImproved() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeAttempts, setActiveAttempts] = useState<Record<string, any>>({});
  const [startingExam, setStartingExam] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v2';
      const res = await fetch(`${baseURL}/student/exams/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('UNAUTHORIZED');
        }
        if (res.status === 404) {
          throw new Error('NOT_FOUND');
        }
        if (res.status >= 500) {
          throw new Error('SERVER_ERROR');
        }
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();
      const examList = Array.isArray(data) ? data : (data.exams || []);
      setExams(examList);
      
      // Check for active attempts
      for (const exam of examList) {
        try {
          const attempt = await studentAPI.getActiveAttempt(exam._id);
          if (attempt) {
            setActiveAttempts(prev => ({ ...prev, [exam._id]: attempt }));
          }
        } catch (err) {
          // No active attempt
        }
      }
    } catch (err: any) {
      console.error('[Exams] Load error:', err);
      setError(err.message || 'Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    setRetrying(true);
    await loadExams();
    setRetrying(false);
  };

  const handleStartExam = async (examId: string) => {
    try {
      setStartingExam(examId);
      
      // Navigate to exam attempt page which will handle the start
      navigate(`/student/exam/${examId}/attempt`);
      
    } catch (err: any) {
      console.error('[Exams] Start exam error:', err);
      alert(err.response?.data?.error || err.message || 'Failed to start exam');
      setStartingExam(null);
    }
  };

  const handleResumeExam = async (examId: string) => {
    try {
      // Navigate to exam attempt page to resume
      navigate(`/student/exam/${examId}/attempt`);
    } catch (err: any) {
      console.error('[Exams] Resume exam error:', err);
      alert(err.message || 'Failed to resume exam');
    }
  };

  // Categorize exams
  const now = new Date();
  const upcomingExams = exams.filter((exam: any) => new Date(exam.startTime) > now);
  const activeExams = exams.filter((exam: any) => {
    const start = new Date(exam.startTime);
    const end = new Date(exam.endTime);
    return now >= start && now <= end;
  });
  const pastExams = exams.filter((exam: any) => new Date(exam.endTime) < now);

  // Loading state
  if (loading) {
    return (
      <div style={{ padding: theme.spacing[8], maxWidth: '1400px', margin: '0 auto' }}>
        <Loading.Overlay message="Loading exams..." />
      </div>
    );
  }

  // Error state
  if (error) {
    const getErrorType = () => {
      if (error === 'UNAUTHORIZED') return 'unauthorized';
      if (error === 'NOT_FOUND') return 'notfound';
      if (error === 'SERVER_ERROR' || error.includes('Failed to fetch')) return 'network';
      return 'general';
    };

    return (
      <div style={{ padding: theme.spacing[8], maxWidth: '1400px', margin: '0 auto' }}>
        <ErrorDisplay
          type={getErrorType()}
          message={error === 'UNAUTHORIZED' ? 'Please log in to view your exams.' : undefined}
          onRetry={handleRetry}
          retrying={retrying}
        />
      </div>
    );
  }

  // Empty state - No exams at all
  if (exams.length === 0) {
    return (
      <div style={{ padding: theme.spacing[8], maxWidth: '1400px', margin: '0 auto' }}>
        <EmptyState
          icon={<GraduationCap size={64} />}
          title="No Exams Yet"
          description="You don't have any exams scheduled. Exams will appear here once your teachers publish them."
        />
      </div>
    );
  }

  return (
    <div style={{ padding: theme.spacing[8], maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: theme.spacing[8] }}>
        <h1 style={{
          fontSize: theme.typography.fontSize['3xl'],
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing[2],
        }}>
          My Exams
        </h1>
        <p style={{
          fontSize: theme.typography.fontSize.lg,
          color: theme.colors.text.secondary,
        }}>
          View and manage your scheduled exams
        </p>
      </div>

      {/* Active Exams */}
      {activeExams.length > 0 && (
        <div style={{ marginBottom: theme.spacing[10] }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing[3],
            marginBottom: theme.spacing[5],
          }}>
            <Clock size={24} style={{ color: theme.colors.success[600] }} />
            <h2 style={{
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text.primary,
            }}>
              Active Now
            </h2>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: theme.spacing[5],
          }}>
            {activeExams.map((exam: any) => (
              <StudentExamCard
                key={exam._id}
                exam={exam}
                onStart={() => handleStartExam(exam._id)}
                onResume={() => handleResumeExam(exam._id)}
                hasActiveAttempt={!!activeAttempts[exam._id]}
                loading={startingExam === exam._id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Exams */}
      {upcomingExams.length > 0 && (
        <div style={{ marginBottom: theme.spacing[10] }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing[3],
            marginBottom: theme.spacing[5],
          }}>
            <Calendar size={24} style={{ color: theme.colors.primary[600] }} />
            <h2 style={{
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text.primary,
            }}>
              Upcoming
            </h2>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: theme.spacing[5],
          }}>
            {upcomingExams.map((exam: any) => (
              <StudentExamCard
                key={exam._id}
                exam={exam}
              />
            ))}
          </div>
        </div>
      )}

      {/* Past Exams */}
      {pastExams.length > 0 && (
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing[3],
            marginBottom: theme.spacing[5],
          }}>
            <CheckCircle size={24} style={{ color: theme.colors.neutral[500] }} />
            <h2 style={{
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text.primary,
            }}>
              Completed
            </h2>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: theme.spacing[5],
          }}>
            {pastExams.map((exam: any) => (
              <StudentExamCard
                key={exam._id}
                exam={exam}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty states for each category */}
      {activeExams.length === 0 && upcomingExams.length === 0 && pastExams.length > 0 && (
        <div style={{ marginTop: theme.spacing[8] }}>
          <EmptyState
            icon={<Calendar size={48} />}
            title="No Active or Upcoming Exams"
            description="All your exams have been completed. New exams will appear here when scheduled."
          />
        </div>
      )}
    </div>
  );
}
