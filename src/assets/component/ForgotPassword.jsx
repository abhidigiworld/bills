import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [localOtp, setLocalOtp] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/forgot-password`, { email });
      if (response.data.success) {
        setIsOtpSent(true);
        setInfoMessage(response.data.message || 'Password reset code has been sent to your email.');
        if (response.data.otp) {
          setLocalOtp(response.data.otp);
        }
      } else {
        setError(response.data.message || 'An error occurred. Please try again.');
      }
    } catch (error) {
      console.error('Error requesting reset code:', error);
      setError(error.response?.data?.message || 'Email not found or error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/reset-password`, {
        email,
        otp,
        newPassword
      });

      if (response.data.success) {
        setInfoMessage('Password reset successfully! Redirecting...');
        setTimeout(() => {
          navigate('/', { state: { successMessage: 'Password reset successful! You can now log in.' } });
        }, 1500);
      } else {
        setError(response.data.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setError(error.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-r from-sky-300 to-violet-400 p-4">
      <div className="flex justify-center items-center w-full h-full mt-8">
        <div className="w-full max-w-md p-6 bg-opacity-30 bg-white rounded-3xl shadow-2xl backdrop-filter backdrop-blur-lg">
          <h1 className="text-2xl font-bold text-center mb-6">Reset Password</h1>

          {error && (
            <p className="text-red-500 bg-red-100 bg-opacity-80 p-2 rounded-lg text-xs sm:text-sm mb-4 text-center border border-red-300">
              {error}
            </p>
          )}

          {infoMessage && (
            <p className="text-green-800 bg-green-100 bg-opacity-80 p-2 rounded-lg text-xs sm:text-sm mb-4 text-center border border-green-300">
              {infoMessage}
            </p>
          )}

          {isOtpSent && localOtp && (
            <div className="mb-4 p-3 bg-amber-100 bg-opacity-80 border border-amber-300 rounded-lg text-amber-900 text-xs text-center font-semibold animate-pulse">
              Local Dev Mode (SMTP disabled): <span className="text-sm text-violet-700 select-all font-mono ml-1">{localOtp}</span>
            </div>
          )}

          {!isOtpSent ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <p className="text-sm text-gray-700 text-center mb-2">
                Enter your registered email address to receive a password reset code.
              </p>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Email:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@company.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-400 focus:outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-violet-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-violet-700 transition-colors duration-200 shadow-md transform hover:scale-[1.02] active:scale-[0.98] disabled:bg-violet-400"
              >
                {loading ? 'Sending Code...' : 'Send Reset Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Reset Code (OTP):</label>
                <input
                  type="text"
                  maxLength="6"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  placeholder="123456"
                  className="w-full text-center tracking-widest text-lg font-mono px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-400 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">New Password:</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-400 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Confirm New Password:</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-400 focus:outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-violet-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-violet-700 transition-colors duration-200 shadow-md transform hover:scale-[1.02] active:scale-[0.98] disabled:bg-violet-400"
              >
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </button>
              
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsOtpSent(false)}
                  className="text-xs text-gray-600 hover:text-violet-700 font-semibold"
                >
                  ← Go Back
                </button>
              </div>
            </form>
          )}

          <p className="text-center mt-6 text-sm text-gray-600">
            Remember your password?{' '}
            <Link to="/" className="text-violet-700 font-bold hover:underline">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
