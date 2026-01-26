/**
 * PHASE 9.1 - Alert Component
 * Notifications and messages
 */

import React from 'react';
import { theme } from '../../styles/theme';

export interface AlertProps {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  children,
  variant = 'info',
  title,
  onClose,
  className = '',
}) => {
  const variantStyles = {
    info: {
      backgroundColor: theme.colors.primary[50],
      color: theme.colors.primary[900],
      borderColor: theme.colors.primary[200],
      iconColor: theme.colors.primary[600],
    },
    success: {
      backgroundColor: theme.colors.success[50],
      color: theme.colors.success[900],
      borderColor: theme.colors.success[200],
      iconColor: theme.colors.success[600],
    },
    warning: {
      backgroundColor: theme.colors.warning[50],
      color: theme.colors.warning[900],
      borderColor: theme.colors.warning[200],
      iconColor: theme.colors.warning[600],
    },
    danger: {
      backgroundColor: theme.colors.danger[50],
      color: theme.colors.danger[900],
      borderColor: theme.colors.danger[200],
      iconColor: theme.colors.danger[600],
    },
  };

  const styles = variantStyles[variant];

  const baseStyles: React.CSSProperties = {
    position: 'relative',
    padding: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    border: `1px solid ${styles.borderColor}`,
    backgroundColor: styles.backgroundColor,
    color: styles.color,
    display: 'flex',
    gap: theme.spacing[3],
  };

  const icons = {
    info: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    success: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    danger: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className={className} style={baseStyles}>
      <div style={{ color: styles.iconColor, flexShrink: 0 }}>
        {icons[variant]}
      </div>
      <div style={{ flex: 1 }}>
        {title && (
          <div style={{
            fontWeight: theme.typography.fontWeight.semibold,
            marginBottom: theme.spacing[1],
          }}>
            {title}
          </div>
        )}
        <div style={{ fontSize: theme.typography.fontSize.sm }}>
          {children}
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: 'currentColor',
            opacity: 0.6,
            transition: theme.transitions.fast,
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};
