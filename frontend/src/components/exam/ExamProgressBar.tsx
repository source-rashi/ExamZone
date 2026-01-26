/**
 * PHASE 9.4 - Exam Progress Bar
 * Visual progress indicator for exam completion
 */

import React from 'react';
import { theme } from '../../styles/theme';
import { CheckCircle, Circle, AlertCircle } from 'lucide-react';

export interface ExamProgressBarProps {
  totalQuestions: number;
  answeredQuestions: number;
  currentQuestion: number;
  showStats?: boolean;
}

export const ExamProgressBar: React.FC<ExamProgressBarProps> = ({
  totalQuestions,
  answeredQuestions,
  currentQuestion,
  showStats = true,
}) => {
  const completionPercentage = (answeredQuestions / totalQuestions) * 100;
  const unansweredQuestions = totalQuestions - answeredQuestions;

  return (
    <div style={{
      padding: theme.spacing[5],
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.borderRadius.lg,
      border: `1px solid ${theme.colors.border.light}`,
    }}>
      {/* Progress Bar */}
      <div style={{ marginBottom: showStats ? theme.spacing[4] : 0 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing[2],
        }}>
          <span style={{
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.medium,
            color: theme.colors.text.primary,
          }}>
            Exam Progress
          </span>
          <span style={{
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.semibold,
            color: completionPercentage === 100 ? theme.colors.success[600] : theme.colors.primary[600],
          }}>
            {completionPercentage.toFixed(0)}%
          </span>
        </div>
        
        <div style={{
          width: '100%',
          height: '8px',
          backgroundColor: theme.colors.neutral[200],
          borderRadius: theme.borderRadius.full,
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${completionPercentage}%`,
            height: '100%',
            backgroundColor: completionPercentage === 100 
              ? theme.colors.success[500] 
              : completionPercentage >= 75 
              ? theme.colors.primary[500]
              : completionPercentage >= 50
              ? theme.colors.warning[500]
              : theme.colors.danger[500],
            transition: `all ${theme.transitions.base}`,
            borderRadius: theme.borderRadius.full,
          }} />
        </div>
      </div>

      {/* Stats */}
      {showStats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: theme.spacing[4],
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing[2],
          }}>
            <CheckCircle size={16} style={{ color: theme.colors.success[500] }} />
            <div>
              <p style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.text.tertiary,
              }}>
                Answered
              </p>
              <p style={{
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.primary,
              }}>
                {answeredQuestions}
              </p>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing[2],
          }}>
            <Circle size={16} style={{ color: theme.colors.neutral[400] }} />
            <div>
              <p style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.text.tertiary,
              }}>
                Remaining
              </p>
              <p style={{
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.primary,
              }}>
                {unansweredQuestions}
              </p>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing[2],
          }}>
            <AlertCircle size={16} style={{ color: theme.colors.primary[500] }} />
            <div>
              <p style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.text.tertiary,
              }}>
                Current
              </p>
              <p style={{
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.primary,
              }}>
                #{currentQuestion + 1}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
