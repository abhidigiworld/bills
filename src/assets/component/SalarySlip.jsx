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

            // Count days marked 'Present'
            const workDaysCount = employeeLogs.filter(log => log.status === 'Present').length;

            // Calculate overtime hours
            let otHoursCount = 0;
            employeeLogs.forEach(log => {
                if (log.status === 'Present' && log.checkIn && log.checkOut) {
                    const checkInTime = new Date(log.checkIn);
                    const checkOutTime = new Date(log.checkOut);
                    const hoursWorked = (checkOutTime - checkInTime) / (1000 * 60 * 60);
                    if (hoursWorked > shiftHours) {
                        otHoursCount += (hoursWorked - shiftHours);
                    }
                }
            });

            setSalarySlip(prev => ({
                ...prev,
                workDays: workDaysCount,
                otHours: Math.floor(otHoursCount),
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
    const totalSalary = Math.floor(salaryByWorkDays + otSalary);
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
                        className="inline-flex items-center gap-2 mb-6 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#3e3857] hover:bg-slate-100 dark:hover:bg-[#201d2c] text-xs font-bold text-slate-600 dark:text-gray-300 transition duration-200 shadow-sm print:hidden"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Dashboard
                    </Link>
                    <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-xl rounded-[2rem] p-6 sm:p-8 mb-10 transition-colors duration-300">
                    <h2 className="text-3xl font-extrabold text-center mb-6 text-indigo-900 dark:text-white tracking-tight">
                        Generate Salary Slip
                    </h2>

                    <div className="mb-6">
                        <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Select Employee</label>
                        <select
                            onChange={handleEmployeeSelect}
                            defaultValue=""
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
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
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-[#201d2c]/40 p-4 rounded-2xl border border-slate-200/50 dark:border-[#262235]">
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
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
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
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                                    >
                                        {[2024, 2025, 2026, 2027, 2028].map(y => (
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
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition text-center font-semibold"
                                    />
                                </div>
                            </div>

                            {/* Interactive Attendance inputs */}
                            <div className="border-t border-slate-100 dark:border-[#262235] pt-4">
                                <h3 className="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-3">Attendance & Overtime</h3>
                                {calculating ? (
                                    <p className="text-xs text-indigo-600 dark:text-violet-400 animate-pulse font-semibold">Calculating attendance logs...</p>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">No. of Workdays</label>
                                            <input
                                                type="number"
                                                name="workDays"
                                                value={salarySlip.workDays}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">O.T. Hours</label>
                                            <input
                                                type="number"
                                                name="otHours"
                                                value={salarySlip.otHours}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                                            />
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
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
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
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
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
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
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
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Summary Calculation Pane */}
                            <div className="border-t border-slate-100 dark:border-[#262235] pt-6 bg-slate-50 dark:bg-[#201d2c]/20 p-5 rounded-[2rem] border border-slate-200/50 dark:border-[#262235] space-y-2.5 text-sm">
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
                                <div className="flex justify-between border-t border-slate-200 dark:border-[#262235] pt-2 font-bold text-slate-900 dark:text-white">
                                    <span>Total Salary (Gross):</span>
                                    <span>₹{totalSalary.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-red-600 dark:text-red-400">
                                    <span>Total Lunch Deduction ({salarySlip.lunchDays} days @ ₹{salarySlip.lunchRate}):</span>
                                    <span>- ₹{lunchDeduction.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center bg-indigo-50 dark:bg-[#201d2c] p-4 rounded-xl mt-4 border border-indigo-100/50 dark:border-indigo-900/50">
                                    <span className="font-extrabold text-slate-900 dark:text-white">In Hand Net Salary (Floored):</span>
                                    <span className="text-xl font-black text-indigo-700 dark:text-violet-400">₹{inHandSalary.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4 pt-2">
                                <button
                                    onClick={handleSubmit}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 dark:bg-violet-600 dark:hover:bg-violet-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition duration-200 transform hover:scale-[1.01] active:scale-[0.99] text-sm"
                                >
                                    Generate Salary Slip
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-700 dark:text-gray-300 font-bold py-3 px-6 rounded-xl shadow-md transition duration-200 text-sm"
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
