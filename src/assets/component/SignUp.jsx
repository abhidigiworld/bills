import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../images/LOGO1.jpeg';
import dunesBg from '../images/dark_dunes_bg.png';
import { API_BASE_URL } from '../../config';

function SignUp() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [localOtp, setLocalOtp] = useState(''); // Local fallback for testing without SMTP
  const [infoMessage, setInfoMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!agreeTerms) {
      setError('You must agree to the Terms & Conditions');
      return;
    }

    const { name, email, password, confirmPassword } = formData;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/signup`, { name, email, password });
      if (response.data.success) {
        setIsOtpSent(true);
        setInfoMessage(response.data.message || 'OTP verification code has been sent to your email.');
        if (response.data.otp) {
          setLocalOtp(response.data.otp);
        }
      } else {
        setError(response.data.message || 'An error occurred during sign-up');
      }
    } catch (error) {
      console.error('Error signing up:', error);
      setError(error.response?.data?.message || 'An error occurred during sign-up');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/verify-otp`, {
        email: formData.email,
        otp
      });

      if (response.data.success) {
        setInfoMessage('Account verified successfully! Redirecting...');
        setTimeout(() => {
          navigate('/', { state: { successMessage: 'Account verified successfully! You can now log in.' } });
        }, 1500);
      } else {
        setError(response.data.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setError(error.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/resend-otp`, {
        email: formData.email
      });

      if (response.data.success) {
        setInfoMessage(response.data.message || 'A new verification OTP code has been sent.');
        if (response.data.otp) {
          setLocalOtp(response.data.otp);
        }
      } else {
        setError(response.data.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      setError(error.response?.data?.message || 'Error resending OTP');
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
              Capturing Moments,<br />Creating Memories.
            </h2>
            <p className="text-sm text-gray-300 mt-2 max-w-xs leading-relaxed">
              Empowering your business workflow with automated billing and simple employee oversight.
            </p>
            {/* Slide indicators */}
            <div className="flex gap-1.5 mt-6">
              <span className="w-1.5 h-1.5 rounded-full bg-white bg-opacity-30"></span>
              <span className="w-6 h-1.5 rounded-full bg-violet-500 transition-all"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-white bg-opacity-30"></span>
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
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              {isOtpSent ? 'Verify Email' : 'Create an account'}
            </h1>
            {!isOtpSent && (
              <p className="text-sm text-gray-400 mt-2">
                Already have an account?{' '}
                <Link to="/" className="text-violet-400 font-bold hover:text-violet-300 hover:underline transition">
                  Log in
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
            <form onSubmit={handleSignUp} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter full name"
                  className="w-full bg-[#201d2c] border border-[#37314e] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="name@company.com"
                  className="w-full bg-[#201d2c] border border-[#37314e] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    placeholder="••••••••"
                    className="w-full bg-[#201d2c] border border-[#37314e] rounded-xl pl-4 pr-11 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition focus:outline-none"
                  >
                    {showPassword ? (
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
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
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

              {/* T&C Checkbox */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="rounded bg-[#201d2c] border-[#37314e] text-violet-600 focus:ring-violet-500 w-4 h-4"
                />
                <label htmlFor="agreeTerms" className="text-xs text-gray-400 leading-none">
                  I agree to the <span onClick={() => setShowTermsModal(true)} className="text-violet-400 hover:underline cursor-pointer">Terms & Conditions</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg transition duration-200 transform hover:scale-[1.01] active:scale-[0.99] disabled:bg-violet-800 disabled:cursor-not-allowed flex items-center justify-center text-sm mt-5"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 text-center mb-4 leading-relaxed">
                  We've sent a 6-digit OTP code to <strong>{formData.email}</strong>. Enter it below to activate your account.
                </p>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 text-center">
                  Verification Code
                </label>
                <input
                  type="text"
                  maxLength="6"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  placeholder="123456"
                  className="w-full text-center tracking-widest text-lg font-mono bg-[#201d2c] border border-[#37314e] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg transition duration-200 transform hover:scale-[1.01] active:scale-[0.99] disabled:bg-violet-800 disabled:cursor-not-allowed flex items-center justify-center text-sm"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <div className="flex justify-between items-center text-xs pt-2">
                <button
                  type="button"
                  onClick={() => setIsOtpSent(false)}
                  className="text-gray-400 hover:text-white font-semibold transition"
                >
                  ← Edit Details
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-violet-400 hover:text-violet-300 font-bold transition hover:underline"
                >
                  Resend Code
                </button>
              </div>
            </form>
          )}


        </div>
      </div>

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#181622] border border-[#262235] w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-scaleUp">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#262235] flex justify-between items-center bg-[#1b1926]">
              <h3 className="font-bold text-lg text-white">Terms of Service & Privacy Policy</h3>
              <button 
                onClick={() => setShowTermsModal(false)}
                className="text-gray-400 hover:text-white transition focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-gray-300 leading-relaxed max-h-[60vh]">
              <div>
                <h4 className="font-bold text-white mb-1">1. Respect for Your Privacy</h4>
                <p>
                  We value your trust immensely. Any data you provide (such as your name, email, credentials, and invoicing information) is encrypted, securely stored, and strictly processed for the operation of your billing dashboard. We commit to a strict policy: <strong>we do not sell, share, rent, or distribute your data to any third parties</strong>.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-1">2. Secure Architecture</h4>
                <p>
                  Your account verification uses direct SMTP tokens to prevent unauthorized logins. All communications are run over secure SSL connections to safeguard your business metadata.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-1">3. Limitation of Liability</h4>
                <p>
                  This administrative utility is provided on an "as-is" and "as-available" basis for organizational reference. We hold no liability for indirect business disruptions, administrative errors, or loss of access arising from local system configuration, internet outages, or third-party service dependencies.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-1">4. User Responsibility</h4>
                <p>
                  You are responsible for keeping your login credentials confidential and for all activity executed under your account.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#262235] flex justify-end bg-[#1b1926] gap-3">
              <button
                onClick={() => setShowTermsModal(false)}
                className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-5 py-2 rounded-xl transition text-xs sm:text-sm"
              >
                Accept & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SignUp;
