import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import PaymentChart from './PaymentChart';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import './printStyles.css';
import logo from '../images/LOGO1.jpeg';
import signature from '../images/sign.png';

function WelcomePage() {
  const navigate = useNavigate();
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

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    }
  }, [navigate]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-50 dark:bg-[#110f18] transition-colors duration-300">
        <div className="text-xl font-semibold text-indigo-600 dark:text-violet-400 animate-pulse">Loading Dashboard...</div>
      </div>
    );
  }

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="flex flex-col min-h-screen bg-indigo-50 dark:bg-[#110f18] text-slate-800 dark:text-gray-200 transition-colors duration-300">
      <Header />
      <main className="flex-grow p-4 sm:p-6 md:p-8 print-hidden">
        <div className="max-w-6xl mx-auto">
          {error && (
            <div className="bg-red-100 dark:bg-red-950/40 border border-red-400 dark:border-red-900/50 text-red-700 dark:text-red-400 px-6 py-4 rounded-[2rem] mb-8 shadow-sm text-center font-medium">
              {error}
            </div>
          )}

          {isAdmin ? (
            /* ADMIN DASHBOARD */
            <div className="space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                <Link
                  to="/existing-bills"
                  className="relative p-6 pl-8 bg-white dark:bg-[#181622] rounded-2xl border border-slate-200/85 dark:border-[#262235] shadow-md hover:shadow-lg hover:border-indigo-500/50 dark:hover:border-violet-500/50 transform hover:-translate-y-1 transition-all duration-300 group overflow-hidden flex items-center justify-between"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-indigo-500 via-violet-500 to-cyan-400" />
                  <div className="flex-grow pr-4">
                    <h3 className="text-lg font-extrabold text-indigo-950 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-violet-400 transition-colors duration-200 leading-snug">
                      Existing Invoices
                    </h3>
                    <p className="text-slate-500 dark:text-gray-400 text-xs mt-1.5 leading-relaxed">
                      View, search, edit, or delete sales records
                    </p>
                  </div>
                  <div className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 dark:group-hover:text-violet-400 transition-colors duration-200">
                    <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
                <Link
                  to="/new-bill"
                  className="relative p-6 pl-8 bg-white dark:bg-[#181622] rounded-2xl border border-slate-200/85 dark:border-[#262235] shadow-md hover:shadow-lg hover:border-indigo-500/50 dark:hover:border-violet-500/50 transform hover:-translate-y-1 transition-all duration-300 group overflow-hidden flex items-center justify-between"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-indigo-500 via-violet-500 to-cyan-400" />
                  <div className="flex-grow pr-4">
                    <h3 className="text-lg font-extrabold text-indigo-950 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-violet-400 transition-colors duration-200 leading-snug">
                      Create Invoice
                    </h3>
                    <p className="text-slate-500 dark:text-gray-400 text-xs mt-1.5 leading-relaxed">
                      Generate tax bills and print reports
                    </p>
                  </div>
                  <div className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 dark:group-hover:text-violet-400 transition-colors duration-200">
                    <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
                <Link
                  to="/new-employee"
                  className="relative p-6 pl-8 bg-white dark:bg-[#181622] rounded-2xl border border-slate-200/85 dark:border-[#262235] shadow-md hover:shadow-lg hover:border-indigo-500/50 dark:hover:border-violet-500/50 transform hover:-translate-y-1 transition-all duration-300 group overflow-hidden flex items-center justify-between"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-indigo-500 via-violet-500 to-cyan-400" />
                  <div className="flex-grow pr-4">
                    <h3 className="text-lg font-extrabold text-indigo-950 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-violet-400 transition-colors duration-200 leading-snug">
                      Manage Employees
                    </h3>
                    <p className="text-slate-500 dark:text-gray-400 text-xs mt-1.5 leading-relaxed">
                      Manage staff details and gross salaries
                    </p>
                  </div>
                  <div className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 dark:group-hover:text-violet-400 transition-colors duration-200">
                    <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
                <Link
                  to="/new-Salary"
                  className="relative p-6 pl-8 bg-white dark:bg-[#181622] rounded-2xl border border-slate-200/85 dark:border-[#262235] shadow-md hover:shadow-lg hover:border-indigo-500/50 dark:hover:border-violet-500/50 transform hover:-translate-y-1 transition-all duration-300 group overflow-hidden flex items-center justify-between"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-indigo-500 via-violet-500 to-cyan-400" />
                  <div className="flex-grow pr-4">
                    <h3 className="text-lg font-extrabold text-indigo-950 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-violet-400 transition-colors duration-200 leading-snug">
                      Payroll & Slips
                    </h3>
                    <p className="text-slate-500 dark:text-gray-400 text-xs mt-1.5 leading-relaxed">
                      Calculate monthly payouts and generate slips
                    </p>
                  </div>
                  <div className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 dark:group-hover:text-violet-400 transition-colors duration-200">
                    <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
                <Link
                  to="/attendance-register"
                  className="relative p-6 pl-8 bg-white dark:bg-[#181622] rounded-2xl border border-slate-200/85 dark:border-[#262235] shadow-md hover:shadow-lg hover:border-indigo-500/50 dark:hover:border-violet-500/50 transform hover:-translate-y-1 transition-all duration-300 group overflow-hidden flex items-center justify-between"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-indigo-500 via-violet-500 to-cyan-400" />
                  <div className="flex-grow pr-4">
                    <h3 className="text-lg font-extrabold text-indigo-950 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-violet-400 transition-colors duration-200 leading-snug">
                      Attendance Register
                    </h3>
                    <p className="text-slate-500 dark:text-gray-400 text-xs mt-1.5 leading-relaxed">
                      View monthly employee attendance grids & OT
                    </p>
                  </div>
                  <div className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 dark:group-hover:text-violet-400 transition-colors duration-200">
                    <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
                <Link
                  to="/manage-payrolls"
                  className="relative p-6 pl-8 bg-white dark:bg-[#181622] rounded-2xl border border-slate-200/85 dark:border-[#262235] shadow-md hover:shadow-lg hover:border-indigo-500/50 dark:hover:border-violet-500/50 transform hover:-translate-y-1 transition-all duration-300 group overflow-hidden flex items-center justify-between"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-indigo-500 via-violet-500 to-cyan-400" />
                  <div className="flex-grow pr-4">
                    <h3 className="text-lg font-extrabold text-indigo-950 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-violet-400 transition-colors duration-200 leading-snug">
                      Manage Payrolls
                    </h3>
                    <p className="text-slate-500 dark:text-gray-400 text-xs mt-1.5 leading-relaxed">
                      View, edit, or delete saved monthly payroll slips
                    </p>
                  </div>
                  <div className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 dark:group-hover:text-violet-400 transition-colors duration-200">
                    <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
                <Link
                  to="/manage-users"
                  className="relative p-6 pl-8 bg-white dark:bg-[#181622] rounded-2xl border border-slate-200/85 dark:border-[#262235] shadow-md hover:shadow-lg hover:border-indigo-500/50 dark:hover:border-violet-500/50 transform hover:-translate-y-1 transition-all duration-300 group overflow-hidden flex items-center justify-between"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-indigo-500 via-violet-500 to-cyan-400" />
                  <div className="flex-grow pr-4">
                    <h3 className="text-lg font-extrabold text-indigo-950 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-violet-400 transition-colors duration-200 leading-snug">
                      Manage Users
                    </h3>
                    <p className="text-slate-500 dark:text-gray-400 text-xs mt-1.5 leading-relaxed">
                      Manage login credentials, roles, and verification
                    </p>
                  </div>
                  <div className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 dark:group-hover:text-violet-400 transition-colors duration-200">
                    <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
                <Link
                  to="/bulk-upload"
                  className="relative p-6 pl-8 bg-white dark:bg-[#181622] rounded-2xl border border-slate-200/85 dark:border-[#262235] shadow-md hover:shadow-lg hover:border-indigo-500/50 dark:hover:border-violet-500/50 transform hover:-translate-y-1 transition-all duration-300 group overflow-hidden flex items-center justify-between"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-indigo-500 via-violet-500 to-cyan-400" />
                  <div className="flex-grow pr-4">
                    <h3 className="text-lg font-extrabold text-indigo-950 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-violet-400 transition-colors duration-200 leading-snug">
                      Bulk Upload PDF
                    </h3>
                    <p className="text-slate-500 dark:text-gray-400 text-xs mt-1.5 leading-relaxed">
                      Import multiple PDF invoices in a single click
                    </p>
                  </div>
                  <div className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 dark:group-hover:text-violet-400 transition-colors duration-200">
                    <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              </div>

              {/* Chart Section */}
              <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] rounded-[2rem] p-6 shadow-xl transition-colors duration-300">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Payout Analysis</h3>
                <PaymentChart />
              </div>
            </div>
          ) : (
            /* EMPLOYEE DASHBOARD */
            profile && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                {/* Left Column: Profile Card and Attendance module */}
                <div className="space-y-8 lg:col-span-1">
                  {/* Profile Card */}
                  <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] rounded-[2rem] p-6 shadow-xl transition-colors duration-300">
                    <h3 className="text-xl font-bold text-indigo-950 dark:text-white mb-4 border-b border-slate-100 dark:border-[#262235] pb-2.5">Employee Profile</h3>
                    <div className="space-y-3.5">
                      <div>
                        <span className="text-xs text-slate-500 dark:text-gray-400 uppercase block font-semibold tracking-wider">Joined Date</span>
                        <span className="text-sm font-semibold text-slate-800 dark:text-gray-200">
                          {profile.dateOfJoining ? new Date(profile.dateOfJoining).toLocaleDateString() : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 dark:text-gray-400 uppercase block font-semibold tracking-wider">Designation</span>
                        <span className="text-sm font-semibold text-slate-800 dark:text-gray-200">
                          {profile.designation || 'Staff'}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 dark:text-gray-400 uppercase block font-semibold tracking-wider">Location</span>
                        <span className="text-sm font-semibold text-slate-800 dark:text-gray-200">
                          {profile.location || 'New Delhi'}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 dark:text-gray-400 uppercase block font-semibold tracking-wider">Gross Salary</span>
                        <span className="text-lg font-bold text-indigo-600 dark:text-violet-400">₹{Math.floor(profile.grossSalary)?.toLocaleString()} / month</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 dark:text-gray-400 uppercase block font-semibold tracking-wider">Status</span>
                        <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full ${profile.status === 'Active' ? 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400' :
                            profile.status === 'On Hold' ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400' :
                              profile.status === 'On Holiday' ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400' :
                                'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400'
                          }`}>
                          {profile.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Check-in */}
                  <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] rounded-[2rem] p-6 shadow-xl transition-colors duration-300">
                    <h3 className="text-xl font-bold text-indigo-950 dark:text-white mb-4 border-b border-slate-100 dark:border-[#262235] pb-2.5">Daily Attendance</h3>
                    <div className="text-center py-4">
                      <p className="text-sm text-slate-600 dark:text-gray-300 mb-4 font-medium">
                        {!isCheckedInToday
                          ? "You haven't checked in yet today."
                          : isCheckedOutToday
                            ? "You have completed your shift today."
                            : "You are currently checked in."}
                      </p>

                      <div className="flex justify-center gap-4">
                        {!isCheckedInToday ? (
                          <button
                            onClick={handleCheckIn}
                            className="bg-indigo-600 hover:bg-indigo-700 dark:bg-violet-600 dark:hover:bg-violet-700 text-white font-bold py-2.5 px-6 rounded-xl shadow transition duration-200"
                          >
                            Check In
                          </button>
                        ) : !isCheckedOutToday ? (
                          <button
                            onClick={handleCheckOut}
                            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 px-6 rounded-xl shadow transition duration-200"
                          >
                            Check Out
                          </button>
                        ) : (
                          <span className="bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 font-bold py-2 px-6 rounded-xl border border-green-300 dark:border-green-900/40">
                            Shift Completed ✓
                          </span>
                        )}
                      </div>

                      {todayRecord && (
                        <div className="mt-4 text-xs text-slate-500 dark:text-gray-400 space-y-1.5 border-t border-slate-100 dark:border-[#262235] pt-3.5 text-left">
                          <p><strong>Check In Time:</strong> {formatTime(todayRecord.checkIn)}</p>
                          {todayRecord.checkOut && (
                            <p><strong>Check Out Time:</strong> {formatTime(todayRecord.checkOut)}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Salary slips and Attendance logs */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Salary Slips History */}
                  <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] rounded-[2rem] p-6 shadow-xl transition-colors duration-300">
                    <h3 className="text-xl font-bold text-indigo-950 dark:text-white mb-4 border-b border-slate-100 dark:border-[#262235] pb-2.5">My Salary Slips</h3>
                    <div className="overflow-x-auto">
                      {salarySlips.length > 0 ? (
                        <table className="w-full text-sm text-left">
                          <thead>
                            <tr className="border-b border-slate-100 dark:border-[#262235] text-slate-500 dark:text-gray-400 font-semibold uppercase text-xs">
                              <th className="py-2">Month</th>
                              <th className="py-2">Work Days</th>
                              <th className="py-2">Total Pay</th>
                              <th className="py-2">In Hand</th>
                              <th className="py-2">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {salarySlips.map((slip) => (
                              <tr key={slip._id} className="border-b border-slate-50 dark:border-[#262235]/40 hover:bg-slate-50 dark:hover:bg-[#201d2c]/50 transition">
                                <td className="py-3 font-semibold text-slate-950 dark:text-white">{slip.monthOfSalary}</td>
                                <td className="py-3 text-slate-600 dark:text-gray-300">{slip.workDays} days</td>
                                <td className="py-3 text-slate-700 dark:text-gray-200">₹{Math.floor(slip.totalSalary)?.toLocaleString()}</td>
                                <td className="py-3 font-bold text-green-600 dark:text-green-400">₹{Math.floor(slip.inHandSalary)?.toLocaleString()}</td>
                                <td className="py-3">
                                  <button
                                    onClick={() => setActiveSlip(slip)}
                                    className="bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold px-3 py-1.5 rounded-lg text-xs transition"
                                  >
                                    View Slip
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 py-4 text-center">No salary slips generated yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Attendance Log */}
                  <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] rounded-[2rem] p-6 shadow-xl transition-colors duration-300">
                    <h3 className="text-xl font-bold text-indigo-950 dark:text-white mb-4 border-b border-slate-100 dark:border-[#262235] pb-2.5">Recent Attendance Logs</h3>
                    <div className="overflow-y-auto max-h-80">
                      {attendance.length > 0 ? (
                        <table className="w-full text-sm text-left">
                          <thead>
                            <tr className="border-b border-slate-100 dark:border-[#262235] text-slate-500 dark:text-gray-400 font-semibold uppercase text-xs">
                              <th className="py-2">Date</th>
                              <th className="py-2">Check In</th>
                              <th className="py-2">Check Out</th>
                              <th className="py-2">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {attendance.map((log) => (
                              <tr key={log._id} className="border-b border-slate-50 dark:border-[#262235]/40 hover:bg-slate-50 dark:hover:bg-[#201d2c]/50 transition">
                                <td className="py-3 font-medium text-slate-900 dark:text-white">{log.date}</td>
                                <td className="py-3 text-slate-600 dark:text-gray-300">{formatTime(log.checkIn)}</td>
                                <td className="py-3 text-slate-600 dark:text-gray-300">{formatTime(log.checkOut)}</td>
                                <td className="py-3">
                                  <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full ${log.status === 'Present' ? 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400' :
                                      log.status === 'Leave' ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400' :
                                        'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400'
                                    }`}>
                                    {log.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 py-4 text-center">No attendance logs available.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </main>

      {/* Salary Slip Modal */}
      {/* Salary Slip Modal */}
      {activeSlip && (() => {
        const activeCalendarDays = getCalendarDays(activeSlip.monthOfSalary);
        const activeGrossSalary = activeSlip.employeeId?.grossSalary || profile?.grossSalary || 0;
        const activeDailyRate = Math.floor(activeGrossSalary / activeCalendarDays);
        const activeHourlyRate = Math.floor(activeDailyRate / (activeSlip.shiftHours || 8));
        return (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 print:static print:bg-transparent print:p-0 print:overflow-visible">
            <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] w-full max-w-2xl rounded-[2rem] p-6 shadow-2xl relative transition-colors duration-300 animate-slide-down print:p-0 print:border-none print:shadow-none print:bg-white print:text-black">

              {/* Slip Printable Block */}
              <div className="printdata font-mono text-slate-800 dark:text-gray-200 print:text-black w-full border border-black rounded-lg overflow-hidden bg-white dark:bg-[#181622] print:bg-white">
                {/* Header (styled like Tax Invoice) */}
                <div className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white p-4 invoice-print-header border-b border-black">
                  <p className="text-xl font-bold text-center uppercase tracking-wide">Salary Statement</p>
                  <div className="flex justify-between items-center relative mt-2">
                    <div className="absolute" style={{ top: '-10px', left: '-10px' }}>
                      <img src={logo} alt="Your Company Logo" className="w-24 h-auto rounded-lg" />
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
                    <tr className="border-b border-slate-200 dark:border-[#262235] print:border-black">
                      <td className="border-r border-black px-2 py-1.5 text-center">1</td>
                      <td className="border-r border-black px-3 py-1.5 text-left font-semibold">Basic Salary Earned</td>
                      <td className="border-r border-black px-3 py-1.5 text-center">₹{activeDailyRate.toLocaleString()} / day</td>
                      <td className="border-r border-black px-3 py-1.5 text-center">{activeSlip.workDays} days</td>
                      <td className="border-r border-black px-3 py-1.5 text-right font-bold text-green-600 print:text-black">₹{Math.floor(activeSlip.salaryByWorkDays).toLocaleString()}</td>
                      <td className="px-3 py-1.5 text-right text-slate-400">-</td>
                    </tr>
                    {activeSlip.overtimeHours > 0 && (
                      <tr className="border-b border-slate-200 dark:border-[#262235] print:border-black">
                        <td className="border-r border-black px-2 py-1.5 text-center">2</td>
                        <td className="border-r border-black px-3 py-1.5 text-left font-semibold">Overtime Pay</td>
                        <td className="border-r border-black px-3 py-1.5 text-center">₹{activeHourlyRate.toLocaleString()} / hr</td>
                        <td className="border-r border-black px-3 py-1.5 text-center">{activeSlip.overtimeHours} hrs</td>
                        <td className="border-r border-black px-3 py-1.5 text-right font-bold text-green-600 print:text-black">₹{Math.floor(activeSlip.overtimeSalary).toLocaleString()}</td>
                        <td className="px-3 py-1.5 text-right text-slate-400">-</td>
                      </tr>
                    )}
                    {activeSlip.esic > 0 && (
                      <tr className="border-b border-slate-200 dark:border-[#262235] print:border-black">
                        <td className="border-r border-black px-2 py-1.5 text-center">{activeSlip.overtimeHours > 0 ? 3 : 2}</td>
                        <td className="border-r border-black px-3 py-1.5 text-left font-semibold text-red-600 print:text-black">ESIC Contribution</td>
                        <td className="border-r border-black px-3 py-1.5 text-center">-</td>
                        <td className="border-r border-black px-3 py-1.5 text-center">-</td>
                        <td className="border-r border-black px-3 py-1.5 text-right text-slate-400">-</td>
                        <td className="px-3 py-1.5 text-right font-bold text-red-500 print:text-black">₹{Math.floor(activeSlip.esic).toLocaleString()}</td>
                      </tr>
                    )}
                    {activeSlip.advance > 0 && (
                      <tr className="border-b border-slate-200 dark:border-[#262235] print:border-black">
                        <td className="border-r border-black px-2 py-1.5 text-center">{activeSlip.overtimeHours > 0 ? (activeSlip.esic > 0 ? 4 : 3) : (activeSlip.esic > 0 ? 3 : 2)}</td>
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
                            ? (activeSlip.esic > 0 ? (activeSlip.advance > 0 ? 5 : 4) : (activeSlip.advance > 0 ? 4 : 3)) 
                            : (activeSlip.esic > 0 ? (activeSlip.advance > 0 ? 4 : 3) : (activeSlip.advance > 0 ? 3 : 2))
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

                {/* Summary Calculation (Totals) */}
                <div className="flex justify-end p-2 border-t border-black bg-slate-50 dark:bg-slate-900/10 print:bg-transparent">
                  <table className="w-80 text-xs">
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

                {/* Terms and Signature block */}
                <div className="p-4 border-t border-black flex justify-between bg-white dark:bg-[#181622] transition-colors duration-300 print:bg-white print:text-black">
                  <div className="max-w-xs text-[10px] text-slate-400 dark:text-slate-500 print:text-gray-500 leading-normal">
                    <p className="font-bold">Note:</p>
                    <p>This document is an official Salary Slip generated by Sakshi Enterprises. All salary calculations, overtime allowances, and ESIC/advance deductions are computed based on recorded monthly logs.</p>
                  </div>
                  <div className="text-right relative w-44 min-h-[70px]">
                    <p className="text-xs font-bold">For Sakshi Enterprises</p>
                    <p className="text-[10px] absolute bottom-0 right-0 font-bold uppercase tracking-wider text-slate-500 print:text-black">Authorised Signatory</p>
                    <img src={signature} alt="Signature" className="absolute top-1.5 left-0 right-0 mx-auto w-32 h-auto opacity-95 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Print Actions */}
              <div className="flex gap-4 mt-6 print:hidden">
                <button
                  onClick={() => window.print()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-violet-600 dark:hover:bg-violet-700 text-white font-bold py-3 px-4 rounded-xl shadow transition duration-200 text-xs uppercase tracking-wider"
                >
                  Print Slip
                </button>
                <button
                  onClick={() => setActiveSlip(null)}
                  className="w-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-gray-300 font-bold py-3 px-4 rounded-xl shadow transition duration-200 text-xs uppercase tracking-wider"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <Footer />
    </div>
  );
}

export default WelcomePage;
