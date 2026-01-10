import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { loginWithGoogle, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated && user) {
      const redirectPath = user.role === 'teacher' ? '/teacher' : '/student';
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const user = await loginWithGoogle(credentialResponse.credential);
      
      // Redirect based on role
      const redirectPath = user.role === 'teacher' ? '/teacher' : '/student';
      navigate(redirectPath, { replace: true });
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please try again.');
    }
  };

  const handleGoogleError = () => {
    console.error('Google login failed');
    alert('Google login failed. Please try again.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">ExamZone</h1>
          <p className="text-gray-600 mt-2">Sign in to continue</p>
        </div>
        
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap
            theme="filled_blue"
            size="large"
            text="signin_with"
            shape="rectangular"
          />
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Sign in with your Google account</p>
          <p className="mt-1">Teachers and students use the same login</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
