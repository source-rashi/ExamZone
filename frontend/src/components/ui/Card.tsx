/**
 * PHASE 9.1 - Card Component
 * Unified card container with variants
 */

import React from 'react';
import { theme } from '../../styles/theme';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'flat';
  padding?: keyof typeof theme.spacing;
  hover?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 6,
  hover = false,
  className = '',
  style = {},
  onClick,
}) => {
  const baseStyles: React.CSSProperties = {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[padding],
    transition: theme.transitions.base,
    cursor: onClick ? 'pointer' : 'default',
  };

  const variantStyles = {
    default: {
      border: `1px solid ${theme.colors.border.light}`,
      boxShadow: theme.shadows.sm,
    },
    elevated: {
      border: 'none',
      boxShadow: theme.shadows.lg,
    },
    outlined: {
      border: `2px solid ${theme.colors.border.default}`,
      boxShadow: 'none',
    },
    flat: {
      border: 'none',
      boxShadow: 'none',
      backgroundColor: theme.colors.background.secondary,
    },
  };

  const hoverStyles = hover ? {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows.xl,
  } : {};

  const [isHovered, setIsHovered] = React.useState(false);

  const combinedStyles = {
    ...baseStyles,
    ...variantStyles[variant],
    ...(isHovered ? hoverStyles : {}),
    ...style,
  };

  return (
    <div
      className={className}
      style={combinedStyles}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </div>
  );
};

export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
  return (
    <div
      className={className}
      style={{
        marginBottom: theme.spacing[4],
        paddingBottom: theme.spacing[4],
        borderBottom: `1px solid ${theme.colors.border.light}`,
      }}
    >
      {children}
    </div>
  );
};

export interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, className = '' }) => {
  return (
    <h3
      className={className}
      style={{
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.primary,
        margin: 0,
      }}
    >
      {children}
    </h3>
  );
};

export interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => {
  return (
    <div
      className={className}
      style={{
        marginTop: theme.spacing[4],
        paddingTop: theme.spacing[4],
        borderTop: `1px solid ${theme.colors.border.light}`,
        display: 'flex',
        gap: theme.spacing[3],
        alignItems: 'center',
      }}
    >
      {children}
    </div>
  );
};
