/**
 * PHASE 9.1 - Loading Component
 * Loading states and skeletons
 */

import React from 'react';
import { theme } from '../../styles/theme';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = theme.colors.primary[600],
  className = '',
}) => {
  const sizeMap = {
    sm: '16px',
    md: '24px',
    lg: '40px',
  };

  const spinnerStyles: React.CSSProperties = {
    width: sizeMap[size],
    height: sizeMap[size],
    border: `3px solid ${theme.colors.neutral[200]}`,
    borderTopColor: color,
    borderRadius: '50%',
    animation: 'spin 0.8s cubic-bezier(0.5, 0, 0.5, 1) infinite',
  };

  return (
    <div 
      className={className} 
      style={spinnerStyles}
      role="status"
      aria-label="Loading"
    />
  );
};

export interface LoadingOverlayProps {
  message?: string;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'Loading...',
  className = '',
}) => {
  const overlayStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[4],
    zIndex: theme.zIndex.modal,
  };

  const contentStyles: React.CSSProperties = {
    backgroundColor: theme.colors.background.primary,
    padding: theme.spacing[8],
    borderRadius: theme.borderRadius.xl,
    boxShadow: theme.shadows.xl,
    textAlign: 'center',
  };

  return (
    <div className={className} style={overlayStyles}>
      <div style={contentStyles}>
        <LoadingSpinner size="lg" />
        <p style={{
          marginTop: theme.spacing[4],
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.medium,
          color: theme.colors.text.primary,
        }}>
          {message}
        </p>
      </div>
    </div>
  );
};

export interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = theme.borderRadius.base,
  className = '',
  style = {},
}) => {
  const skeletonStyles: React.CSSProperties = {
    width,
    height,
    borderRadius,
    backgroundColor: theme.colors.neutral[200],
    animation: 'pulse 1.5s ease-in-out infinite',
    backgroundImage: `linear-gradient(
      90deg,
      ${theme.colors.neutral[200]} 0%,
      ${theme.colors.neutral[300]} 50%,
      ${theme.colors.neutral[200]} 100%
    )`,
    backgroundSize: '200% 100%',
    ...style,
  };

  return <div className={className} style={skeletonStyles} />;
};

export interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  className = '',
}) => {
  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '60%' : '100%'}
          height="16px"
        />
      ))}
    </div>
  );
};

export interface SkeletonCardProps {
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ className = '' }) => {
  return (
    <div
      className={className}
      style={{
        padding: theme.spacing[6],
        borderRadius: theme.borderRadius.xl,
        border: `1px solid ${theme.colors.border.light}`,
        backgroundColor: theme.colors.background.primary,
      }}
    >
      <Skeleton width="60%" height="24px" style={{ marginBottom: theme.spacing[3] }} />
      <SkeletonText lines={2} />
      <div style={{
        marginTop: theme.spacing[4],
        display: 'flex',
        gap: theme.spacing[2],
      }}>
        <Skeleton width="80px" height="32px" borderRadius={theme.borderRadius.full} />
        <Skeleton width="80px" height="32px" borderRadius={theme.borderRadius.full} />
      </div>
    </div>
  );
};
