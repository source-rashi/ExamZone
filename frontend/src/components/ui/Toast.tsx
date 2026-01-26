/**
 * PHASE 9.2 - Toast Notification System
 * Professional feedback notifications
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { theme } from '../../styles/theme';
import { CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-react';

export interface Toast {
  id: string;
  message: string;
  variant: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, variant?: Toast['variant'], duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((
    message: string,
    variant: Toast['variant'] = 'info',
    duration: number = 3000
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toast: Toast = { id, message, variant, duration };
    
    setToasts((prev) => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const success = useCallback((message: string, duration?: number) => {
    showToast(message, 'success', duration);
  }, [showToast]);

  const error = useCallback((message: string, duration?: number) => {
    showToast(message, 'error', duration || 5000);
  }, [showToast]);

  const warning = useCallback((message: string, duration?: number) => {
    showToast(message, 'warning', duration);
  }, [showToast]);

  const info = useCallback((message: string, duration?: number) => {
    showToast(message, 'info', duration);
  }, [showToast]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  const containerStyles: React.CSSProperties = {
    position: 'fixed',
    top: theme.spacing[6],
    right: theme.spacing[6],
    zIndex: theme.zIndex.tooltip,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[3],
    maxWidth: '400px',
  };

  return (
    <div style={containerStyles}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const variantStyles = {
    success: {
      backgroundColor: theme.colors.success[50],
      borderColor: theme.colors.success[200],
      iconColor: theme.colors.success[600],
      icon: <CheckCircle size={20} />,
    },
    error: {
      backgroundColor: theme.colors.danger[50],
      borderColor: theme.colors.danger[200],
      iconColor: theme.colors.danger[600],
      icon: <XCircle size={20} />,
    },
    warning: {
      backgroundColor: theme.colors.warning[50],
      borderColor: theme.colors.warning[200],
      iconColor: theme.colors.warning[600],
      icon: <AlertCircle size={20} />,
    },
    info: {
      backgroundColor: theme.colors.primary[50],
      borderColor: theme.colors.primary[200],
      iconColor: theme.colors.primary[600],
      icon: <Info size={20} />,
    },
  };

  const styles = variantStyles[toast.variant];

  const toastStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing[3],
    padding: theme.spacing[4],
    backgroundColor: styles.backgroundColor,
    border: `1px solid ${styles.borderColor}`,
    borderRadius: theme.borderRadius.lg,
    boxShadow: theme.shadows.lg,
    animation: 'slideDown 0.3s ease-out',
  };

  return (
    <div style={toastStyles}>
      <div style={{ color: styles.iconColor, flexShrink: 0 }}>
        {styles.icon}
      </div>
      <p style={{
        flex: 1,
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.primary,
        margin: 0,
        lineHeight: theme.typography.lineHeight.relaxed,
      }}>
        {toast.message}
      </p>
      <button
        onClick={() => onRemove(toast.id)}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          color: theme.colors.text.secondary,
          transition: theme.transitions.fast,
          flexShrink: 0,
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.text.primary}
        onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.text.secondary}
      >
        <X size={18} />
      </button>
    </div>
  );
};
