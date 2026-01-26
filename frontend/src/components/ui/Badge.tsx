/**
 * PHASE 9.1 - Badge Component
 * Status indicators and labels
 */

import React from 'react';
import { theme } from '../../styles/theme';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
}) => {
  const sizeStyles = {
    sm: {
      fontSize: theme.typography.fontSize.xs,
      padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
    },
    md: {
      fontSize: theme.typography.fontSize.sm,
      padding: `${theme.spacing[1]} ${theme.spacing[3]}`,
    },
    lg: {
      fontSize: theme.typography.fontSize.base,
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
    },
  };

  const variantStyles = {
    primary: {
      backgroundColor: theme.colors.primary[100],
      color: theme.colors.primary[700],
      border: `1px solid ${theme.colors.primary[200]}`,
    },
    success: {
      backgroundColor: theme.colors.success[100],
      color: theme.colors.success[700],
      border: `1px solid ${theme.colors.success[200]}`,
    },
    danger: {
      backgroundColor: theme.colors.danger[100],
      color: theme.colors.danger[700],
      border: `1px solid ${theme.colors.danger[200]}`,
    },
    warning: {
      backgroundColor: theme.colors.warning[100],
      color: theme.colors.warning[700],
      border: `1px solid ${theme.colors.warning[200]}`,
    },
    neutral: {
      backgroundColor: theme.colors.neutral[100],
      color: theme.colors.neutral[700],
      border: `1px solid ${theme.colors.neutral[200]}`,
    },
  };

  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing[2],
    borderRadius: theme.borderRadius.full,
    fontWeight: theme.typography.fontWeight.medium,
    whiteSpace: 'nowrap',
    ...sizeStyles[size],
    ...variantStyles[variant],
  };

  return (
    <span className={className} style={baseStyles}>
      {dot && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'currentColor',
          }}
        />
      )}
      {children}
    </span>
  );
};
