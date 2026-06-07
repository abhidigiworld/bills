import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import PaymentChart from './PaymentChart';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import './printStyles.css';

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
      <main className="flex-grow p-4 sm:p-6 md:p-8">
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
                  className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  <h3 className="text-lg font-bold">Existing Invoices</h3>
                  <p className="text-blue-100 text-xs mt-1 leading-relaxed">View, search, edit, or delete sales records</p>
                </Link>
                <Link
                  to="/new-bill"
                  className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  <h3 className="text-lg font-bold">Create Invoice</h3>
                  <p className="text-emerald-100 text-xs mt-1 leading-relaxed">Generate tax bills and print reports</p>
                </Link>
                <Link
                  to="/new-employee"
                  className="bg-gradient-to-br from-purple-500 to-pink-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  <h3 className="text-lg font-bold">Manage Employees</h3>
                  <p className="text-purple-100 text-xs mt-1 leading-relaxed">Manage staff details and gross salaries</p>
                </Link>
                <Link
                  to="/new-Salary"
                  className="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  <h3 className="text-lg font-bold">Payroll & Slips</h3>
                  <p className="text-amber-100 text-xs mt-1 leading-relaxed">Calculate monthly payouts and generate slips</p>
                </Link>
                <Link
                  to="/attendance-register"
                  className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  <h3 className="text-lg font-bold">Attendance Register</h3>
                  <p className="text-indigo-100 text-xs mt-1 leading-relaxed">View monthly employee attendance grids & OT</p>
                </Link>
                <Link
                  to="/manage-payrolls"
                  className="bg-gradient-to-br from-rose-500 to-red-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  <h3 className="text-lg font-bold">Manage Payrolls</h3>
                  <p className="text-rose-100 text-xs mt-1 leading-relaxed">View, edit, or delete saved monthly payroll slips</p>
                </Link>
                <Link
                  to="/manage-users"
                  className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  <h3 className="text-lg font-bold">Manage Users</h3>
                  <p className="text-cyan-100 text-xs mt-1 leading-relaxed">Manage login credentials, roles, and verification</p>
                </Link>
                <Link
                  to="/bulk-upload"
                  className="bg-gradient-to-br from-fuchsia-500 to-pink-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  <h3 className="text-lg font-bold">Bulk Upload PDF</h3>
                  <p className="text-fuchsia-100 text-xs mt-1 leading-relaxed">Import multiple PDF invoices in a single click</p>
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
      {activeSlip && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 print:bg-white print:p-0 print:absolute print:inset-0 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] text-slate-900 dark:text-gray-200 rounded-[2rem] p-8 max-w-lg w-full shadow-2xl relative overflow-y-auto max-h-[90vh] print:shadow-none print:max-h-full print:rounded-none transition-colors duration-300">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-[#262235] pb-4 mb-4 print:hidden">
              <h3 className="text-xl font-bold text-slate-950 dark:text-white">Salary Slip Details</h3>
              <button
                onClick={() => setActiveSlip(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-2xl font-bold focus:outline-none"
              >
                &times;
              </button>
            </div>

            {/* Slip Content */}
            <div className="font-mono">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-indigo-900 dark:text-violet-400 uppercase">Sakshi Enterprises</h2>
                <p className="text-xs text-slate-500 dark:text-gray-400">Mahavir Enclave, West Delhi - 110059</p>
                <p className="text-sm font-semibold mt-1.5 text-slate-800 dark:text-white border-y border-dashed border-slate-200 dark:border-[#262235] py-1">
                  Salary Slip for {activeSlip.monthOfSalary}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm border-b border-slate-200 dark:border-[#262235] pb-4 mb-4">
                <div>
                  <span className="text-slate-500 dark:text-gray-400 block text-xs font-bold uppercase">Employee Name:</span>
                  <span className="font-bold text-slate-800 dark:text-white">{activeSlip.employeeId?.name || profile?.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-gray-400 block text-xs font-bold uppercase">Joined Date:</span>
                  <span className="font-semibold text-slate-800 dark:text-white">
                    {activeSlip.employeeId?.dateOfJoining
                      ? new Date(activeSlip.employeeId.dateOfJoining).toLocaleDateString()
                      : (profile?.dateOfJoining ? new Date(profile.dateOfJoining).toLocaleDateString() : '-')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-gray-400 block text-xs font-bold uppercase">Gross Salary:</span>
                  <span className="font-bold text-indigo-700 dark:text-violet-400">
                    ₹{activeSlip.employeeId?.grossSalary
                      ? Math.floor(activeSlip.employeeId.grossSalary).toLocaleString()
                      : (profile?.grossSalary ? Math.floor(profile.grossSalary).toLocaleString() : '-')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-gray-400 block text-xs font-bold uppercase">Designation:</span>
                  <span className="font-medium text-slate-800 dark:text-white">
                    {activeSlip.employeeId?.designation || profile?.designation || 'Staff'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 border-b border-slate-200 dark:border-[#262235] pb-4 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-gray-400">No. of Workday:</span>
                  <span className="font-bold text-slate-800 dark:text-white">{activeSlip.workDays} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-gray-400">Salary earned:</span>
                  <span className="font-semibold text-slate-800 dark:text-white">₹{Math.floor(activeSlip.salaryByWorkDays || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-gray-400">O.T. ({activeSlip.overtimeHours || 0} hrs):</span>
                  <span className="font-semibold text-slate-800 dark:text-white">₹{Math.floor(activeSlip.overtimeSalary || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 dark:border-[#262235] pt-2 font-bold text-slate-900 dark:text-white">
                  <span>Total Salary (Gross):</span>
                  <span>₹{Math.floor(activeSlip.totalSalary || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2 border-b border-slate-200 dark:border-[#262235] pb-4 mb-4 text-sm text-red-600 dark:text-red-400">
                <div className="flex justify-between">
                  <span>ESIC Deduction:</span>
                  <span>- ₹{Math.floor(activeSlip.esic || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Advance:</span>
                  <span>- ₹{Math.floor(activeSlip.advance || 0).toLocaleString()}</span>
                </div>
                {activeSlip.lunchDeduction > 0 && (
                  <div className="flex justify-between">
                    <span>Lunch ({activeSlip.lunchDays || 0} days @ ₹{activeSlip.lunchRate || 0}):</span>
                    <span>- ₹{Math.floor(activeSlip.lunchDeduction || 0).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center bg-indigo-50 dark:bg-[#201d2c] p-4 rounded-2xl mb-6 transition-colors duration-300">
                <span className="font-extrabold text-slate-900 dark:text-white text-base">In Hand:</span>
                <span className="font-extrabold text-indigo-700 dark:text-violet-400 text-xl">₹{Math.floor(activeSlip.inHandSalary || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-4 print:hidden">
              <button
                onClick={() => window.print()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-violet-600 dark:hover:bg-violet-700 text-white font-bold py-3 px-4 rounded-xl shadow transition duration-200"
              >
                Print Slip
              </button>
              <button
                onClick={() => setActiveSlip(null)}
                className="w-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-gray-300 font-bold py-3 px-4 rounded-xl shadow transition duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default WelcomePage;
