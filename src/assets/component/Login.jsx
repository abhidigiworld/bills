import React, { useState, useEffect } from 'react';
import axios from 'axios';
import logo from '../images/LOGO1.jpeg';
import dunesBg from '../images/dark_dunes_bg.png';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../../config';

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

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

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessMsg(location.state.successMessage);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const loginData = { username, password };
      const response = await axios.post(`${API_BASE_URL}/login`, loginData);

      if (response.data.success) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/Main');
      } else {
        setError('Invalid username or password');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      setError(error.response?.data?.message || 'An error occurred while logging in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-indigo-50 dark:bg-[#110f18] p-4 sm:p-6 md:p-10 font-sans text-slate-800 dark:text-gray-200 transition-colors duration-300 relative overflow-hidden">
      {/* Background Ambient Glow Blobs */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-300/30 dark:bg-indigo-900/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-cyan-200/40 dark:bg-cyan-950/10 blur-[120px] pointer-events-none" />

      <div className="flex w-full max-w-5xl md:h-[640px] bg-white dark:bg-[#181622] rounded-[2rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-[#262235] transition-colors duration-300 relative z-10">

        {/* Left Side: Dunes Graphic Panel */}
        <div
          className="hidden md:flex md:w-1/2 relative bg-cover bg-center flex-col justify-between p-10 select-none overflow-hidden"
          style={{ backgroundImage: `url(${dunesBg})` }}
        >
          {/* Dark Overlay for better contrast */}
          <div className="absolute inset-0 bg-[#14121d] bg-opacity-20 pointer-events-none" />

          {/* Top Row: Logo */}
          <div className="relative z-10 flex items-center w-full">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Sakshi Logo" className="h-9 w-auto rounded-lg shadow-md border border-[#3e3857]" />
              <div className="flex flex-col justify-center leading-[1.05]">
                <span className="company-name-light text-[13px] tracking-wider block">
                  SAKSHI
                </span>
                <span className="company-name-light text-[8px] tracking-[0.22em] block opacity-90">
                  ENTERPRISES
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Row: Text Carousel & Pagination Dots */}
          <div className="relative z-10 mt-auto">
            <h2 className="text-3xl font-extrabold leading-tight text-white drop-shadow-md">
              Streamlining Billing,<br />Powering Payouts.
            </h2>
            <p className="text-sm text-gray-300 mt-2 max-w-xs leading-relaxed">
              Managing enterprises and invoicing with a state of the art payroll experience.
            </p>
            {/* Slide indicators */}
            <div className="flex gap-1.5 mt-6">
              <span className="w-6 h-1.5 rounded-full bg-violet-500 transition-all"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-white bg-opacity-30"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-white bg-opacity-30"></span>
            </div>
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 md:p-14 flex flex-col justify-center bg-white dark:bg-[#181622] relative transition-colors duration-300">

          {/* Light/Dark Toggle Button */}
          <button
            onClick={toggleTheme}
            className="absolute top-6 right-6 p-2.5 rounded-xl border border-slate-200 dark:border-[#3e3857] hover:bg-slate-100 dark:hover:bg-[#201d2c] transition duration-200 text-slate-600 dark:text-gray-300 focus:outline-none"
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

          {/* Logo overlay on Mobile screens */}
          <div className="flex md:hidden items-center gap-2 mb-6">
            <img src={logo} alt="Sakshi Logo" className="h-9 w-auto rounded-lg" />
            <div className="flex flex-col justify-center leading-[1.05]">
              <span className="company-name text-[13px] tracking-wider block">
                Sakshi
              </span>
              <span className="company-name text-[8px] tracking-[0.22em] block opacity-90">
                Enterprises
              </span>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-indigo-900 dark:text-white tracking-tight">Log in to account</h1>
            <p className="text-sm text-slate-600 dark:text-gray-400 mt-2">
              Don't have an account?{' '}
              <Link to="/signup" className="text-indigo-600 dark:text-violet-400 font-bold hover:text-indigo-700 dark:hover:text-violet-300 hover:underline transition">
                Sign Up
              </Link>
            </p>
          </div>

          {error && (
            <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/25 border border-red-200 dark:border-red-900/40 p-3 rounded-xl text-xs sm:text-sm mb-5 text-center font-medium animate-shake">
              {error}
            </p>
          )}
          {successMsg && (
            <p className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-900/40 p-3 rounded-xl text-xs sm:text-sm mb-5 text-center font-medium">
              {successMsg}
            </p>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Email or Username
              </label>
              <input
                type="text"
                placeholder="name@company.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition font-medium"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-indigo-600 dark:text-violet-400 hover:text-indigo-700 dark:hover:text-violet-300 transition font-bold hover:underline">
                  Forgot?
                </Link>
              </div>

              {/* Password Container */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-xl pl-4 pr-11 py-3 text-sm text-slate-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition font-medium"
                />

                {/* Eye Icon Button */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition focus:outline-none"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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
              className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-violet-600 dark:hover:bg-violet-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition duration-200 transform hover:scale-[1.01] active:scale-[0.99] disabled:bg-violet-800 disabled:cursor-not-allowed flex items-center justify-center text-sm mt-6"
            >
              {loading ? 'Logging In...' : 'Log In'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}

export default Login;
