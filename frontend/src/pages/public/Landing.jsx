import { Link } from 'react-router-dom';
import Navbar from '../../components/ui/Navbar';
import Footer from '../../components/ui/Footer';
import Button from '../../components/ui/Button';
import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import { BookOpen, CheckCircle, Zap, Clock, Shield } from 'lucide-react';

/**
 * Landing Page
 * Main entry point with hero and platform overview
 */
export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <Section background="indigo" className="py-20">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-slate-900 mb-6">
              AI-Powered Exam Evaluation
            </h1>
            <p className="text-xl text-slate-700 mb-8 max-w-2xl mx-auto">
              ExamZone transforms the way teachers create and evaluate exams. 
              Automated grading, instant feedback, and intelligent insights.
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/login">
                <Button variant="primary" size="lg">
                  Get Started
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button variant="outline" size="lg">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </Section>

        {/* Teacher vs Student Section */}
        <Section>
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Built for Teachers and Students
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card hover>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">For Teachers</h3>
                <p className="text-slate-600 mb-4">
                  Create exams, invite students, and let AI evaluate answers automatically. 
                  Get detailed analytics and save hours of grading time.
                </p>
                <ul className="text-left text-sm text-slate-600 space-y-2">
                  <li>✓ Create and manage classes</li>
                  <li>✓ Design custom exams</li>
                  <li>✓ AI-powered grading</li>
                  <li>✓ Instant results and analytics</li>
                </ul>
              </div>
            </Card>

            <Card hover>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">For Students</h3>
                <p className="text-slate-600 mb-4">
                  Join classes, take exams online, and receive instant feedback. 
                  Track your progress and improve with detailed explanations.
                </p>
                <ul className="text-left text-sm text-slate-600 space-y-2">
                  <li>✓ Join classes with invites</li>
                  <li>✓ Take exams online</li>
                  <li>✓ Instant AI feedback</li>
                  <li>✓ Track your performance</li>
                </ul>
              </div>
            </Card>
          </div>
        </Section>

        {/* Platform Pillars */}
        <Section background="slate">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Platform Pillars
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-7 h-7 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">AI-Powered</h3>
              <p className="text-slate-600">
                Advanced AI models evaluate answers with accuracy and provide detailed feedback
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Real-Time</h3>
              <p className="text-slate-600">
                Instant grading and feedback so students can learn immediately
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Secure</h3>
              <p className="text-slate-600">
                Enterprise-grade security with Google OAuth and encrypted data
              </p>
            </div>
          </div>
        </Section>

        {/* CTA Section */}
        <Section background="indigo" className="text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Ready to Transform Your Exams?
          </h2>
          <p className="text-lg text-slate-700 mb-8 max-w-2xl mx-auto">
            Join thousands of teachers and students using ExamZone for smarter evaluation
          </p>
          <Link to="/login">
            <Button variant="primary" size="lg">
              Start Free Today
            </Button>
          </Link>
        </Section>
      </main>

      <Footer />
    </div>
  );
}
