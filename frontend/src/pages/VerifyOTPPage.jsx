import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth, homePath } from '../context/AuthContext';

const VerifyOTPPage = () => {
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOtp } = useAuth();
  
  // Extract email from query parameter: /verify-otp?email=user@example.com
  const searchParams = new URLSearchParams(location.search);
  const email = searchParams.get('email') || 'your email';

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const loggedInUser = await verifyOtp(email, otp);
      setMessage('Email verified successfully! Redirecting to your dashboard...');
      setTimeout(() => navigate(homePath(loggedInUser.role)), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Please check your code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      {/* Header / Navbar */}
      <header className="bg-white shadow-sm py-4 px-4 sm:px-8 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-sm bg-blood" aria-hidden="true"></span>
          <h1 className="text-xl sm:text-2xl font-bold text-blood-dark">Blood Donor Match</h1>
        </Link>
        <Link 
          to="/login" 
          className="px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-800 font-semibold hover:text-blood-dark transition-all duration-200"
        >
          Log In
        </Link>
      </header>

      {/* Main OTP Card Container */}
      <main className="flex-grow flex items-center justify-center px-4 py-8">
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-md border border-gray-100 w-full max-w-md text-center">
          
          {/* Icon Badge */}
          <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <span className="h-3 w-3 rounded-full bg-blood" aria-hidden="true"></span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6">
            Enter the 6-digit verification code sent to <br />
            <strong className="text-gray-900 font-semibold break-all">{email}</strong>
          </p>

          {/* Feedback Messages */}
          {message && (
            <div className="p-3 mb-4 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">
              {message}
            </div>
          )}
          {error && (
            <div className="p-3 mb-4 bg-red-50 text-blood-dark text-sm rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {/* OTP Form */}
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <input
                type="text"
                inputMode="numeric"
                maxLength="6"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full text-center tracking-widest text-2xl sm:text-3xl font-mono py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blood focus:border-blood transition-all"
                placeholder="123456"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className={`w-full py-3 px-4 bg-blood-dark text-white font-medium text-base rounded-lg shadow-md transition-all duration-200 ${
                loading || otp.length !== 6
                  ? 'opacity-60 cursor-not-allowed'
                  : 'hover:bg-blood hover:scale-[1.01] hover:shadow-lg hover:shadow-red-200'
              }`}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>

          {/* Additional Links */}
          <div className="mt-6 text-xs sm:text-sm text-gray-500">
            <p>
              Didn't receive code?{' '}
              <button 
                type="button" 
                onClick={() => alert('OTP Resent! Check your inbox or console.')}
                className="text-blood-dark font-semibold hover:underline"
              >
                Resend Code
              </button>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white py-4 sm:py-6 text-center text-xs sm:text-sm text-gray-500 border-t">
        <p>&copy; {new Date().getFullYear()} Blood Donor Match System. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default VerifyOTPPage;