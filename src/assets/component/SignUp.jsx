import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
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
  const [localOtp, setLocalOtp] = useState(''); // Holds OTP when testing locally without SMTP credentials
  const [infoMessage, setInfoMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);

    const { name, email, password, confirmPassword } = formData;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

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
    <div className="flex flex-col min-h-screen bg-gradient-to-r from-sky-300 to-violet-400 p-4">
      <div className="flex justify-center items-center w-full h-full mt-8">
        <div className="w-full max-w-md p-6 bg-opacity-30 bg-white rounded-3xl shadow-2xl backdrop-filter backdrop-blur-lg">
          <h1 className="text-2xl font-bold text-center mb-6">
            {isOtpSent ? 'Verify Email' : 'Sign Up'}
          </h1>

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
            <div className="mb-4 p-3 bg-amber-100 bg-opacity-80 border border-amber-300 rounded-lg text-amber-900 text-xs text-center font-semibold">
              Local Dev Mode (SMTP disabled): <span className="text-sm text-violet-700 select-all font-mono ml-1">{localOtp}</span>
            </div>
          )}

          {!isOtpSent ? (
            <form onSubmit={handleSignUp} className="space-y-3 sm:space-y-5">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Name:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter full name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-400 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Email:</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="name@company.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-400 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Password:</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-400 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Confirm Password:</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
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
                {loading ? 'Registering...' : 'Sign Up'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 text-center mb-4">
                  Please enter the 6-digit OTP code sent to <strong>{formData.email}</strong>.
                </p>
                <label className="block text-gray-700 text-sm font-bold mb-2 text-center">Verification Code:</label>
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-violet-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-violet-700 transition-colors duration-200 shadow-md transform hover:scale-[1.02] active:scale-[0.98] disabled:bg-violet-400"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <div className="flex justify-between items-center text-xs pt-2">
                <button
                  type="button"
                  onClick={() => setIsOtpSent(false)}
                  className="text-gray-600 hover:text-violet-700 font-semibold"
                >
                  ← Edit Email
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-violet-700 hover:underline font-bold"
                >
                  Resend OTP Code
                </button>
              </div>
            </form>
          )}

          <p className="text-center mt-6 text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/" className="text-violet-700 font-bold hover:underline transition-all">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
