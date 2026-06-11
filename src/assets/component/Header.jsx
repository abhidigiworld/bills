import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import './printStyles.css';
import logo from '../images/LOGO1.jpeg';

function Header() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [currentUser, setCurrentUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otp, setOtp] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const sessionUser = localStorage.getItem('user');
    if (sessionUser) {
      const parsedUser = JSON.parse(sessionUser);
      setCurrentUser(parsedUser);
      setProfileForm({
        name: parsedUser.name || '',
        email: parsedUser.email || '',
        password: '',
        confirmPassword: ''
      });
      setShowOtpVerification(false);
      setOtp('');
      setProfileError('');
      setProfileSuccess('');
    }
  }, [isProfileModalOpen]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!event.target.closest('.hamburger-container')) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/logout`);
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleResendOtp = async () => {
    setProfileError('');
    setProfileSuccess('');
    if (!currentUser) return;
    try {
      await axios.post(`${API_BASE_URL}/api/users/profile/request-otp`, { email: currentUser.email });
      setProfileSuccess('A new verification code has been sent to your email.');
    } catch (err) {
      setProfileError(err.response?.data?.error || 'Failed to resend verification code.');
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!currentUser || !currentUser.id) return;

    if (!profileForm.name.trim()) {
      setProfileError('Name is required.');
      return;
    }

    if (!profileForm.email.trim()) {
      setProfileError('Email is required.');
      return;
    }

    // If changing password, validation rules apply
    if (profileForm.password) {
      if (profileForm.password.length < 6) {
        setProfileError('Password must be at least 6 characters long.');
        return;
      }
      if (profileForm.password !== profileForm.confirmPassword) {
        setProfileError('Passwords do not match.');
        return;
      }

      // If user hasn't requested OTP yet, request it first
      if (!showOtpVerification) {
        setIsSaving(true);
        try {
          await axios.post(`${API_BASE_URL}/api/users/profile/request-otp`, { email: currentUser.email });
          setProfileSuccess('Verification code has been sent to your email.');
          setShowOtpVerification(true);
        } catch (err) {
          setProfileError(err.response?.data?.error || 'Failed to send OTP.');
        } finally {
          setIsSaving(false);
        }
        return;
      }
    }

    // Proceed to save profile changes (either name/email only OR verified password with OTP)
    setIsSaving(true);
    try {
      const response = await axios.put(`${API_BASE_URL}/api/users/profile/${currentUser.id}`, {
        name: profileForm.name,
        email: profileForm.email,
        password: profileForm.password || undefined,
        otp: showOtpVerification ? otp : undefined
      });

      // Update localStorage session
      const updatedUser = {
        ...currentUser,
        name: response.data.name,
        email: response.data.email
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      setProfileSuccess('Profile updated successfully!');

      // Reload page to reflect changes everywhere
      setTimeout(() => {
        setIsProfileModalOpen(false);
        window.location.reload();
      }, 1200);

    } catch (err) {
      console.error('Error updating profile:', err);
      setProfileError(err.response?.data?.error || 'Failed to update profile details.');
    } finally {
      setIsSaving(false);
    }
  };



  return (
    <>
      <header className="sticky top-0 z-50 bg-white/85 dark:bg-[#181622]/85 backdrop-blur-md text-slate-800 dark:text-gray-200 border-b border-slate-200/60 dark:border-[#262235]/65 px-6 py-3.5 print-hidden transition-colors duration-300 shadow-sm">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold flex items-center">
          <Link to={'/Main'} className="flex items-center gap-2.5 group">
            <img src={logo} alt="Sakshi Enterprises Logo" className="h-9 w-auto rounded-md shadow-md border border-slate-200 dark:border-[#3e3857]" />
            <div className="flex flex-col justify-center leading-[1.05]">
              <span className="company-name text-[13px] tracking-wider block transition-all group-hover:opacity-90">
                SAKSHI
              </span>
              <span className="company-name text-[8px] tracking-[0.22em] block opacity-90 transition-all group-hover:opacity-85">
                ENTERPRISES
              </span>
            </div>
          </Link>
        </h1>

        <div className="flex items-center gap-3">
          {/* Light/Dark Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-lg border border-slate-200 dark:border-[#3e3857] hover:bg-slate-100 dark:hover:bg-[#201d2c] transition duration-200 text-slate-600 dark:text-gray-300 focus:outline-none"
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            )}
          </button>

          {/* Hamburger Menu dropdown */}
          <div className="relative hamburger-container">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2.5 rounded-lg border border-slate-200 dark:border-[#3e3857] hover:bg-slate-100 dark:hover:bg-[#201d2c] transition duration-200 text-slate-600 dark:text-gray-300 focus:outline-none flex items-center justify-center"
              aria-label="Menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] rounded-xl shadow-xl z-50 py-2 transition-colors duration-300 animate-slide-down">
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-[#262235]">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {currentUser ? currentUser.name : 'Guest User'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-gray-400 capitalize truncate mt-0.5">
                    Role: <span className="font-semibold text-indigo-600 dark:text-violet-400">{currentUser ? currentUser.role : 'Guest'}</span>
                  </p>
                </div>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-[#201d2c]/50 text-sm font-semibold text-slate-700 dark:text-gray-200 flex items-center gap-2 transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  My Profile
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-2 border-t border-slate-100 dark:border-[#262235]/60 transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] w-full max-w-md rounded-xl p-6 shadow-2xl relative transition-all duration-300 animate-slide-down">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-[#262235] pb-3 mb-4">
              My Profile Details
            </h3>

            {showOtpVerification ? (
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-400 p-4 rounded-lg text-xs sm:text-sm font-medium leading-relaxed">
                  To confirm your password change, please enter the 6-digit verification code sent to <strong>{currentUser?.email}</strong>.
                </div>

                {profileError && (
                  <div className="bg-red-50 dark:bg-red-950/25 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 px-4 py-2.5 rounded-lg text-center text-xs font-semibold">
                    {profileError}
                  </div>
                )}
                {profileSuccess && (
                  <div className="bg-green-50 dark:bg-green-950/25 border border-green-200 dark:border-green-900/40 text-green-600 dark:text-green-400 px-4 py-2.5 rounded-lg text-center text-xs font-semibold animate-pulse">
                    {profileSuccess}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">6-Digit Verification Code</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter OTP code"
                    maxLength="6"
                    className="w-full text-center tracking-widest text-lg font-bold px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                    required
                  />
                </div>

                <div className="flex justify-between items-center text-xs pt-1">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-indigo-600 dark:text-violet-400 hover:underline font-bold focus:outline-none"
                  >
                    Resend Verification Code
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowOtpVerification(false);
                      setProfileError('');
                      setProfileSuccess('');
                      setOtp('');
                    }}
                    className="text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200 font-semibold focus:outline-none"
                  >
                    ← Back to Edit
                  </button>
                </div>

                <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-[#262235] mt-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 rounded-lg shadow transition duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Verifying...' : 'Verify and Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileModalOpen(false);
                      setShowOtpVerification(false);
                      setOtp('');
                    }}
                    className="w-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-gray-300 font-bold py-2.5 rounded-lg shadow transition duration-200 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                {profileError && (
                  <div className="bg-red-50 dark:bg-red-950/25 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 px-4 py-2.5 rounded-lg text-center text-xs font-semibold">
                    {profileError}
                  </div>
                )}
                {profileSuccess && (
                  <div className="bg-green-50 dark:bg-green-950/25 border border-green-200 dark:border-green-900/40 text-green-600 dark:text-green-400 px-4 py-2.5 rounded-lg text-center text-xs font-semibold animate-pulse">
                    {profileSuccess}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={profileForm.name}
                    onChange={handleProfileInputChange}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={profileForm.email}
                    onChange={handleProfileInputChange}
                    disabled={currentUser?.role !== 'admin'}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    required
                  />
                </div>

                <div className="border-t border-slate-100 dark:border-[#262235] pt-4 my-2">
                  <p className="text-xs text-slate-400 mb-3">Leave password fields blank if you do not wish to change it.</p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">New Password</label>
                      <input
                        type="password"
                        name="password"
                        value={profileForm.password}
                        onChange={handleProfileInputChange}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={profileForm.confirmPassword}
                        onChange={handleProfileInputChange}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-[#262235] mt-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 rounded-lg shadow transition duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(false)}
                    className="w-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-gray-300 font-bold py-2.5 rounded-lg shadow transition duration-200 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default Header;
