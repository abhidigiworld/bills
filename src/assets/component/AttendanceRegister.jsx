import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './Header';
import Footer from './Footer';
import { API_BASE_URL } from '../../config';

function AttendanceRegister() {
    const [employees, setEmployees] = useState([]);
    const [attendanceLogs, setAttendanceLogs] = useState([]);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-indexed (1-12)
    const [shiftHours, setShiftHours] = useState(8);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [selectedYear, selectedMonth]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const empRes = await axios.get(`${API_BASE_URL}/api/employees`);
            const attRes = await axios.get(`${API_BASE_URL}/api/attendance`);
            setEmployees(Array.isArray(empRes.data) ? empRes.data : []);
            setAttendanceLogs(Array.isArray(attRes.data) ? attRes.data : []);
        } catch (error) {
            console.error("Error fetching attendance register data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate days in the selected month
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // Get month name
    const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' });

    // Helpers to find logs for a specific employee and day
    const getLogForDay = (employeeId, dayNum) => {
        const dayStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        return attendanceLogs.find(log => {
            const empId = log.employeeId?._id || log.employeeId;
            return empId === employeeId && log.date === dayStr;
        });
    };

    const getStatusForDay = (employeeId, dayNum) => {
        const log = getLogForDay(employeeId, dayNum);
        if (!log) return 'A'; // Default to Absent if no record
        if (log.status === 'Present') return 'P';
        if (log.status === 'Absent') return 'A';
        if (log.status === 'Leave') return 'L';
        return 'A';
    };

    // Calculate Overtime for a single day log
    const getOtForDay = (log) => {
        if (!log || !log.checkIn || !log.checkOut) return 0;
        const checkInTime = new Date(log.checkIn);
        const checkOutTime = new Date(log.checkOut);
        const diffHrs = (checkOutTime - checkInTime) / (1000 * 60 * 60);
        if (diffHrs > shiftHours) {
            return diffHrs - shiftHours;
        }
        return 0;
    };

    // Calculations for Summary
    const getEmployeeSummary = (employeeId) => {
        let presentDays = 0;
        let totalOtHours = 0;

        for (let d = 1; d <= daysInMonth; d++) {
            const log = getLogForDay(employeeId, d);
            if (log) {
                if (log.status === 'Present') {
                    presentDays++;
                }
                totalOtHours += getOtForDay(log);
            }
        }

        return {
            presentDays,
            totalOtHours: Math.floor(totalOtHours) // Floor the OT Hours
        };
    };

    return (
        <div className="flex flex-col min-h-screen bg-indigo-50 dark:bg-[#110f18] text-slate-800 dark:text-gray-200 transition-colors duration-300">
            <Header />
            <main className="flex-grow p-4 sm:p-6 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl font-extrabold mb-6 text-center text-indigo-900 dark:text-white tracking-tight">
                        Monthly Attendance Register
                    </h2>

                    {/* Filter Bar */}
                    <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-lg rounded-[2rem] p-6 mb-8 flex flex-wrap gap-6 items-center justify-between transition-colors duration-300">
                        <div className="flex flex-wrap gap-4 items-center">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Month</label>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                    className="px-4 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                                >
                                    {[
                                        { v: 1, n: 'January' }, { v: 2, n: 'February' }, { v: 3, n: 'March' }, { v: 4, n: 'April' },
                                        { v: 5, n: 'May' }, { v: 6, n: 'June' }, { v: 7, n: 'July' }, { v: 8, n: 'August' },
                                        { v: 9, n: 'September' }, { v: 10, n: 'October' }, { v: 11, n: 'November' }, { v: 12, n: 'December' }
                                    ].map(m => (
                                        <option key={m.v} value={m.v}>{m.n}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Year</label>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    className="px-4 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                                >
                                    {[2024, 2025, 2026, 2027, 2028].map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Shift Hours</label>
                                <input
                                    type="number"
                                    min="4"
                                    max="16"
                                    value={shiftHours}
                                    onChange={(e) => setShiftHours(parseInt(e.target.value) || 8)}
                                    className="w-24 px-4 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition text-center"
                                />
                            </div>
                        </div>

                        <div className="text-right">
                            <span className="text-xs font-semibold text-slate-500 dark:text-gray-400 block uppercase">Currently Showing</span>
                            <span className="text-lg font-bold text-indigo-700 dark:text-violet-400">{monthName} {selectedYear}</span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-10">
                            <div className="text-indigo-600 dark:text-violet-400 text-xl font-bold animate-pulse">Loading Attendance Records...</div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-xl rounded-[2rem] p-6 transition-colors duration-300">
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-[#262235] text-slate-500 dark:text-gray-400 font-bold uppercase">
                                            <th className="px-2 py-3 text-center border-r border-slate-100 dark:border-[#262235]">Sl</th>
                                            <th className="px-3 py-3 min-w-[140px] border-r border-slate-100 dark:border-[#262235]">Name</th>
                                            <th className="px-3 py-3 min-w-[100px] border-r border-slate-100 dark:border-[#262235]">Designation</th>
                                            <th className="px-3 py-3 min-w-[100px] border-r border-slate-100 dark:border-[#262235]">Location</th>
                                            
                                            {/* Render day columns */}
                                            {daysArray.map(day => (
                                                <th key={day} className="px-1.5 py-3 text-center min-w-[26px] border-r border-slate-100 dark:border-[#262235] last:border-r-0">
                                                    {day}
                                                </th>
                                            ))}
                                            
                                            <th className="px-3 py-3 text-center min-w-[60px] border-l border-slate-100 dark:border-[#262235]">Work Days</th>
                                            <th className="px-3 py-3 text-center min-w-[60px]">OT Hrs</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {employees.length > 0 ? (
                                            employees.map((emp, index) => {
                                                const summary = getEmployeeSummary(emp._id);
                                                return (
                                                    <tr key={emp._id} className="border-b border-slate-100 dark:border-[#262235] hover:bg-slate-50 dark:hover:bg-[#201d2c]/50 transition duration-150">
                                                        <td className="px-2 py-3 text-center font-bold text-slate-400 border-r border-slate-100 dark:border-[#262235]">{index + 1}</td>
                                                        <td className="px-3 py-3 font-semibold text-slate-900 dark:text-white border-r border-slate-100 dark:border-[#262235]">{emp.name}</td>
                                                        <td className="px-3 py-3 text-slate-600 dark:text-gray-300 border-r border-slate-100 dark:border-[#262235]">{emp.designation || '-'}</td>
                                                        <td className="px-3 py-3 text-slate-600 dark:text-gray-300 border-r border-slate-100 dark:border-[#262235]">{emp.location || '-'}</td>
                                                        
                                                        {/* Render status for each day */}
                                                        {daysArray.map(day => {
                                                            const status = getStatusForDay(emp._id, day);
                                                            return (
                                                                <td 
                                                                    key={day} 
                                                                    className={`px-1.5 py-3 text-center font-bold border-r border-slate-100 dark:border-[#262235] last:border-r-0 ${
                                                                        status === 'P' ? 'text-green-600 dark:text-green-400' :
                                                                        status === 'L' ? 'text-amber-500 dark:text-amber-400' :
                                                                        'text-red-500 dark:text-red-400/80'
                                                                    }`}
                                                                >
                                                                    {status}
                                                                </td>
                                                            );
                                                        })}
                                                        
                                                        <td className="px-3 py-3 text-center font-bold text-green-600 dark:text-green-400 border-l border-slate-100 dark:border-[#262235]">
                                                            {summary.presentDays}
                                                        </td>
                                                        <td className="px-3 py-3 text-center font-bold text-indigo-600 dark:text-violet-400">
                                                            {summary.totalOtHours}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={daysInMonth + 6} className="text-center py-6 font-medium text-gray-500">
                                                    No employees registered in the system.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default AttendanceRegister;
