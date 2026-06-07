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
      <div className="min-h-screen flex items-center justify-center bg-indigo-50">
        <div className="text-xl font-semibold text-indigo-600 animate-pulse">Loading Dashboard...</div>
      </div>
    );
  }

  const isAdmin = currentUser?.role === 'admin';

  return (
    <>
      <Header />
      <div className="min-h-screen bg-indigo-50 px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Message */}
          <div className="bg-white rounded-3xl p-6 shadow-md mb-8 flex flex-col md:flex-row justify-between items-center bg-opacity-80 backdrop-blur-md">
            <div>
              <h2 className="text-3xl font-extrabold text-indigo-900">
                Welcome back, {currentUser?.name}!
              </h2>
              <p className="text-gray-600 mt-1">
                Role: <span className="font-bold text-indigo-600 capitalize">{currentUser?.role}</span>
              </p>
            </div>
            {isAdmin && (
              <div className="mt-4 md:mt-0 flex gap-2">
                <Link
                  to="/new-bill"
                  className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl shadow hover:bg-indigo-700 transition"
                >
                  + New Bill
                </Link>
                <Link
                  to="/new-employee"
                  className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl shadow hover:bg-indigo-700 transition"
                >
                  + Add Employee
                </Link>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-3xl mb-8 shadow-sm text-center font-medium">
              {error}
            </div>
          )}

          {isAdmin ? (
            /* ADMIN DASHBOARD */
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <Link
                  to="/existing-bills"
                  className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  <h3 className="text-lg font-bold">Existing Invoices</h3>
                  <p className="text-blue-100 text-sm mt-1">View, search, edit, or delete sales records</p>
                </Link>
                <Link
                  to="/new-bill"
                  className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  <h3 className="text-lg font-bold">Create Invoice</h3>
                  <p className="text-emerald-100 text-sm mt-1">Generate tax bills and print reports</p>
                </Link>
                <Link
                  to="/new-employee"
                  className="bg-gradient-to-br from-purple-500 to-pink-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  <h3 className="text-lg font-bold">Manage Employees</h3>
                  <p className="text-purple-100 text-sm mt-1">Manage staff details and gross salaries</p>
                </Link>
                <Link
                  to="/new-Salary"
                  className="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  <h3 className="text-lg font-bold">Payroll & Slips</h3>
                  <p className="text-amber-100 text-sm mt-1">Calculate monthly payouts and generate slips</p>
                </Link>
              </div>

              {/* Chart Section */}
              <div className="bg-white rounded-3xl p-6 shadow-md">
                <PaymentChart />
              </div>
            </div>
          ) : (
            /* EMPLOYEE DASHBOARD */
            profile && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Profile Card and Attendance module */}
                <div className="space-y-8 lg:col-span-1">
                  {/* Profile Card */}
                  <div className="bg-white rounded-3xl p-6 shadow-md border border-indigo-100 bg-opacity-95">
                    <h3 className="text-xl font-bold text-indigo-950 mb-4 border-b pb-2">Employee Profile</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs text-gray-500 uppercase block font-semibold">Joined Date</span>
                        <span className="text-sm font-medium text-gray-800">
                          {profile.dateOfJoining ? new Date(profile.dateOfJoining).toLocaleDateString() : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 uppercase block font-semibold">Gross Salary</span>
                        <span className="text-lg font-bold text-indigo-700">₹{profile.grossSalary?.toLocaleString()} / month</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 uppercase block font-semibold">Status</span>
                        <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${profile.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {profile.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Check-in */}
                  <div className="bg-white rounded-3xl p-6 shadow-md border border-indigo-100 bg-opacity-95">
                    <h3 className="text-xl font-bold text-indigo-950 mb-4 border-b pb-2">Daily Attendance</h3>
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-600 mb-4">
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
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl shadow transition transform hover:scale-[1.02] active:scale-[0.98]"
                          >
                            Check In
                          </button>
                        ) : !isCheckedOutToday ? (
                          <button
                            onClick={handleCheckOut}
                            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 px-6 rounded-xl shadow transition transform hover:scale-[1.02] active:scale-[0.98]"
                          >
                            Check Out
                          </button>
                        ) : (
                          <span className="bg-green-100 text-green-700 font-bold py-2 px-6 rounded-xl border border-green-300">
                            Shift Completed ✓
                          </span>
                        )}
                      </div>

                      {todayRecord && (
                        <div className="mt-4 text-xs text-gray-500 space-y-1 border-t pt-3 text-left">
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
                  <div className="bg-white rounded-3xl p-6 shadow-md border border-indigo-100">
                    <h3 className="text-xl font-bold text-indigo-950 mb-4 border-b pb-2">My Salary Slips</h3>
                    <div className="overflow-x-auto">
                      {salarySlips.length > 0 ? (
                        <table className="w-full text-sm text-left">
                          <thead>
                            <tr className="border-b text-gray-500 font-semibold uppercase text-xs">
                              <th className="py-2">Month</th>
                              <th className="py-2">Work Days</th>
                              <th className="py-2">Total Pay</th>
                              <th className="py-2">In Hand</th>
                              <th className="py-2">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {salarySlips.map((slip) => (
                              <tr key={slip._id} className="border-b hover:bg-gray-50">
                                <td className="py-3 font-semibold text-gray-900">{slip.monthOfSalary}</td>
                                <td className="py-3 text-gray-600">{slip.workDays} days</td>
                                <td className="py-3 text-gray-700">₹{slip.totalSalary?.toLocaleString()}</td>
                                <td className="py-3 font-bold text-green-600">₹{slip.inHandSalary?.toLocaleString()}</td>
                                <td className="py-3">
                                  <button
                                    onClick={() => setActiveSlip(slip)}
                                    className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold px-3 py-1 rounded-lg text-xs transition"
                                  >
                                    View Slip
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="text-gray-500 py-4 text-center">No salary slips generated yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Attendance Log */}
                  <div className="bg-white rounded-3xl p-6 shadow-md border border-indigo-100">
                    <h3 className="text-xl font-bold text-indigo-950 mb-4 border-b pb-2">Recent Attendance Logs</h3>
                    <div className="overflow-y-auto max-h-80">
                      {attendance.length > 0 ? (
                        <table className="w-full text-sm text-left">
                          <thead>
                            <tr className="border-b text-gray-500 font-semibold uppercase text-xs">
                              <th className="py-2">Date</th>
                              <th className="py-2">Check In</th>
                              <th className="py-2">Check Out</th>
                              <th className="py-2">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {attendance.map((log) => (
                              <tr key={log._id} className="border-b hover:bg-gray-50">
                                <td className="py-3 font-medium text-gray-900">{log.date}</td>
                                <td className="py-3 text-gray-600">{formatTime(log.checkIn)}</td>
                                <td className="py-3 text-gray-600">{formatTime(log.checkOut)}</td>
                                <td className="py-3">
                                  <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700`}>
                                    {log.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="text-gray-500 py-4 text-center">No attendance logs available.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Salary Slip Modal */}
      {activeSlip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 print:bg-white print:p-0 print:absolute print:inset-0">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative overflow-y-auto max-h-[90vh] print:shadow-none print:max-h-full print:rounded-none">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b pb-4 mb-4 print:hidden">
              <h3 className="text-xl font-bold text-indigo-950">Salary Slip Details</h3>
              <button
                onClick={() => setActiveSlip(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold font-sans"
              >
                &times;
              </button>
            </div>

            {/* Slip Content */}
            <div className="font-mono">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-indigo-900 uppercase">Sakshi Enterprises</h2>
                <p className="text-xs text-gray-500">Mahavir Enclave, West Delhi - 110059</p>
                <p className="text-sm font-semibold mt-1">Salary Slip for {activeSlip.monthOfSalary}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm border-t border-b py-4 mb-4">
                <div>
                  <span className="text-gray-500 block text-xs">Employee Name:</span>
                  <span className="font-bold text-gray-800">{activeSlip.employeeId?.name || profile?.name}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-xs">Joined Date:</span>
                  <span className="font-medium text-gray-800">
                    {profile?.dateOfJoining ? new Date(profile.dateOfJoining).toLocaleDateString() : '-'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 border-b pb-4 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Work Days:</span>
                  <span className="font-bold">{activeSlip.workDays} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Salary earned by days:</span>
                  <span className="font-semibold">₹{activeSlip.salaryByWorkDays?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Overtime Hours:</span>
                  <span className="font-semibold">{activeSlip.overtimeHours || 0} hrs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Overtime Pay:</span>
                  <span className="font-semibold">₹{(activeSlip.overtimeSalary || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-bold text-gray-800">
                  <span>Total Pay (Gross):</span>
                  <span>₹{activeSlip.totalSalary?.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2 border-b pb-4 mb-4 text-sm text-red-600">
                <div className="flex justify-between">
                  <span>ESIC Deduction:</span>
                  <span>- ₹{(activeSlip.esic || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Advance Taken:</span>
                  <span>- ₹{(activeSlip.advance || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-xl mb-6">
                <span className="font-extrabold text-indigo-950 text-base">Net In-Hand Salary:</span>
                <span className="font-extrabold text-indigo-800 text-xl">₹{activeSlip.inHandSalary?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-4 print:hidden">
              <button
                onClick={() => window.print()}
                className="w-full bg-indigo-600 text-white font-bold py-2.5 px-4 rounded-xl shadow hover:bg-indigo-700 transition"
              >
                Print Slip
              </button>
              <button
                onClick={() => setActiveSlip(null)}
                className="w-full bg-gray-300 text-gray-700 font-bold py-2.5 px-4 rounded-xl shadow hover:bg-gray-400 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

export default WelcomePage;
