import Navbar from '../../components/ui/Navbar';
import Footer from '../../components/ui/Footer';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import { Users, FileText, Lightbulb, Zap, BarChart, Lock } from 'lucide-react';

/**
 * Features Page
 * Detailed platform features
 */
export default function Features() {
  const features = [
    {
      title: 'Class Management',
      description: 'Create and organize classes with unique codes. Invite students via email.',
      icon: <Users className="w-8 h-8" />,
    },
    {
      title: 'Exam Creation',
      description: 'Design custom exams with flexible questions and AI evaluation settings.',
      icon: <FileText className="w-8 h-8" />,
    },
    {
      title: 'AI Grading',
      description: 'Automated evaluation with advanced AI models that understand context.',
      icon: <Lightbulb className="w-8 h-8" />,
    },
    {
      title: 'Instant Feedback',
      description: 'Students receive immediate results with detailed explanations.',
      icon: <Zap className="w-8 h-8" />,
    },
    {
      title: 'Analytics Dashboard',
      description: 'Track student performance with comprehensive analytics and insights.',
      icon: <BarChart className="w-8 h-8" />,
    },
    {
      title: 'Secure Access',
      description: 'Google OAuth authentication with role-based access control.',
      icon: <Lock className="w-8 h-8" />,
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
