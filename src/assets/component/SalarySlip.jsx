import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

const monthMap = {
    'January': '01', 'February': '02', 'March': '03', 'April': '04',
    'May': '05', 'June': '06', 'July': '07', 'August': '08',
    'September': '09', 'October': '10', 'November': '11', 'December': '12'
};

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
        nightShiftRate: 0,
        hra: 0
    });
    const [monthlyBreakdown, setMonthlyBreakdown] = useState([]);
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
            
            const monthPrefix = `${year}-${monthMap[month]}`;
            
            const employeeLogs = logs.filter(log => {
                const empId = log.employeeId?._id || log.employeeId;
                return empId === selectedEmployee._id && log.date.startsWith(monthPrefix);
            });

            // Rule 1: If there are no Present or Holiday attendance records in the database for the selected employee and month, default to 0
            const hasPresentOrHolidayLogs = employeeLogs.some(log => log.status === 'Present' || log.status === 'Holiday');
            if (!hasPresentOrHolidayLogs) {
                setSalarySlip(prev => ({
                    ...prev,
                    workDays: 0,
                    otHours: 0,
                    nightShiftHours: 0,
                    nightShiftDays: 0,
                    lunchDays: 0
                }));
                setMonthlyBreakdown([]);
                setCalculating(false);
                return;
            }

            // Local date formatter helper to prevent timezone shifts
            const getYYYYMMDD = (d) => {
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}`;
            };

            const daysInMonth = new Date(year, parseInt(monthMap[month]), 0).getDate();
            const dailyCredits = [];

            for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = `${year}-${monthMap[month]}-${String(day).padStart(2, '0')}`;
                
                // Find log
                const log = employeeLogs.find(l => l.date === dateStr);

                let status = 'Absent';
                if (log) {
                    status = log.status;
                } else {
                    const d = new Date(year, parseInt(monthMap[month]) - 1, day);
                    if (d.getDay() === 0) {
                        status = 'Holiday'; // Sunday defaults to Holiday (paid)
                    } else {
                        const todayStr = getYYYYMMDD(new Date());
                        if (dateStr > todayStr) {
                            status = 'Unmarked';
                        } else {
                            status = 'Absent';
                        }
                    }
                }

                let checkIn = '-';
                let checkOut = '-';
                let workedHours = 0;
                let credit = 0.0;
                let description = '';

                const d = new Date(year, parseInt(monthMap[month]) - 1, day);
                const isSunday = d.getDay() === 0;

                if (status === 'Present') {
                    if (log) {
                        if (log.checkIn && log.checkOut) {
                            const inTime = new Date(log.checkIn);
                            const outTime = new Date(log.checkOut);
                            workedHours = (outTime - inTime) / (1000 * 60 * 60);
                            workedHours = parseFloat(workedHours.toFixed(2));
                            checkIn = inTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            checkOut = outTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                            // Apply thresholds
                            if (workedHours < 1.0) {
                                credit = 0.0;
                                description = 'Short Login (< 1 hr)';
                            } else if (workedHours < 7.0) {
                                credit = 0.5;
                                description = 'Half Day (1 - 7 hrs)';
                            } else {
                                credit = 1.0;
                                description = 'Full Day (>= 7 hrs)';
                            }
                        } else if (log.checkIn) {
                            const inTime = new Date(log.checkIn);
                            checkIn = inTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            credit = 0.0;
                            description = 'Missed Punch-Out';
                        } else {
                            // Blanket Present (manual override)
                            credit = 1.0;
                            workedHours = 8.0; // Standard day
                            description = 'Manual Mark';
                        }
                    } else {
                        credit = 1.0;
                        description = 'Manual Mark';
                    }
                } else if (status === 'Holiday') {
                    credit = 1.0;
                    description = isSunday ? 'Sunday' : 'Holiday';
                } else if (status === 'Leave') {
                    credit = 0.0;
                    description = 'Unpaid Leave';
                } else if (status === 'Absent') {
                    credit = 0.0;
                    description = 'Absent';
                } else {
                    credit = 0.0;
                    description = 'Unmarked';
                }

                dailyCredits.push({
                    day,
                    dateStr,
                    status,
                    checkIn,
                    checkOut,
                    workedHours,
                    credit,
                    description,
                    isSunday
                });
            }

            // Helper to compute credit for arbitrary dates (for sandwich rule check outside current month if needed)
            const getCreditForDateStr = (dStr) => {
                const log = logs.find(l => {
                    const empId = l.employeeId?._id || l.employeeId;
                    return empId === selectedEmployee._id && l.date === dStr;
                });
                
                let s = 'Absent';
                if (log) {
                    s = log.status;
                } else {
                    const parts = dStr.split('-');
                    const dt = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                    if (dt.getDay() === 0) {
                        s = 'Holiday';
                    } else {
                        const todayStr = getYYYYMMDD(new Date());
                        if (dStr > todayStr) {
                            s = 'Unmarked';
                        } else {
                            s = 'Absent';
                        }
                    }
                }

                if (s === 'Present') {
                    if (log) {
                        if (log.checkIn && log.checkOut) {
                            const inTime = new Date(log.checkIn);
                            const outTime = new Date(log.checkOut);
                            const wh = (outTime - inTime) / (1000 * 60 * 60);
                            if (wh < 1.0) return 0.0;
                            if (wh < 7.0) return 0.5;
                            return 1.0;
                        } else if (log.checkIn) {
                            return 0.0; // Missed punch-out
                        } else {
                            return 1.0;
                        }
                    }
                    return 1.0;
                } else if (s === 'Holiday') {
                    return 1.0;
                } else {
                    return 0.0;
                }
            };

            // Second pass: Apply sandwich rule on Sundays
            let workDaysCount = 0;
            dailyCredits.forEach((entry) => {
                if (entry.isSunday) {
                    if (entry.status !== 'Absent' && entry.status !== 'Leave') {
                        // Check Saturday & Monday
                        const prevDate = new Date(year, parseInt(monthMap[month]) - 1, entry.day - 1);
                        const nextDate = new Date(year, parseInt(monthMap[month]) - 1, entry.day + 1);
                        const prevDateStr = getYYYYMMDD(prevDate);
                        const nextDateStr = getYYYYMMDD(nextDate);

                        const prevCredit = getCreditForDateStr(prevDateStr);
                        const nextCredit = getCreditForDateStr(nextDateStr);

                        if (prevCredit === 0.0 && nextCredit === 0.0) {
                            entry.credit = 0.0;
                            entry.description = 'Sunday (Sandwich Rule)';
                        }
                    }
                }
                workDaysCount += entry.credit;
            });

            setMonthlyBreakdown(dailyCredits);

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
                lunchDays: Math.ceil(workDaysCount) // Default lunch days to ceiling of work days
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
            setSalarySlip(prev => ({
                ...prev,
                hra: emp.hra || 0
            }));
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
        const monthMapNums = {
            'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
            'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
        };
        return new Date(year, monthMapNums[month], 0).getDate();
    };

    const calendarDays = getCalendarDays();

    // Floor-based Payroll Formulas
    const dailyRate = selectedEmployee ? Math.floor(selectedEmployee.grossSalary / calendarDays) : 0;
    const salaryByWorkDays = Math.floor(salarySlip.workDays * dailyRate);
    const hourlyOtRate = Math.floor(dailyRate / shiftHours);
    const otSalary = Math.floor(salarySlip.otHours * hourlyOtRate);
    const nightShiftAllowance = Math.floor((salarySlip.nightShiftHours || 0) * (salarySlip.nightShiftRate || 0));
    const totalSalary = Math.floor(salaryByWorkDays + otSalary + nightShiftAllowance + Math.floor(salarySlip.hra || 0));
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
                hra: salarySlip.hra || 0,
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
        <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-xl rounded-xl p-6 sm:p-8 mb-10 transition-colors duration-300">
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

                        {/* Allowances: HRA */}
                        <div className="border-t border-slate-100 dark:border-[#262235] pt-4">
                            <h3 className="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-3">Allowances</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">HRA (House Rent Allowance) (₹)</label>
                                    <input
                                        type="number"
                                        name="hra"
                                        value={salarySlip.hra || ''}
                                        placeholder="e.g. 3000"
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                                    />
                                </div>
                            </div>
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

                        {/* Daily Attendance Audit Trail Table */}
                        {monthlyBreakdown.length > 0 && (
                            <div className="border-t border-slate-100 dark:border-[#262235] pt-6">
                                <h3 className="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                                    <span>Daily Attendance Audit Trail</span>
                                    <span className="text-xs normal-case font-normal text-indigo-600 dark:text-violet-400">
                                        Total Credits: <span className="font-bold">{salarySlip.workDays} days</span>
                                    </span>
                                </h3>
                                <div className="border border-slate-200 dark:border-[#262235] rounded-lg overflow-hidden">
                                    <div className="max-h-64 overflow-y-auto overflow-x-auto">
                                        <table className="w-full text-xs text-left border-collapse table-auto">
                                            <thead className="bg-slate-50 dark:bg-[#201d2c]/50 text-slate-500 dark:text-gray-400 font-bold uppercase sticky top-0 z-10 border-b border-slate-200 dark:border-[#262235]">
                                                <tr>
                                                    <th className="px-4 py-2.5">Date</th>
                                                    <th className="px-4 py-2.5">Status</th>
                                                    <th className="px-4 py-2.5">Check-In</th>
                                                    <th className="px-4 py-2.5">Check-Out</th>
                                                    <th className="px-4 py-2.5">Worked Hours</th>
                                                    <th className="px-4 py-2.5 text-center">Paid Credit</th>
                                                    <th className="px-4 py-2.5">Remark</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-[#262235]">
                                                {monthlyBreakdown.map((row) => (
                                                    <tr key={row.day} className="hover:bg-slate-50 dark:hover:bg-[#201d2c]/20 transition duration-150">
                                                        <td className="px-4 py-2 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                                                            {row.day} {month} ({new Date(year, parseInt(monthMap[month]) - 1, row.day).toLocaleDateString('default', { weekday: 'short' })})
                                                        </td>
                                                        <td className="px-4 py-2 whitespace-nowrap">
                                                            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                                row.status === 'Present' ? 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400' :
                                                                row.status === 'Holiday' ? 'bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400' :
                                                                row.status === 'Leave' ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400' :
                                                                'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400'
                                                            }`}>
                                                                {row.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2 text-slate-600 dark:text-gray-300 font-mono">{row.checkIn}</td>
                                                        <td className="px-4 py-2 text-slate-600 dark:text-gray-300 font-mono">{row.checkOut}</td>
                                                        <td className="px-4 py-2 text-slate-600 dark:text-gray-300 font-semibold">{row.workedHours > 0 ? `${row.workedHours.toFixed(2)} hrs` : '-'}</td>
                                                        <td className="px-4 py-2 text-center font-bold text-slate-700 dark:text-gray-200">
                                                            {row.credit.toFixed(1)}
                                                        </td>
                                                        <td className="px-4 py-2 text-slate-500 dark:text-gray-400 italic font-medium">{row.description}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

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
                            {salarySlip.hra > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-slate-500 dark:text-gray-400">House Rent Allowance (HRA):</span>
                                    <span className="font-semibold text-green-600 dark:text-green-400">+ ₹{Math.floor(salarySlip.hra).toLocaleString()}</span>
                                </div>
                            )}
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
                                className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-violet-600 dark:hover:bg-violet-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition duration-200 transform hover:scale-[1.01] active:scale-[0.99] text-sm"
                            >
                                Generate Salary Slip
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SalarySlip;
