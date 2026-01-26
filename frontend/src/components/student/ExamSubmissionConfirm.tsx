/**
 * PHASE 9.3 - Exam Submission Confirmation Modal
 * Final review before submitting exam
 */

import React from 'react';
import { theme } from '../../styles/theme';
import { Card, Button, Badge } from '../ui';
import {
  AlertTriangle,
  CheckCircle,
  Circle,
  Clock,
  FileText,
  Send,
  X,
} from 'lucide-react';

export interface SubmissionSummary {
  totalQuestions: number;
  attemptedQuestions: number;
  unattemptedQuestions: number;
  timeRemaining: number; // in seconds
  examTitle: string;
  autoSubmit?: boolean;
}

export interface ExamSubmissionConfirmProps {
  summary: SubmissionSummary;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ExamSubmissionConfirm: React.FC<ExamSubmissionConfirmProps> = ({
  summary,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const {
    totalQuestions,
    attemptedQuestions,
    unattemptedQuestions,
    timeRemaining,
    examTitle,
    autoSubmit = false,
  } = summary;

  const completionPercentage = (attemptedQuestions / totalQuestions) * 100;
  const hasUnattempted = unattemptedQuestions > 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: theme.zIndex.modal,
      padding: theme.spacing[4],
    }}>
      <Card
        variant="elevated"
        padding={0}
        style={{
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        <div>
          {/* Header */}
          <div style={{
            padding: theme.spacing[6],
            borderBottom: `1px solid ${theme.colors.border.light}`,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: theme.spacing[2],
            }}>
              <h2 style={{
                fontSize: theme.typography.fontSize['2xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text.primary,
              }}>
                {autoSubmit ? 'Time Up!' : 'Confirm Submission'}
              </h2>
              {!autoSubmit && (
                <button
                  onClick={onCancel}
                  disabled={loading}
                  style={{
                    padding: theme.spacing[2],
                    background: 'none',
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    color: theme.colors.text.secondary,
                    transition: `color ${theme.transitions.fast}`,
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) e.currentTarget.style.color = theme.colors.text.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = theme.colors.text.secondary;
                  }}
                >
                  <X size={24} />
                </button>
              )}
            </div>
            <p style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
            }}>
              {examTitle}
            </p>
          </div>

          {/* Content */}
          <div style={{ padding: theme.spacing[6] }}>
            {/* Auto-submit warning */}
            {autoSubmit && (
              <div style={{
                padding: theme.spacing[4],
                backgroundColor: theme.colors.warning[50],
                border: `1px solid ${theme.colors.warning[200]}`,
                borderRadius: theme.borderRadius.lg,
                marginBottom: theme.spacing[5],
              }}>
                <div style={{
                  display: 'flex',
                  gap: theme.spacing[3],
                }}>
                  <AlertTriangle size={20} style={{ color: theme.colors.warning[600], flexShrink: 0 }} />
                  <div>
                    <p style={{
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.medium,
                      color: theme.colors.warning[800],
                      marginBottom: theme.spacing[1],
                    }}>
                      Exam Time Expired
                    </p>
                    <p style={{
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.warning[700],
                      lineHeight: theme.typography.lineHeight.relaxed,
                    }}>
                      Your exam will be automatically submitted. Please review your answers one last time.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Unattempted warning */}
            {hasUnattempted && !autoSubmit && (
              <div style={{
                padding: theme.spacing[4],
                backgroundColor: theme.colors.warning[50],
                border: `1px solid ${theme.colors.warning[200]}`,
                borderRadius: theme.borderRadius.lg,
                marginBottom: theme.spacing[5],
              }}>
                <div style={{
                  display: 'flex',
                  gap: theme.spacing[3],
                }}>
                  <AlertTriangle size={20} style={{ color: theme.colors.warning[600], flexShrink: 0 }} />
                  <div>
                    <p style={{
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.medium,
                      color: theme.colors.warning[800],
                      marginBottom: theme.spacing[1],
                    }}>
                      You have unattempted questions
                    </p>
                    <p style={{
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.warning[700],
                    }}>
                      {unattemptedQuestions} question{unattemptedQuestions !== 1 ? 's' : ''} left unanswered. You can go back and attempt them.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Summary Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: theme.spacing[4],
              marginBottom: theme.spacing[5],
            }}>
              <div style={{
                padding: theme.spacing[4],
                backgroundColor: theme.colors.background.secondary,
                borderRadius: theme.borderRadius.lg,
                border: `1px solid ${theme.colors.border.light}`,
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing[2],
                  marginBottom: theme.spacing[2],
                }}>
                  <FileText size={16} style={{ color: theme.colors.text.tertiary }} />
                  <span style={{
                    fontSize: theme.typography.fontSize.xs,
                    color: theme.colors.text.secondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>
                    Total Questions
                  </span>
                </div>
                <p style={{
                  fontSize: theme.typography.fontSize['2xl'],
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.text.primary,
                }}>
                  {totalQuestions}
                </p>
              </div>

              <div style={{
                padding: theme.spacing[4],
                backgroundColor: theme.colors.background.secondary,
                borderRadius: theme.borderRadius.lg,
                border: `1px solid ${theme.colors.border.light}`,
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
                    letterSpacing: '0.5px',
                  }}>
                    Time Remaining
                  </span>
                </div>
                <p style={{
                  fontSize: theme.typography.fontSize['2xl'],
                  fontWeight: theme.typography.fontWeight.bold,
                  color: timeRemaining < 60 ? theme.colors.danger[600] : theme.colors.text.primary,
                }}>
                  {formatTime(timeRemaining)}
                </p>
              </div>
            </div>

            {/* Question Status */}
            <div style={{
              padding: theme.spacing[5],
              backgroundColor: theme.colors.background.secondary,
              borderRadius: theme.borderRadius.lg,
              marginBottom: theme.spacing[5],
            }}>
              <h3 style={{
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing[4],
              }}>
                Answer Summary
              </h3>

              {/* Progress Bar */}
              <div style={{
                marginBottom: theme.spacing[4],
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: theme.spacing[2],
                }}>
                  <span style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.text.secondary,
                  }}>
                    Completion
                  </span>
                  <span style={{
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.text.primary,
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
                    backgroundColor: completionPercentage === 100 ? theme.colors.success[500] : theme.colors.primary[500],
                    transition: `width ${theme.transitions.base}`,
                  }} />
                </div>
              </div>

              {/* Status List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
                    <CheckCircle size={18} style={{ color: theme.colors.success[500] }} />
                    <span style={{
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.text.secondary,
                    }}>
                      Attempted
                    </span>
                  </div>
                  <Badge variant="success">{attemptedQuestions}</Badge>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
                    <Circle size={18} style={{ color: theme.colors.neutral[400] }} />
                    <span style={{
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.text.secondary,
                    }}>
                      Unattempted
                    </span>
                  </div>
                  <Badge variant={hasUnattempted ? 'warning' : 'neutral'}>{unattemptedQuestions}</Badge>
                </div>
              </div>
            </div>

            {/* Final Warning */}
            {!autoSubmit && (
              <div style={{
                padding: theme.spacing[4],
                backgroundColor: theme.colors.primary[50],
                border: `1px solid ${theme.colors.primary[200]}`,
                borderRadius: theme.borderRadius.lg,
                marginBottom: theme.spacing[5],
              }}>
                <p style={{
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.primary[800],
                  lineHeight: theme.typography.lineHeight.relaxed,
                  textAlign: 'center',
                }}>
                  <strong>Once submitted, you cannot change your answers.</strong>
                  {hasUnattempted && ' Make sure you have attempted all questions.'}
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div style={{
            padding: theme.spacing[6],
            borderTop: `1px solid ${theme.colors.border.light}`,
            display: 'flex',
            gap: theme.spacing[3],
          }}>
            {!autoSubmit && (
              <Button
                variant="outline"
                fullWidth
                onClick={onCancel}
                disabled={loading}
              >
                Go Back
              </Button>
            )}
            <Button
              variant={hasUnattempted ? 'danger' : 'primary'}
              fullWidth
              onClick={onConfirm}
              loading={loading}
              icon={<Send size={18} />}
            >
              {autoSubmit ? 'Submit Now' : 'Submit Exam'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
