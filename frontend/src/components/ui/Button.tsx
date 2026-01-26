/**
 * PHASE 9.1 - Button Component
 * Unified button styles with variants
 */

import React from 'react';
import { theme } from '../../styles/theme';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  className = '',
  ...props
}) => {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[2],
    fontFamily: theme.typography.fontFamily.sans,
    fontWeight: theme.typography.fontWeight.medium,
    borderRadius: theme.borderRadius.lg,
    transition: theme.transitions.base,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    width: fullWidth ? '100%' : 'auto',
    border: 'none',
    outline: 'none',
  };

  const sizeStyles = {
    sm: {
      fontSize: theme.typography.fontSize.sm,
      padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
      minHeight: '36px', // Increased from 32px for better touch targets
      minWidth: '36px',
    },
    md: {
      fontSize: theme.typography.fontSize.base,
      padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
      minHeight: '44px', // Increased from 40px for better touch targets
      minWidth: '44px',
    },
    lg: {
      fontSize: theme.typography.fontSize.lg,
      padding: `${theme.spacing[4]} ${theme.spacing[6]}`,
      minHeight: '48px',
      minWidth: '48px',
    },
  };

  const variantStyles = {
    primary: {
      backgroundColor: theme.colors.primary[600],
      color: theme.colors.text.inverse,
      boxShadow: theme.shadows.sm,
    },
    secondary: {
      backgroundColor: theme.colors.neutral[100],
      color: theme.colors.text.primary,
      boxShadow: theme.shadows.sm,
    },
    success: {
      backgroundColor: theme.colors.success[600],
      color: theme.colors.text.inverse,
      boxShadow: theme.shadows.sm,
    },
    danger: {
      backgroundColor: theme.colors.danger[600],
      color: theme.colors.text.inverse,
      boxShadow: theme.shadows.sm,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: theme.colors.text.primary,
    },
    outline: {
      backgroundColor: 'transparent',
      color: theme.colors.primary[600],
      border: `1px solid ${theme.colors.primary[600]}`,
    },
  };

  const hoverStyles = {
    primary: { 
      filter: 'brightness(110%)',
      transform: 'translateY(-1px)',
      boxShadow: theme.shadows.md,
    },
    secondary: { 
      backgroundColor: theme.colors.neutral[200],
      transform: 'translateY(-1px)',
    },
    success: { 
      filter: 'brightness(110%)',
      transform: 'translateY(-1px)',
      boxShadow: theme.shadows.md,
    },
    danger: { 
      filter: 'brightness(110%)',
      transform: 'translateY(-1px)',
      boxShadow: theme.shadows.md,
    },
    ghost: { 
      backgroundColor: theme.colors.neutral[100],
    },
    outline: { 
      backgroundColor: theme.colors.primary[50],
      borderColor: theme.colors.primary[700],
    },
  };

  const activeStyles = {
    primary: { transform: 'scale(0.98)' },
    secondary: { transform: 'scale(0.98)' },
    success: { transform: 'scale(0.98)' },
    danger: { transform: 'scale(0.98)' },
    ghost: { transform: 'scale(0.98)' },
    outline: { transform: 'scale(0.98)' },
  };

  const combinedStyles = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      Object.assign(e.currentTarget.style, hoverStyles[variant]);
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    Object.assign(e.currentTarget.style, variantStyles[variant]);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      Object.assign(e.currentTarget.style, activeStyles[variant]);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      Object.assign(e.currentTarget.style, hoverStyles[variant]);
    }
  };

  return (
    <button
      style={combinedStyles}
      disabled={disabled || loading}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      className={className}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      role="button"
      tabIndex={disabled || loading ? -1 : 0}
      {...props}
    >
      {loading ? (
        <>
          <span 
            className="spinner" 
            role="status" 
            aria-label="Loading"
            style={{
              width: '16px',
              height: '16px',
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite',
            }} 
          />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span aria-hidden="true">{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && <span aria-hidden="true">{icon}</span>}
        </>
      )}
    </button>
  );
};
