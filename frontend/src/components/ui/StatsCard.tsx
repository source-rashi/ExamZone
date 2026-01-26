/**
 * PHASE 9.2 - Stats Card Component
 * Dashboard statistics display
 */

import React from 'react';
import { theme } from '../../styles/theme';
import { Card } from './Card';

export interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtext?: string;
  loading?: boolean;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  icon,
  iconColor = theme.colors.primary[600],
  trend,
  subtext,
  loading = false,
}) => {
  if (loading) {
    return (
      <Card variant="elevated" padding={6}>
        <div style={{
          height: '100px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            border: `3px solid ${theme.colors.neutral[200]}`,
            borderTopColor: theme.colors.primary[600],
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
          }} />
        </div>
      </Card>
    );
  }

  return (
    <Card variant="elevated" padding={6} hover>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: theme.spacing[4],
      }}>
        <div style={{ flex: 1 }}>
          <p style={{
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.medium,
            color: theme.colors.text.secondary,
            marginBottom: theme.spacing[2],
          }}>
            {label}
          </p>
          
          <p style={{
            fontSize: theme.typography.fontSize['4xl'],
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text.primary,
            lineHeight: 1,
            marginBottom: theme.spacing[2],
          }}>
            {value}
          </p>

          {trend && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing[1],
              fontSize: theme.typography.fontSize.xs,
              color: trend.isPositive ? theme.colors.success[600] : theme.colors.danger[600],
            }}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span style={{ color: theme.colors.text.tertiary }}>vs last month</span>
            </div>
          )}

          {subtext && (
            <p style={{
              fontSize: theme.typography.fontSize.xs,
              color: theme.colors.text.tertiary,
              marginTop: theme.spacing[1],
            }}>
              {subtext}
            </p>
          )}
        </div>

        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: theme.borderRadius.xl,
          backgroundColor: `${iconColor}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: iconColor,
          flexShrink: 0,
        }}>
          {icon}
        </div>
      </div>
    </Card>
  );
};
