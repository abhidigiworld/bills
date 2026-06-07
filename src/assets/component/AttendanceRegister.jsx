import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

    // Modal Edit states
    const [selectedCell, setSelectedCell] = useState(null); // { employee, dayNum }
    const [modalForm, setModalForm] = useState({ status: 'Absent', checkIn: '', checkOut: '', overtimeHours: 0, isNightShift: false });

    // Blanket Edit states
    const [isBlanketModalOpen, setIsBlanketModalOpen] = useState(false);
    const [blanketForm, setBlanketForm] = useState({ dayNum: 1, status: 'Present', checkIn: '09:00', checkOut: '17:00', overtimeHours: 0, isNightShift: false });

    // Hover tooltip state
    const [hoveredCell, setHoveredCell] = useState(null);

    useEffect(() => {
        const today = new Date();
        if (today.getFullYear() === selectedYear && (today.getMonth() + 1) === selectedMonth) {
            setBlanketForm(prev => ({ ...prev, dayNum: today.getDate() }));
        } else {
            setBlanketForm(prev => ({ ...prev, dayNum: 1 }));
        }
    }, [selectedYear, selectedMonth, isBlanketModalOpen]);

    useEffect(() => {
        fetchData();
    }, [selectedYear, selectedMonth]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const empRes = await axios.get(`${API_BASE_URL}/api/employees`);
            const attRes = await axios.get(`${API_BASE_URL}/api/attendance`);
            // Filter out discontinued and inactive employees from the attendance list
            setEmployees(Array.isArray(empRes.data) ? empRes.data.filter(emp => emp.status !== 'Discontinued' && emp.status !== 'Inactive') : []);
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

    const calculateOvertime = (checkInStr, checkOutStr, isNightShiftVal) => {
        if (!checkInStr || !checkOutStr) return 0;
        const [inH, inM] = checkInStr.split(':').map(Number);
        const [outH, outM] = checkOutStr.split(':').map(Number);
        if (isNaN(inH) || isNaN(inM) || isNaN(outH) || isNaN(outM)) return 0;

        let inMinutes = inH * 60 + inM;
        let outMinutes = outH * 60 + outM;

        if (outMinutes < inMinutes || isNightShiftVal) {
            if (outMinutes < inMinutes) {
                outMinutes += 24 * 60;
            }
        }

        const diffHours = (outMinutes - inMinutes) / 60;
        const ot = diffHours - shiftHours;
        return ot > 0 ? parseFloat(ot.toFixed(2)) : 0;
    };

    const handleModalFormChange = (updatedFields) => {
        setModalForm(prev => {
            const nextForm = { ...prev, ...updatedFields };
            if (nextForm.status === 'Present') {
                const calculatedOt = calculateOvertime(nextForm.checkIn, nextForm.checkOut, nextForm.isNightShift);
                if ('checkIn' in updatedFields || 'checkOut' in updatedFields || 'isNightShift' in updatedFields || 'status' in updatedFields) {
                    nextForm.overtimeHours = calculatedOt;
                }
            } else {
                nextForm.overtimeHours = 0;
                nextForm.isNightShift = false;
            }
            return nextForm;
        });
    };

    const handleBlanketFormChange = (updatedFields) => {
        setBlanketForm(prev => {
            const nextForm = { ...prev, ...updatedFields };
            if (nextForm.status === 'Present') {
                const calculatedOt = calculateOvertime(nextForm.checkIn, nextForm.checkOut, nextForm.isNightShift);
                if ('checkIn' in updatedFields || 'checkOut' in updatedFields || 'isNightShift' in updatedFields || 'status' in updatedFields) {
                    nextForm.overtimeHours = calculatedOt;
                }
            } else {
                nextForm.overtimeHours = 0;
                nextForm.isNightShift = false;
            }
            return nextForm;
        });
    };

    const getCellDisplayInfo = (employeeId, dayNum) => {
        const log = getLogForDay(employeeId, dayNum);
        if (log) {
            const status = log.status;
            let display = '';
            let colorClass = '';
            let tooltip = '';

            const formatTime = (dateStr) => {
                if (!dateStr) return '';
                try {
                    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                } catch (e) {
                    return '';
                }
            };

            const checkInStr = formatTime(log.checkIn);
            const checkOutStr = formatTime(log.checkOut);

            if (status === 'Present') {
                const ot = log.overtimeHours || 0;
                const ns = log.isNightShift || false;
                
                if (ns && ot > 0) {
                    display = 'P🌙⁺';
                    colorClass = 'text-indigo-600 dark:text-violet-400 font-extrabold';
                } else if (ns) {
                    display = 'P🌙';
                    colorClass = 'text-cyan-600 dark:text-cyan-400 font-bold';
                } else if (ot > 0) {
                    display = 'P⁺';
                    colorClass = 'text-emerald-600 dark:text-emerald-400 font-bold';
                } else {
                    display = 'P';
                    colorClass = 'text-green-600 dark:text-green-400';
                }
                
                tooltip = `Present | In: ${checkInStr || '-'} | Out: ${checkOutStr || '-'}`;
                if (ns) tooltip += ` | Night Shift`;
                if (ot > 0) tooltip += ` | OT: ${ot} hrs`;
            } else if (status === 'Absent') {
                display = 'A';
                colorClass = 'text-red-500 dark:text-red-400/80';
                tooltip = 'Absent';
            } else if (status === 'Leave') {
                display = 'L';
                colorClass = 'text-amber-500 dark:text-amber-400';
                tooltip = 'Leave';
            } else if (status === 'Holiday') {
                display = 'H';
                colorClass = 'text-violet-500 dark:text-violet-400';
                tooltip = 'Holiday';
            }
            return { display, colorClass, tooltip };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const cellDate = new Date(selectedYear, selectedMonth - 1, dayNum);
        
        if (cellDate > today) {
            return { display: '-', colorClass: 'text-slate-400 dark:text-gray-500 font-normal', tooltip: 'Future Date' };
        } else {
            return { display: 'A', colorClass: 'text-red-500 dark:text-red-400/80', tooltip: 'Absent (No Record)' };
        }
    };

    // Calculate Overtime for a single day log
    const getOtForDay = (log) => {
        if (!log) return 0;
        if (typeof log.overtimeHours === 'number') {
            return log.overtimeHours;
        }
        if (!log.checkIn || !log.checkOut) return 0;
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
                if (log.status === 'Present' || log.status === 'Holiday') {
                    presentDays++;
                }
                totalOtHours += getOtForDay(log);
            }
        }

        return {
            presentDays,
            totalOtHours: parseFloat(totalOtHours.toFixed(2)) // Keep decimal precision for OT!
        };
    };

    const handleCellClick = (employee, dayNum) => {
        const log = getLogForDay(employee._id, dayNum);
        setSelectedCell({ employee, dayNum });
        if (log) {
            setModalForm({
                status: log.status === 'Present' ? 'Present' : (log.status === 'Leave' ? 'Leave' : (log.status === 'Holiday' ? 'Holiday' : 'Absent')),
                checkIn: log.checkIn ? new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '',
                checkOut: log.checkOut ? new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '',
                overtimeHours: log.overtimeHours || 0,
                isNightShift: log.isNightShift || false
            });
        } else {
            // Default depending on whether it is in the future
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const cellDate = new Date(selectedYear, selectedMonth - 1, dayNum);
            
            if (cellDate > today) {
                setModalForm({ status: 'Present', checkIn: '09:00', checkOut: '17:00', overtimeHours: 0, isNightShift: false });
            } else {
                setModalForm({ status: 'Absent', checkIn: '', checkOut: '', overtimeHours: 0, isNightShift: false });
            }
        }
    };

    const handleSaveAttendance = async () => {
        if (!selectedCell) return;
        const { employee, dayNum } = selectedCell;
        const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

        try {
            await axios.post(`${API_BASE_URL}/api/attendance/admin-mark`, {
                employeeId: employee._id,
                date: dateStr,
                status: modalForm.status,
                checkIn: modalForm.status === 'Present' ? modalForm.checkIn : null,
                checkOut: modalForm.status === 'Present' ? modalForm.checkOut : null,
                overtimeHours: modalForm.status === 'Present' ? modalForm.overtimeHours : 0,
                isNightShift: modalForm.status === 'Present' ? modalForm.isNightShift : false
            });
            setSelectedCell(null);
            fetchData();
        } catch (error) {
            console.error("Error saving manual attendance:", error);
            alert("Failed to save attendance.");
        }
    };

    const handleSaveBlanketAttendance = async () => {
        const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(blanketForm.dayNum).padStart(2, '0')}`;
        try {
            await axios.post(`${API_BASE_URL}/api/attendance/blanket-mark`, {
                date: dateStr,
                status: blanketForm.status,
                checkIn: blanketForm.status === 'Present' ? blanketForm.checkIn : null,
                checkOut: blanketForm.status === 'Present' ? blanketForm.checkOut : null,
                overtimeHours: blanketForm.status === 'Present' ? blanketForm.overtimeHours : 0,
                isNightShift: blanketForm.status === 'Present' ? blanketForm.isNightShift : false
            });
            setIsBlanketModalOpen(false);
            fetchData();
        } catch (error) {
            console.error("Error saving blanket attendance:", error);
            alert("Failed to save blanket attendance.");
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-indigo-50 dark:bg-[#110f18] text-slate-800 dark:text-gray-200 transition-colors duration-300">
            <Header />
            <main className="flex-grow p-4 sm:p-6 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <Link 
                        to="/Main" 
                        className="inline-flex items-center gap-2 mb-6 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-[#3e3857] hover:bg-slate-100 dark:hover:bg-[#201d2c] text-xs font-bold text-slate-600 dark:text-gray-300 transition duration-200 shadow-sm print:hidden"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Dashboard
                    </Link>
                    <h2 className="text-3xl font-extrabold mb-6 text-center text-indigo-900 dark:text-white tracking-tight">
                        Monthly Attendance Register
                    </h2>

                    {/* Filter Bar */}
                    <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-lg rounded-xl p-6 mb-8 flex flex-wrap gap-6 items-center justify-between transition-colors duration-300">
                        <div className="flex flex-wrap gap-4 items-center">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Month</label>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                    className="px-4 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
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
                                    className="px-4 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                                >
                                    {Array.from({ length: new Date().getFullYear() + 5 - 2024 + 1 }, (_, i) => 2024 + i).map(y => (
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
                                    className="w-24 px-4 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition text-center"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 items-center">
                            <button
                                onClick={() => setIsBlanketModalOpen(true)}
                                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-750 hover:to-violet-750 text-white font-bold rounded-lg text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition duration-200 flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                                Blanket Mark
                            </button>
                            <div className="text-right text-xs print:hidden">
                                <span className="text-[10px] font-bold text-slate-400 dark:text-gray-500 block uppercase tracking-wider">Currently Showing</span>
                                <span className="text-sm font-extrabold text-indigo-700 dark:text-violet-400">{monthName} {selectedYear}</span>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-10">
                            <div className="text-indigo-600 dark:text-violet-400 text-xl font-bold animate-pulse">Loading Attendance Records...</div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-xl rounded-xl p-6 transition-colors duration-300">
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
                                                            const cellInfo = getCellDisplayInfo(emp._id, day);
                                                            return (
                                                                <td 
                                                                    key={day} 
                                                                    className={`px-1.5 py-3 text-center font-bold border-r border-slate-100 dark:border-[#262235] last:border-r-0 cursor-pointer hover:bg-indigo-100/30 dark:hover:bg-[#201d2c] transition duration-150 ${cellInfo.colorClass}`}
                                                                    onClick={() => handleCellClick(emp, day)}
                                                                    onMouseEnter={(e) => {
                                                                        const log = getLogForDay(emp._id, day);
                                                                        if (log) {
                                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                                            setHoveredCell({
                                                                                employeeName: emp.name,
                                                                                date: `${day} ${monthName} ${selectedYear}`,
                                                                                status: log.status,
                                                                                checkIn: log.checkIn ? new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : null,
                                                                                checkOut: log.checkOut ? new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : null,
                                                                                isNightShift: log.isNightShift,
                                                                                overtimeHours: log.overtimeHours,
                                                                                x: rect.left,
                                                                                y: rect.bottom + 5
                                                                            });
                                                                        }
                                                                    }}
                                                                    onMouseLeave={() => setHoveredCell(null)}
                                                                >
                                                                    {cellInfo.display}
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

                    {/* Legend Section */}
                    <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-lg rounded-xl p-6 mt-8 transition-colors duration-300">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Attendance Status Legend & Guide</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4 text-xs">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 flex items-center justify-center font-bold rounded bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/30">P</span>
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-white">Present</p>
                                    <p className="text-[10px] text-slate-400">Regular Shift</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 flex items-center justify-center font-bold rounded bg-green-50 dark:bg-green-950/20 text-emerald-600 dark:text-emerald-400 border border-green-200 dark:border-green-900/30">P⁺</span>
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-white">Present + OT</p>
                                    <p className="text-[10px] text-slate-400">Overtime Hours</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 flex items-center justify-center font-bold rounded bg-cyan-50 dark:bg-cyan-950/20 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-900/30">P🌙</span>
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-white">Night Shift</p>
                                    <p className="text-[10px] text-slate-400">Night Hours</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 flex items-center justify-center font-bold rounded bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-violet-400 border border-indigo-200 dark:border-indigo-900/30">P🌙⁺</span>
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-white">Night Shift + OT</p>
                                    <p className="text-[10px] text-slate-400">Overnight + OT</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 flex items-center justify-center font-bold rounded bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400/80 border border-red-200 dark:border-red-900/30">A</span>
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-white">Absent</p>
                                    <p className="text-[10px] text-slate-400">No work log</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 flex items-center justify-center font-bold rounded bg-amber-50 dark:bg-amber-950/20 text-amber-500 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30">L</span>
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-white">Leave</p>
                                    <p className="text-[10px] text-slate-400 font-normal">Approved leave</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 flex items-center justify-center font-bold rounded bg-violet-50 dark:bg-violet-950/20 text-violet-500 dark:text-violet-400 border border-violet-200 dark:border-violet-900/30">H</span>
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-white">Holiday</p>
                                    <p className="text-[10px] text-slate-400 font-normal">Public holiday</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 flex items-center justify-center font-normal rounded bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-gray-500 border border-slate-200 dark:border-[#262235]">-</span>
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-white">Unmarked</p>
                                    <p className="text-[10px] text-slate-400 font-normal">Future date</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#262235] text-[11px] text-slate-500 dark:text-gray-400 flex flex-wrap gap-4">
                            <span className="flex items-center gap-1.5">
                                <svg className="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <strong>Interactive Tooltips:</strong> Hover over any daily cell to inspect detailed check-in, check-out, night shift status, and overtime hours instantly.
                            </span>
                            <span className="flex items-center gap-1.5">
                                <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                <strong>Quick Edit:</strong> Click on any daily cell to manually override status, adjust time logs, or designate overtime hours.
                            </span>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />

            {/* Attendance Override Modal */}
            {selectedCell && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-65 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] w-full max-w-sm rounded-xl p-6 shadow-2xl relative transition-all duration-300 animate-slide-down">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-[#262235] pb-2 mb-4">
                            Mark Attendance
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-gray-400 mb-4">
                            Employee: <span className="font-bold text-slate-800 dark:text-white">{selectedCell.employee.name}</span><br />
                            Date: <span className="font-bold text-slate-800 dark:text-white">{selectedCell.dayNum} {monthName} {selectedYear}</span>
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Status</label>
                                <select
                                    value={modalForm.status}
                                    onChange={(e) => handleModalFormChange({ status: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition font-medium"
                                >
                                    <option value="Present">Present</option>
                                    <option value="Absent">Absent</option>
                                    <option value="Leave">Leave</option>
                                    <option value="Holiday">Holiday</option>
                                </select>
                            </div>

                            {modalForm.status === 'Present' && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Check In</label>
                                            <input
                                                type="time"
                                                value={modalForm.checkIn}
                                                onChange={(e) => handleModalFormChange({ checkIn: e.target.value })}
                                                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition text-center"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Check Out</label>
                                            <input
                                                type="time"
                                                value={modalForm.checkOut}
                                                onChange={(e) => handleModalFormChange({ checkOut: e.target.value })}
                                                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition text-center"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between bg-slate-50 dark:bg-[#201d2c] p-2.5 rounded-lg border border-slate-200 dark:border-[#37314e]">
                                        <label className="text-xs font-bold text-slate-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={modalForm.isNightShift}
                                                onChange={(e) => handleModalFormChange({ isNightShift: e.target.checked })}
                                                className="rounded text-violet-600 focus:ring-violet-500 bg-slate-100 dark:bg-[#201d2c] border-slate-300 dark:border-[#37314e] h-4 w-4"
                                            />
                                            🌙 Night Shift
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">OT (Hrs):</label>
                                            <input
                                                type="number"
                                                step="0.5"
                                                min="0"
                                                value={modalForm.overtimeHours}
                                                onChange={(e) => handleModalFormChange({ overtimeHours: parseFloat(e.target.value) || 0 })}
                                                className="w-16 px-2 py-1 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#37314e] rounded text-sm text-center text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 font-semibold"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleSaveAttendance}
                                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 rounded-lg shadow transition duration-200 text-sm"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => setSelectedCell(null)}
                                className="w-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-gray-300 font-bold py-2.5 rounded-lg shadow transition duration-200 text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Blanket Mark Attendance Modal */}
            {isBlanketModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-65 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] w-full max-w-sm rounded-xl p-6 shadow-2xl relative transition-all duration-300 animate-slide-down">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-[#262235] pb-2 mb-4">
                            Blanket Attendance Mark
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-gray-400 mb-4">
                            Apply a blanket status to **all** employees for a single day of {monthName} {selectedYear}.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Select Day of Month</label>
                                <select
                                    value={blanketForm.dayNum}
                                    onChange={(e) => setBlanketForm({ ...blanketForm, dayNum: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition font-medium"
                                >
                                    {daysArray.map(day => (
                                        <option key={day} value={day}>{day} ({new Date(selectedYear, selectedMonth - 1, day).toLocaleString('default', { weekday: 'short' })})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Blanket Status</label>
                                <select
                                    value={blanketForm.status}
                                    onChange={(e) => handleBlanketFormChange({ status: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition font-medium"
                                >
                                    <option value="Present">Present</option>
                                    <option value="Absent">Absent</option>
                                    <option value="Leave">Leave</option>
                                    <option value="Holiday">Holiday</option>
                                </select>
                            </div>

                            {blanketForm.status === 'Present' && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Check In</label>
                                            <input
                                                type="time"
                                                value={blanketForm.checkIn}
                                                onChange={(e) => handleBlanketFormChange({ checkIn: e.target.value })}
                                                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition text-center"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Check Out</label>
                                            <input
                                                type="time"
                                                value={blanketForm.checkOut}
                                                onChange={(e) => handleBlanketFormChange({ checkOut: e.target.value })}
                                                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition text-center"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between bg-slate-50 dark:bg-[#201d2c] p-2.5 rounded-lg border border-slate-200 dark:border-[#37314e]">
                                        <label className="text-xs font-bold text-slate-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={blanketForm.isNightShift}
                                                onChange={(e) => handleBlanketFormChange({ isNightShift: e.target.checked })}
                                                className="rounded text-indigo-600 focus:ring-indigo-500 bg-slate-100 dark:bg-[#201d2c] border-slate-300 dark:border-[#37314e] h-4 w-4"
                                            />
                                            🌙 Night Shift
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">OT (Hrs):</label>
                                            <input
                                                type="number"
                                                step="0.5"
                                                min="0"
                                                value={blanketForm.overtimeHours}
                                                onChange={(e) => handleBlanketFormChange({ overtimeHours: parseFloat(e.target.value) || 0 })}
                                                className="w-16 px-2 py-1 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#37314e] rounded text-sm text-center text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleSaveBlanketAttendance}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg shadow transition duration-200 text-sm"
                            >
                                Apply All
                            </button>
                            <button
                                onClick={() => setIsBlanketModalOpen(false)}
                                className="w-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-gray-300 font-bold py-2.5 rounded-lg shadow transition duration-200 text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Custom Hover Tooltip */}
            {hoveredCell && (
                <div 
                    className="fixed z-50 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#37314e] text-slate-800 dark:text-gray-200 p-4 rounded-xl shadow-2xl text-xs space-y-2 pointer-events-none transition-all duration-150"
                    style={{ 
                        left: `${hoveredCell.x}px`, 
                        top: `${hoveredCell.y}px`,
                        minWidth: '220px',
                        transform: 'translateX(-50%)',
                        marginLeft: '13px'
                    }}
                >
                    <div className="font-extrabold text-indigo-700 dark:text-violet-400 border-b border-slate-100 dark:border-[#262235] pb-1.5 mb-1.5 uppercase tracking-wide">
                        {hoveredCell.employeeName}
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-400 dark:text-gray-500">Date:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{hoveredCell.date}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-400 dark:text-gray-500">Status:</span>
                        <span className="font-bold text-green-600 dark:text-green-400">{hoveredCell.status}</span>
                    </div>
                    {hoveredCell.status === 'Present' && (
                        <>
                            <div className="flex justify-between">
                                <span className="text-slate-400 dark:text-gray-500">In / Out Time:</span>
                                <span className="font-semibold text-slate-900 dark:text-white">
                                    {hoveredCell.checkIn || '-'} to {hoveredCell.checkOut || '-'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400 dark:text-gray-500">Shift Type:</span>
                                <span className="font-semibold text-slate-900 dark:text-white">
                                    {hoveredCell.isNightShift ? '🌙 Night Shift' : '☀️ Regular Shift'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400 dark:text-gray-500">Overtime:</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                    {hoveredCell.overtimeHours > 0 ? `${hoveredCell.overtimeHours} hrs` : 'None'}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default AttendanceRegister;
