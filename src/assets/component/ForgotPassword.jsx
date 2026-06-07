import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../images/LOGO1.jpeg';
import dunesBg from '../images/dark_dunes_bg.png';
import { API_BASE_URL } from '../../config';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localOtp, setLocalOtp] = useState(''); // Local fallback for testing without SMTP
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

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

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
    <div className="flex items-center justify-center min-h-screen bg-[#110f18] p-4 sm:p-6 md:p-10 font-sans text-gray-200">
      <div className="flex w-full max-w-5xl bg-[#181622] rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-[#262235]">
        
        {/* Left Side: Dunes Graphic Panel */}
        <div 
          className="hidden md:flex md:w-1/2 relative bg-cover bg-center flex-col justify-between p-10 select-none overflow-hidden"
          style={{ backgroundImage: `url(${dunesBg})` }}
        >
          {/* Dark Overlay for better contrast */}
          <div className="absolute inset-0 bg-[#14121d] bg-opacity-20 pointer-events-none" />

          {/* Top Row: Logo & Button */}
          <div className="relative z-10 flex items-center w-full">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Sakshi Logo" className="h-9 w-auto rounded-lg shadow-md border border-[#3e3857]" />
              <span className="font-bold text-lg tracking-wider bg-gradient-to-r from-violet-200 to-indigo-100 bg-clip-text text-transparent">
                SAKSHI E.
              </span>
            </div>
          </div>

          {/* Bottom Row: Text Carousel & Pagination Dots */}
          <div className="relative z-10 mt-auto">
            <h2 className="text-3xl font-extrabold leading-tight text-white drop-shadow-md">
              Restoring Security,<br />Ensuring Access.
            </h2>
            <p className="text-sm text-gray-300 mt-2 max-w-xs leading-relaxed">
              Verify your identity via SMTP secure verification codes to regain access to your account.
            </p>
            {/* Slide indicators */}
            <div className="flex gap-1.5 mt-6">
              <span className="w-1.5 h-1.5 rounded-full bg-white bg-opacity-30"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-white bg-opacity-30"></span>
              <span className="w-6 h-1.5 rounded-full bg-violet-500 transition-all"></span>
            </div>
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 md:p-14 flex flex-col justify-center bg-[#181622] relative">
          
          {/* Logo overlay on Mobile screens */}
          <div className="flex md:hidden items-center gap-2 mb-6">
            <img src={logo} alt="Sakshi Logo" className="h-9 w-auto rounded-lg" />
            <span className="font-bold text-lg text-white">Sakshi Enterprises</span>
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Reset Password</h1>
            {!isOtpSent && (
              <p className="text-sm text-gray-400 mt-2">
                Remember your password?{' '}
                <Link to="/" className="text-violet-400 font-bold hover:text-violet-300 hover:underline transition">
                  Log In
                </Link>
              </p>
            )}
          </div>

          {error && (
            <p className="text-red-400 bg-red-950 bg-opacity-50 border border-red-900/50 p-3 rounded-xl text-xs sm:text-sm mb-4 text-center font-medium animate-shake">
              {error}
            </p>
          )}

          {infoMessage && (
            <p className="text-emerald-400 bg-emerald-950 bg-opacity-50 border border-emerald-900/50 p-3 rounded-xl text-xs sm:text-sm mb-4 text-center font-medium">
              {infoMessage}
            </p>
          )}

          {isOtpSent && localOtp && (
            <div className="mb-4 p-3 bg-amber-950 bg-opacity-50 border border-amber-900/50 rounded-xl text-amber-300 text-xs text-center font-semibold animate-pulse">
              Local Dev Mode (SMTP disabled): <span className="text-sm text-violet-300 select-all font-mono ml-1">{localOtp}</span>
            </div>
          )}

          {!isOtpSent ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <p className="text-sm text-gray-400 leading-relaxed">
                Enter your registered email address below, and we'll send you an OTP to reset your password.
              </p>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@company.com"
                  className="w-full bg-[#201d2c] border border-[#37314e] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition duration-200 transform hover:scale-[1.01] active:scale-[0.99] disabled:bg-violet-800 disabled:cursor-not-allowed flex items-center justify-center text-sm"
              >
                {loading ? 'Sending Code...' : 'Send Reset Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 text-center">
                  Reset Code (OTP)
                </label>
                <input
                  type="text"
                  maxLength="6"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  placeholder="123456"
                  className="w-full text-center tracking-widest text-lg font-mono bg-[#201d2c] border border-[#37314e] rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-[#201d2c] border border-[#37314e] rounded-xl pl-4 pr-11 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition focus:outline-none"
                  >
                    {showNewPassword ? (
                      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-[#201d2c] border border-[#37314e] rounded-xl pl-4 pr-11 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition focus:outline-none"
                  >
                    {showConfirmPassword ? (
                      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg transition duration-200 transform hover:scale-[1.01] active:scale-[0.99] disabled:bg-violet-800 disabled:cursor-not-allowed flex items-center justify-center text-sm"
              >
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </button>
              
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsOtpSent(false)}
                  className="text-xs text-gray-400 hover:text-white font-semibold transition"
                >
                  ← Go Back
                </button>
              </div>
            </form>
          )}

          <p className="text-center mt-6 text-sm text-gray-400">
            Remembered your password?{' '}
            <Link to="/" className="text-violet-400 font-bold hover:text-violet-300 hover:underline transition">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
