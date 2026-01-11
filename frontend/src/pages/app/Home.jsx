import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/ui/Navbar';
import Footer from '../../components/ui/Footer';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

/**
 * App Home Page
 * Landing page after authentication
 */
export default function Home() {
  const { user } = useAuth();
  
  const teacherFeatures = [
    {
      title: 'Classes',
      description: 'Create and manage your classes',
      link: '/teacher/dashboard',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      title: 'Exams',
      description: 'Create and publish exams',
      link: '/teacher/dashboard',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ];

  const studentFeatures = [
    {
      title: 'My Classes',
      description: 'View your enrolled classes',
      link: '/student/dashboard',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      title: 'Exams',
      description: 'Take available exams',
      link: '/student/dashboard',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
  ];

  const features = user?.role === 'teacher' ? teacherFeatures : studentFeatures;
  const dashboardLink = user?.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard';

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Welcome Section */}
        <Section background="indigo">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Welcome, {user?.name}!
            </h1>
            <p className="text-lg text-slate-700 mb-6">
              You're logged in as a <span className="font-semibold capitalize">{user?.role}</span>
            </p>
            <Link to={dashboardLink}>
              <Button variant="primary" size="lg">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </Section>

        {/* Quick Access */}
        <Section>
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Quick Access
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {features.map((feature, index) => (
              <Link key={index} to={feature.link}>
                <Card hover className="h-full">
                  <div className="text-center">
                    <div className="text-indigo-600 flex justify-center mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600">{feature.description}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </Section>

        {/* What's Next */}
        <Section background="slate">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">
              What's Next?
            </h2>
            {user?.role === 'teacher' ? (
              <div className="space-y-4">
                <Card>
                  <h3 className="font-bold text-slate-900 mb-2">1. Create Your First Class</h3>
                  <p className="text-sm text-slate-600">
                    Set up a class to organize your students and exams.
                  </p>
                </Card>
                <Card>
                  <h3 className="font-bold text-slate-900 mb-2">2. Invite Students</h3>
                  <p className="text-sm text-slate-600">
                    Send email invitations to your students to join the class.
                  </p>
                </Card>
                <Card>
                  <h3 className="font-bold text-slate-900 mb-2">3. Create an Exam</h3>
                  <p className="text-sm text-slate-600">
                    Design your first exam with AI-powered evaluation settings.
                  </p>
                </Card>
              </div>
            ) : (
              <div className="space-y-4">
                <Card>
                  <h3 className="font-bold text-slate-900 mb-2">1. Join a Class</h3>
                  <p className="text-sm text-slate-600">
                    Accept an invitation from your teacher or enter a class code.
                  </p>
                </Card>
                <Card>
                  <h3 className="font-bold text-slate-900 mb-2">2. Take Exams</h3>
                  <p className="text-sm text-slate-600">
                    View available exams and submit your answers.
                  </p>
                </Card>
                <Card>
                  <h3 className="font-bold text-slate-900 mb-2">3. Track Your Progress</h3>
                  <p className="text-sm text-slate-600">
                    Monitor your performance and see detailed feedback.
                  </p>
                </Card>
              </div>
            )}
          </div>
        </Section>
      </main>

      <Footer />
    </div>
  );
}
