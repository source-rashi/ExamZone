import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/ui/Navbar';
import Footer from '../../components/ui/Footer';
import Card from '../../components/ui/Card';

/**
 * Login Page
 * Google OAuth authentication
 */
export default function Login() {
  const navigate = useNavigate();
  const { loginWithGoogle, isAuthenticated, user, loading } = useAuth();
  const [error, setError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard';
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoggingIn(true);
      setError('');
      
      const user = await loginWithGoogle(credentialResponse.credential);
      
      // Navigate based on role
      const redirectPath = user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard';
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
      setLoggingIn(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google authentication failed. Please try again.');
    setLoggingIn(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center bg-slate-50 py-12">
        <div className="w-full max-w-md px-4">
          <Card className="text-center">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-3xl">E</span>
              </div>
            </div>

            {/* Heading */}
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Welcome to ExamZone
            </h1>
            <p className="text-slate-600 mb-8">
              Sign in with your Google account to get started
            </p>

            {/* Google Login Button */}
            <div className="flex justify-center mb-6">
              {loggingIn ? (
                <div className="text-slate-600">Logging in...</div>
              ) : (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap
                  theme="filled_blue"
                  size="large"
                  text="signin_with"
                  shape="rectangular"
                />
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-3 bg-red-50 text-red-700 text-sm rounded">
                {error}
              </div>
            )}

            {/* Info */}
            <div className="border-t border-slate-200 pt-6">
              <p className="text-sm text-slate-500 mb-4">
                <strong>No separate signup required</strong>
              </p>
              <p className="text-xs text-slate-500">
                Your account will be created automatically when you sign in with Google for the first time. 
                Teachers and students use the same login process.
              </p>
            </div>

            {/* Benefits */}
            <div className="mt-6 text-left space-y-2">
              <p className="text-xs text-slate-600 flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Secure authentication with Google
              </p>
              <p className="text-xs text-slate-600 flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Access from any device
              </p>
              <p className="text-xs text-slate-600 flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Free to get started
              </p>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
