import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Section from '../../components/ui/Section';

/**
 * Landing Page - University Portal Style
 */
export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#1f3c88] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">E</span>
              </div>
              <span className="text-xl font-bold text-[#1f3c88]">ExamZone</span>
            </Link>
            
            <Link to="/login">
              <Button variant="outline" size="sm">Sign In</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <Section background="white">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-[#1f3c88] mb-6">
            Modern Academic Assessment Platform
          </h1>
          <p className="text-xl text-slate-600 mb-8 leading-relaxed">
            Streamline your examination process with AI-powered grading, 
            secure exam delivery, and comprehensive classroom management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/get-started?role=teacher">
              <Button variant="primary" size="lg">Get Started as Teacher</Button>
            </Link>
            <Link to="/get-started?role=student">
              <Button variant="secondary" size="lg">Get Started as Student</Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg">Sign In</Button>
            </Link>
          </div>
        </div>
      </Section>

      {/* Features Section */}
      <Section background="slate">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#1f3c88] mb-4">Platform Features</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Comprehensive tools designed for modern academic institutions
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card hover>
            <div className="p-6 text-center">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-lg font-semibold text-[#1f3c88] mb-2">AI-Powered Grading</h3>
              <p className="text-sm text-slate-600">
                Automated evaluation with intelligent scoring algorithms
              </p>
            </div>
          </Card>
          
          <Card hover>
            <div className="p-6 text-center">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-lg font-semibold text-[#1f3c88] mb-2">Secure Exams</h3>
              <p className="text-sm text-slate-600">
                Protected exam environment with integrity monitoring
              </p>
            </div>
          </Card>
          
          <Card hover>
            <div className="p-6 text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-[#1f3c88] mb-2">Automated Evaluation</h3>
              <p className="text-sm text-slate-600">
                Instant results with detailed performance analytics
              </p>
            </div>
          </Card>
          
          <Card hover>
            <div className="p-6 text-center">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-lg font-semibold text-[#1f3c88] mb-2">Classroom System</h3>
              <p className="text-sm text-slate-600">
                Complete class management and student tracking
              </p>
            </div>
          </Card>
        </div>
      </Section>

      {/* Teacher/Student Blocks */}
      <Section background="white">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <div className="p-8">
              <div className="text-4xl mb-4">👨‍🏫</div>
              <h3 className="text-2xl font-bold text-[#1f3c88] mb-4">For Teachers</h3>
              <ul className="space-y-3 text-slate-600 mb-6">
                <li className="flex items-start">
                  <span className="text-[#1f3c88] mr-2">✓</span>
                  <span>Create and manage multiple classes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#1f3c88] mr-2">✓</span>
                  <span>Design custom exams with AI assistance</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#1f3c88] mr-2">✓</span>
                  <span>Automated grading and analytics</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#1f3c88] mr-2">✓</span>
                  <span>Track student progress and performance</span>
                </li>
              </ul>
              <Link to="/get-started?role=teacher">
                <Button variant="primary" className="w-full">Get Started as Teacher</Button>
              </Link>
            </div>
          </Card>
          
          <Card>
            <div className="p-8">
              <div className="text-4xl mb-4">🎓</div>
              <h3 className="text-2xl font-bold text-[#1f3c88] mb-4">For Students</h3>
              <ul className="space-y-3 text-slate-600 mb-6">
                <li className="flex items-start">
                  <span className="text-[#1f3c88] mr-2">✓</span>
                  <span>Join classes with invitation codes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#1f3c88] mr-2">✓</span>
                  <span>Take secure online examinations</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#1f3c88] mr-2">✓</span>
                  <span>Receive instant feedback and grades</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#1f3c88] mr-2">✓</span>
                  <span>View performance history and analytics</span>
                </li>
              </ul>
              <Link to="/get-started?role=student">
                <Button variant="primary" className="w-full">Get Started as Student</Button>
              </Link>
            </div>
          </Card>
        </div>
      </Section>

      {/* Footer */}
      <footer className="bg-[#1f3c88] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-[#1f3c88] font-bold">E</span>
                </div>
                <span className="text-lg font-bold">ExamZone</span>
              </div>
              <p className="text-blue-200 text-sm">
                Modern academic assessment platform for institutions worldwide.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-blue-200">
                <li><Link to="/features" className="hover:text-white">Features</Link></li>
                <li><Link to="/how-it-works" className="hover:text-white">How It Works</Link></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-blue-200">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-blue-200">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-blue-700 mt-8 pt-8 text-center text-sm text-blue-200">
            <p>&copy; 2026 ExamZone. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
