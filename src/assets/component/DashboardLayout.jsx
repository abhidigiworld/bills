import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import logo from '../images/LOGO1.jpeg';

function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);

  // Layout States
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // Profile Modal State (replicated from Header.jsx to preserve profile editing)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
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
    if (!sessionUser) {
      navigate('/');
      return;
    }
    setCurrentUser(JSON.parse(sessionUser));
  }, [navigate]);

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

  // Sync profile details when modal opens
  useEffect(() => {
    if (isProfileModalOpen && currentUser) {
      setProfileForm({
        name: currentUser.name || '',
        email: currentUser.email || '',
        password: '',
        confirmPassword: ''
      });
      setShowOtpVerification(false);
      setOtp('');
      setProfileError('');
      setProfileSuccess('');
    }
  }, [isProfileModalOpen, currentUser]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
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

    if (profileForm.password) {
      if (profileForm.password.length < 6) {
        setProfileError('Password must be at least 6 characters long.');
        return;
      }
      if (profileForm.password !== profileForm.confirmPassword) {
        setProfileError('Passwords do not match.');
        return;
      }

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

    setIsSaving(true);
    try {
      const response = await axios.put(`${API_BASE_URL}/api/users/profile/${currentUser.id}`, {
        name: profileForm.name,
        email: profileForm.email,
        password: profileForm.password || undefined,
        otp: showOtpVerification ? otp : undefined
      });

      const updatedUser = {
        ...currentUser,
        name: response.data.name,
        email: response.data.email
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      setProfileSuccess('Profile updated successfully!');

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

  const isAdmin = currentUser?.role === 'admin';
  const isFallbackAdmin = currentUser && !currentUser.id;

  const getPageDetails = () => {
    switch (location.pathname) {
      case '/Main':
        return {
          title: "Dashboard",
          subtitle: isAdmin ? "Unified controls and reporting analytics" : "Employee profile and record logs"
        };
      case '/existing-bills':
        return {
          title: "Existing Invoices",
          subtitle: "View, update, or delete enterprise invoices"
        };
      case '/new-bill':
        return {
          title: "Create Invoice",
          subtitle: "Generate a new tax invoice for customer billing"
        };
      case '/new-employee':
        return {
          title: "Manage Employees",
          subtitle: "Add new staff members or edit employee profiles"
        };
      case '/new-Salary':
        return {
          title: "Payroll & Slips",
          subtitle: "Generate or view staff salary slips"
        };
      case '/attendance-register':
        return {
          title: "Attendance Register",
          subtitle: "Monitor daily staff check-ins, check-outs, and shift logs"
        };
      case '/manage-payrolls':
        return {
          title: "Manage Payrolls",
          subtitle: "View, edit, or delete saved monthly payroll slips"
        };
      case '/manage-users':
        return {
          title: "Manage Users",
          subtitle: "Manage login credentials, roles, and verification"
        };
      case '/bulk-upload':
        return {
          title: "Bulk Upload PDF",
          subtitle: "Import multiple PDF invoices in a single click"
        };
      default:
        return {
          title: "Sakshi Enterprises",
          subtitle: "Enterprise management and payroll portal"
        };
    }
  };

  const { title, subtitle } = getPageDetails();

  const renderNavLink = (to, iconSvg, label) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        title={!isSidebarHovered ? label : ""}
        className={`flex items-center rounded-xl transition-all duration-300 ease-in-out h-12 ${
          isSidebarHovered 
            ? 'px-4 w-full justify-start gap-3' 
            : 'w-12 mx-auto justify-center px-0 gap-0'
        } ${
          isActive
            ? 'bg-indigo-50 dark:bg-[#201d2c] text-indigo-600 dark:text-violet-400 shadow-sm border border-indigo-100/10'
            : 'text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-slate-50 dark:hover:bg-[#201d2c]/50'
        }`}
      >
        <span className="shrink-0">{iconSvg}</span>
        <span 
          className={`text-sm font-semibold whitespace-nowrap transition-all duration-300 ease-in-out ${
            isSidebarHovered 
              ? 'opacity-100 w-auto ml-1 visible' 
              : 'opacity-0 w-0 overflow-hidden invisible'
          }`}
        >
          {label}
        </span>
      </Link>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-[#F5F6FA] dark:bg-[#110f18] text-slate-800 dark:text-gray-200 transition-colors duration-300 font-sans overflow-hidden">
      
      {/* Top Navbar Header (Full Width) */}
      <header className="flex justify-between items-center h-16 px-6 bg-white/70 dark:bg-[#181622]/70 backdrop-blur-md border-b border-slate-200/40 dark:border-[#262235]/40 shrink-0 z-30 w-full print:hidden">
        <div className="flex items-center gap-4">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="Sakshi Enterprises Logo" className="h-9 w-auto rounded-md shadow-md border border-slate-200 dark:border-[#3e3857]" />
            <div className="flex flex-col justify-center leading-[1.05]">
              <span className="text-[13px] font-black tracking-wider text-slate-800 dark:text-white uppercase">SAKSHI</span>
              <span className="text-[8px] font-bold tracking-[0.22em] text-slate-400 dark:text-slate-500 uppercase mt-0.5">ENTERPRISES</span>
            </div>
          </div>
          
          {/* Small vertical divider */}
          <div className="h-8 w-px bg-slate-200 dark:bg-[#262235]/60" />

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{title}</h1>
            <p className="text-slate-400 dark:text-gray-400 text-[10px] mt-1.5 font-medium">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button 
            type="button"
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-slate-200/60 dark:border-[#2b263e]/40 bg-slate-50 dark:bg-[#110f18]/60 hover:bg-slate-100 dark:hover:bg-[#110f18] transition-all duration-300 shadow-sm text-slate-500 dark:text-gray-400 focus:outline-none shrink-0"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? (
              <svg className="w-5 h-5 text-amber-500 transition-transform duration-300 hover:rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-violet-400 transition-transform duration-300 hover:-rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Body container (sidebar & main content side-by-side) */}
      <div className="flex flex-row flex-grow h-[calc(100vh-4rem)] overflow-hidden">
        
        {/* UNIFIED HOVER-EXPANDABLE SIDEBAR */}
        <aside 
          onMouseEnter={() => setIsSidebarHovered(true)}
          onMouseLeave={() => setIsSidebarHovered(false)}
          className={`${isSidebarHovered ? 'w-64' : 'w-20'} bg-white dark:bg-[#181622] border-r border-slate-200/50 dark:border-[#262235]/65 flex flex-col justify-between pb-6 shrink-0 transition-all duration-300 ease-in-out print:hidden z-20 h-full`}
        >
          <div className="w-full flex flex-col overflow-y-auto overflow-x-hidden scrollbar-none pt-0">
            {/* Grouped Sidebar Menu Items */}
            <div className="space-y-4 px-2">
              {isAdmin ? (
                <>
                  {/* ADMIN CATEGORY 1: OPERATIONS */}
                  <div>
                    <div className="h-8 flex items-center px-4 relative shrink-0">
                      <h5 
                        className={`text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest transition-all duration-300 ease-in-out ${
                          isSidebarHovered 
                            ? 'opacity-100 w-auto visible' 
                            : 'opacity-0 w-0 overflow-hidden invisible'
                        }`}
                      >
                        OPERATIONS
                      </h5>
                      <div 
                        className={`bg-slate-200 dark:bg-[#262235]/60 mx-auto transition-all duration-300 ease-in-out ${
                          isSidebarHovered 
                            ? 'w-0 opacity-0 invisible' 
                            : 'w-8 h-px opacity-100 visible mx-auto'
                        }`}
                      />
                    </div>
                    <div className="space-y-1">
                      {renderNavLink("/Main", (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
                        </svg>
                      ), "Dashboard")}
                      {renderNavLink("/existing-bills", (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      ), "Invoices List")}
                      {renderNavLink("/new-bill", (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ), "Create Invoice")}
                      {renderNavLink("/bulk-upload", (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      ), "Bulk Upload PDF")}
                    </div>
                  </div>

                  {/* ADMIN CATEGORY 2: STAFF & PAYROLL */}
                  <div>
                    <div className="h-8 flex items-center px-4 relative shrink-0">
                      <h5 
                        className={`text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest transition-all duration-300 ease-in-out ${
                          isSidebarHovered 
                            ? 'opacity-100 w-auto visible' 
                            : 'opacity-0 w-0 overflow-hidden invisible'
                        }`}
                      >
                        STAFF & PAYROLL
                      </h5>
                      <div 
                        className={`bg-slate-200 dark:bg-[#262235]/60 mx-auto transition-all duration-300 ease-in-out ${
                          isSidebarHovered 
                            ? 'w-0 opacity-0 invisible' 
                            : 'w-8 h-px opacity-100 visible mx-auto'
                        }`}
                      />
                    </div>
                    <div className="space-y-1">
                      {renderNavLink("/new-employee", (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      ), "Manage Employees")}
                      {renderNavLink("/new-Salary", (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ), "Payroll & Slips")}
                      {renderNavLink("/attendance-register", (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      ), "Attendance Register")}
                      {renderNavLink("/manage-payrolls", (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                      ), "Manage Payrolls")}
                    </div>
                  </div>

                  {/* ADMIN CATEGORY 3: SYSTEM */}
                  <div>
                    <div className="h-8 flex items-center px-4 relative shrink-0">
                      <h5 
                        className={`text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest transition-all duration-300 ease-in-out ${
                          isSidebarHovered 
                            ? 'opacity-100 w-auto visible' 
                            : 'opacity-0 w-0 overflow-hidden invisible'
                        }`}
                      >
                        SYSTEM
                      </h5>
                      <div 
                        className={`bg-slate-200 dark:bg-[#262235]/60 mx-auto transition-all duration-300 ease-in-out ${
                          isSidebarHovered 
                            ? 'w-0 opacity-0 invisible' 
                            : 'w-8 h-px opacity-100 visible mx-auto'
                        }`}
                      />
                    </div>
                    <div className="space-y-1">
                      {renderNavLink("/manage-users", (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      ), "Manage Users")}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* EMPLOYEE CATEGORY 1: WORKSPACE */}
                  <div>
                    <div className="h-8 flex items-center px-4 relative shrink-0">
                      <h5 
                        className={`text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest transition-all duration-300 ease-in-out ${
                          isSidebarHovered 
                            ? 'opacity-100 w-auto visible' 
                            : 'opacity-0 w-0 overflow-hidden invisible'
                        }`}
                      >
                        WORKSPACE
                      </h5>
                      <div 
                        className={`bg-slate-200 dark:bg-[#262235]/60 mx-auto transition-all duration-300 ease-in-out ${
                          isSidebarHovered 
                            ? 'w-0 opacity-0 invisible' 
                            : 'w-8 h-px opacity-100 visible mx-auto'
                        }`}
                      />
                    </div>
                    <div className="space-y-1">
                      {renderNavLink("/Main", (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
                        </svg>
                      ), "My Dashboard")}
                    </div>
                  </div>

                  {/* EMPLOYEE CATEGORY 2: SYSTEM */}
                  <div>
                    <div className="h-8 flex items-center px-4 relative shrink-0">
                      <h5 
                        className={`text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest transition-all duration-300 ease-in-out ${
                          isSidebarHovered 
                            ? 'opacity-100 w-auto visible' 
                            : 'opacity-0 w-0 overflow-hidden invisible'
                        }`}
                      >
                        SYSTEM
                      </h5>
                      <div 
                        className={`bg-slate-200 dark:bg-[#262235]/60 mx-auto transition-all duration-300 ease-in-out ${
                          isSidebarHovered 
                            ? 'w-0 opacity-0 invisible' 
                            : 'w-8 h-px opacity-100 visible mx-auto'
                        }`}
                      />
                    </div>
                    <div className="space-y-1">
                      <button 
                        type="button"
                        onClick={() => setIsProfileModalOpen(true)} 
                        title={!isSidebarHovered ? "My Profile" : ""}
                        className={`flex items-center rounded-xl transition-all duration-300 ease-in-out h-12 w-full ${
                          isSidebarHovered 
                            ? 'px-4 justify-start gap-3' 
                            : 'w-12 mx-auto justify-center px-0 gap-0'
                        } text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-slate-50 dark:hover:bg-[#201d2c]/50`}
                      >
                        <span className="shrink-0">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </span>
                        <span 
                          className={`text-sm font-semibold whitespace-nowrap transition-all duration-300 ease-in-out ${
                            isSidebarHovered 
                              ? 'opacity-100 w-auto ml-1 visible' 
                              : 'opacity-0 w-0 overflow-hidden invisible'
                          }`}
                        >
                          My Profile
                        </span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Sidebar Footer block */}
          <div className="px-3 border-t border-slate-100 dark:border-[#262235]/60 pt-4 flex flex-col justify-end gap-2 shrink-0 h-32 mt-auto">
            {/* User profile row */}
            <div
              onClick={() => setIsProfileModalOpen(true)}
              title={!isSidebarHovered ? "My Profile" : ""}
              className={`flex items-center rounded-xl transition-all duration-300 ease-in-out h-12 cursor-pointer ${
                isSidebarHovered 
                  ? 'px-4 w-full justify-start gap-3 hover:bg-slate-50 dark:hover:bg-[#201d2c]/50' 
                  : 'w-12 mx-auto justify-center px-0 gap-0 hover:bg-slate-50 dark:hover:bg-[#201d2c]/50'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white text-[11px] font-black shadow-sm shrink-0">
                {currentUser?.name ? currentUser.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() : 'ME'}
              </div>
              <div 
                className={`flex-grow min-w-0 transition-all duration-300 ease-in-out ${
                  isSidebarHovered 
                    ? 'opacity-100 w-auto ml-1 visible' 
                    : 'opacity-0 w-0 overflow-hidden invisible'
                }`}
              >
                <h4 className="text-xs font-bold text-slate-800 dark:text-white truncate">{currentUser?.name || 'Guest User'}</h4>
                <p className="text-[9.5px] font-extrabold text-indigo-600 dark:text-violet-400 tracking-wider uppercase mt-0.5 truncate">
                  {currentUser?.role || 'Staff'} Member
                </p>
              </div>
            </div>

            {/* Logout row */}
            <button
              type="button"
              onClick={handleLogout}
              title={!isSidebarHovered ? "Logout" : ""}
              className={`flex items-center rounded-xl transition-all duration-300 ease-in-out h-12 ${
                isSidebarHovered 
                  ? 'px-4 w-full justify-start gap-3 hover:bg-red-50 dark:hover:bg-red-950/20' 
                  : 'w-12 mx-auto justify-center px-0 gap-0 hover:bg-red-50 dark:hover:bg-red-950/20'
              } text-red-500 hover:text-red-700`}
            >
              <span className="shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </span>
              <span 
                className={`text-sm font-semibold whitespace-nowrap transition-all duration-300 ease-in-out ${
                  isSidebarHovered 
                    ? 'opacity-100 w-auto ml-1 visible' 
                    : 'opacity-0 w-0 overflow-hidden invisible'
                }`}
              >
                Logout
              </span>
            </button>
          </div>
        </aside>

        {/* 3. MAIN WORKSPACE CONTAINER */}
        <main className="flex-grow p-6 sm:p-8 max-w-7xl w-full mx-auto overflow-y-auto print:p-0">
          <Outlet />
        </main>
      </div>

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] w-full max-w-md rounded-2xl p-6 shadow-2xl relative transition-all duration-300 animate-slide-down">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-[#262235] pb-3 mb-4">
              My Profile Details
            </h3>

            {isFallbackAdmin ? (
              <div className="space-y-4">
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400 p-4 rounded-lg text-xs sm:text-sm font-medium leading-relaxed">
                  You are currently logged in using the default fallback administrator credentials (<strong>Sakshi Admin</strong>). For security and architectural reasons, default/fallback credentials cannot be modified directly from the UI.
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setIsProfileModalOpen(false)}
                    className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-gray-300 font-bold py-2.5 px-6 rounded-lg transition text-sm shadow-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : showOtpVerification ? (
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
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
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
    </div>
  );
}

export default DashboardLayout;
