/**
 * PHASE 9.4 - Question Display Component
 * Enhanced readability and spacing for exam questions
 */

import React from 'react';
import { theme } from '../../styles/theme';
import { Card, Badge, Button } from '../ui';
import { Flag, FlagOff, BookOpen } from 'lucide-react';

export interface QuestionDisplayProps {
  question: {
    _id: string;
    type: 'mcq' | 'subjective' | 'true-false';
    text: string;
    marks: number;
    options?: string[];
    imageUrl?: string;
  };
  questionNumber: number;
  totalQuestions: number;
  answer?: string;
  onAnswerChange: (value: string) => void;
  flagged?: boolean;
  onToggleFlag?: () => void;
  readOnly?: boolean;
}

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  questionNumber,
  totalQuestions,
  answer,
  onAnswerChange,
  flagged = false,
  onToggleFlag,
  readOnly = false,
}) => {
  const renderQuestionType = () => {
    switch (question.type) {
      case 'mcq':
        return 'Multiple Choice';
      case 'true-false':
        return 'True/False';
      case 'subjective':
        return 'Subjective';
      default:
        return question.type;
    }
  };

  const renderAnswerInput = () => {
    if (readOnly) {
      return (
        <div style={{
          padding: theme.spacing[4],
          backgroundColor: theme.colors.background.secondary,
          borderRadius: theme.borderRadius.lg,
          border: `1px solid ${theme.colors.border.light}`,
        }}>
          <p style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.secondary,
            marginBottom: theme.spacing[2],
            fontWeight: theme.typography.fontWeight.medium,
          }}>
            Your Answer:
          </p>
          <p style={{
            fontSize: theme.typography.fontSize.base,
            color: theme.colors.text.primary,
            lineHeight: theme.typography.lineHeight.relaxed,
          }}>
            {answer || 'Not answered'}
          </p>
        </div>
      );
    }

    if (question.type === 'mcq') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
          {question.options?.map((option, index) => {
            const optionLabel = String.fromCharCode(65 + index); // A, B, C, D...
            const isSelected = answer === option;

            return (
              <label
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: theme.spacing[3],
                  padding: theme.spacing[4],
                  backgroundColor: isSelected ? theme.colors.primary[50] : theme.colors.background.secondary,
                  border: `2px solid ${isSelected ? theme.colors.primary[500] : theme.colors.border.light}`,
                  borderRadius: theme.borderRadius.lg,
                  cursor: 'pointer',
                  transition: `all ${theme.transitions.fast}`,
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = theme.colors.neutral[100];
                    e.currentTarget.style.borderColor = theme.colors.border.default;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = theme.colors.background.secondary;
                    e.currentTarget.style.borderColor = theme.colors.border.light;
                  }
                }}
              >
                <input
                  type="radio"
                  name={`question-${question._id}`}
                  value={option}
                  checked={isSelected}
                  onChange={(e) => onAnswerChange(e.target.value)}
                  style={{
                    width: '20px',
                    height: '20px',
                    marginTop: '2px',
                    cursor: 'pointer',
                    accentColor: theme.colors.primary[500],
                  }}
                />
                <div style={{ flex: 1 }}>
                  <span style={{
                    display: 'inline-block',
                    width: '28px',
                    height: '28px',
                    borderRadius: theme.borderRadius.full,
                    backgroundColor: isSelected ? theme.colors.primary[500] : theme.colors.neutral[200],
                    color: isSelected ? 'white' : theme.colors.text.secondary,
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.semibold,
                    textAlign: 'center',
                    lineHeight: '28px',
                    marginRight: theme.spacing[3],
                  }}>
                    {optionLabel}
                  </span>
                  <span style={{
                    fontSize: theme.typography.fontSize.base,
                    color: theme.colors.text.primary,
                    lineHeight: theme.typography.lineHeight.relaxed,
                  }}>
                    {option}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      );
    }

    if (question.type === 'true-false') {
      return (
        <div style={{ display: 'flex', gap: theme.spacing[4] }}>
          {['True', 'False'].map((option) => {
            const isSelected = answer === option;

            return (
              <label
                key={option}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: theme.spacing[3],
                  padding: theme.spacing[5],
                  backgroundColor: isSelected ? theme.colors.primary[50] : theme.colors.background.secondary,
                  border: `2px solid ${isSelected ? theme.colors.primary[500] : theme.colors.border.light}`,
                  borderRadius: theme.borderRadius.lg,
                  cursor: 'pointer',
                  transition: `all ${theme.transitions.fast}`,
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = theme.colors.neutral[100];
                    e.currentTarget.style.borderColor = theme.colors.border.default;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = theme.colors.background.secondary;
                    e.currentTarget.style.borderColor = theme.colors.border.light;
                  }
                }}
              >
                <input
                  type="radio"
                  name={`question-${question._id}`}
                  value={option}
                  checked={isSelected}
                  onChange={(e) => onAnswerChange(e.target.value)}
                  style={{
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                    accentColor: theme.colors.primary[500],
                  }}
                />
                <span style={{
                  fontSize: theme.typography.fontSize.lg,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: isSelected ? theme.colors.primary[700] : theme.colors.text.primary,
                }}>
                  {option}
                </span>
              </label>
            );
          })}
        </div>
      );
    }

    if (question.type === 'subjective') {
      return (
        <textarea
          value={answer || ''}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="Type your answer here..."
          rows={8}
          style={{
            width: '100%',
            padding: theme.spacing[4],
            fontSize: theme.typography.fontSize.base,
            lineHeight: theme.typography.lineHeight.relaxed,
            color: theme.colors.text.primary,
            backgroundColor: theme.colors.background.primary,
            border: `2px solid ${theme.colors.border.default}`,
            borderRadius: theme.borderRadius.lg,
            outline: 'none',
            resize: 'vertical',
            fontFamily: theme.typography.fontFamily.sans,
            transition: `border-color ${theme.transitions.fast}`,
          }}
          onFocus={(e) => {
            e.target.style.borderColor = theme.colors.primary[500];
          }}
          onBlur={(e) => {
            e.target.style.borderColor = theme.colors.border.default;
          }}
        />
      );
    }

    return null;
  };

  return (
    <Card variant="elevated" padding={0}>
      <div>
        {/* Question Header */}
        <div style={{
          padding: theme.spacing[6],
          borderBottom: `1px solid ${theme.colors.border.light}`,
          backgroundColor: theme.colors.background.secondary,
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: theme.spacing[4],
            marginBottom: theme.spacing[3],
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[3] }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: theme.borderRadius.full,
                backgroundColor: theme.colors.primary[500],
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.bold,
              }}>
                {questionNumber}
              </div>
              <div>
                <p style={{
                  fontSize: theme.typography.fontSize.xs,
                  color: theme.colors.text.tertiary,
                  textTransform: 'uppercase',
                  fontWeight: theme.typography.fontWeight.medium,
                  letterSpacing: '0.5px',
                }}>
                  Question {questionNumber} of {totalQuestions}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[3] }}>
              <Badge variant="primary">{renderQuestionType()}</Badge>
              <Badge variant="success">{question.marks} {question.marks === 1 ? 'mark' : 'marks'}</Badge>
              {onToggleFlag && !readOnly && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleFlag}
                  icon={flagged ? <FlagOff size={16} /> : <Flag size={16} />}
                  style={{
                    color: flagged ? theme.colors.danger[600] : theme.colors.text.secondary,
                  }}
                >
                  {flagged ? 'Unflag' : 'Flag'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div style={{ padding: theme.spacing[6] }}>
          {/* Question Text */}
          <div style={{
            marginBottom: theme.spacing[6],
            padding: theme.spacing[5],
            backgroundColor: theme.colors.background.secondary,
            borderLeft: `4px solid ${theme.colors.primary[500]}`,
            borderRadius: theme.borderRadius.md,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: theme.spacing[3],
              marginBottom: theme.spacing[3],
            }}>
              <BookOpen size={20} style={{ color: theme.colors.primary[500], flexShrink: 0, marginTop: '2px' }} />
              <p style={{
                fontSize: theme.typography.fontSize.lg,
                color: theme.colors.text.primary,
                lineHeight: theme.typography.lineHeight.relaxed,
                fontWeight: theme.typography.fontWeight.medium,
              }}>
                {question.text}
              </p>
            </div>

            {/* Question Image */}
            {question.imageUrl && (
              <div style={{ marginTop: theme.spacing[4] }}>
                <img
                  src={question.imageUrl}
                  alt="Question"
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                    borderRadius: theme.borderRadius.lg,
                    border: `1px solid ${theme.colors.border.light}`,
                  }}
                />
              </div>
            )}
          </div>

          {/* Answer Section */}
          <div>
            <p style={{
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing[4],
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Your Answer
            </p>
            {renderAnswerInput()}
          </div>
        </div>
      </div>
    </Card>
  );
};
