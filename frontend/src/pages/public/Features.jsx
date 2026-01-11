import Navbar from '../../components/ui/Navbar';
import Footer from '../../components/ui/Footer';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';

/**
 * Features Page
 * Detailed platform features
 */
export default function Features() {
  const features = [
    {
      title: 'Class Management',
      description: 'Create and organize classes with unique codes. Invite students via email.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      title: 'Exam Creation',
      description: 'Design custom exams with flexible questions and AI evaluation settings.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      title: 'AI Grading',
      description: 'Automated evaluation with advanced AI models that understand context.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      title: 'Instant Feedback',
      description: 'Students receive immediate results with detailed explanations.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      title: 'Analytics Dashboard',
      description: 'Track student performance with comprehensive analytics and insights.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      title: 'Secure Access',
      description: 'Google OAuth authentication with role-based access control.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero */}
        <Section background="indigo">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Features
            </h1>
            <p className="text-xl text-slate-700 max-w-2xl mx-auto">
              Everything you need to create, manage, and evaluate exams efficiently
            </p>
          </div>
        </Section>

        {/* Features Grid */}
        <Section>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} hover>
                <div className="text-indigo-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600">{feature.description}</p>
              </Card>
            ))}
          </div>
        </Section>

        {/* Additional Benefits */}
        <Section background="slate">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Why Choose ExamZone?
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Save Time</h3>
              <p className="text-slate-600">
                Reduce grading time by 90%. AI handles evaluation while you focus on teaching.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Improve Learning</h3>
              <p className="text-slate-600">
                Instant feedback helps students learn faster and retain knowledge better.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Scale Easily</h3>
              <p className="text-slate-600">
                Handle hundreds of students and exams without additional overhead.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Stay Organized</h3>
              <p className="text-slate-600">
                Keep all your classes, exams, and student data in one place.
              </p>
            </div>
          </div>
        </Section>
      </main>

      <Footer />
    </div>
  );
}
