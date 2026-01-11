/**
 * Button Component
 * Reusable button with variants
 */
export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) {
  const baseStyles = 'font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-[#1f3c88] text-white hover:bg-[#152d6b] active:bg-[#0f1f4a]',
    secondary: 'bg-[#3d5ca3] text-white hover:bg-[#2e4782] active:bg-[#1f3463]',
    outline: 'border-2 border-[#1f3c88] text-[#1f3c88] hover:bg-[#1f3c88] hover:text-white active:bg-[#152d6b]',
    ghost: 'text-slate-700 hover:bg-slate-100 active:bg-slate-200',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
