import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { useSettings } from '../../context/SettingsContext';

function SupervisorAttendance() {
    const { settings } = useSettings();
    const [token, setToken] = useState('');
    const [tokenValid, setTokenValid] = useState(false);
    const [tokenChecking, setTokenChecking] = useState(true);
    const [tokenError, setTokenError] = useState('');
    const [date, setDate] = useState('');
    const [employees, setEmployees] = useState([]);
    const [attendanceForm, setAttendanceForm] = useState({}); 
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // Inline authentication states
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
    const [loginUsername, setLoginUsername] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState('');

    useEffect(() => {
        const urlToken = new URLSearchParams(window.location.search).get('token');
        if (urlToken) {
            setToken(urlToken);
            verifyToken(urlToken);
        } else {
            setTokenChecking(false);
            setTokenError('Access Link Invalid: Verification token is missing.');
        }
    }, []);

    const verifyToken = async (urlToken) => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/attendance/supervisor-check-token?token=${urlToken}`);
            if (res.data && res.data.success) {
                setDate(res.data.data.date);
                setTokenValid(true);
                
                // Only load employee records if user is logged in
                const hasSession = !!localStorage.getItem('token');
                setIsAuthenticated(hasSession);
                if (hasSession) {
                    fetchEmployees();
                }
            } else {
                setTokenError(res.data.message || 'Token verification failed.');
            }
        } catch (err) {
            console.error("Token verification error:", err);
            const msg = err.response?.data?.message || 'The link you followed has expired or is invalid.';
            setTokenError(msg);
        } finally {
            setTokenChecking(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/employees`);
            const activeEmps = Array.isArray(res.data) 
                ? res.data.filter(emp => emp.status !== 'Discontinued' && emp.status !== 'Inactive')
                : [];
            setEmployees(activeEmps);

            // Pre-populate attendance states with sensible defaults based on employee shift definitions
            const initialStates = {};
            activeEmps.forEach(emp => {
                const shift = emp.defaultShift || 'Day (09:30 - 17:30)';
                const isNightDefault = shift.includes('Night');
                
                let checkIn = '09:30';
                let checkOut = '17:30';
                if (shift.includes('09:00')) {
                    checkIn = '09:00';
                    checkOut = '17:00';
                }
                let nightCheckIn = '20:00';
                let nightCheckOut = '04:00';

                const timeMatch = shift.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
                if (timeMatch) {
                    if (isNightDefault) {
                        nightCheckIn = timeMatch[1];
                        nightCheckOut = timeMatch[2];
                    } else {
                        checkIn = timeMatch[1];
                        checkOut = timeMatch[2];
                    }
                }

                // Auto-calculate default overtime based on system settings shift_hours
                const sh = settings.shift_hours || 8;
                let defaultOT = 0;
                if (!isNightDefault) {
                    const [inH, inM] = checkIn.split(':').map(Number);
                    const [outH, outM] = checkOut.split(':').map(Number);
                    if (!isNaN(inH) && !isNaN(inM) && !isNaN(outH) && !isNaN(outM)) {
                        const diffHours = (outH * 60 + outM - (inH * 60 + inM)) / 60;
                        defaultOT = diffHours > sh ? parseFloat((diffHours - sh).toFixed(2)) : 0;
                    }
                }

                initialStates[emp._id] = {
                    employeeId: emp._id,
                    name: emp.name,
                    status: 'Present',
                    workedDay: !isNightDefault,
                    workedNight: isNightDefault,
                    checkIn,
                    checkOut,
                    nightCheckIn,
                    nightCheckOut,
                    overtimeHours: defaultOT,
                    isNightShift: isNightDefault,
                    nightShiftHours: isNightDefault ? 8 : 0
                };
            });
            setAttendanceForm(initialStates);
        } catch (err) {
            console.error("Error fetching employees:", err);
        }
    };

    const handleInlineLogin = async (e) => {
        e.preventDefault();
        setLoginLoading(true);
        setLoginError('');
        try {
            const response = await axios.post(`${API_BASE_URL}/login`, {
                username: loginUsername,
                password: loginPassword
            });
            if (response.data.success) {
                const user = response.data.user;
                if (user.role !== 'supervisor' && user.role !== 'admin') {
                    setLoginError('Access Denied: Only supervisors and administrators are allowed.');
                    return;
                }
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('token', response.data.token);
                
                // Add authorization header to axios requests
                axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
                
                setIsAuthenticated(true);
                fetchEmployees();
            } else {
                setLoginError('Invalid username or password.');
            }
        } catch (err) {
            console.error("Login error:", err);
            setLoginError(err.response?.data?.message || 'Login failed. Please verify credentials.');
        } finally {
            setLoginLoading(false);
        }
    };

    const calculateOvertime = (checkInStr, checkOutStr) => {
        if (!checkInStr || !checkOutStr) return 0;
        const [inH, inM] = checkInStr.split(':').map(Number);
        const [outH, outM] = checkOutStr.split(':').map(Number);
        if (isNaN(inH) || isNaN(inM) || isNaN(outH) || isNaN(outM)) return 0;

        let inMinutes = inH * 60 + inM;
        let outMinutes = outH * 60 + outM;

        if (outMinutes < inMinutes) {
            outMinutes += 24 * 60;
        }

        const diffHours = (outMinutes - inMinutes) / 60;
        const sh = settings.shift_hours || 8;
        const ot = diffHours - sh;
        return ot > 0 ? parseFloat(ot.toFixed(2)) : 0;
    };

    const handleStatusChange = (empId, status) => {
        setAttendanceForm(prev => {
            const empRecord = prev[empId];
            const updated = { ...empRecord, status };
            if (status !== 'Present') {
                updated.overtimeHours = 0;
            } else {
                if (updated.workedDay) {
                    updated.overtimeHours = calculateOvertime(updated.checkIn, updated.checkOut);
                }
            }
            return {
                ...prev,
                [empId]: updated
            };
        });
    };

    const handleShiftToggle = (empId, type) => {
        setAttendanceForm(prev => {
            const empRecord = prev[empId];
            const updated = { ...empRecord };
            if (type === 'day') {
                updated.workedDay = !empRecord.workedDay;
                if (updated.workedDay) {
                    updated.overtimeHours = calculateOvertime(updated.checkIn, updated.checkOut);
                } else {
                    updated.overtimeHours = 0;
                }
            } else if (type === 'night') {
                updated.workedNight = !empRecord.workedNight;
                updated.isNightShift = updated.workedNight;
                updated.nightShiftHours = updated.workedNight ? 8 : 0;
            }
            return {
                ...prev,
                [empId]: updated
            };
        });
    };

    const handleTimeChange = (empId, field, val) => {
        setAttendanceForm(prev => {
            const empRecord = prev[empId];
            const updated = { ...empRecord, [field]: val };
            
            // Recalculate OT if checkIn/checkOut changed and Day Shift is active
            if (field === 'checkIn' || field === 'checkOut') {
                if (updated.status === 'Present' && updated.workedDay) {
                    updated.overtimeHours = calculateOvertime(updated.checkIn, updated.checkOut);
                }
            }
            return {
                ...prev,
                [empId]: updated
            };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const records = Object.values(attendanceForm);
            const res = await axios.post(`${API_BASE_URL}/api/attendance/supervisor-submit`, {
                token,
                records
            });
            if (res.data && res.data.success) {
                setSuccessMsg('Attendance sheet submitted successfully! Form is now locked.');
                setTokenValid(false); 
                setTokenError('Attendance for this date has already been submitted and is locked.');
            } else {
                setErrorMsg(res.data.message || 'Submission failed.');
            }
        } catch (err) {
            console.error("Submission error:", err);
            setErrorMsg(err.response?.data?.message || 'Failed to submit attendance logs. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDisplayDate = (dStr) => {
        if (!dStr) return '';
        return new Date(dStr).toLocaleDateString('en-IN', {
            dateStyle: 'long',
            timeZone: 'Asia/Kolkata'
        });
    };

    if (tokenChecking) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#0f0e15] flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-gray-400 font-bold animate-pulse">Verifying Attendance Link...</p>
                </div>
            </div>
        );
    }

    if (!tokenValid) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#0f0e15] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-2xl rounded-2xl p-8 max-w-md w-full text-center">
                    <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-950/40 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mb-6">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0-8V7m0 11a1 1 0 100-2 1 1 0 000 2zm0-11a5 5 0 100 10 5 5 0 000-10z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Access Denied / Locked</h2>
                    <p className="text-sm text-slate-600 dark:text-gray-400 mb-6">{tokenError}</p>
                    {successMsg && (
                        <div className="p-3.5 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-xs font-bold mb-4">
                            {successMsg}
                        </div>
                    )}
                    <button 
                        onClick={() => window.close()} 
                        className="w-full bg-slate-800 hover:bg-slate-900 dark:bg-[#2d283e] dark:hover:bg-[#39334f] text-white font-bold py-2.5 px-4 rounded-xl transition duration-200 text-xs uppercase tracking-wider"
                    >
                        Close Window
                    </button>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#0f0e15] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-2xl rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center relative transition-colors duration-300">
                    <div className="mx-auto w-12 h-12 bg-indigo-100 dark:bg-violet-950/40 rounded-full flex items-center justify-center text-indigo-600 dark:text-violet-400 mb-4">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0-8V7m0 11a1 1 0 100-2 1 1 0 000 2zm0-11a5 5 0 100 10 5 5 0 000-10z" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white mb-2">Supervisor Verification</h2>
                    <p className="text-xs text-slate-500 dark:text-gray-400 mb-6">Please verify your session credentials to unlock this sheet for date <strong className="text-indigo-600 dark:text-violet-400">{formatDisplayDate(date)}</strong>.</p>
                    
                    {loginError && (
                        <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/25 border border-red-200 dark:border-red-900/40 p-2.5 rounded-lg text-xs mb-4 text-center font-bold">
                            {loginError}
                        </p>
                    )}

                    <form onSubmit={handleInlineLogin} className="space-y-4 text-left">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Email or Username</label>
                            <input
                                type="text"
                                required
                                value={loginUsername}
                                onChange={(e) => setLoginUsername(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white"
                                placeholder="name@company.com"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Password</label>
                            <input
                                type="password"
                                required
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white"
                                placeholder="••••••••"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loginLoading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-violet-600 dark:hover:bg-violet-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition duration-200 text-xs uppercase tracking-wider flex justify-center items-center gap-1.5"
                        >
                            {loginLoading ? 'Verifying...' : 'Unlock Entry Form'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0f0e15] py-8 px-4 transition-colors duration-300">
            <div className="max-w-xl mx-auto">
                {/* Heading Card */}
                <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-xl rounded-2xl p-6 mb-6 text-center">
                    <span className="text-[10px] font-black tracking-widest text-indigo-600 dark:text-violet-400 uppercase">Supervisor Attendance Entry</span>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1 mb-2">{settings.company_name}</h1>
                    <div className="inline-block px-4 py-1.5 bg-indigo-50 dark:bg-violet-950/20 text-indigo-700 dark:text-violet-300 rounded-full text-xs font-extrabold border border-indigo-100/30">
                        Date: {formatDisplayDate(date)}
                    </div>
                </div>

                {errorMsg && (
                    <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 rounded-xl text-sm font-bold mb-6 text-center">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 pb-24">
                    {employees.map((emp, idx) => {
                        const record = attendanceForm[emp._id] || {};
                        const isPresent = record.status === 'Present';

                        return (
                            <div 
                                key={emp._id} 
                                className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-lg rounded-2xl p-5 transition-colors duration-300 hover:shadow-xl"
                            >
                                {/* Emp Identity Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">{emp.name}</h3>
                                        <p className="text-[11px] text-slate-400 dark:text-gray-500 font-semibold">{emp.designation || 'No Designation'} • {emp.location || 'No Location'}</p>
                                    </div>
                                    <span className="text-[10px] bg-slate-100 dark:bg-[#201d2c] text-slate-500 dark:text-gray-400 px-2 py-1 rounded-md font-mono border border-slate-200/20">
                                        Sl. {idx + 1}
                                    </span>
                                </div>

                                {/* Status Toggle Grid (Tappable Pills) */}
                                <div className="grid grid-cols-4 gap-2 mb-4">
                                    {['Present', 'Absent', 'Leave', 'Holiday'].map(status => {
                                        const isSelected = record.status === status;
                                        let activeColor = '';
                                        if (isSelected) {
                                            if (status === 'Present') activeColor = 'bg-green-600 border-green-600 text-white';
                                            if (status === 'Absent') activeColor = 'bg-red-600 border-red-600 text-white';
                                            if (status === 'Leave') activeColor = 'bg-amber-500 border-amber-500 text-white';
                                            if (status === 'Holiday') activeColor = 'bg-violet-600 border-violet-600 text-white';
                                        } else {
                                            activeColor = 'bg-slate-50 dark:bg-[#1e1c27] text-slate-600 dark:text-gray-400 hover:bg-slate-100';
                                        }

                                        return (
                                            <button
                                                key={status}
                                                type="button"
                                                onClick={() => handleStatusChange(emp._id, status)}
                                                className={`py-2 px-1 text-center text-xs font-bold rounded-lg border border-slate-200/50 dark:border-[#2f2a41] transition-all duration-150 ${activeColor}`}
                                            >
                                                {status}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Conditionally Render Time Options if Present */}
                                {isPresent && (
                                    <div className="space-y-4 p-3.5 bg-slate-50 dark:bg-[#1f1b2c] border border-slate-100 dark:border-[#2b273d] rounded-xl animate-fade-in text-xs">
                                        {/* Shift Toggle Checkboxes */}
                                        <div className="flex gap-6">
                                            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-gray-300">
                                                <input
                                                    type="checkbox"
                                                    className="h-4.5 w-4.5 text-indigo-600 border-slate-300 dark:border-[#37314e] rounded cursor-pointer"
                                                    checked={!!record.workedDay}
                                                    onChange={() => handleShiftToggle(emp._id, 'day')}
                                                />
                                                Day Shift
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-gray-300">
                                                <input
                                                    type="checkbox"
                                                    className="h-4.5 w-4.5 text-indigo-600 border-slate-300 dark:border-[#37314e] rounded cursor-pointer"
                                                    checked={!!record.workedNight}
                                                    onChange={() => handleShiftToggle(emp._id, 'night')}
                                                />
                                                Night Shift
                                            </label>
                                        </div>

                                        {/* Day Shift Times */}
                                        {record.workedDay && (
                                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/30">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Day Check-In</label>
                                                    <input
                                                        type="time"
                                                        required
                                                        className="w-full px-3 py-1.5 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#37314e] rounded-lg text-xs text-slate-800 dark:text-white"
                                                        value={record.checkIn}
                                                        onChange={(e) => handleTimeChange(emp._id, 'checkIn', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Day Check-Out</label>
                                                    <input
                                                        type="time"
                                                        required
                                                        className="w-full px-3 py-1.5 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#37314e] rounded-lg text-xs text-slate-800 dark:text-white"
                                                        value={record.checkOut}
                                                        onChange={(e) => handleTimeChange(emp._id, 'checkOut', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Night Shift Times */}
                                        {record.workedNight && (
                                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/30">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Night Check-In</label>
                                                    <input
                                                        type="time"
                                                        required
                                                        className="w-full px-3 py-1.5 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#37314e] rounded-lg text-xs text-slate-800 dark:text-white"
                                                        value={record.nightCheckIn}
                                                        onChange={(e) => handleTimeChange(emp._id, 'nightCheckIn', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Night Check-Out</label>
                                                    <input
                                                        type="time"
                                                        required
                                                        className="w-full px-3 py-1.5 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#37314e] rounded-lg text-xs text-slate-800 dark:text-white"
                                                        value={record.nightCheckOut}
                                                        onChange={(e) => handleTimeChange(emp._id, 'nightCheckOut', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Overtime Input */}
                                        {record.workedDay && (
                                            <div className="pt-2 border-t border-slate-200/30 flex items-center justify-between">
                                                <label className="font-bold text-slate-700 dark:text-gray-300">Overtime Hours (OT):</label>
                                                <input
                                                    type="number"
                                                    step="0.5"
                                                    min="0"
                                                    max="8"
                                                    className="w-20 px-3 py-1 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#37314e] rounded-lg text-center"
                                                    value={record.overtimeHours}
                                                    onChange={(e) => handleTimeChange(emp._id, 'overtimeHours', parseFloat(e.target.value) || 0)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Submit Section (Sticky bottom bar on mobile screens) */}
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-[#181622]/95 border-t border-slate-200 dark:border-[#262235] backdrop-blur-md shadow-2xl flex justify-center z-50">
                        <button
                            type="submit"
                            disabled={isSubmitting || employees.length === 0}
                            className="max-w-md w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-violet-600 dark:hover:bg-violet-700 text-white font-black py-3 px-6 rounded-2xl shadow-lg hover:shadow-xl disabled:opacity-50 transition duration-200 text-sm uppercase tracking-wider flex justify-center items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Submitting Logs...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    Submit Attendance Logs
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SupervisorAttendance;
