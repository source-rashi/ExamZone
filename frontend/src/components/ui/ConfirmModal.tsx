/**
 * PHASE 9.2 - Confirmation Modal Component
 * Professional confirmation dialogs with warnings
 */

import React from 'react';
import { theme } from '../../styles/theme';
import { Button } from './Button';
import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  loading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  loading = false,
}) => {
  // Handle keyboard events
  React.useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const icons = {
    danger: <AlertTriangle size={48} />,
    warning: <AlertCircle size={48} />,
    info: <Info size={48} />,
    success: <CheckCircle size={48} />,
  };

  const iconColors = {
    danger: theme.colors.danger[600],
    warning: theme.colors.warning[600],
    info: theme.colors.primary[600],
    success: theme.colors.success[600],
  };

  const buttonVariants = {
    danger: 'danger' as const,
    warning: 'warning' as const,
    info: 'primary' as const,
    success: 'success' as const,
  };

  const handleConfirm = async () => {
    await onConfirm();
  };

  const backdropStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: theme.zIndex.modal,
    padding: theme.spacing[4],
    animation: 'fadeIn 0.2s ease-out',
  };

  const modalStyles: React.CSSProperties = {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.xl,
    boxShadow: theme.shadows.xl,
    maxWidth: '500px',
    width: '100%',
    padding: theme.spacing[6],
    animation: 'slideUp 0.3s ease-out',
  };

  const iconContainerStyles: React.CSSProperties = {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: `${iconColors[variant]}15`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: iconColors[variant],
    margin: '0 auto',
    marginBottom: theme.spacing[4],
  };

  return (
    <div 
      style={backdropStyles} 
      onClick={onClose}
      role="presentation"
      aria-hidden={!isOpen}
    >
      <div 
        style={modalStyles} 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <div style={iconContainerStyles} aria-hidden="true">
          {icons[variant]}
        </div>

        <h3 
          id="modal-title"
          style={{
            fontSize: theme.typography.fontSize['2xl'],
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.text.primary,
            textAlign: 'center',
            marginBottom: theme.spacing[3],
          }}
        >
          {title}
        </h3>

        <p 
          id="modal-description"
          style={{
            fontSize: theme.typography.fontSize.base,
            color: theme.colors.text.secondary,
            textAlign: 'center',
            lineHeight: theme.typography.lineHeight.relaxed,
            marginBottom: theme.spacing[6],
          }}
        >
          {message}
        </p>

        <div style={{
          display: 'flex',
          gap: theme.spacing[3],
          justifyContent: 'flex-end',
        }}>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            aria-label={cancelText}
          >
            {cancelText}
          </Button>
          <Button
            variant={buttonVariants[variant]}
            onClick={handleConfirm}
            loading={loading}
            aria-label={confirmText}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};
