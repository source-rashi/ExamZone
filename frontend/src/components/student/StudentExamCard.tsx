/**
 * PHASE 9.3 - Student Exam Card
 * Enhanced exam display with status indicators
 */

import React from 'react';
import { theme } from '../../styles/theme';
import { Card, Badge, Button } from '../ui';
import {
  Clock,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle,
  PlayCircle,
  Ban,
} from 'lucide-react';

export interface StudentExamCardProps {
  exam: {
    _id: string;
    title: string;
    description?: string;
    classId?: {
      name?: string;
      title?: string;
    };
    status: 'draft' | 'generated' | 'published' | 'running' | 'closed' | 'ended';
    startTime: string;
    endTime: string;
    duration: number;
    totalMarks: number;
    attemptsAllowed: number;
    studentAttemptCount?: number;
    attemptsRemaining?: number;
    attemptsExhausted?: boolean;
  };
  onStart?: () => void;
  onResume?: () => void;
  hasActiveAttempt?: boolean;
  loading?: boolean;
}

export const StudentExamCard: React.FC<StudentExamCardProps> = ({
  exam,
  onStart,
  onResume,
  hasActiveAttempt = false,
  loading = false,
}) => {
  const now = new Date();
  const startTime = new Date(exam.startTime);
  const endTime = new Date(exam.endTime);
  
  const isUpcoming = now < startTime;
  const isActive = now >= startTime && now <= endTime;
  const isEnded = now > endTime;

  const getStatusBadge = () => {
    if (exam.attemptsExhausted) {
      return <Badge variant="neutral">Attempts Exhausted</Badge>;
    }
    if (hasActiveAttempt) {
      return <Badge variant="warning" dot>In Progress</Badge>;
    }
    if (isEnded) {
      return <Badge variant="neutral">Ended</Badge>;
    }
    if (isActive) {
      return <Badge variant="success" dot>Active Now</Badge>;
    }
    if (isUpcoming) {
      return <Badge variant="primary">Upcoming</Badge>;
    }
    return <Badge variant="neutral">{exam.status}</Badge>;
  };

  const getTimeInfo = () => {
    const formatDateTime = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    if (isUpcoming) {
      const hoursUntil = Math.floor((startTime.getTime() - now.getTime()) / (1000 * 60 * 60));
      if (hoursUntil < 24) {
        return {
          label: 'Starts in',
          value: `${hoursUntil}h`,
          color: theme.colors.primary[600],
        };
      }
      return {
        label: 'Starts',
        value: formatDateTime(startTime),
        color: theme.colors.text.secondary,
      };
    }

    if (isActive) {
      const hoursLeft = Math.floor((endTime.getTime() - now.getTime()) / (1000 * 60 * 60));
      return {
        label: 'Ends in',
        value: `${hoursLeft}h`,
        color: theme.colors.warning[600],
      };
    }

    return {
      label: 'Ended',
      value: formatDateTime(endTime),
      color: theme.colors.text.tertiary,
    };
  };

  const timeInfo = getTimeInfo();

  const canStartExam = isActive && !exam.attemptsExhausted && !hasActiveAttempt;
  const canResumeExam = hasActiveAttempt && isActive;

  return (
    <Card variant="elevated" padding={6} hover={canStartExam || canResumeExam}>
      <div>
        {/* Header */}
        <div style={{ marginBottom: theme.spacing[4] }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: theme.spacing[3],
            marginBottom: theme.spacing[2],
          }}>
            <div style={{ flex: 1 }}>
              <h3 style={{
                fontSize: theme.typography.fontSize.xl,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing[1],
              }}>
                {exam.title}
              </h3>
              {exam.classId && (
                <p style={{
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.text.secondary,
                }}>
                  {exam.classId.title || exam.classId.name}
                </p>
              )}
            </div>
            {getStatusBadge()}
          </div>

          {exam.description && (
            <p style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
              lineHeight: theme.typography.lineHeight.relaxed,
              marginTop: theme.spacing[2],
            }}>
              {exam.description}
            </p>
          )}
        </div>

        {/* Info Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: theme.spacing[4],
          padding: theme.spacing[4],
          backgroundColor: theme.colors.background.secondary,
          borderRadius: theme.borderRadius.lg,
          marginBottom: theme.spacing[4],
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2], marginBottom: theme.spacing[1] }}>
              <Clock size={14} style={{ color: theme.colors.text.tertiary }} />
              <span style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.text.secondary,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Duration
              </span>
            </div>
            <p style={{
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.text.primary,
            }}>
              {exam.duration} min
            </p>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2], marginBottom: theme.spacing[1] }}>
              <FileText size={14} style={{ color: theme.colors.text.tertiary }} />
              <span style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.text.secondary,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Marks
              </span>
            </div>
            <p style={{
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.text.primary,
            }}>
              {exam.totalMarks}
            </p>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2], marginBottom: theme.spacing[1] }}>
              <Calendar size={14} style={{ color: theme.colors.text.tertiary }} />
              <span style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.text.secondary,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                {timeInfo.label}
              </span>
            </div>
            <p style={{
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.semibold,
              color: timeInfo.color,
            }}>
              {timeInfo.value}
            </p>
          </div>

          {exam.attemptsAllowed > 1 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2], marginBottom: theme.spacing[1] }}>
                <AlertCircle size={14} style={{ color: theme.colors.text.tertiary }} />
                <span style={{
                  fontSize: theme.typography.fontSize.xs,
                  color: theme.colors.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  Attempts
                </span>
              </div>
              <p style={{
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.semibold,
                color: (exam.attemptsRemaining || 0) === 0 ? theme.colors.danger[600] : theme.colors.text.primary,
              }}>
                {exam.attemptsRemaining || 0} left
              </p>
            </div>
          )}
        </div>

        {/* Action Button */}
        {canResumeExam && onResume ? (
          <Button
            variant="secondary"
            fullWidth
            size="lg"
            onClick={onResume}
            loading={loading}
            icon={<PlayCircle size={20} />}
          >
            Resume Exam
          </Button>
        ) : canStartExam && onStart ? (
          <Button
            variant="primary"
            fullWidth
            size="lg"
            onClick={onStart}
            loading={loading}
            icon={<PlayCircle size={20} />}
          >
            Start Exam
          </Button>
        ) : exam.attemptsExhausted ? (
          <Button
            variant="ghost"
            fullWidth
            disabled
            icon={<Ban size={20} />}
          >
            No Attempts Remaining
          </Button>
        ) : isUpcoming ? (
          <Button
            variant="outline"
            fullWidth
            disabled
            icon={<Clock size={20} />}
          >
            Not Yet Available
          </Button>
        ) : isEnded ? (
          <Button
            variant="outline"
            fullWidth
            disabled
            icon={<CheckCircle size={20} />}
          >
            Exam Ended
          </Button>
        ) : null}
      </div>
    </Card>
  );
};
