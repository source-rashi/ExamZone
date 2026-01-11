/**
 * Section Component
 * Page section with consistent spacing
 */
export default function Section({ children, className = '', background = 'white' }) {
  const backgrounds = {
    white: 'bg-white',
    slate: 'bg-[#f4f7fb]',
    blue: 'bg-[#1f3c88]',
  };
  
  return (
    <section className={`py-16 ${backgrounds[background]} ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  );
}
