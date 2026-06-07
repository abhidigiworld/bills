import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import Footer from './Footer';
import { API_BASE_URL } from '../../config';

function SalarySlip() {
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
    const [shiftHours, setShiftHours] = useState(8);
    const [salarySlip, setSalarySlip] = useState({
        workDays: 0,
        otHours: 0,
        advance: 0,
        esic: 0,
        lunchDays: 0,
        lunchRate: 0,
        nightShiftHours: 0,
        nightShiftDays: 0,
        nightShiftRate: 0
    });
    const [calculating, setCalculating] = useState(false);

    useEffect(() => {
        fetchActiveEmployees();
    }, []);

    useEffect(() => {
        if (selectedEmployee) {
            autoCalculateAttendance();
        }
    }, [selectedEmployee, month, year, shiftHours]);

    const fetchActiveEmployees = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/employees/active`);
            setEmployees(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Error fetching active employees:", error);
            setEmployees([]);
        }
    };

    const autoCalculateAttendance = async () => {
        setCalculating(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/attendance`);
            const logs = Array.isArray(response.data) ? response.data : [];
            
            const monthMap = {
                'January': '01', 'February': '02', 'March': '03', 'April': '04',
                'May': '05', 'June': '06', 'July': '07', 'August': '08',
                'September': '09', 'October': '10', 'November': '11', 'December': '12'
            };
            const monthPrefix = `${year}-${monthMap[month]}`;
            
            const employeeLogs = logs.filter(log => {
                const empId = log.employeeId?._id || log.employeeId;
                return empId === selectedEmployee._id && log.date.startsWith(monthPrefix);
            });

            // Local date formatter helper to prevent timezone shifts
            const getYYYYMMDD = (d) => {
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}`;
            };

            // Helper to get status of any specific date (YYYY-MM-DD)
            const getStatusForDate = (dateStr) => {
                const log = logs.find(l => {
                    const empId = l.employeeId?._id || l.employeeId;
                    return empId === selectedEmployee._id && l.date === dateStr;
                });
                if (log) return log.status; // 'Present', 'Absent', 'Leave', 'Holiday'
                
                // If no log exists in database:
                const todayStr = getYYYYMMDD(new Date());
                if (dateStr > todayStr) {
                    return 'Unmarked'; 
                } else {
                    // Sundays in the past default to Holiday (paid off), others default to Absent (unpaid)
                    const parts = dateStr.split('-');
                    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                    if (d.getDay() === 0) {
                        return 'Holiday';
                    }
                    return 'Absent';
                }
            };

            // Calculate paid days for the month
            let workDaysCount = 0;
            const daysInMonth = new Date(year, parseInt(monthMap[month]), 0).getDate();
            
            for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = `${year}-${monthMap[month]}-${String(day).padStart(2, '0')}`;
                const status = getStatusForDate(dateStr);
                
                const d = new Date(year, parseInt(monthMap[month]) - 1, day);
                const isSunday = d.getDay() === 0;
                
                if (isSunday) {
                    if (status === 'Leave' || status === 'Absent') {
                        // Explicitly marked unpaid
                    } else {
                        // Check Sandwich Rule: if Saturday before and Monday after are Leave/Absent
                        const prevDate = new Date(year, parseInt(monthMap[month]) - 1, day - 1);
                        const nextDate = new Date(year, parseInt(monthMap[month]) - 1, day + 1);
                        
                        const prevDateStr = getYYYYMMDD(prevDate);
                        const nextDateStr = getYYYYMMDD(nextDate);
                        
                        const prevStatus = getStatusForDate(prevDateStr);
                        const nextStatus = getStatusForDate(nextDateStr);
                        
                        const isSandwich = (prevStatus === 'Leave' || prevStatus === 'Absent') && 
                                           (nextStatus === 'Leave' || nextStatus === 'Absent');
                        
                        if (!isSandwich) {
                            workDaysCount++;
                        }
                    }
                } else {
                    // Weekdays are paid if marked Present or Holiday
                    if (status === 'Present' || status === 'Holiday') {
                        workDaysCount++;
                    }
                }
            }

            // Calculate overtime hours & night shift hours
            let otHoursCount = 0;
            let nightShiftHoursCount = 0;
            let nightShiftDaysCount = 0;
            employeeLogs.forEach(log => {
                if (log.status === 'Present') {
                    otHoursCount += (log.overtimeHours || 0);
                    if (log.isNightShift) {
                        nightShiftHoursCount += (log.nightShiftHours || 0);
                        nightShiftDaysCount++;
                    }
                }
            });

            setSalarySlip(prev => ({
                ...prev,
                workDays: workDaysCount,
                otHours: parseFloat(otHoursCount.toFixed(2)),
                nightShiftHours: parseFloat(nightShiftHoursCount.toFixed(2)),
                nightShiftDays: nightShiftDaysCount,
                lunchDays: workDaysCount // Default lunch days to work days
            }));
        } catch (err) {
            console.error("Error auto-calculating attendance:", err);
        } finally {
            setCalculating(false);
        }
    };

    const handleEmployeeSelect = (e) => {
        const emp = employees.find(emp => emp._id === e.target.value);
        if (emp) {
            setSelectedEmployee({
                ...emp,
                dateOfJoining: formatDate(emp.dateOfJoining),
            });
        }
    };

    const formatDate = (date) => {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    };

    // Calculate days in the selected month
    const getCalendarDays = () => {
        const monthMap = {
            'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
            'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
        };
        return new Date(year, monthMap[month], 0).getDate();
    };

    const calendarDays = getCalendarDays();

    // Floor-based Payroll Formulas
    const dailyRate = selectedEmployee ? Math.floor(selectedEmployee.grossSalary / calendarDays) : 0;
    const salaryByWorkDays = Math.floor(salarySlip.workDays * dailyRate);
    const hourlyOtRate = Math.floor(dailyRate / shiftHours);
    const otSalary = Math.floor(salarySlip.otHours * hourlyOtRate);
    const nightShiftAllowance = Math.floor((salarySlip.nightShiftHours || 0) * (salarySlip.nightShiftRate || 0));
    const totalSalary = Math.floor(salaryByWorkDays + otSalary + nightShiftAllowance);
    const lunchDeduction = Math.floor(salarySlip.lunchDays * salarySlip.lunchRate);
    const inHandSalary = Math.floor(totalSalary - salarySlip.esic - salarySlip.advance - lunchDeduction);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSalarySlip({ ...salarySlip, [name]: parseFloat(value) || 0 });
    };

    const handleEmployeeDetailsChange = (e) => {
        const { name, value } = e.target;
        setSelectedEmployee({ ...selectedEmployee, [name]: value });
    };

    const handleSubmit = async () => {
        if (!selectedEmployee) return;
        try {
            await axios.post(`${API_BASE_URL}/api/salary-slips`, {
                employeeId: selectedEmployee._id,
                monthOfSalary: `${month} ${year}`,
                workDays: salarySlip.workDays,
                salaryByWorkDays,
                overtimeHours: salarySlip.otHours,
                overtimeSalary: otSalary,
                nightShiftHours: salarySlip.nightShiftHours || 0,
                nightShiftDays: salarySlip.nightShiftDays || 0,
                nightShiftRate: salarySlip.nightShiftRate || 0,
                nightShiftAllowance,
                advance: salarySlip.advance,
                esic: salarySlip.esic,
                lunchDays: salarySlip.lunchDays,
                lunchRate: salarySlip.lunchRate,
                lunchDeduction,
                shiftHours,
                totalSalary,
                inHandSalary
            });
            alert('Salary Slip Saved Successfully!');
        } catch (error) {
            console.error("Error saving salary slip:", error);
            alert("Failed to save salary slip: " + (error.response?.data?.error || error.message));
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-indigo-50 dark:bg-[#110f18] text-slate-800 dark:text-gray-200 transition-colors duration-300">
            <Header />
            <main className="flex-grow p-4 sm:p-6 md:p-8">
                <div className="max-w-3xl mx-auto">
                    <Link 
                        to="/Main" 
                        className="inline-flex items-center gap-2 mb-6 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-[#3e3857] hover:bg-slate-100 dark:hover:bg-[#201d2c] text-xs font-bold text-slate-600 dark:text-gray-300 transition duration-200 shadow-sm print:hidden"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Dashboard
                    </Link>
                    <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-xl rounded-xl p-6 sm:p-8 mb-10 transition-colors duration-300">
                    <h2 className="text-3xl font-extrabold text-center mb-6 text-indigo-900 dark:text-white tracking-tight">
                        Generate Salary Slip
                    </h2>

                    <div className="mb-6">
                        <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Select Employee</label>
                        <select
                            onChange={handleEmployeeSelect}
                            defaultValue=""
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                        >
                            <option value="" disabled>Choose active employee...</option>
                            {employees.length > 0 ? (
                                employees.map(emp => (
                                    <option key={emp._id} value={emp._id}>{emp.name} ({emp.designation || 'Staff'})</option>
                                ))
                            ) : (
                                <option disabled>No active employees found</option>
                            )}
                        </select>
                    </div>

                    {selectedEmployee && (
                        <div className="space-y-6 animate-fade-in">
                            {/* Employee Static Details */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-[#201d2c]/40 p-4 rounded-lg border border-slate-200/50 dark:border-[#262235]">
                                <div>
                                    <span className="block text-xs text-slate-400 font-bold uppercase">Name</span>
                                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{selectedEmployee.name}</span>
                                </div>
                                <div>
                                    <span className="block text-xs text-slate-400 font-bold uppercase">Date of Joining</span>
                                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{selectedEmployee.dateOfJoining}</span>
                                </div>
                                <div>
                                    <span className="block text-xs text-slate-400 font-bold uppercase">Gross Salary (Monthly)</span>
                                    <span className="text-sm font-bold text-indigo-600 dark:text-violet-400">₹{Math.floor(selectedEmployee.grossSalary).toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Month & Year Selectors */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Salary Month</label>
                                    <select
                                        value={month}
                                        onChange={(e) => setMonth(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                                    >
                                        {[
                                            'January', 'February', 'March', 'April', 'May',
                                            'June', 'July', 'August', 'September', 'October',
                                            'November', 'December',
                                        ].map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Salary Year</label>
                                    <select
                                        value={year}
                                        onChange={(e) => setYear(parseInt(e.target.value))}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                                    >
                                        {Array.from({ length: new Date().getFullYear() + 5 - 2024 + 1 }, (_, i) => 2024 + i).map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Shift Hours (Standard)</label>
                                    <input
                                        type="number"
                                        value={shiftHours}
                                        onChange={(e) => setShiftHours(parseInt(e.target.value) || 8)}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition text-center font-semibold"
                                    />
                                </div>
                            </div>

                            {/* Interactive Attendance inputs */}
                            <div className="border-t border-slate-100 dark:border-[#262235] pt-4">
                                <h3 className="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-3">Attendance & Overtime</h3>
                                {calculating ? (
                                    <p className="text-xs text-indigo-600 dark:text-violet-400 animate-pulse font-semibold">Calculating attendance logs...</p>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">No. of Workdays</label>
                                                <input
                                                    type="number"
                                                    name="workDays"
                                                    value={salarySlip.workDays}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">O.T. Hours</label>
                                                <input
                                                    type="number"
                                                    name="otHours"
                                                    value={salarySlip.otHours}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Night Shift Hours</label>
                                                <input
                                                    type="number"
                                                    name="nightShiftHours"
                                                    value={salarySlip.nightShiftHours || 0}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Night Shift Rate (₹ / hr)</label>
                                                <input
                                                    type="number"
                                                    name="nightShiftRate"
                                                    value={salarySlip.nightShiftRate || ''}
                                                    placeholder="Allowance per hour"
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Deductions: Advance, ESIC, Lunch */}
                            <div className="border-t border-slate-100 dark:border-[#262235] pt-4">
                                <h3 className="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-3">Deductions</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Advance Taken (₹)</label>
                                        <input
                                            type="number"
                                            name="advance"
                                            value={salarySlip.advance || ''}
                                            placeholder="Enter advance amount"
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">ESIC (₹)</label>
                                        <input
                                            type="number"
                                            name="esic"
                                            value={salarySlip.esic || ''}
                                            placeholder="Enter ESIC deduction"
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Lunch Days</label>
                                        <input
                                            type="number"
                                            name="lunchDays"
                                            value={salarySlip.lunchDays}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Lunch Rate (₹ per day)</label>
                                        <input
                                            type="number"
                                            name="lunchRate"
                                            value={salarySlip.lunchRate || ''}
                                            placeholder="e.g. 50"
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Summary Calculation Pane */}
                            <div className="border-t border-slate-100 dark:border-[#262235] pt-6 bg-slate-50 dark:bg-[#201d2c]/20 p-5 rounded-lg border border-slate-200/50 dark:border-[#262235] space-y-2.5 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500 dark:text-gray-400">Calendar Days in Month:</span>
                                    <span className="font-semibold">{calendarDays} days</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500 dark:text-gray-400">Basic Earned Salary:</span>
                                    <span className="font-semibold">₹{salaryByWorkDays.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500 dark:text-gray-400">Overtime Salary (Floored):</span>
                                    <span className="font-semibold text-green-600 dark:text-green-400">+ ₹{otSalary.toLocaleString()}</span>
                                </div>
                                {nightShiftAllowance > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500 dark:text-gray-400">Night Shift Allowance ({salarySlip.nightShiftHours || salarySlip.nightShiftDays} {salarySlip.nightShiftHours ? 'hrs' : 'shifts'} @ ₹{salarySlip.nightShiftRate}{salarySlip.nightShiftHours ? '/hr' : '/shift'}):</span>
                                        <span className="font-semibold text-green-600 dark:text-green-400">+ ₹{nightShiftAllowance.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between border-t border-slate-200 dark:border-[#262235] pt-2 font-bold text-slate-900 dark:text-white">
                                    <span>Total Salary (Gross):</span>
                                    <span>₹{totalSalary.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-red-600 dark:text-red-400">
                                    <span>Total Lunch Deduction ({salarySlip.lunchDays} days @ ₹{salarySlip.lunchRate}):</span>
                                    <span>- ₹{lunchDeduction.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center bg-indigo-50 dark:bg-[#201d2c] p-4 rounded-lg mt-4 border border-indigo-100/50 dark:border-indigo-900/50">
                                    <span className="font-extrabold text-slate-900 dark:text-white">In Hand Net Salary (Floored):</span>
                                    <span className="text-xl font-black text-indigo-700 dark:text-violet-400">₹{inHandSalary.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4 pt-2">
                                <button
                                    onClick={handleSubmit}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 dark:bg-violet-600 dark:hover:bg-violet-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition duration-200 transform hover:scale-[1.01] active:scale-[0.99] text-sm"
                                >
                                    Generate Salary Slip
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-700 dark:text-gray-300 font-bold py-3 px-6 rounded-lg shadow-md transition duration-200 text-sm"
                                >
                                    Print View
                                </button>
                            </div>
                        </div>
                    )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default SalarySlip;
