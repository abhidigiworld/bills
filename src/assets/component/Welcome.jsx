import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import PaymentChart from './PaymentChart';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import './printStyles.css';
import logo from '../images/LOGO.png';
import signature from '../images/sign.png';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

function WelcomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [salarySlips, setSalarySlips] = useState([]);

  // Attendance state
  const [isCheckedInToday, setIsCheckedInToday] = useState(false);
  const [isCheckedOutToday, setIsCheckedOutToday] = useState(false);
  const [todayRecord, setTodayRecord] = useState(null);

  // Modal state for viewing selected salary slip
  const [activeSlip, setActiveSlip] = useState(null);
  const [showSignature, setShowSignature] = useState(true);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Dribbble Screen Layout States
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [activeTimeframe, setActiveTimeframe] = useState('monthly');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // Admin stats
  const [adminStats, setAdminStats] = useState({
    staffCount: 0,
    invoiceCount: 0,
    grossBilling: 0,
    slipsCount: 0,
  });
  const [customerStats, setCustomerStats] = useState([]);

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
    const parsedUser = JSON.parse(sessionUser);
    setCurrentUser(parsedUser);

    if (parsedUser.role !== 'admin') {
      fetchEmployeeDashboardData(parsedUser.email);
    } else {
      fetchAdminStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const fetchAdminStats = async () => {
    setLoading(true);
    try {
      const [empRes, invRes, slipRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/employees`),
        axios.get(`${API_BASE_URL}/api/invoices`),
        axios.get(`${API_BASE_URL}/api/salary-slips`)
      ]);

      const staffCount = empRes.data.length || 0;
      const invoiceCount = invRes.data.length || 0;
      const slipsCount = slipRes.data.length || 0;
      const grossBilling = invRes.data.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

      setAdminStats({
        staffCount,
        invoiceCount,
        grossBilling,
        slipsCount,
      });

      // Group invoices by customer company for charts and widgets
      const customerMap = {};
      invRes.data.forEach((inv) => {
        const name = inv.companyName || 'Other Recipient';
        customerMap[name] = (customerMap[name] || 0) + (inv.grandTotal || 0);
      });

      const totalBilling = Object.values(customerMap).reduce((sum, val) => sum + val, 0);

      const customerArray = Object.entries(customerMap).map(([name, amount]) => {
        const percent = totalBilling > 0 ? Math.round((amount / totalBilling) * 100) : 0;
        return { name, amount, percent };
      }).sort((a, b) => b.amount - a.amount);

      setCustomerStats(customerArray);
    } catch (err) {
      console.error('Error fetching admin statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeDashboardData = async (email) => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch employee profile
      const profileRes = await axios.get(`${API_BASE_URL}/api/employees/my-profile?email=${email}`);
      setProfile(profileRes.data);

      // 2. Fetch attendance
      const attendanceRes = await axios.get(`${API_BASE_URL}/api/attendance/my-records?email=${email}`);
      setAttendance(attendanceRes.data);
      evaluateTodayAttendance(attendanceRes.data);

      // 3. Fetch salary slips
      const slipsRes = await axios.get(`${API_BASE_URL}/api/salary-slips/my-slips?email=${email}`);
      setSalarySlips(slipsRes.data);
    } catch (err) {
      console.error('Error fetching employee data:', err);
      setError('Could not link to an Employee profile. Please contact Admin to register your email.');
    } finally {
      setLoading(false);
    }
  };

  const evaluateTodayAttendance = (records) => {
    if (!records || records.length === 0) {
      setIsCheckedInToday(false);
      setIsCheckedOutToday(false);
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    const latest = records[0]; // records are sorted date descending
    if (latest.date === todayStr) {
      setTodayRecord(latest);
      setIsCheckedInToday(true);
      setIsCheckedOutToday(!!latest.checkOut);
    } else {
      setTodayRecord(null);
      setIsCheckedInToday(false);
      setIsCheckedOutToday(false);
    }
  };

  const handleCheckIn = async () => {
    if (!currentUser) return;
    try {
      const res = await axios.post(`${API_BASE_URL}/api/attendance/check-in`, { email: currentUser.email });
      alert(res.data.message || 'Checked in successfully!');
      fetchEmployeeDashboardData(currentUser.email);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to check in');
    }
  };

  const handleCheckOut = async () => {
    if (!currentUser) return;
    try {
      const res = await axios.post(`${API_BASE_URL}/api/attendance/check-out`, { email: currentUser.email });
      alert(res.data.message || 'Checked out successfully!');
      fetchEmployeeDashboardData(currentUser.email);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to check out');
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '-';
    return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getCalendarDays = (monthOfSalary) => {
    if (!monthOfSalary) return 30;
    const [monthName, yearStr] = monthOfSalary.split(' ');
    const monthMap = {
      'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
      'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
    };
    const monthNum = monthMap[monthName] || 1;
    const yearNum = parseInt(yearStr) || new Date().getFullYear();
    return new Date(yearNum, monthNum, 0).getDate();
  };

  const handlePrint = (showSign) => {
    setShowSignature(showSign);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const convertNumberToWords = (number) => {
    if (isNaN(number) || number === null || number === undefined) return '';

    let num = parseFloat(number);
    if (num < 0) return 'Negative ' + convertNumberToWords(Math.abs(num));
    if (num === 0) return 'Zero';

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convertToWordsLessThanThousand = (val) => {
      let words = '';
      if (val >= 100) {
        words += ones[Math.floor(val / 100)] + ' Hundred ';
        val %= 100;
      }
      if (val >= 20) {
        words += tens[Math.floor(val / 10)] + ' ';
        val %= 10;
      }
      if (val > 0) {
        words += ones[val] + ' ';
      }
      return words.trim();
    };

    let integerPart = Math.floor(num);
    let decimalPart = Math.round((num - integerPart) * 100);
    let result = '';

    if (integerPart >= 10000000) { // Crore (1,00,00,000)
      const crore = Math.floor(integerPart / 10000000);
      result += convertToWordsLessThanThousand(crore) + ' Crore ';
      integerPart %= 10000000;
    }
    if (integerPart >= 100000) { // Lakh (1,00,000)
      const lakh = Math.floor(integerPart / 100000);
      result += convertToWordsLessThanThousand(lakh) + ' Lakh ';
      integerPart %= 100000;
    }
    if (integerPart >= 1000) { // Thousand (1,000)
      const thousand = Math.floor(integerPart / 1000);
      result += convertToWordsLessThanThousand(thousand) + ' Thousand ';
      integerPart %= 1000;
    }
    if (integerPart > 0) {
      result += convertToWordsLessThanThousand(integerPart);
    }

    let words = result.trim();

    // Convert decimal part to words (Paisa)
    if (decimalPart > 0) {
      if (words !== '') {
        words += ' and ' + convertToWordsLessThanThousand(decimalPart) + ' Paisa';
      } else {
        words = convertToWordsLessThanThousand(decimalPart) + ' Paisa';
      }
    }

    return words.trim();
  };

  // Profile Form changes (replicated from Header.jsx)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F6FA] dark:bg-[#110f18] transition-colors duration-300">
        <div className="text-xl font-semibold text-indigo-600 dark:text-violet-400 animate-pulse">Loading Workspace...</div>
      </div>
    );
  }

  const isAdmin = currentUser?.role === 'admin';
  const isFallbackAdmin = currentUser && !currentUser.id;

  // Donut chart colors
  const DONUT_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

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
    <div className="flex min-h-screen bg-[#F5F6FA] dark:bg-[#110f18] text-slate-800 dark:text-gray-200 transition-colors duration-300 font-sans">
      
      {/* UNIFIED HOVER-EXPANDABLE SIDEBAR */}
      <aside 
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={`${isSidebarHovered ? 'w-64' : 'w-20'} bg-white dark:bg-[#181622] border-r border-slate-200/50 dark:border-[#262235]/65 flex flex-col justify-between py-6 shrink-0 transition-all duration-300 ease-in-out print:hidden z-30 h-screen sticky top-0`}
      >
        <div className="w-full flex flex-col overflow-y-auto overflow-x-hidden scrollbar-none">
          {/* Logo Brand Header */}
          <div className="flex items-center gap-3 px-5 mb-8 border-b border-slate-100 dark:border-[#262235]/50 pb-5 h-14 overflow-hidden shrink-0">
            {/* Permanent brand logo image (no SE text emblem) */}
            <img src={logo} alt="Sakshi Enterprises" className="w-10 h-10 object-contain rounded-lg shrink-0" />
            
            {/* Sliding logo image and branding text */}
            <div 
              className={`flex flex-col justify-center leading-none transition-all duration-300 ease-in-out ${
                isSidebarHovered 
                  ? 'opacity-100 w-36 ml-1 visible' 
                  : 'opacity-0 w-0 overflow-hidden invisible'
              }`}
            >
              <span className="text-[11px] font-black tracking-widest text-slate-800 dark:text-white uppercase whitespace-nowrap">SAKSHI</span>
              <span className="text-[7px] font-bold tracking-[0.25em] text-slate-400 dark:text-slate-500 uppercase mt-0.5 whitespace-nowrap">ENTERPRISES</span>
            </div>
          </div>

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
                    
                    {/* Theme Toggle menu item */}
                    <button
                      type="button"
                      onClick={toggleTheme}
                      title={!isSidebarHovered ? "Toggle Theme" : ""}
                      className={`flex items-center rounded-xl transition-all duration-300 ease-in-out h-12 w-full ${
                        isSidebarHovered 
                          ? 'px-4 justify-start gap-3' 
                          : 'w-12 mx-auto justify-center px-0 gap-0'
                      } text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-slate-50 dark:hover:bg-[#201d2c]/50`}
                    >
                      <span className="shrink-0">
                        {theme === 'light' ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                          </svg>
                        )}
                      </span>
                      <span 
                        className={`text-sm font-semibold whitespace-nowrap transition-all duration-300 ease-in-out ${
                          isSidebarHovered 
                            ? 'opacity-100 w-auto ml-1 visible' 
                            : 'opacity-0 w-0 overflow-hidden invisible'
                        }`}
                      >
                        {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                      </span>
                    </button>
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
                    
                    {/* Theme Toggle menu item */}
                    <button
                      type="button"
                      onClick={toggleTheme}
                      title={!isSidebarHovered ? "Toggle Theme" : ""}
                      className={`flex items-center rounded-xl transition-all duration-300 ease-in-out h-12 w-full ${
                        isSidebarHovered 
                          ? 'px-4 justify-start gap-3' 
                          : 'w-12 mx-auto justify-center px-0 gap-0'
                      } text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-slate-50 dark:hover:bg-[#201d2c]/50`}
                    >
                      <span className="shrink-0">
                        {theme === 'light' ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                          </svg>
                        )}
                      </span>
                      <span 
                        className={`text-sm font-semibold whitespace-nowrap transition-all duration-300 ease-in-out ${
                          isSidebarHovered 
                            ? 'opacity-100 w-auto ml-1 visible' 
                            : 'opacity-0 w-0 overflow-hidden invisible'
                        }`}
                      >
                        {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
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
      <div className="flex-grow flex flex-col h-screen overflow-y-auto z-10">
        
        {/* Top Navbar Header */}
        <header className="flex justify-between items-center px-6 py-4 bg-white/70 dark:bg-[#181622]/70 backdrop-blur-md border-b border-slate-200/40 dark:border-[#262235]/40 shrink-0 sticky top-0 z-30">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Dashboard</h1>
            <p className="text-slate-400 dark:text-gray-400 text-xs mt-1.5 font-medium">
              {isAdmin ? "Unified controls and reporting analytics" : "Employee profile and record logs"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Time period dropdown switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#110f18]/60 rounded-xl border border-slate-200/30 dark:border-[#2b263e]/40 text-xs font-bold text-slate-500 dark:text-gray-400">
              <button 
                type="button" 
                onClick={() => setActiveTimeframe('monthly')}
                className={`px-3 py-1.5 rounded-lg transition ${activeTimeframe === 'monthly' ? 'bg-white dark:bg-[#181622] text-indigo-600 dark:text-violet-400 shadow-sm' : 'hover:text-slate-800 dark:hover:text-white'}`}
              >
                Monthly
              </button>
              <button 
                type="button" 
                onClick={() => setActiveTimeframe('quarterly')}
                className={`px-3 py-1.5 rounded-lg transition ${activeTimeframe === 'quarterly' ? 'bg-white dark:bg-[#181622] text-indigo-600 dark:text-violet-400 shadow-sm' : 'hover:text-slate-800 dark:hover:text-white'}`}
              >
                Quarterly
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content Workspace */}
        <main className="flex-grow p-6 sm:p-8 max-w-7xl w-full mx-auto print:p-0">
          {isAdmin ? (
            /* ADMIN GRID (Flup Dribbble style) */
            <div className="space-y-8 animate-fade-in">
              
              {/* TOP STATS ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
                {/* Stat 1: Total Staff */}
                <div className="bg-white dark:bg-[#181622] border border-slate-200/50 dark:border-[#262235]/65 rounded-3xl p-5 shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between min-h-[120px]">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 dark:text-gray-500 font-extrabold uppercase tracking-widest">Total Staff</span>
                    <span className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-violet-400 rounded-xl">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-none">{adminStats.staffCount}</h3>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/35 text-emerald-600 dark:text-emerald-400 border border-emerald-100/20">
                      Active
                    </span>
                  </div>
                </div>

                {/* Stat 2: Total Billings */}
                <div className="bg-white dark:bg-[#181622] border border-slate-200/50 dark:border-[#262235]/65 rounded-3xl p-5 shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between min-h-[120px]">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 dark:text-gray-500 font-extrabold uppercase tracking-widest">Total Billing</span>
                    <span className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white leading-none">₹{Math.floor(adminStats.grossBilling).toLocaleString()}</h3>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/35 text-emerald-600 dark:text-emerald-400 border border-emerald-100/20 flex items-center gap-0.5">
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                      3.4%
                    </span>
                  </div>
                </div>

                {/* Stat 3: Total Invoices */}
                <div className="bg-white dark:bg-[#181622] border border-slate-200/50 dark:border-[#262235]/65 rounded-3xl p-5 shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between min-h-[120px]">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 dark:text-gray-500 font-extrabold uppercase tracking-widest">Total Invoices</span>
                    <span className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-none">{adminStats.invoiceCount}</h3>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/35 text-indigo-600 dark:text-indigo-400 border border-indigo-100/20">
                      Invoiced
                    </span>
                  </div>
                </div>

                {/* Stat 4: Salary Slips */}
                <div className="bg-white dark:bg-[#181622] border border-slate-200/50 dark:border-[#262235]/65 rounded-3xl p-5 shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between min-h-[120px]">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 dark:text-gray-500 font-extrabold uppercase tracking-widest">Slips Count</span>
                    <span className="p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-none">{adminStats.slipsCount}</h3>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/35 text-rose-600 dark:text-rose-400 border border-rose-100/20">
                      Computed
                    </span>
                  </div>
                </div>

                {/* Stat 5: "+ Add Data" style Button Link */}
                <Link
                  to="/new-bill"
                  className="bg-transparent border-2 border-dashed border-slate-300 dark:border-[#2b263e]/85 rounded-3xl p-5 flex flex-col justify-center items-center gap-2.5 group hover:border-indigo-500 dark:hover:border-violet-500 hover:bg-white dark:hover:bg-[#181622] transition duration-300 min-h-[120px]"
                >
                  <div className="p-2 bg-slate-200/50 dark:bg-slate-950/20 text-slate-500 dark:text-slate-400 rounded-xl group-hover:bg-indigo-600 group-hover:text-white dark:group-hover:bg-violet-600 transition duration-300">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white transition">Create Invoice</span>
                </Link>
              </div>

              {/* MIDDLE DOUBLE BAR CHART CARD */}
              <div className="bg-white dark:bg-[#181622] border border-slate-200/40 dark:border-[#262235]/65 rounded-3xl p-6 sm:p-7 shadow-sm transition-all duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-[#262235]/60">
                  <div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-white">Payout Analysis</h3>
                    <p className="text-slate-400 dark:text-gray-400 text-xs mt-1.5 font-semibold">Productive analysis representing gross margins and operations outlay</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 dark:bg-violet-500 block" />
                      <span className="text-slate-500 dark:text-gray-400">Total Disbursements</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block" />
                      <span className="text-slate-500 dark:text-gray-400">Tax Liabilities</span>
                    </div>
                  </div>
                </div>
                <div className="p-1 bg-slate-50/20 dark:bg-[#12101b]/20 rounded-2xl border border-slate-100/30 dark:border-[#262235]/20">
                  <PaymentChart />
                </div>
              </div>

              {/* BOTTOM ROW (Donut Chart & Customers List) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left Card: Billing Donut Chart */}
                <div className="bg-white dark:bg-[#181622] border border-slate-200/40 dark:border-[#262235]/65 rounded-3xl p-6 shadow-sm flex flex-col transition duration-300">
                  <div className="pb-4 border-b border-slate-100 dark:border-[#262235]/60 mb-5">
                    <h3 className="text-lg font-black text-slate-800 dark:text-white">Billing by Recipient</h3>
                    <p className="text-slate-400 dark:text-gray-400 text-xs mt-1 font-semibold">Distribution of billing volume by top client category</p>
                  </div>

                  <div className="flex-grow flex flex-col sm:flex-row items-center justify-between gap-6">
                    {/* Recharts Donut/Pie */}
                    <div className="w-48 h-48 flex-shrink-0 relative">
                      {customerStats.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={customerStats.slice(0, 5)}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={4}
                              dataKey="amount"
                            >
                              {customerStats.slice(0, 5).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip formatter={(value) => `₹${Math.floor(value).toLocaleString()}`} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-400">No Data</div>
                      )}
                      {/* Center circle details */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Gross Total</span>
                        <span className="text-sm font-black text-slate-800 dark:text-white mt-0.5">
                          ₹{Math.floor(adminStats.grossBilling / 100000)}L+
                        </span>
                      </div>
                    </div>

                    {/* Donut Legend */}
                    <div className="flex-grow space-y-3.5 w-full">
                      {customerStats.slice(0, 4).map((c, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                            <span className="font-bold text-slate-700 dark:text-gray-300 truncate max-w-[150px]">{c.name}</span>
                          </div>
                          <span className="font-black text-slate-500 dark:text-gray-400">{c.percent}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Card: Customers billing progress bars list */}
                <div className="bg-white dark:bg-[#181622] border border-slate-200/40 dark:border-[#262235]/65 rounded-3xl p-6 shadow-sm flex flex-col transition duration-300">
                  <div className="pb-4 border-b border-slate-100 dark:border-[#262235]/60 mb-5">
                    <h3 className="text-lg font-black text-slate-800 dark:text-white">Top Recipient billing</h3>
                    <p className="text-slate-400 dark:text-gray-400 text-xs mt-1 font-semibold">Highest billable balances by transaction value</p>
                  </div>

                  <div className="space-y-5 flex-grow justify-center flex flex-col">
                    {customerStats.slice(0, 4).map((c, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-700 dark:text-gray-200">{c.name}</span>
                          <span className="text-indigo-600 dark:text-violet-400">₹{Math.floor(c.amount).toLocaleString()}</span>
                        </div>
                        {/* Progress Bar container */}
                        <div className="w-full bg-slate-100 dark:bg-[#110f18] h-2.5 rounded-full overflow-hidden border border-slate-200/20 dark:border-[#2b263e]/20">
                          <div 
                            className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2.5 rounded-full transition-all duration-1000"
                            style={{ width: `${c.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    {customerStats.length === 0 && (
                      <p className="text-slate-400 dark:text-gray-400 text-sm py-4 text-center">No sales records logged yet.</p>
                    )}
                  </div>
                </div>

              </div>

            </div>
          ) : (
            /* EMPLOYEE WORKSPACE VIEW (styled beautifully inside the new workspace) */
            profile ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                {/* Left Column: Profile Card and Attendance module */}
                <div className="space-y-8 lg:col-span-1">
                  {/* Profile Card */}
                  <div className="bg-white dark:bg-[#181622] border border-slate-200/50 dark:border-[#262235] rounded-3xl p-6.5 shadow-sm transition-all duration-300">
                    <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100 dark:border-[#262235]/80 mb-6">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-indigo-500/15 mb-3 border-2 border-white dark:border-[#181622] relative group">
                        <div className="absolute inset-0 rounded-full bg-indigo-500/10 animate-ping pointer-events-none" />
                        {profile.name ? profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'EE'}
                      </div>
                      <h4 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">{profile.name || 'Employee Profile'}</h4>
                      <span className="text-xs text-indigo-600 dark:text-violet-400 font-extrabold tracking-wider uppercase mt-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 rounded-full">{profile.designation || 'Staff Member'}</span>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-sm py-1.5 border-b border-slate-50 dark:border-[#262235]/30">
                        <span className="text-xs text-slate-400 dark:text-gray-400 font-semibold uppercase tracking-wider">Joined Date</span>
                        <span className="font-bold text-slate-800 dark:text-gray-200">
                          {profile.dateOfJoining ? new Date(profile.dateOfJoining).toLocaleDateString() : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm py-1.5 border-b border-slate-50 dark:border-[#262235]/30">
                        <span className="text-xs text-slate-400 dark:text-gray-400 font-semibold uppercase tracking-wider">Location</span>
                        <span className="font-bold text-slate-800 dark:text-gray-200">
                          {profile.location || 'New Delhi'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm py-1.5 border-b border-slate-50 dark:border-[#262235]/30">
                        <span className="text-xs text-slate-400 dark:text-gray-400 font-semibold uppercase tracking-wider">Gross Salary</span>
                        <span className="font-extrabold text-indigo-600 dark:text-violet-400 text-base">₹{Math.floor(profile.grossSalary)?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm py-1.5">
                        <span className="text-xs text-slate-400 dark:text-gray-400 font-semibold uppercase tracking-wider">Status</span>
                        <span className={`inline-block text-[11px] font-extrabold px-3 py-1 rounded-full ${
                          profile.status === 'Active' ? 'bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/30' :
                          profile.status === 'On Hold' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30' :
                          profile.status === 'On Holiday' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30' :
                          'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/50'
                        }`}>
                          {profile.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Check-in */}
                  <div className="bg-white dark:bg-[#181622] border border-slate-200/50 dark:border-[#262235] rounded-3xl p-6.5 shadow-sm transition-all duration-300 text-center">
                    <h3 className="text-xl font-bold text-indigo-950 dark:text-white mb-3 text-left border-b border-slate-100 dark:border-[#262235]/80 pb-2.5">Daily Attendance</h3>
                    <div className="py-4 flex flex-col items-center">
                      <p className="text-sm text-slate-500 dark:text-gray-300 mb-6 font-medium leading-relaxed max-w-[240px]">
                        {!isCheckedInToday
                          ? "You haven't checked in yet today. Record your timing here."
                          : isCheckedOutToday
                            ? "Excellent! You have completed your shift records for today."
                            : "You are currently checked in and your shift is active."}
                      </p>

                      <div className="flex justify-center gap-4">
                        {!isCheckedInToday ? (
                          <button
                            onClick={handleCheckIn}
                            className="relative group bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold py-3 px-8 rounded-2xl shadow-lg shadow-indigo-500/15 hover:shadow-indigo-500/25 transform hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
                          >
                            <span className="absolute -inset-1 rounded-2xl bg-indigo-500/10 blur opacity-30 group-hover:opacity-50 transition duration-300" />
                            <span className="relative flex items-center gap-2 text-sm">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                              Check In
                            </span>
                          </button>
                        ) : !isCheckedOutToday ? (
                          <button
                            onClick={handleCheckOut}
                            className="relative group bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-extrabold py-3 px-8 rounded-2xl shadow-lg shadow-rose-500/15 hover:shadow-rose-500/25 transform hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
                          >
                            <span className="absolute -inset-1 rounded-2xl bg-red-500/10 blur opacity-30 group-hover:opacity-50 transition duration-300" />
                            <span className="relative flex items-center gap-2 text-sm">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                              Check Out
                            </span>
                          </button>
                        ) : (
                          <span className="flex items-center gap-2 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 font-extrabold py-3 px-8 rounded-2xl border border-green-200 dark:border-green-900/30 shadow-inner text-sm">
                            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Shift Completed
                          </span>
                        )}
                      </div>

                      {todayRecord && (
                        <div className="mt-5 w-full text-xs text-slate-500 dark:text-gray-400 space-y-2 border-t border-slate-100 dark:border-[#262235] pt-4 text-left px-2 leading-relaxed">
                          <p className="flex justify-between">
                            <span className="font-semibold">Check In Time:</span>
                            <span className="font-bold text-slate-700 dark:text-gray-300">{formatTime(todayRecord.checkIn)}</span>
                          </p>
                          {todayRecord.checkOut && (
                            <p className="flex justify-between">
                              <span className="font-semibold">Check Out Time:</span>
                              <span className="font-bold text-slate-700 dark:text-gray-300">{formatTime(todayRecord.checkOut)}</span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Salary slips and Attendance logs */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Salary Slips History */}
                  <div className="bg-white dark:bg-[#181622] border border-slate-200/50 dark:border-[#262235] rounded-3xl p-6 shadow-sm transition duration-300">
                    <h3 className="text-xl font-bold text-indigo-950 dark:text-white mb-4 border-b border-slate-100 dark:border-[#262235] pb-2.5">My Salary Slips</h3>
                    <div className="overflow-x-auto">
                      {salarySlips.length > 0 ? (
                        <div className="overflow-hidden border border-slate-100 dark:border-[#262235]/65 rounded-2xl">
                          <table className="w-full text-sm text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50/70 dark:bg-[#1f1b2d]/50 border-b border-slate-100 dark:border-[#262235] text-slate-500 dark:text-gray-400 font-extrabold uppercase text-[10px] tracking-wider">
                                <th className="px-4 py-3">Month</th>
                                <th className="px-4 py-3">Work Days</th>
                                <th className="px-4 py-3">Total Pay</th>
                                <th className="px-4 py-3">In Hand</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {salarySlips.map((slip) => (
                                <tr key={slip._id} className="border-b border-slate-100/60 dark:border-[#262235]/40 hover:bg-slate-50/80 dark:hover:bg-[#201d2c]/40 transition duration-150">
                                  <td className="px-4 py-3.5 font-bold text-slate-950 dark:text-white">{slip.monthOfSalary}</td>
                                  <td className="px-4 py-3.5 text-slate-500 dark:text-gray-300 font-semibold">{slip.workDays} days</td>
                                  <td className="px-4 py-3.5 text-slate-700 dark:text-gray-200 font-bold">₹{Math.floor(slip.totalSalary)?.toLocaleString()}</td>
                                  <td className="px-4 py-3.5 font-black text-green-600 dark:text-green-400">₹{Math.floor(slip.inHandSalary)?.toLocaleString()}</td>
                                  <td className="px-4 py-3.5 text-right">
                                    <button
                                      onClick={() => setActiveSlip(slip)}
                                      className="bg-indigo-50/80 dark:bg-indigo-950 hover:bg-indigo-600 hover:text-white dark:hover:bg-violet-600 text-indigo-700 dark:text-violet-400 font-extrabold px-4 py-2 rounded-xl text-xs shadow-sm transition-all duration-200"
                                    >
                                      View Slip
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-slate-400 dark:text-gray-400 py-6 text-center text-sm font-medium">No salary slips generated yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Attendance Log */}
                  <div className="bg-white dark:bg-[#181622] border border-slate-200/50 dark:border-[#262235] rounded-3xl p-6 shadow-sm transition duration-300">
                    <h3 className="text-xl font-bold text-indigo-950 dark:text-white mb-4 border-b border-slate-100 dark:border-[#262235] pb-2.5">Recent Attendance Logs</h3>
                    <div className="overflow-y-auto max-h-80 pr-1.5 scrollbar-thin">
                      {attendance.length > 0 ? (
                        <div className="overflow-hidden border border-slate-100 dark:border-[#262235]/65 rounded-2xl">
                          <table className="w-full text-sm text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50/70 dark:bg-[#1f1b2d]/50 border-b border-slate-100 dark:border-[#262235] text-slate-500 dark:text-gray-400 font-extrabold uppercase text-[10px] tracking-wider">
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Check In</th>
                                <th className="px-4 py-3">Check Out</th>
                                <th className="px-4 py-3 text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {attendance.map((log) => (
                                <tr key={log._id} className="border-b border-slate-100/60 dark:border-[#262235]/40 hover:bg-slate-50/80 dark:hover:bg-[#201d2c]/40 transition duration-150">
                                  <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">{log.date}</td>
                                  <td className="px-4 py-3.5 text-slate-500 dark:text-gray-300 font-semibold">{formatTime(log.checkIn)}</td>
                                  <td className="px-4 py-3.5 text-slate-500 dark:text-gray-300 font-semibold">{formatTime(log.checkOut)}</td>
                                  <td className="px-4 py-3.5 text-right">
                                    <span className={`inline-block text-[10px] font-extrabold px-3 py-1 rounded-full ${
                                      log.status === 'Present' ? 'bg-green-50 dark:bg-green-950/35 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/35' :
                                      log.status === 'Leave' ? 'bg-amber-50 dark:bg-amber-950/35 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/35' :
                                      'bg-rose-50 dark:bg-rose-950/35 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/35'
                                    }`}>
                                      {log.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-slate-400 dark:text-gray-400 py-6 text-center text-sm font-medium">No attendance logs available.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="max-w-md mx-auto mt-12 p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-3xl text-center shadow-sm">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/35 flex items-center justify-center text-red-600 dark:text-red-400 mx-auto mb-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-base font-extrabold text-red-800 dark:text-red-200 mb-2">Workspace Linking Error</h3>
                <p className="text-xs text-red-600 dark:text-red-400 font-bold leading-relaxed">{error}</p>
              </div>
            ) : null
          )}
        </main>
      </div>

      {/* Salary Slip Modal */}
      {activeSlip && (() => {
        const activeCalendarDays = getCalendarDays(activeSlip.monthOfSalary);
        const activeGrossSalary = activeSlip.employeeId?.grossSalary || profile?.grossSalary || 0;
        const activeDailyRate = Math.floor(activeGrossSalary / activeCalendarDays);
        const activeHourlyRate = Math.floor(activeDailyRate / (activeSlip.shiftHours || 8));
        return (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 print:static print:bg-transparent print:p-0 print:overflow-visible">
            <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] w-full max-w-2xl rounded-xl p-6 shadow-2xl relative transition-colors duration-300 animate-slide-down print:p-0 print:border-none print:shadow-none print:bg-white print:text-black">

              {/* Slip Printable Block */}
              <div className="printdata font-mono text-slate-800 dark:text-gray-200 print:text-black w-full border border-black rounded-md overflow-hidden bg-white dark:bg-[#181622] print:bg-white">
                {/* Header (styled like Tax Invoice) */}
                <div className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white p-4 invoice-print-header border-b border-black">
                  <p className="text-xl font-bold text-center uppercase tracking-wide">Salary Statement</p>
                  <div className="flex justify-between items-center relative mt-2">
                    <div className="absolute" style={{ top: '-10px', left: '-10px' }}>
                      <img src={logo} alt="Your Company Logo" className="w-24 h-auto rounded-md" />
                    </div>
                    <div className="flex-1 text-center pt-2" style={{ marginLeft: '120px' }}>
                      <p className="text-2xl font-bold uppercase tracking-wider">Sakshi Enterprises</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold">GSTIN: 07OURPS6573P1ZY</p>
                      <p className="text-xs">M.: 9650650297</p>
                    </div>
                  </div>
                  <div className="flex flex-col content-center mt-3 text-[10px] opacity-90 text-center">
                    <p>D-435, Gali No.-59, Mahavir Enclave, Part-3, West Delhi-110059</p>
                    <p>E-mail id: manojsharma.2016m@gmail.com</p>
                  </div>
                </div>

                {/* Metadata Table Grid (styled like Invoice top table) */}
                <table className="w-full text-xs mb-2">
                  <tbody>
                    <tr className="border-b border-black">
                      <td colSpan="3" className="border-r border-black px-3 py-2 text-left"><span className="text-slate-500 print:text-gray-500 font-bold uppercase text-[9px] block">Employee Name:</span> <span className="font-extrabold text-sm">{activeSlip.employeeId?.name || profile?.name || 'Staff'}</span></td>
                      <td colSpan="2" className="px-3 py-2 text-left"><span className="text-slate-500 print:text-gray-500 font-bold uppercase text-[9px] block">Salary Slip No:</span> <span className="font-bold">SLIP-{activeSlip._id.slice(-6).toUpperCase()}</span></td>
                    </tr>
                    <tr className="border-b border-black">
                      <td colSpan="3" className="border-r border-black px-3 py-2 text-left"><span className="text-slate-500 print:text-gray-500 font-bold uppercase text-[9px] block">Designation:</span> <span className="font-semibold">{activeSlip.employeeId?.designation || profile?.designation || 'Staff'}</span></td>
                      <td colSpan="2" className="px-3 py-2 text-left"><span className="text-slate-500 print:text-gray-500 font-bold uppercase text-[9px] block">Statement Period:</span> <span className="font-bold">{activeSlip.monthOfSalary}</span></td>
                    </tr>
                    <tr className="border-b border-black">
                      <td colSpan="3" className="border-r border-black px-3 py-2 text-left">
                        <span className="text-slate-500 print:text-gray-500 font-bold uppercase text-[9px] block">Date of Joining:</span>
                        <span className="font-semibold">
                          {activeSlip.employeeId?.dateOfJoining
                            ? new Date(activeSlip.employeeId.dateOfJoining).toLocaleDateString()
                            : (profile?.dateOfJoining ? new Date(profile.dateOfJoining).toLocaleDateString() : '-')}
                        </span>
                      </td>
                      <td colSpan="2" className="px-3 py-2 text-left"><span className="text-slate-500 print:text-gray-500 font-bold uppercase text-[9px] block">Gross Salary (Monthly):</span> <span className="font-bold text-indigo-600 print:text-black">₹{Math.floor(activeGrossSalary).toLocaleString()}</span></td>
                    </tr>
                  </tbody>
                </table>

                {/* Earnings & Deductions Table (styled like Invoice item table) */}
                <table className="w-full text-xs mb-2 border-t border-black">
                  <thead>
                    <tr className="border-b border-black bg-slate-50 dark:bg-slate-900/25 print:bg-gray-100 font-bold">
                      <td className="border-r border-black px-2 py-1.5 text-center w-12">S.No</td>
                      <td className="border-r border-black px-3 py-1.5 text-left">Description</td>
                      <td className="border-r border-black px-3 py-1.5 text-center w-36">Rate / Base</td>
                      <td className="border-r border-black px-3 py-1.5 text-center w-28">Quantity / Days</td>
                      <td className="border-r border-black px-3 py-1.5 text-right w-32">Earnings</td>
                      <td className="px-3 py-1.5 text-right w-32">Deductions</td>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Basic / Attendance Earned */}
                    <tr className="border-b border-slate-200 dark:border-[#262235] print:border-black">
                      <td className="border-r border-black px-2 py-1.5 text-center">1</td>
                      <td className="border-r border-black px-3 py-1.5 text-left font-semibold">Basic Attendance Earnings</td>
                      <td className="border-r border-black px-3 py-1.5 text-center">₹{activeDailyRate.toLocaleString()} / day</td>
                      <td className="border-r border-black px-3 py-1.5 text-center">{activeSlip.workDays} days</td>
                      <td className="border-r border-black px-3 py-1.5 text-right font-bold text-green-600 print:text-black">₹{Math.floor(activeSlip.salaryByWorkDays).toLocaleString()}</td>
                      <td className="px-3 py-1.5 text-right text-slate-400">-</td>
                    </tr>

                    {/* Overtime (if any) */}
                    {activeSlip.overtimeHours > 0 && (
                      <tr className="border-b border-slate-200 dark:border-[#262235] print:border-black">
                        <td className="border-r border-black px-2 py-1.5 text-center">2</td>
                        <td className="border-r border-black px-3 py-1.5 text-left font-semibold">Overtime Allowance</td>
                        <td className="border-r border-black px-3 py-1.5 text-center">₹{activeHourlyRate.toLocaleString()} / hour</td>
                        <td className="border-r border-black px-3 py-1.5 text-center">{activeSlip.overtimeHours} hours</td>
                        <td className="border-r border-black px-3 py-1.5 text-right font-bold text-green-600 print:text-black">₹{Math.floor(activeSlip.overtimeSalary).toLocaleString()}</td>
                        <td className="px-3 py-1.5 text-right text-slate-400">-</td>
                      </tr>
                    )}

                    {/* Night Shift Allowance (if any) */}
                    {activeSlip.nightShiftAllowance > 0 && (
                      <tr className="border-b border-slate-200 dark:border-[#262235] print:border-black">
                        <td className="border-r border-black px-2 py-1.5 text-center">
                          {activeSlip.overtimeHours > 0 ? 3 : 2}
                        </td>
                        <td className="border-r border-black px-3 py-1.5 text-left font-semibold">Night Shift Allowance</td>
                        <td className="border-r border-black px-3 py-1.5 text-center">₹{activeSlip.nightShiftRate.toLocaleString()} / day</td>
                        <td className="border-r border-black px-3 py-1.5 text-center">{activeSlip.nightShiftDays} days ({activeSlip.nightShiftHours} hrs)</td>
                        <td className="border-r border-black px-3 py-1.5 text-right font-bold text-green-600 print:text-black">₹{Math.floor(activeSlip.nightShiftAllowance).toLocaleString()}</td>
                        <td className="px-3 py-1.5 text-right text-slate-400">-</td>
                      </tr>
                    )}

                    {/* Deductions (ESIC, Advance, Lunch) */}
                    {activeSlip.esic > 0 && (
                      <tr className="border-b border-slate-200 dark:border-[#262235] print:border-black">
                        <td className="border-r border-black px-2 py-1.5 text-center">
                          {activeSlip.overtimeHours > 0 ? (activeSlip.nightShiftAllowance > 0 ? 4 : 3) : (activeSlip.nightShiftAllowance > 0 ? 3 : 2)}
                        </td>
                        <td className="border-r border-black px-3 py-1.5 text-left font-semibold text-red-600 print:text-black">ESIC Contribution</td>
                        <td className="border-r border-black px-3 py-1.5 text-center">-</td>
                        <td className="border-r border-black px-3 py-1.5 text-center">-</td>
                        <td className="border-r border-black px-3 py-1.5 text-right text-slate-400">-</td>
                        <td className="px-3 py-1.5 text-right font-bold text-red-500 print:text-black">₹{Math.floor(activeSlip.esic).toLocaleString()}</td>
                      </tr>
                    )}

                    {activeSlip.advance > 0 && (
                      <tr className="border-b border-slate-200 dark:border-[#262235] print:border-black">
                        <td className="border-r border-black px-2 py-1.5 text-center">
                          {activeSlip.overtimeHours > 0 
                            ? (activeSlip.nightShiftAllowance > 0 ? (activeSlip.esic > 0 ? 5 : 4) : (activeSlip.esic > 0 ? 4 : 3)) 
                            : (activeSlip.nightShiftAllowance > 0 ? (activeSlip.esic > 0 ? 4 : 3) : (activeSlip.esic > 0 ? 3 : 2))
                          }
                        </td>
                        <td className="border-r border-black px-3 py-1.5 text-left font-semibold text-red-600 print:text-black">Salary Advance</td>
                        <td className="border-r border-black px-3 py-1.5 text-center">-</td>
                        <td className="border-r border-black px-3 py-1.5 text-center">-</td>
                        <td className="border-r border-black px-3 py-1.5 text-right text-slate-400">-</td>
                        <td className="px-3 py-1.5 text-right font-bold text-red-500 print:text-black">₹{Math.floor(activeSlip.advance).toLocaleString()}</td>
                      </tr>
                    )}

                    {activeSlip.lunchDeduction > 0 && (
                      <tr className="border-b border-slate-200 dark:border-[#262235] print:border-black">
                        <td className="border-r border-black px-2 py-1.5 text-center">
                          {activeSlip.overtimeHours > 0 
                            ? (activeSlip.nightShiftAllowance > 0 
                              ? (activeSlip.esic > 0 ? (activeSlip.advance > 0 ? 6 : 5) : (activeSlip.advance > 0 ? 5 : 4))
                              : (activeSlip.esic > 0 ? (activeSlip.advance > 0 ? 5 : 4) : (activeSlip.advance > 0 ? 4 : 3)))
                            : (activeSlip.nightShiftAllowance > 0 
                              ? (activeSlip.esic > 0 ? (activeSlip.advance > 0 ? 5 : 4) : (activeSlip.advance > 0 ? 4 : 3))
                              : (activeSlip.esic > 0 ? (activeSlip.advance > 0 ? 4 : 3) : (activeSlip.advance > 0 ? 3 : 2)))
                          }
                        </td>
                        <td className="border-r border-black px-3 py-1.5 text-left font-semibold text-red-600 print:text-black">Lunch Deduction</td>
                        <td className="border-r border-black px-3 py-1.5 text-center">₹{Math.floor(activeSlip.lunchRate).toLocaleString()} / day</td>
                        <td className="border-r border-black px-3 py-1.5 text-center">{activeSlip.lunchDays} days</td>
                        <td className="border-r border-black px-3 py-1.5 text-right text-slate-400">-</td>
                        <td className="px-3 py-1.5 text-right font-bold text-red-500 print:text-black">₹{Math.floor(activeSlip.lunchDeduction).toLocaleString()}</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Summary Totals block */}
                <div className="flex justify-between items-stretch border-t border-black bg-slate-50 dark:bg-slate-900/10 print:bg-transparent">
                  <div className="text-left text-xs font-bold p-3 pr-4 flex flex-col justify-start border-r border-black flex-grow">
                    <span className="text-slate-500 print:text-gray-500 block uppercase text-[9px] mb-1">Net Pay (In Words):</span>
                    <span className="font-extrabold text-slate-900 dark:text-white print:text-black">
                      Rupees {convertNumberToWords(Math.floor(activeSlip.inHandSalary))} Only
                    </span>
                  </div>
                  <div className="p-3 flex-shrink-0 w-80">
                    <table className="w-full text-xs">
                      <tbody>
                        <tr className="border-b border-slate-200 dark:border-[#262235] print:border-black">
                          <td className="py-1 font-semibold">Gross Earnings:</td>
                          <td className="py-1 text-right font-bold">₹{Math.floor(activeSlip.totalSalary).toLocaleString()}</td>
                        </tr>
                        <tr className="border-b border-slate-200 dark:border-[#262235] print:border-black">
                          <td className="py-1 font-semibold text-red-600 print:text-black">Total Deductions:</td>
                          <td className="py-1 text-right font-bold text-red-500 print:text-black">-₹{Math.floor((activeSlip.esic || 0) + (activeSlip.advance || 0) + (activeSlip.lunchDeduction || 0)).toLocaleString()}</td>
                        </tr>
                        <tr className="text-sm font-extrabold">
                          <td className="py-1.5 uppercase text-slate-900 dark:text-white print:text-black">Net Pay:</td>
                          <td className="py-1.5 text-right text-indigo-700 dark:text-violet-400 print:text-black">₹{Math.floor(activeSlip.inHandSalary).toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Footnote and sign stamp */}
                <div className="p-4 border-t border-black flex justify-between bg-white dark:bg-[#181622] transition-colors duration-300 print:bg-white print:text-black">
                  <div className="max-w-xs text-[10px] text-slate-400 dark:text-slate-500 print:text-gray-500 leading-normal">
                    <p className="font-bold">Note:</p>
                    <p>This document is an official Salary Slip generated by Sakshi Enterprises. All salary calculations, overtime allowances, and ESIC/advance deductions are computed based on recorded monthly logs.</p>
                  </div>
                  <div className="text-right relative w-44 min-h-[70px]">
                    <p className="text-xs font-bold">For Sakshi Enterprises</p>
                    <p className="text-[10px] absolute bottom-0 right-0 font-bold uppercase tracking-wider text-slate-500 print:text-black">Authorised Signatory</p>
                    {showSignature && (
                      <img src={signature} alt="Signature" className="absolute top-1.5 left-0 right-0 mx-auto w-32 h-auto opacity-95 pointer-events-none" />
                    )}
                  </div>
                </div>
              </div>

              {/* Print Actions */}
              <div className="flex flex-col gap-3 mt-6 print:hidden">
                <div className="flex gap-3">
                  <button
                    onClick={() => handlePrint(true)}
                    className="w-1/2 bg-indigo-600 hover:bg-indigo-700 dark:bg-violet-600 dark:hover:bg-violet-700 text-white font-bold py-3 px-4 rounded-lg shadow transition duration-200 text-xs uppercase tracking-wider"
                  >
                    Print with Sign
                  </button>
                  <button
                    onClick={() => handlePrint(false)}
                    className="w-1/2 bg-indigo-600 hover:bg-indigo-700 dark:bg-violet-600 dark:hover:bg-violet-700 text-white font-bold py-3 px-4 rounded-lg shadow transition duration-200 text-xs uppercase tracking-wider"
                  >
                    Print without Sign
                  </button>
                </div>
                <button
                  onClick={() => setActiveSlip(null)}
                  className="w-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-gray-300 font-bold py-3 px-4 rounded-lg shadow transition duration-200 text-xs uppercase tracking-wider"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Replicated Profile Modal from Header.jsx */}
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

export default WelcomePage;
