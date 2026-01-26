/**
 * PHASE 9.2 - Progress Steps Component
 * Visual progress indicator for multi-step flows
 */

import React from 'react';
import { theme } from '../../styles/theme';
import { Check } from 'lucide-react';

export interface Step {
  number: number;
  name: string;
  icon?: React.ComponentType<any>;
}

export interface ProgressStepsProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepNumber: number) => void;
  allowClickBack?: boolean;
}

export const ProgressSteps: React.FC<ProgressStepsProps> = ({
  steps,
  currentStep,
  onStepClick,
  allowClickBack = false,
}) => {
  const handleStepClick = (stepNumber: number) => {
    if (allowClickBack && stepNumber < currentStep && onStepClick) {
      onStepClick(stepNumber);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      padding: theme.spacing[6],
      backgroundColor: theme.colors.background.primary,
      borderRadius: theme.borderRadius.xl,
      border: `1px solid ${theme.colors.border.light}`,
      marginBottom: theme.spacing[8],
    }}>
      {steps.map((step, index) => {
        const isCompleted = step.number < currentStep;
        const isCurrent = step.number === currentStep;
        const isClickable = allowClickBack && step.number < currentStep;

        return (
          <React.Fragment key={step.number}>
            <div
              onClick={() => handleStepClick(step.number)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: theme.spacing[2],
                cursor: isClickable ? 'pointer' : 'default',
                transition: theme.transitions.base,
                opacity: step.number > currentStep ? 0.5 : 1,
              }}
            >
              {/* Circle with icon */}
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isCompleted 
                  ? theme.colors.success[500]
                  : isCurrent
                  ? theme.colors.primary[600]
                  : theme.colors.neutral[200],
                color: isCompleted || isCurrent 
                  ? theme.colors.text.inverse
                  : theme.colors.text.secondary,
                transition: theme.transitions.base,
                boxShadow: isCurrent ? theme.shadows.md : 'none',
              }}>
                {isCompleted ? (
                  <Check size={24} />
                ) : step.icon ? (
                  <step.icon size={24} />
                ) : (
                  <span style={{
                    fontSize: theme.typography.fontSize.lg,
                    fontWeight: theme.typography.fontWeight.semibold,
                  }}>
                    {step.number}
                  </span>
                )}
              </div>

              {/* Step name */}
              <span style={{
                fontSize: theme.typography.fontSize.sm,
                fontWeight: isCurrent ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.normal,
                color: isCurrent ? theme.colors.text.primary : theme.colors.text.secondary,
                textAlign: 'center',
                maxWidth: '100px',
              }}>
                {step.name}
              </span>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div style={{
                flex: 1,
                height: '2px',
                backgroundColor: isCompleted 
                  ? theme.colors.success[500]
                  : theme.colors.neutral[200],
                margin: `0 ${theme.spacing[4]}`,
                marginBottom: theme.spacing[10],
                transition: theme.transitions.base,
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
