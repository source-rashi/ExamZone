/**
 * Card Component
 * Reusable card container
 */
export default function Card({ children, className = '', hover = false }) {
  return (
    <div
      className={`bg-white rounded-lg border border-slate-200 shadow-sm p-6 ${
        hover ? 'transition-shadow hover:shadow-md' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
