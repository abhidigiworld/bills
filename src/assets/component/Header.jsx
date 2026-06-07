import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './printStyles.css';
import logo from '../images/LOGO1.jpeg'; // Use LOGO1.jpeg which we know exists

function Header() {
  const navigate = useNavigate();
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

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/'); 
  };

  return (
    <header className="bg-white dark:bg-[#181622] text-slate-800 dark:text-gray-200 border-b border-slate-200 dark:border-[#262235] px-6 py-4 print-hidden transition-colors duration-300 shadow-sm">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold flex items-center">
          <Link to={'/Main'} className="flex items-center gap-2.5 group">
            <img src={logo} alt="Sakshi Enterprises Logo" className="h-9 w-auto rounded-lg shadow-md border border-slate-200 dark:border-[#3e3857]" />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-violet-200 dark:to-indigo-100 bg-clip-text text-transparent tracking-wide font-extrabold transition-all group-hover:opacity-80">
              SAKSHI ENTERPRISES
            </span>
          </Link>
        </h1>
        <p className="text-sm text-slate-500 dark:text-gray-400 font-medium hidden md:block">Providing Quality Services Since 2024</p>
        
        <div className="flex items-center gap-4">
          {/* Light/Dark Toggle Button */}
          <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-[#3e3857] hover:bg-slate-100 dark:hover:bg-[#201d2c] transition duration-200 text-slate-600 dark:text-gray-300 focus:outline-none"
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

          <button 
            onClick={handleLogout} 
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-xl text-sm transition duration-200 shadow-sm focus:outline-none"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
