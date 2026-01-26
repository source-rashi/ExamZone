/**
 * PHASE 9.5 - Error Display Component
 * Reusable error UI for failed API calls and other errors
 */

import React from 'react';
import { theme } from '../../styles/theme';
import { Card, Button } from '../ui';
import { 
  AlertTriangle, 
  XCircle, 
  WifiOff, 
  Clock, 
  Lock,
  RefreshCw,
} from 'lucide-react';

export type ErrorType = 'general' | 'network' | 'timeout' | 'unauthorized' | 'notfound' | 'forbidden';

export interface ErrorDisplayProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  retrying?: boolean;
  showRetry?: boolean;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  type = 'general',
  title,
  message,
  onRetry,
  retryLabel = 'Try Again',
  retrying = false,
  showRetry = true,
}) => {
  const getErrorConfig = () => {
    switch (type) {
      case 'network':
        return {
          icon: <WifiOff size={48} />,
          defaultTitle: 'Network Error',
          defaultMessage: 'Unable to connect to the server. Please check your internet connection and try again.',
          color: theme.colors.warning[500],
          bgColor: theme.colors.warning[50],
        };
      case 'timeout':
        return {
          icon: <Clock size={48} />,
          defaultTitle: 'Request Timeout',
          defaultMessage: 'The request took too long to complete. Please try again.',
          color: theme.colors.warning[500],
          bgColor: theme.colors.warning[50],
        };
      case 'unauthorized':
        return {
          icon: <Lock size={48} />,
          defaultTitle: 'Unauthorized',
          defaultMessage: 'You do not have permission to access this resource. Please log in again.',
          color: theme.colors.danger[500],
          bgColor: theme.colors.danger[50],
        };
      case 'notfound':
        return {
          icon: <XCircle size={48} />,
          defaultTitle: 'Not Found',
          defaultMessage: 'The requested resource could not be found.',
          color: theme.colors.neutral[500],
          bgColor: theme.colors.neutral[50],
        };
      case 'forbidden':
        return {
          icon: <Lock size={48} />,
          defaultTitle: 'Access Denied',
          defaultMessage: 'You do not have permission to perform this action.',
          color: theme.colors.danger[500],
          bgColor: theme.colors.danger[50],
        };
      default:
        return {
          icon: <AlertTriangle size={48} />,
          defaultTitle: 'Something Went Wrong',
          defaultMessage: 'An unexpected error occurred. Please try again later.',
          color: theme.colors.danger[500],
          bgColor: theme.colors.danger[50],
        };
    }
  };

  const config = getErrorConfig();

  return (
    <Card variant="elevated" padding={8}>
      <div style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{
          width: '96px',
          height: '96px',
          borderRadius: theme.borderRadius.full,
          backgroundColor: config.bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto',
          marginBottom: theme.spacing[6],
        }}>
          <div style={{ color: config.color }}>
            {config.icon}
          </div>
        </div>

        <h2 style={{
          fontSize: theme.typography.fontSize.xl,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing[3],
        }}>
          {title || config.defaultTitle}
        </h2>

        <p style={{
          fontSize: theme.typography.fontSize.base,
          color: theme.colors.text.secondary,
          lineHeight: theme.typography.lineHeight.relaxed,
          marginBottom: theme.spacing[6],
        }}>
          {message || config.defaultMessage}
        </p>

        {showRetry && onRetry && (
          <Button
            variant="primary"
            onClick={onRetry}
            loading={retrying}
            icon={<RefreshCw size={18} />}
          >
            {retryLabel}
          </Button>
        )}
      </div>
    </Card>
  );
};

export default ErrorDisplay;
