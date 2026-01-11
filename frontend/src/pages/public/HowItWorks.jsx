import Navbar from '../../components/ui/Navbar';
import Footer from '../../components/ui/Footer';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Link } from 'react-router-dom';

/**
 * How It Works Page
 * Step-by-step guide for teachers and students
 */
export default function HowItWorks() {
  const teacherSteps = [
    {
      number: '1',
      title: 'Sign Up with Google',
      description: 'Create your account instantly using your Google credentials. No complicated forms.',
    },
    {
      number: '2',
      title: 'Create a Class',
      description: 'Set up your class with a name and subject. Get a unique class code.',
    },
    {
      number: '3',
      title: 'Invite Students',
      description: 'Send email invitations to your students or share the class code.',
    },
    {
      number: '4',
      title: 'Design Exams',
      description: 'Create exams with custom questions, duration, and AI evaluation settings.',
    },
    {
      number: '5',
      title: 'Publish & Monitor',
      description: 'Publish exams and watch as AI automatically grades student submissions.',
    },
    {
      number: '6',
      title: 'Review Results',
      description: 'Access detailed analytics and insights about student performance.',
    },
  ];

  const studentSteps = [
    {
      number: '1',
      title: 'Sign Up with Google',
      description: 'Join ExamZone using your Google account. Quick and secure.',
    },
    {
      number: '2',
      title: 'Join a Class',
      description: 'Accept an email invitation or enter a class code from your teacher.',
    },
    {
      number: '3',
      title: 'Take Exams',
      description: 'Access published exams and submit your answers within the time limit.',
    },
    {
      number: '4',
      title: 'Get Instant Feedback',
      description: 'Receive AI-generated grades and detailed feedback immediately.',
    },
    {
      number: '5',
      title: 'Track Progress',
      description: 'Monitor your performance across all exams and classes.',
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
              How It Works
            </h1>
            <p className="text-xl text-slate-700 max-w-2xl mx-auto">
              Simple steps to get started with ExamZone
            </p>
          </div>
        </Section>

        {/* For Teachers */}
        <Section>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              For Teachers
            </h2>
            <p className="text-slate-600">
              Set up your classroom and start evaluating exams in minutes
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teacherSteps.map((step) => (
              <Card key={step.number}>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-slate-600">{step.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Section>

        {/* For Students */}
        <Section background="slate">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              For Students
            </h2>
            <p className="text-slate-600">
              Join classes and take exams with instant feedback
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {studentSteps.map((step) => (
              <Card key={step.number}>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-slate-600">{step.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Section>

        {/* CTA */}
        <Section className="text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Join ExamZone today and experience the future of exam evaluation
          </p>
          <Link to="/login">
            <Button variant="primary" size="lg">
              Sign Up Now
            </Button>
          </Link>
        </Section>
      </main>

      <Footer />
    </div>
  );
}
