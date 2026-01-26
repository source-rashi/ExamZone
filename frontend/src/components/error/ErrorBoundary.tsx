/**
 * PHASE 9.5 - Error Boundary Component
 * Catches React errors and displays user-friendly error UI
 */

import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { theme } from '../../styles/theme';
import { Button, Card } from '../ui';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.spacing[8],
          backgroundColor: theme.colors.background.secondary,
        }}>
          <Card
            variant="elevated"
            padding={8}
            style={{
              maxWidth: '600px',
              width: '100%',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: theme.borderRadius.full,
                backgroundColor: theme.colors.danger[50],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                marginBottom: theme.spacing[6],
              }}>
                <AlertTriangle size={40} style={{ color: theme.colors.danger[500] }} />
              </div>

              <h1 style={{
                fontSize: theme.typography.fontSize['2xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing[3],
              }}>
                Oops! Something went wrong
              </h1>

              <p style={{
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.text.secondary,
                lineHeight: theme.typography.lineHeight.relaxed,
                marginBottom: theme.spacing[6],
              }}>
                We encountered an unexpected error. Don't worry, your data is safe. 
                Please try refreshing the page or return to the home page.
              </p>

              {/* Error Details (Development Only) */}
              {import.meta.env.DEV && this.state.error && (
                <div style={{
                  padding: theme.spacing[4],
                  backgroundColor: theme.colors.danger[50],
                  border: `1px solid ${theme.colors.danger[200]}`,
                  borderRadius: theme.borderRadius.lg,
                  marginBottom: theme.spacing[6],
                  textAlign: 'left',
                  overflow: 'auto',
                  maxHeight: '200px',
                }}>
                  <p style={{
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.danger[800],
                    marginBottom: theme.spacing[2],
                  }}>
                    Error Details (Development):
                  </p>
                  <pre style={{
                    fontSize: theme.typography.fontSize.xs,
                    color: theme.colors.danger[700],
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}>
                    {this.state.error.toString()}
                    {this.state.errorInfo && '\n\n' + this.state.errorInfo.componentStack}
                  </pre>
                </div>
              )}

              <div style={{
                display: 'flex',
                gap: theme.spacing[3],
                justifyContent: 'center',
              }}>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                  icon={<Home size={18} />}
                >
                  Go Home
                </Button>
                <Button
                  variant="primary"
                  onClick={this.handleReset}
                  icon={<RefreshCw size={18} />}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
