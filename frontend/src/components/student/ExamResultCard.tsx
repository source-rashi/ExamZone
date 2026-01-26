/**
 * PHASE 9.3 - Exam Result Display Card
 * Enhanced result presentation with visual feedback
 */

import React from 'react';
import { theme } from '../../styles/theme';
import { Card, Badge } from '../ui';
import {
  Trophy,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Target,
  Star,
} from 'lucide-react';

export interface ExamResultCardProps {
  result: {
    score: number;
    totalMarks: number;
    percentage: number;
    grade: string;
    integrityScore?: number;
    timeTaken?: number; // in minutes
    submittedAt: string;
    exam: {
      title: string;
      duration: number;
    };
  };
  showDetails?: boolean;
}

export const ExamResultCard: React.FC<ExamResultCardProps> = ({
  result,
  showDetails = true,
}) => {
  const { score, totalMarks, percentage, grade, integrityScore, timeTaken, exam } = result;

  // Score color coding
  const getScoreColor = (pct: number) => {
    if (pct >= 90) return theme.colors.success[600];
    if (pct >= 75) return theme.colors.primary[600];
    if (pct >= 60) return theme.colors.warning[500];
    if (pct >= 40) return theme.colors.warning[600];
    return theme.colors.danger[600];
  };

  // Grade styling
  const getGradeBadgeVariant = (grade: string): 'success' | 'primary' | 'warning' | 'danger' | 'neutral' => {
    if (grade.startsWith('A')) return 'success';
    if (grade.startsWith('B')) return 'primary';
    if (grade.startsWith('C')) return 'warning';
    if (grade.startsWith('D')) return 'danger';
    return 'neutral';
  };

  // Integrity badge
  const getIntegrityStatus = (score?: number) => {
    if (!score) return null;
    if (score >= 90) return { label: 'Excellent', variant: 'success' as const, icon: <ShieldCheck size={16} /> };
    if (score >= 75) return { label: 'Good', variant: 'primary' as const, icon: <ShieldCheck size={16} /> };
    if (score >= 60) return { label: 'Fair', variant: 'warning' as const, icon: <AlertTriangle size={16} /> };
    return { label: 'Review Required', variant: 'danger' as const, icon: <AlertTriangle size={16} /> };
  };

  const integrityStatus = getIntegrityStatus(integrityScore);
  const scoreColor = getScoreColor(percentage);

  // Performance message
  const getPerformanceMessage = (pct: number) => {
    if (pct >= 90) return 'Outstanding Performance!';
    if (pct >= 75) return 'Excellent Work!';
    if (pct >= 60) return 'Good Job!';
    if (pct >= 40) return 'Keep Practicing!';
    return 'Need More Preparation';
  };

  return (
    <Card variant="elevated" padding={6}>
      <div>
        {/* Header with Trophy */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing[3],
          marginBottom: theme.spacing[6],
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: theme.borderRadius.full,
            backgroundColor: percentage >= 60 ? theme.colors.success[50] : theme.colors.neutral[100],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Trophy size={24} style={{ color: scoreColor }} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing[1],
            }}>
              {exam.title}
            </h3>
            <p style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
            }}>
              {getPerformanceMessage(percentage)}
            </p>
          </div>
        </div>

        {/* Score Display - Large and Prominent */}
        <div style={{
          textAlign: 'center',
          padding: theme.spacing[8],
          backgroundColor: theme.colors.background.secondary,
          borderRadius: theme.borderRadius.xl,
          marginBottom: theme.spacing[6],
          border: `2px solid ${scoreColor}15`,
        }}>
          <div style={{
            fontSize: '4rem',
            fontWeight: theme.typography.fontWeight.bold,
            color: scoreColor,
            lineHeight: 1,
            marginBottom: theme.spacing[2],
          }}>
            {percentage.toFixed(1)}%
          </div>
          <div style={{
            fontSize: theme.typography.fontSize.xl,
            color: theme.colors.text.secondary,
            marginBottom: theme.spacing[3],
          }}>
            {score} / {totalMarks} marks
          </div>
          <Badge variant={getGradeBadgeVariant(grade)} size="lg">
            Grade: {grade}
          </Badge>
        </div>

        {showDetails && (
          <>
            {/* Details Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: integrityScore ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
              gap: theme.spacing[4],
              marginBottom: theme.spacing[5],
            }}>
              {/* Time Taken */}
              {timeTaken !== undefined && (
                <div style={{
                  padding: theme.spacing[4],
                  backgroundColor: theme.colors.background.secondary,
                  borderRadius: theme.borderRadius.lg,
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing[2],
                    marginBottom: theme.spacing[2],
                  }}>
                    <Clock size={16} style={{ color: theme.colors.text.tertiary }} />
                    <span style={{
                      fontSize: theme.typography.fontSize.xs,
                      color: theme.colors.text.secondary,
                      textTransform: 'uppercase',
                      fontWeight: theme.typography.fontWeight.medium,
                    }}>
                      Time Taken
                    </span>
                  </div>
                  <p style={{
                    fontSize: theme.typography.fontSize.lg,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.text.primary,
                  }}>
                    {Math.floor(timeTaken)} min
                  </p>
                  <p style={{
                    fontSize: theme.typography.fontSize.xs,
                    color: theme.colors.text.tertiary,
                    marginTop: theme.spacing[1],
                  }}>
                    of {exam.duration} min
                  </p>
                </div>
              )}

              {/* Accuracy */}
              <div style={{
                padding: theme.spacing[4],
                backgroundColor: theme.colors.background.secondary,
                borderRadius: theme.borderRadius.lg,
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing[2],
                  marginBottom: theme.spacing[2],
                }}>
                  <Target size={16} style={{ color: theme.colors.text.tertiary }} />
                  <span style={{
                    fontSize: theme.typography.fontSize.xs,
                    color: theme.colors.text.secondary,
                    textTransform: 'uppercase',
                    fontWeight: theme.typography.fontWeight.medium,
                  }}>
                    Accuracy
                  </span>
                </div>
                <p style={{
                  fontSize: theme.typography.fontSize.lg,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: scoreColor,
                }}>
                  {percentage.toFixed(1)}%
                </p>
                <p style={{
                  fontSize: theme.typography.fontSize.xs,
                  color: theme.colors.text.tertiary,
                  marginTop: theme.spacing[1],
                }}>
                  {score} correct
                </p>
              </div>

              {/* Integrity Score */}
              {integrityScore !== undefined && integrityStatus && (
                <div style={{
                  padding: theme.spacing[4],
                  backgroundColor: theme.colors.background.secondary,
                  borderRadius: theme.borderRadius.lg,
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing[2],
                    marginBottom: theme.spacing[2],
                  }}>
                    {integrityStatus.icon}
                    <span style={{
                      fontSize: theme.typography.fontSize.xs,
                      color: theme.colors.text.secondary,
                      textTransform: 'uppercase',
                      fontWeight: theme.typography.fontWeight.medium,
                    }}>
                      Integrity
                    </span>
                  </div>
                  <p style={{
                    fontSize: theme.typography.fontSize.lg,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.text.primary,
                  }}>
                    {integrityScore.toFixed(0)}%
                  </p>
                  <div style={{ marginTop: theme.spacing[1] }}>
                    <Badge
                      variant={integrityStatus.variant}
                      size="sm"
                    >
                      {integrityStatus.label}
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            {/* Performance Insights */}
            <div style={{
              padding: theme.spacing[4],
              backgroundColor: percentage >= 60 ? theme.colors.success[50] : theme.colors.warning[50],
              borderRadius: theme.borderRadius.lg,
              border: `1px solid ${percentage >= 60 ? theme.colors.success[200] : theme.colors.warning[200]}`,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing[2],
                marginBottom: theme.spacing[2],
              }}>
                {percentage >= 60 ? (
                  <Star size={16} style={{ color: theme.colors.success[600] }} />
                ) : (
                  <TrendingUp size={16} style={{ color: theme.colors.warning[600] }} />
                )}
                <span style={{
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: percentage >= 60 ? theme.colors.success[800] : theme.colors.warning[800],
                }}>
                  Performance Insight
                </span>
              </div>
              <p style={{
                fontSize: theme.typography.fontSize.sm,
                color: percentage >= 60 ? theme.colors.success[700] : theme.colors.warning[700],
                lineHeight: theme.typography.lineHeight.relaxed,
              }}>
                {percentage >= 90
                  ? 'Exceptional! You have mastered this topic. Keep up the excellent work!'
                  : percentage >= 75
                  ? 'Great job! You have a strong understanding of the material.'
                  : percentage >= 60
                  ? 'Good effort! Review areas where you lost marks to improve further.'
                  : percentage >= 40
                  ? 'You are making progress. Focus on understanding key concepts better.'
                  : 'This topic needs more practice. Review your notes and try sample problems.'}
              </p>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};
