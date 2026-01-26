/**
 * PHASE 9.6 - Responsive & Accessibility Utilities
 * Helper functions for responsive design and accessibility
 */

import { theme } from '../styles/theme';

/**
 * Check if current viewport matches a breakpoint
 */
export const useBreakpoint = () => {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  if (width < parseInt(theme.breakpoints.sm)) return 'mobile';
  if (width < parseInt(theme.breakpoints.md)) return 'tablet';
  if (width < parseInt(theme.breakpoints.lg)) return 'laptop';
  return 'desktop';
};

/**
 * Get responsive value based on breakpoint
 */
export const getResponsiveValue = <T,>(
  values: {
    mobile?: T;
    tablet?: T;
    laptop?: T;
    desktop?: T;
    default: T;
  }
): T => {
  const breakpoint = useBreakpoint();
  return values[breakpoint] ?? values.default;
};

/**
 * Generate responsive styles
 */
export const responsive = {
  padding: {
    mobile: theme.spacing[4],
    tablet: theme.spacing[6],
    desktop: theme.spacing[8],
  },
  fontSize: {
    mobile: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
    desktop: theme.typography.fontSize,
  },
  grid: {
    mobile: '1fr',
    tablet: 'repeat(2, 1fr)',
    desktop: 'repeat(3, 1fr)',
  },
};

/**
 * Accessibility helpers
 */
export const a11y = {
  /**
   * Generate accessible button props
   */
  button: (label: string, options?: { pressed?: boolean; expanded?: boolean }) => ({
    'aria-label': label,
    'aria-pressed': options?.pressed,
    'aria-expanded': options?.expanded,
    role: 'button',
    tabIndex: 0,
  }),

  /**
   * Generate accessible link props
   */
  link: (label: string, external?: boolean) => ({
    'aria-label': label,
    ...(external && {
      'aria-describedby': 'external-link-description',
      rel: 'noopener noreferrer',
      target: '_blank',
    }),
  }),

  /**
   * Generate accessible form input props
   */
  input: (label: string, options?: { required?: boolean; invalid?: boolean; describedBy?: string }) => ({
    'aria-label': label,
    'aria-required': options?.required,
    'aria-invalid': options?.invalid,
    'aria-describedby': options?.describedBy,
  }),

  /**
   * Generate accessible modal props
   */
  modal: (label: string) => ({
    role: 'dialog',
    'aria-modal': true,
    'aria-label': label,
    tabIndex: -1,
  }),

  /**
   * Generate accessible alert props
   */
  alert: (type: 'error' | 'warning' | 'info' | 'success') => ({
    role: type === 'error' ? 'alert' : 'status',
    'aria-live': type === 'error' ? 'assertive' : 'polite',
    'aria-atomic': true,
  }),

  /**
   * Screen reader only text
   */
  srOnly: {
    position: 'absolute' as const,
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap' as const,
    border: 0,
  },

  /**
   * Focus visible styles
   */
  focusVisible: {
    outline: `2px solid ${theme.colors.primary[500]}`,
    outlineOffset: '2px',
  },
};

/**
 * Touch target helpers - ensure minimum 44x44px for touch
 */
export const touchTarget = {
  minSize: '44px',
  padding: theme.spacing[3],
  minHeight: '44px',
  minWidth: '44px',
};

/**
 * Contrast ratio checker (WCAG AA requires 4.5:1 for normal text)
 */
export const contrastRatio = (foreground: string, background: string): number => {
  const getLuminance = (color: string): number => {
    // Simple luminance calculation
    const rgb = color.match(/\d+/g);
    if (!rgb) return 0;
    
    const [r, g, b] = rgb.map(val => {
      const v = parseInt(val) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Keyboard navigation helper
 */
export const handleKeyboardNav = (
  event: React.KeyboardEvent,
  handlers: {
    onEnter?: () => void;
    onSpace?: () => void;
    onEscape?: () => void;
    onArrowUp?: () => void;
    onArrowDown?: () => void;
    onArrowLeft?: () => void;
    onArrowRight?: () => void;
    onTab?: () => void;
  }
) => {
  const { key } = event;
  
  switch (key) {
    case 'Enter':
      handlers.onEnter?.();
      break;
    case ' ':
    case 'Space':
      event.preventDefault();
      handlers.onSpace?.();
      break;
    case 'Escape':
      handlers.onEscape?.();
      break;
    case 'ArrowUp':
      event.preventDefault();
      handlers.onArrowUp?.();
      break;
    case 'ArrowDown':
      event.preventDefault();
      handlers.onArrowDown?.();
      break;
    case 'ArrowLeft':
      handlers.onArrowLeft?.();
      break;
    case 'ArrowRight':
      handlers.onArrowRight?.();
      break;
    case 'Tab':
      handlers.onTab?.();
      break;
  }
};

/**
 * Generate unique ID for accessibility
 */
let idCounter = 0;
export const generateId = (prefix: string = 'a11y'): string => {
  return `${prefix}-${++idCounter}`;
};
