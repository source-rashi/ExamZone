/**
 * PHASE 9.3 - Exam Readiness Checklist
 * Pre-exam checklist to ensure students are prepared
 */

import React, { useState } from 'react';
import { theme } from '../../styles/theme';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../ui';
import { CheckCircle, Circle, Clock, FileText, AlertTriangle } from 'lucide-react';

export interface ReadinessItem {
  id: string;
  label: string;
  checked: boolean;
  required: boolean;
}

export interface ExamReadinessProps {
  exam: {
    title: string;
    duration: number;
    startTime: string;
    endTime: string;
    totalMarks: number;
    instructions?: string;
  };
  onStart: () => void;
  onCancel: () => void;
}

export const ExamReadinessChecklist: React.FC<ExamReadinessProps> = ({
  exam,
  onStart,
  onCancel,
}) => {
  const [checklist, setChecklist] = useState<ReadinessItem[]>([
    {
      id: 'environment',
      label: 'I am in a quiet, distraction-free environment',
      checked: false,
      required: true,
    },
    {
      id: 'materials',
      label: 'I have all necessary materials (pen, paper, calculator if allowed)',
      checked: false,
      required: true,
    },
    {
      id: 'internet',
      label: 'My internet connection is stable',
      checked: false,
      required: true,
    },
    {
      id: 'time',
      label: `I have at least ${exam.duration} minutes available`,
      checked: false,
      required: true,
    },
    {
      id: 'instructions',
      label: 'I have read and understood the exam instructions',
      checked: false,
      required: true,
    },
    {
      id: 'device',
      label: 'My device is charged or plugged in',
      checked: false,
      required: false,
    },
  ]);

  const toggleItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const allRequiredChecked = checklist
    .filter((item) => item.required)
    .every((item) => item.checked);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} minutes`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const containerStyles: React.CSSProperties = {
    maxWidth: '600px',
    margin: '0 auto',
    padding: theme.spacing[6],
  };

  return (
    <div style={containerStyles}>
      {/* Exam Info Card */}
      <Card variant="elevated" padding={6} style={{ marginBottom: theme.spacing[6] }}>
        <div style={{ textAlign: 'center', marginBottom: theme.spacing[4] }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: theme.colors.primary[100],
              color: theme.colors.primary[600],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              marginBottom: theme.spacing[4],
            }}
          >
            <FileText size={32} />
          </div>
          <h2
            style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing[2],
            }}
          >
            {exam.title}
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: theme.spacing[4],
            padding: theme.spacing[4],
            backgroundColor: theme.colors.background.secondary,
            borderRadius: theme.borderRadius.lg,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2], marginBottom: theme.spacing[1] }}>
              <Clock size={16} style={{ color: theme.colors.text.secondary }} />
              <span style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.text.secondary }}>
                Duration
              </span>
            </div>
            <p style={{ fontSize: theme.typography.fontSize.lg, fontWeight: theme.typography.fontWeight.semibold }}>
              {formatDuration(exam.duration)}
            </p>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2], marginBottom: theme.spacing[1] }}>
              <FileText size={16} style={{ color: theme.colors.text.secondary }} />
              <span style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.text.secondary }}>
                Total Marks
              </span>
            </div>
            <p style={{ fontSize: theme.typography.fontSize.lg, fontWeight: theme.typography.fontWeight.semibold }}>
              {exam.totalMarks}
            </p>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2], marginBottom: theme.spacing[1] }}>
              <Clock size={16} style={{ color: theme.colors.text.secondary }} />
              <span style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.text.secondary }}>
                Time Window
              </span>
            </div>
            <p style={{ fontSize: theme.typography.fontSize.base }}>
              {formatDateTime(exam.startTime)} - {formatDateTime(exam.endTime)}
            </p>
          </div>
        </div>

        {exam.instructions && (
          <div
            style={{
              marginTop: theme.spacing[4],
              padding: theme.spacing[4],
              backgroundColor: theme.colors.warning[50],
              border: `1px solid ${theme.colors.warning[200]}`,
              borderRadius: theme.borderRadius.lg,
            }}
          >
            <div style={{ display: 'flex', gap: theme.spacing[2], marginBottom: theme.spacing[2] }}>
              <AlertTriangle size={20} style={{ color: theme.colors.warning[600], flexShrink: 0 }} />
              <span
                style={{
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.warning[900],
                }}
              >
                Special Instructions
              </span>
            </div>
            <p
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.warning[800],
                lineHeight: theme.typography.lineHeight.relaxed,
              }}
            >
              {exam.instructions}
            </p>
          </div>
        )}
      </Card>

      {/* Readiness Checklist */}
      <Card variant="elevated" padding={6}>
        <CardHeader>
          <CardTitle>Before You Start</CardTitle>
          <p style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.text.secondary, marginTop: theme.spacing[2] }}>
            Please confirm the following before starting your exam:
          </p>
        </CardHeader>

        <CardContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
            {checklist.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: theme.spacing[3],
                  padding: theme.spacing[3],
                  borderRadius: theme.borderRadius.lg,
                  backgroundColor: item.checked ? theme.colors.success[50] : theme.colors.background.secondary,
                  border: `1px solid ${item.checked ? theme.colors.success[200] : theme.colors.border.light}`,
                  cursor: 'pointer',
                  transition: theme.transitions.base,
                }}
              >
                <div style={{ flexShrink: 0, marginTop: '2px' }}>
                  {item.checked ? (
                    <CheckCircle size={20} style={{ color: theme.colors.success[600] }} />
                  ) : (
                    <Circle size={20} style={{ color: theme.colors.neutral[400] }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <span
                    style={{
                      fontSize: theme.typography.fontSize.sm,
                      color: item.checked ? theme.colors.success[900] : theme.colors.text.primary,
                      lineHeight: theme.typography.lineHeight.relaxed,
                    }}
                  >
                    {item.label}
                    {item.required && (
                      <span style={{ color: theme.colors.danger[600], marginLeft: theme.spacing[1] }}>*</span>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: theme.spacing[6],
              display: 'flex',
              gap: theme.spacing[3],
              justifyContent: 'flex-end',
            }}
          >
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={onStart}
              disabled={!allRequiredChecked}
              size="lg"
            >
              Start Exam
            </Button>
          </div>

          {!allRequiredChecked && (
            <p
              style={{
                marginTop: theme.spacing[3],
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.text.secondary,
                textAlign: 'center',
              }}
            >
              * Please check all required items to continue
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
