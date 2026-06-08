import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import PaymentChart from './PaymentChart';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import './printStyles.css';
import logo from '../images/LOGO1.jpeg';
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

  // Admin stats
  const [adminStats, setAdminStats] = useState({
    staffCount: 0,
    invoiceCount: 0,
    grossBilling: 0,
    slipsCount: 0,
  });
  const [customerStats, setCustomerStats] = useState([]);

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

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center h-64">
        <div className="text-xl font-semibold text-indigo-600 dark:text-violet-400 animate-pulse">Loading Workspace...</div>
      </div>
    );
  }

  const isAdmin = currentUser?.role === 'admin';
  const isFallbackAdmin = currentUser && !currentUser.id;

  // Donut chart colors
  const DONUT_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

  return (
    <>
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
                <span className="text-[10px] text-slate-400 dark:text-gray-500 font-extrabold uppercase tracking-widest">Gross billing</span>
                <span className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-violet-400 rounded-xl">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
              <div className="mt-3 flex flex-col">
                <h3 className="text-xl font-black text-slate-900 dark:text-white leading-none truncate">
                  ₹{adminStats.grossBilling.toLocaleString('en-IN')}
                </h3>
                <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">All Invoices</span>
              </div>
            </div>

            {/* Stat 3: Total Invoices */}
            <div className="bg-white dark:bg-[#181622] border border-slate-200/50 dark:border-[#262235]/65 rounded-3xl p-5 shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between min-h-[120px]">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400 dark:text-gray-500 font-extrabold uppercase tracking-widest">Tax Invoices</span>
                <span className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-violet-400 rounded-xl">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-none">{adminStats.invoiceCount}</h3>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Dispatched</span>
              </div>
            </div>

            {/* Stat 4: Attendance Rate */}
            <div className="bg-white dark:bg-[#181622] border border-slate-200/50 dark:border-[#262235]/65 rounded-3xl p-5 shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between min-h-[120px]">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400 dark:text-gray-500 font-extrabold uppercase tracking-widest">Today Check-Ins</span>
                <span className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-violet-400 rounded-xl">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                  {adminStats.staffCount > 0 ? Math.round((adminStats.slipsCount / adminStats.staffCount) * 100) : 0}%
                </h3>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Slip Count</span>
              </div>
            </div>

            {/* Stat 5: Quick Link */}
            <div className="bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-3xl p-5 text-white shadow-md hover:shadow-lg transition duration-300 flex flex-col justify-between min-h-[120px]">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black uppercase tracking-widest opacity-80">Quick Action</span>
                <span className="p-1.5 bg-white/20 rounded-lg">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
              <div className="mt-2">
                <h4 className="text-sm font-black leading-tight">Create Invoice</h4>
                <Link to="/new-bill" className="text-[10px] font-black bg-white text-indigo-600 px-3 py-1 rounded-lg mt-2 inline-block hover:bg-slate-100 transition shadow-sm uppercase tracking-wider">
                  Launch →
                </Link>
              </div>
            </div>
          </div>

          {/* SECOND ROW: ANALYTICS CHART & TOP CLIENTS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Chart Widget */}
            <div className="bg-white dark:bg-[#181622] border border-slate-200/50 dark:border-[#262235]/65 rounded-3xl p-6 shadow-sm lg:col-span-2">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">Billing Trends</h3>
                  <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1">Invoice billing summary by customer companies</p>
                </div>
              </div>
              <div className="h-72">
                <PaymentChart />
              </div>
            </div>

            {/* Customer Share Donut Widget */}
            <div className="bg-white dark:bg-[#181622] border border-slate-200/50 dark:border-[#262235]/65 rounded-3xl p-6 shadow-sm">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">Client Billing Share</h3>
              <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1 mb-4">Percentage division of total enterprise billings</p>

              {customerStats.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-slate-400 text-xs font-semibold">No invoices generated yet</div>
              ) : (
                <div className="space-y-4">
                  <div className="h-44 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={customerStats.slice(0, 5)}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="amount"
                        >
                          {customerStats.slice(0, 5).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Billing']}
                          contentStyle={{ borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gross</span>
                      <span className="text-sm font-black text-slate-800 dark:text-white mt-0.5">
                        ₹{adminStats.grossBilling > 100000 ? `${(adminStats.grossBilling / 100000).toFixed(1)}L` : adminStats.grossBilling.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Donut Legend */}
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {customerStats.slice(0, 5).map((item, idx) => (
                      <div key={item.name} className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }} />
                          <span className="font-bold text-slate-700 dark:text-slate-300 truncate">{item.name}</span>
                        </div>
                        <span className="font-black text-slate-900 dark:text-white shrink-0 ml-2">{item.percent}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
        </div>
      ) : (
        /* EMPLOYEE GRID */
        <div className="space-y-8 animate-fade-in">
          
          {/* WELCOME ROW & CLOCK CARD */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            
            {/* Greeting & Quick Stats */}
            <div className="md:col-span-2 bg-white dark:bg-[#181622] border border-slate-200/50 dark:border-[#262235]/65 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-sm">
              <div>
                <span className="text-[10px] font-black text-indigo-600 dark:text-violet-400 uppercase tracking-widest bg-indigo-50 dark:bg-[#201d2c] px-3 py-1 rounded-full border border-indigo-100/10">
                  Employee Portal
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-4">
                  Welcome Back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">{currentUser?.name || 'User'}</span>!
                </h2>
                <p className="text-slate-400 dark:text-gray-400 text-xs mt-2 font-medium leading-relaxed max-w-lg">
                  Access your monthly salary slips, check in/out daily to log attendance, and review your payroll analytics from your private workspace dashboard.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-slate-100 dark:border-[#262235]/60 pt-6 mt-6 sm:mt-12">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Basic Pay</p>
                  <p className="text-base font-black text-slate-950 dark:text-white mt-1">
                    ₹{profile?.grossSalary ? profile.grossSalary.toLocaleString('en-IN') : '0'}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Slips Saved</p>
                  <p className="text-base font-black text-slate-950 dark:text-white mt-1">{salarySlips.length}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Attendance Logs</p>
                  <p className="text-base font-black text-slate-950 dark:text-white mt-1">{attendance.length} Days</p>
                </div>
              </div>
            </div>

            {/* Attendance Punching Widget */}
            <div className="bg-white dark:bg-[#181622] border border-slate-200/50 dark:border-[#262235]/65 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 rounded-full blur-xl pointer-events-none" />
              
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">Time Clock</h3>
                <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1">Punch check-in / check-out daily to log shifts</p>
              </div>

              <div className="my-6 py-4 flex flex-col items-center justify-center">
                <div className="text-center">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest block">Today is</span>
                  <span className="text-sm font-black text-slate-800 dark:text-white mt-0.5 block">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </span>
                </div>

                {/* Status indicators */}
                <div className="flex gap-4 mt-4 text-[10px] font-bold">
                  <span className={`px-2 py-0.5 rounded-full border ${
                    isCheckedInToday 
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100/10' 
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-400 border-slate-200/10'
                  }`}>
                    Checked In: {todayRecord?.checkIn ? formatTime(todayRecord.checkIn) : '-'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full border ${
                    isCheckedOutToday 
                      ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100/10' 
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-400 border-slate-200/10'
                  }`}>
                    Checked Out: {todayRecord?.checkOut ? formatTime(todayRecord.checkOut) : '-'}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {!isCheckedInToday ? (
                  <button
                    onClick={handleCheckIn}
                    className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-extrabold py-3 px-4 rounded-xl shadow-sm hover:shadow transition duration-200 text-xs uppercase tracking-wider"
                  >
                    Punch Check In
                  </button>
                ) : !isCheckedOutToday ? (
                  <button
                    onClick={handleCheckOut}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold py-3 px-4 rounded-xl shadow-sm hover:shadow transition duration-200 text-xs uppercase tracking-wider"
                  >
                    Punch Check Out
                  </button>
                ) : (
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 py-3 text-center rounded-xl text-xs font-black uppercase tracking-wider">
                    Logged for today
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* BOTTOM ROW: PRIVATE SALARY SLIPS & ATTENDANCE LOGS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Salary Slips list */}
            <div className="bg-white dark:bg-[#181622] border border-slate-200/50 dark:border-[#262235]/65 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">My Salary Slips</h3>
                <p className="text-[10px] text-slate-400 dark:text-gray-500 mb-4">View or print salary statements dispatched by the administrator</p>
                
                {salarySlips.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs font-semibold">No salary slips found</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-[#262235]/50">
                          <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Month</th>
                          <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Paid Days</th>
                          <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Net Salary</th>
                          <th className="pb-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50/50 dark:divide-[#262235]/20">
                        {salarySlips.map((slip) => (
                          <tr key={slip._id} className="hover:bg-slate-50/50 dark:hover:bg-[#201d2c]/20 transition">
                            <td className="py-3 text-xs font-bold text-slate-800 dark:text-slate-200">{slip.monthOfSalary}</td>
                            <td className="py-3 text-xs font-semibold text-slate-500 dark:text-gray-400">{slip.paidDays} Days</td>
                            <td className="py-3 text-xs font-extrabold text-slate-800 dark:text-slate-200">₹{slip.netSalary.toLocaleString('en-IN')}</td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => setActiveSlip(slip)}
                                className="bg-indigo-50 hover:bg-indigo-100 dark:bg-violet-950/30 dark:hover:bg-violet-900/40 text-indigo-600 dark:text-violet-400 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition shadow-sm border border-indigo-100/10"
                              >
                                View Slip
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Attendance Records Log */}
            <div className="bg-white dark:bg-[#181622] border border-slate-200/50 dark:border-[#262235]/65 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">My Attendance Registers</h3>
                <p className="text-[10px] text-slate-400 dark:text-gray-500 mb-4">Latest check-in, check-out times, and calculated shift durations</p>

                {attendance.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs font-semibold">No attendance logged yet</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-[#262235]/50">
                          <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Date</th>
                          <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">In</th>
                          <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Out</th>
                          <th className="pb-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider">Hours</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50/50 dark:divide-[#262235]/20">
                        {attendance.slice(0, 5).map((record) => (
                          <tr key={record._id} className="hover:bg-slate-50/50 dark:hover:bg-[#201d2c]/20 transition">
                            <td className="py-3 text-xs font-bold text-slate-800 dark:text-slate-200">
                              {new Date(record.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                            </td>
                            <td className="py-3 text-xs font-semibold text-slate-500 dark:text-gray-400">{formatTime(record.checkIn)}</td>
                            <td className="py-3 text-xs font-semibold text-slate-500 dark:text-gray-400">{formatTime(record.checkOut)}</td>
                            <td className="py-3 text-right text-xs font-extrabold text-slate-800 dark:text-slate-200">
                              {record.hoursWorked !== undefined ? `${record.hoursWorked.toFixed(1)} hrs` : 'Active'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

          </div>

          {error && (
            error.includes("contact Admin") ? (
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
        </div>
      )}

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
                      <p className="text-xs">Address: Plot No 12, Sector 4, Rohini, Delhi, 110085</p>
                      <p className="text-xs">Email: contact@sakshienterprises.com | Tel: +91-9876543210</p>
                    </div>
                  </div>
                </div>

                {/* Meta details grid */}
                <div className="p-4 grid grid-cols-2 gap-y-2 text-xs border-b border-black">
                  <p><strong>Employee ID:</strong> {activeSlip.employeeId?.employeeId || '-'}</p>
                  <p><strong>Statement Month:</strong> {activeSlip.monthOfSalary}</p>
                  <p><strong>Full Name:</strong> {activeSlip.employeeId?.name || '-'}</p>
                  <p><strong>Designation:</strong> {activeSlip.employeeId?.designation || '-'}</p>
                  <p><strong>Email Address:</strong> {activeSlip.employeeId?.email || '-'}</p>
                  <p><strong>Bank A/C No:</strong> {activeSlip.employeeId?.bankAccountNumber || '-'}</p>
                </div>

                {/* Earnings & Deductions Breakdown Tables */}
                <div className="grid grid-cols-2 text-xs border-b border-black divide-x divide-black">
                  {/* Left: Earnings */}
                  <div>
                    <div className="bg-slate-100 dark:bg-[#201d2c]/50 p-2 font-black border-b border-black text-center print:bg-slate-100 print:text-black">EARNINGS</div>
                    <div className="p-3 space-y-2.5">
                      <div className="flex justify-between">
                        <span>Basic Salary:</span>
                        <span className="font-bold">₹{(activeSlip.netSalary - (activeSlip.overtimeAmount || 0)).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Overtime (OT) Pay:</span>
                        <span className="font-bold">₹{(activeSlip.overtimeAmount || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between font-black border-t border-slate-100 dark:border-[#262235]/40 pt-2 print:border-black">
                        <span>Gross Salary:</span>
                        <span>₹{activeSlip.netSalary.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Work Analytics */}
                  <div>
                    <div className="bg-slate-100 dark:bg-[#201d2c]/50 p-2 font-black border-b border-black text-center print:bg-slate-100 print:text-black">WORK DETAILS</div>
                    <div className="p-3 space-y-2.5">
                      <div className="flex justify-between">
                        <span>Month Calendar Days:</span>
                        <span className="font-bold">{activeCalendarDays} Days</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Paid Worked Days:</span>
                        <span className="font-bold">{activeSlip.paidDays} Days</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Calculated Daily Rate:</span>
                        <span className="font-bold">₹{activeDailyRate.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-100 dark:border-[#262235]/40 pt-2 print:border-black">
                        <span>Overtime (OT) Logged:</span>
                        <span className="font-bold">{(activeSlip.overtimeHours || 0).toFixed(1)} hrs</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Totals Banner */}
                <div className="p-4 bg-slate-50 dark:bg-[#181622] text-xs space-y-2 border-b border-black print:bg-transparent print:text-black">
                  <div className="flex justify-between items-center text-sm font-black text-indigo-700 dark:text-violet-400 print:text-black">
                    <span className="uppercase">Net Take-Home Salary:</span>
                    <span className="text-lg">₹{activeSlip.netSalary.toLocaleString('en-IN')}/-</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-normal uppercase print:text-black mt-1">
                    In Words: {convertNumberToWords(activeSlip.netSalary)} Only
                  </p>
                </div>

                {/* Signature Block */}
                {showSignature ? (
                  <div className="p-4 flex justify-between items-end min-h-[90px]">
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Employee Signature</p>
                      <div className="h-8 border-b border-dashed border-slate-300 w-32 mt-2" />
                    </div>
                    <div className="text-right">
                      <img src={signature} alt="Authorized Signatory" className="h-10 w-auto object-contain ml-auto" />
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-2">Authorized Signatory</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 flex justify-between items-end min-h-[90px]">
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Employee Signature</p>
                      <div className="h-8 border-b border-dashed border-slate-300 w-32 mt-2" />
                    </div>
                    <div className="text-right">
                      <div className="h-10 w-32 ml-auto" />
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-2">Authorized Signatory</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons (hidden in print) */}
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
    </>
  );
}

export default WelcomePage;
