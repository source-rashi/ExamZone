/**
 * PHASE 9.4 - Question Palette Component
 * Visual navigation for all exam questions with status indicators
 */

import React from 'react';
import { theme } from '../../styles/theme';
import { Card } from '../ui';
import { CheckCircle, Circle, Flag } from 'lucide-react';

export interface QuestionStatus {
  questionId: string;
  questionNumber: number;
  answered: boolean;
  flagged?: boolean;
  visited?: boolean;
}

export interface QuestionPaletteProps {
  questions: QuestionStatus[];
  currentQuestion: number;
  onQuestionSelect: (index: number) => void;
  totalQuestions: number;
}

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({
  questions,
  currentQuestion,
  onQuestionSelect,
  totalQuestions,
}) => {
  const answeredCount = questions.filter(q => q.answered).length;
  const unansweredCount = totalQuestions - answeredCount;
  const flaggedCount = questions.filter(q => q.flagged).length;

  const getQuestionStyle = (question: QuestionStatus, index: number) => {
    const isCurrentQuestion = index === currentQuestion;
    const baseStyle = {
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.borderRadius.md,
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      cursor: 'pointer',
      transition: `all ${theme.transitions.fast}`,
      border: '2px solid transparent',
      position: 'relative' as const,
    };

    if (isCurrentQuestion) {
      return {
        ...baseStyle,
        backgroundColor: theme.colors.primary[500],
        color: 'white',
        border: `2px solid ${theme.colors.primary[600]}`,
        boxShadow: theme.shadows.md,
      };
    }

    if (question.answered) {
      return {
        ...baseStyle,
        backgroundColor: theme.colors.success[100],
        color: theme.colors.success[700],
        border: `2px solid ${theme.colors.success[300]}`,
      };
    }

    if (question.visited) {
      return {
        ...baseStyle,
        backgroundColor: theme.colors.warning[100],
        color: theme.colors.warning[700],
        border: `2px solid ${theme.colors.warning[300]}`,
      };
    }

    return {
      ...baseStyle,
      backgroundColor: theme.colors.neutral[100],
      color: theme.colors.text.secondary,
      border: `2px solid ${theme.colors.neutral[300]}`,
    };
  };

  const getQuestionHoverStyle = (question: QuestionStatus, index: number) => {
    if (index === currentQuestion) return {};

    if (question.answered) {
      return {
        backgroundColor: theme.colors.success[200],
        transform: 'scale(1.05)',
      };
    }

    return {
      backgroundColor: theme.colors.neutral[200],
      transform: 'scale(1.05)',
    };
  };

  return (
    <Card variant="elevated" padding={5}>
      <div>
        {/* Header */}
        <h3 style={{
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing[4],
        }}>
          Question Palette
        </h3>

        {/* Status Summary */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing[2],
          marginBottom: theme.spacing[5],
          padding: theme.spacing[3],
          backgroundColor: theme.colors.background.secondary,
          borderRadius: theme.borderRadius.md,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
              <CheckCircle size={16} style={{ color: theme.colors.success[500] }} />
              <span style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.text.secondary,
              }}>
                Answered
              </span>
            </div>
            <span style={{
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.success[600],
            }}>
              {answeredCount}
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
              <Circle size={16} style={{ color: theme.colors.neutral[400] }} />
              <span style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.text.secondary,
              }}>
                Unanswered
              </span>
            </div>
            <span style={{
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.warning[600],
            }}>
              {unansweredCount}
            </span>
          </div>

          {flaggedCount > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
                <Flag size={16} style={{ color: theme.colors.danger[500] }} />
                <span style={{
                  fontSize: theme.typography.fontSize.xs,
                  color: theme.colors.text.secondary,
                }}>
                  Flagged
                </span>
              </div>
              <span style={{
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.danger[600],
              }}>
                {flaggedCount}
              </span>
            </div>
          )}
        </div>

        {/* Question Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: theme.spacing[2],
        }}>
          {questions.map((question, index) => (
            <div key={question.questionId} style={{ position: 'relative' }}>
              <button
                onClick={() => onQuestionSelect(index)}
                style={getQuestionStyle(question, index)}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, getQuestionHoverStyle(question, index));
                }}
                onMouseLeave={(e) => {
                  Object.assign(e.currentTarget.style, getQuestionStyle(question, index));
                }}
              >
                {question.questionNumber}
              </button>
              {question.flagged && (
                <div style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '12px',
                  height: '12px',
                  borderRadius: theme.borderRadius.full,
                  backgroundColor: theme.colors.danger[500],
                  border: '2px solid white',
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{
          marginTop: theme.spacing[5],
          paddingTop: theme.spacing[4],
          borderTop: `1px solid ${theme.colors.border.light}`,
        }}>
          <p style={{
            fontSize: theme.typography.fontSize.xs,
            color: theme.colors.text.tertiary,
            marginBottom: theme.spacing[3],
            textTransform: 'uppercase',
            fontWeight: theme.typography.fontWeight.medium,
            letterSpacing: '0.5px',
          }}>
            Legend
          </p>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing[2],
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing[2],
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: theme.borderRadius.sm,
                backgroundColor: theme.colors.success[100],
                border: `2px solid ${theme.colors.success[300]}`,
              }} />
              <span style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.text.secondary,
              }}>
                Answered
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing[2],
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: theme.borderRadius.sm,
                backgroundColor: theme.colors.neutral[100],
                border: `2px solid ${theme.colors.neutral[300]}`,
              }} />
              <span style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.text.secondary,
              }}>
                Not Visited
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing[2],
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: theme.borderRadius.sm,
                backgroundColor: theme.colors.primary[500],
              }} />
              <span style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.text.secondary,
              }}>
                Current
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
