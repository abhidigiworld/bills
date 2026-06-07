import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import Footer from './Footer';
import { API_BASE_URL } from '../../config';
import logo from '../images/LOGO.png';
import signature from '../images/sign.png';

function ManagePayrolls() {
    const [slips, setSlips] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Filters
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState('');

    // Modal Edit State
    const [editingSlip, setEditingSlip] = useState(null);
    const [editForm, setEditForm] = useState({
        workDays: 0,
        otHours: 0,
        nightShiftDays: 0,
        nightShiftRate: 0,
        advance: 0,
        esic: 0,
        lunchDays: 0,
        lunchRate: 0,
        shiftHours: 8
    });

    // Slip Print/View State
    const [activeSlip, setActiveSlip] = useState(null);
    const [showSignature, setShowSignature] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const slipsRes = await axios.get(`${API_BASE_URL}/api/salary-slips`);
            const empRes = await axios.get(`${API_BASE_URL}/api/employees`);
            setSlips(Array.isArray(slipsRes.data) ? slipsRes.data : []);
            setEmployees(Array.isArray(empRes.data) ? empRes.data : []);
        } catch (err) {
            console.error("Error loading payroll data:", err);
            setError("Failed to load payroll details.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSlip = async (slipId, empName, monthOfSalary) => {
        const confirmDelete = window.confirm(`Are you sure you want to delete the payroll slip for ${empName} (${monthOfSalary})?`);
        if (!confirmDelete) return;

        setError('');
        setSuccessMessage('');
        try {
            await axios.delete(`${API_BASE_URL}/api/salary-slips/${slipId}`);
            setSuccessMessage(`Payroll slip for ${empName} deleted successfully.`);
            fetchData();
        } catch (err) {
            console.error("Error deleting payroll slip:", err);
            setError("Failed to delete payroll slip.");
        }
    };

    // Open Modal for Edit
    const handleOpenEdit = (slip) => {
        setEditingSlip(slip);
        setEditForm({
            workDays: slip.workDays,
            otHours: slip.overtimeHours || 0,
            nightShiftDays: slip.nightShiftDays || 0,
            nightShiftRate: slip.nightShiftRate || 0,
            advance: slip.advance || 0,
            esic: slip.esic || 0,
            lunchDays: slip.lunchDays || 0,
            lunchRate: slip.lunchRate || 0,
            shiftHours: slip.shiftHours || 8
        });
    };

    // Recalculate based on input form changes (using strict intermediate flooring)
    const calculateLiveEditValues = () => {
        if (!editingSlip || !editingSlip.employeeId) return null;

        // Find matching employee details to retrieve grossSalary
        const emp = employees.find(e => e._id === (editingSlip.employeeId._id || editingSlip.employeeId));
        if (!emp) return null;

        const grossSalary = emp.grossSalary || 0;

        // Determine calendar days for selected month
        const monthOfSalary = editingSlip.monthOfSalary || '';
        const [monthName, yearStr] = monthOfSalary.split(' ');
        const monthMap = {
            'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
            'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
        };
        const monthNum = monthMap[monthName] || 1;
        const yearNum = parseInt(yearStr) || new Date().getFullYear();
        const calendarDays = new Date(yearNum, monthNum, 0).getDate();

        // Floor division rates
        const dailyRate = Math.floor(grossSalary / calendarDays);
        const salaryByWorkDays = Math.floor(editForm.workDays * dailyRate);

        const hourlyOtRate = Math.floor(dailyRate / editForm.shiftHours);
        const otSalary = Math.floor(editForm.otHours * hourlyOtRate);
        const nightShiftAllowance = Math.floor((editForm.nightShiftDays || 0) * (editForm.nightShiftRate || 0));
        const totalSalary = Math.floor(salaryByWorkDays + otSalary + nightShiftAllowance);

        const lunchDeduction = Math.floor(editForm.lunchDays * editForm.lunchRate);
        const inHandSalary = Math.floor(totalSalary - editForm.esic - editForm.advance - lunchDeduction);

        return {
            calendarDays,
            dailyRate,
            salaryByWorkDays,
            hourlyOtRate,
            otSalary,
            nightShiftAllowance,
            totalSalary,
            lunchDeduction,
            inHandSalary,
            grossSalary,
            empName: emp.name,
            designation: emp.designation || 'Staff',
            dateOfJoining: emp.dateOfJoining
        };
    };

    const liveCalculations = calculateLiveEditValues();

    const handleSaveEdit = async () => {
        if (!editingSlip || !liveCalculations) return;
        setError('');
        setSuccessMessage('');
        try {
            await axios.put(`${API_BASE_URL}/api/salary-slips/${editingSlip._id}`, {
                employeeId: editingSlip.employeeId._id || editingSlip.employeeId,
                monthOfSalary: editingSlip.monthOfSalary,
                workDays: editForm.workDays,
                salaryByWorkDays: liveCalculations.salaryByWorkDays,
                otHours: editForm.otHours,
                otSalary: liveCalculations.otSalary,
                nightShiftDays: editForm.nightShiftDays,
                nightShiftRate: editForm.nightShiftRate,
                nightShiftAllowance: liveCalculations.nightShiftAllowance,
                advance: editForm.advance,
                esic: editForm.esic,
                lunchDays: editForm.lunchDays,
                lunchRate: editForm.lunchRate,
                lunchDeduction: liveCalculations.lunchDeduction,
                shiftHours: editForm.shiftHours,
                totalSalary: liveCalculations.totalSalary,
                inHandSalary: liveCalculations.inHandSalary
            });
            setSuccessMessage(`Payroll details updated successfully.`);
            setEditingSlip(null);
            fetchData();
        } catch (err) {
            console.error("Error updating payroll slip:", err);
            setError("Failed to update payroll slip details.");
        }
    };

    // Filter Slips
    const filteredSlips = slips.filter(slip => {
        const emp = slip.employeeId;
        const empId = emp?._id || emp;
        const monthOfSalary = slip.monthOfSalary || '';
        const [monthName, yearStr] = monthOfSalary.split(' ');

        const matchEmployee = selectedEmployeeId ? empId === selectedEmployeeId : true;
        const matchMonth = selectedMonth ? monthName.toLowerCase() === selectedMonth.toLowerCase() : true;
        const matchYear = selectedYear ? yearStr === selectedYear : true;

        return matchEmployee && matchMonth && matchYear;
    });

    const formatSlipDate = (date) => {
        if (!date) return '-';
        const d = new Date(date);
        return d.toLocaleDateString();
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

    return (
        <div className="flex flex-col min-h-screen bg-indigo-50 dark:bg-[#110f18] text-slate-800 dark:text-gray-200 transition-colors duration-300">
            <Header />
            <main className="flex-grow p-4 sm:p-6 md:p-8 print-hidden">
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
                        Manage Saved Payrolls
                    </h2>

                    {error && (
                        <div className="max-w-md mx-auto mb-6 bg-red-100 dark:bg-red-950/40 border border-red-400 dark:border-red-900/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-center text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {successMessage && (
                        <div className="max-w-md mx-auto mb-6 bg-green-100 dark:bg-green-950/40 border border-green-400 dark:border-green-900/50 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg text-center text-sm font-medium">
                            {successMessage}
                        </div>
                    )}

                    {/* Filter Bar */}
                    <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-lg rounded-xl p-6 mb-8 flex flex-wrap gap-4 items-center transition-colors duration-300">
                        <div className="w-full sm:w-auto flex-grow">
                            <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Employee</label>
                            <select
                                value={selectedEmployeeId}
                                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                            >
                                <option value="">All Employees</option>
                                {employees.map(emp => (
                                    <option key={emp._id} value={emp._id}>{emp.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="w-full sm:w-auto">
                            <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Month</label>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                            >
                                <option value="">All Months</option>
                                {[
                                    'January', 'February', 'March', 'April', 'May', 'June',
                                    'July', 'August', 'September', 'October', 'November', 'December'
                                ].map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>

                        <div className="w-full sm:w-auto">
                            <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Year</label>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                            >
                                <option value="">All Years</option>
                                {Array.from({ length: new Date().getFullYear() + 5 - 2024 + 1 }, (_, i) => 2024 + i).map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>

                        {/* Reset Filters button */}
                        <div className="self-end mt-4 sm:mt-0">
                            <button
                                onClick={() => {
                                    setSelectedEmployeeId('');
                                    setSelectedMonth('');
                                    setSelectedYear('');
                                }}
                                className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-[#3e3857] hover:bg-slate-100 dark:hover:bg-[#201d2c] text-xs font-bold transition duration-200"
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-10">
                            <div className="text-indigo-600 dark:text-violet-400 text-xl font-bold animate-pulse">Loading payroll slips...</div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-xl rounded-xl p-6 transition-colors duration-300">
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-[#262235] text-slate-500 dark:text-gray-400 font-bold uppercase text-xxs tracking-wider">
                                            <th className="px-3 py-3 text-center">Sl</th>
                                            <th className="px-3 py-3">Employee</th>
                                            <th className="px-3 py-3">Month</th>
                                            <th className="px-3 py-3 text-center">Work Days</th>
                                            <th className="px-3 py-3 text-center">Gross Salary</th>
                                            <th className="px-3 py-3 text-center">OT Hrs</th>
                                            <th className="px-3 py-3 text-center">Advance</th>
                                            <th className="px-3 py-3 text-center">ESIC</th>
                                            <th className="px-3 py-3 text-center">Lunch Ded</th>
                                            <th className="px-3 py-3 text-center">In Hand</th>
                                            <th className="px-3 py-3 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredSlips.length > 0 ? (
                                            filteredSlips.map((slip, index) => {
                                                const empName = slip.employeeId?.name || 'Unknown';
                                                const grossVal = Math.floor(slip.employeeId?.grossSalary || 0);
                                                return (
                                                    <tr key={slip._id} className="border-b border-slate-100 dark:border-[#262235] hover:bg-slate-50 dark:hover:bg-[#201d2c]/50 transition duration-150">
                                                        <td className="px-3 py-3.5 text-center font-bold text-slate-400">{index + 1}</td>
                                                        <td className="px-3 py-3.5 font-semibold text-slate-900 dark:text-white">{empName}</td>
                                                        <td className="px-3 py-3.5 font-medium text-slate-600 dark:text-gray-300">{slip.monthOfSalary}</td>
                                                        <td className="px-3 py-3.5 text-center font-semibold text-slate-800 dark:text-gray-200">{slip.workDays} days</td>
                                                        <td className="px-3 py-3.5 text-center text-slate-600 dark:text-gray-300">₹{grossVal.toLocaleString()}</td>
                                                        <td className="px-3 py-3.5 text-center text-slate-600 dark:text-gray-300">{slip.overtimeHours || 0} hrs</td>
                                                        <td className="px-3 py-3.5 text-center text-red-500 font-medium">-₹{Math.floor(slip.advance || 0).toLocaleString()}</td>
                                                        <td className="px-3 py-3.5 text-center text-red-500 font-medium">-₹{Math.floor(slip.esic || 0).toLocaleString()}</td>
                                                        <td className="px-3 py-3.5 text-center text-red-500 font-medium">-₹{Math.floor(slip.lunchDeduction || 0).toLocaleString()}</td>
                                                        <td className="px-3 py-3.5 text-center font-extrabold text-green-600 dark:text-green-400 text-sm">₹{Math.floor(slip.inHandSalary || 0).toLocaleString()}</td>
                                                        <td className="px-3 py-3.5 text-center">
                                                            <div className="flex gap-1.5 justify-center">
                                                                <button
                                                                    onClick={() => handleOpenEdit(slip)}
                                                                    className="text-violet-600 hover:text-violet-700 font-bold px-2 py-1.5 rounded-md border border-violet-200 dark:border-violet-900/35 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => setActiveSlip(slip)}
                                                                    className="text-indigo-600 hover:text-indigo-700 font-bold px-2 py-1.5 rounded-md border border-indigo-200 dark:border-indigo-900/35 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition"
                                                                >
                                                                    Print
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteSlip(slip._id, empName, slip.monthOfSalary)}
                                                                    className="text-red-500 hover:text-red-600 font-bold px-2 py-1.5 rounded-md border border-red-200 dark:border-red-900/35 hover:bg-red-50 dark:hover:bg-red-950/20 transition"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="11" className="text-center py-8 text-slate-400 font-medium">
                                                    No salary slips found matching the filters.
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

            {/* EDIT SLIP MODAL */}
            {editingSlip && liveCalculations && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] w-full max-w-lg rounded-xl p-6 shadow-2xl relative transition-all duration-300 animate-slide-down">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-[#262235] pb-2.5 mb-4">
                            Edit Payroll - {liveCalculations.empName} ({editingSlip.monthOfSalary})
                        </h3>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">No. of Workday</label>
                                    <input
                                        type="number"
                                        value={editForm.workDays}
                                        onChange={(e) => setEditForm({ ...editForm, workDays: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">O.T. (Hours)</label>
                                    <input
                                        type="number"
                                        value={editForm.otHours}
                                        onChange={(e) => setEditForm({ ...editForm, otHours: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Night Shift Days</label>
                                    <input
                                        type="number"
                                        value={editForm.nightShiftDays}
                                        onChange={(e) => setEditForm({ ...editForm, nightShiftDays: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Night Shift Rate (₹ / Shift)</label>
                                    <input
                                        type="number"
                                        value={editForm.nightShiftRate}
                                        onChange={(e) => setEditForm({ ...editForm, nightShiftRate: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Advance Taken</label>
                                    <input
                                        type="number"
                                        value={editForm.advance}
                                        onChange={(e) => setEditForm({ ...editForm, advance: Math.floor(parseFloat(e.target.value)) || 0 })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">ESIC Deduction</label>
                                    <input
                                        type="number"
                                        value={editForm.esic}
                                        onChange={(e) => setEditForm({ ...editForm, esic: Math.floor(parseFloat(e.target.value)) || 0 })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Lunch Days</label>
                                    <input
                                        type="number"
                                        value={editForm.lunchDays}
                                        onChange={(e) => setEditForm({ ...editForm, lunchDays: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition text-center"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Lunch Rate</label>
                                    <input
                                        type="number"
                                        value={editForm.lunchRate}
                                        onChange={(e) => setEditForm({ ...editForm, lunchRate: Math.floor(parseFloat(e.target.value)) || 0 })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition text-center"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Shift Hours</label>
                                    <input
                                        type="number"
                                        value={editForm.shiftHours}
                                        onChange={(e) => setEditForm({ ...editForm, shiftHours: parseInt(e.target.value) || 8 })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition text-center"
                                    />
                                </div>
                            </div>

                            {/* Recalculated Breakdown Live Preview */}
                            <div className="bg-slate-50 dark:bg-[#201d2c]/40 p-4 rounded-lg border border-slate-200/50 dark:border-[#262235] text-xs space-y-1.5 transition-colors">
                                <h4 className="font-bold text-slate-700 dark:text-gray-300 border-b border-slate-200/50 dark:border-[#262235] pb-1.5 mb-2 uppercase tracking-wide">Live Payout Breakdown</h4>
                                <div className="flex justify-between">
                                    <span className="text-slate-500 dark:text-gray-400">Calendar Days:</span>
                                    <span className="font-semibold text-slate-800 dark:text-white">{liveCalculations.calendarDays} days</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500 dark:text-gray-400">Daily Rate (Floored):</span>
                                    <span className="font-semibold text-slate-800 dark:text-white">₹{liveCalculations.dailyRate.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500 dark:text-gray-400">Workday Salary:</span>
                                    <span className="font-semibold text-slate-800 dark:text-white">₹{liveCalculations.salaryByWorkDays.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500 dark:text-gray-400">O.T. Pay (Hourly Rate ₹{liveCalculations.hourlyOtRate}):</span>
                                    <span className="font-semibold text-slate-800 dark:text-white">₹{liveCalculations.otSalary.toLocaleString()}</span>
                                </div>
                                {liveCalculations.nightShiftAllowance > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500 dark:text-gray-400">Night Shift Pay ({editForm.nightShiftDays} shifts @ ₹{editForm.nightShiftRate}):</span>
                                        <span className="font-semibold text-slate-800 dark:text-white">₹{liveCalculations.nightShiftAllowance.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between border-t border-slate-200/50 dark:border-[#262235] pt-1.5 font-bold text-slate-900 dark:text-white">
                                    <span>Total Salary (Gross):</span>
                                    <span>₹{liveCalculations.totalSalary.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-red-500 font-semibold">
                                    <span>ESIC + Advance + Lunch (₹{liveCalculations.lunchDeduction}):</span>
                                    <span>-₹{(editForm.esic + editForm.advance + liveCalculations.lunchDeduction).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between border-t border-slate-200/50 dark:border-[#262235] pt-1.5 font-extrabold text-indigo-700 dark:text-violet-400 text-sm">
                                    <span>Net In Hand (Floored):</span>
                                    <span>₹{liveCalculations.inHandSalary.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleSaveEdit}
                                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 rounded-lg shadow transition duration-200 text-sm"
                            >
                                Save Changes
                            </button>
                            <button
                                onClick={() => setEditingSlip(null)}
                                className="w-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-gray-300 font-bold py-2.5 rounded-lg shadow transition duration-200 text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PRINT PREVIEW MODAL */}
            {activeSlip && (() => {
                const activeCalendarDays = getCalendarDays(activeSlip.monthOfSalary);
                const activeGrossSalary = activeSlip.employeeId?.grossSalary || 0;
                const activeDailyRate = Math.floor(activeGrossSalary / activeCalendarDays);
                const activeHourlyRate = Math.floor(activeDailyRate / (activeSlip.shiftHours || 8));
                return (
                    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 print:static print:bg-transparent print:p-0 print:overflow-visible">
                        <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] w-full max-w-2xl rounded-xl p-6 shadow-2xl relative transition-colors duration-300 animate-slide-down print:p-0 print:border-none print:shadow-none print:bg-white print:text-black">

                            {/* Slip Printable Block */}
                            <div className="printdata font-mono text-slate-800 dark:text-gray-200 print:text-black w-full border border-black rounded-lg overflow-hidden bg-white dark:bg-[#181622] print:bg-white">
                                {/* Header (styled like Tax Invoice) */}
                                <div className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white p-4 invoice-print-header border-b border-black">
                                    <p className="text-xl font-bold text-center uppercase tracking-wide">Salary Statement</p>
                                    <div className="flex justify-between items-center relative mt-2">
                                        <div className="absolute" style={{ top: '-10px', left: '-10px' }}>
                                            <img src={logo} alt="Your Company Logo" className="w-24 h-auto rounded-md" />
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
                                            <td colSpan="3" className="border-r border-black px-3 py-2 text-left"><span className="text-slate-500 print:text-gray-500 font-bold uppercase text-[9px] block">Employee Name:</span> <span className="font-extrabold text-sm">{activeSlip.employeeId?.name || 'Staff'}</span></td>
                                            <td colSpan="2" className="px-3 py-2 text-left"><span className="text-slate-500 print:text-gray-500 font-bold uppercase text-[9px] block">Salary Slip No:</span> <span className="font-bold">SLIP-{activeSlip._id.slice(-6).toUpperCase()}</span></td>
                                        </tr>
                                        <tr className="border-b border-black">
                                            <td colSpan="3" className="border-r border-black px-3 py-2 text-left"><span className="text-slate-500 print:text-gray-500 font-bold uppercase text-[9px] block">Designation:</span> <span className="font-semibold">{activeSlip.employeeId?.designation || 'Staff'}</span></td>
                                            <td colSpan="2" className="px-3 py-2 text-left"><span className="text-slate-500 print:text-gray-500 font-bold uppercase text-[9px] block">Statement Period:</span> <span className="font-bold">{activeSlip.monthOfSalary}</span></td>
                                        </tr>
                                        <tr className="border-b border-black">
                                            <td colSpan="3" className="border-r border-black px-3 py-2 text-left"><span className="text-slate-500 print:text-gray-500 font-bold uppercase text-[9px] block">Date of Joining:</span> <span className="font-semibold">{activeSlip.employeeId?.dateOfJoining ? new Date(activeSlip.employeeId.dateOfJoining).toLocaleDateString() : '-'}</span></td>
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
                                        {(() => {
                                            let sNo = 1;
                                            return (
                                                <>
                                                    <tr className="border-b border-slate-200 dark:border-[#262235] print:border-black">
                                                        <td className="border-r border-black px-2 py-1.5 text-center">{sNo++}</td>
                                                        <td className="border-r border-black px-3 py-1.5 text-left font-semibold">Basic Salary Earned</td>
                                                        <td className="border-r border-black px-3 py-1.5 text-center">₹{activeDailyRate.toLocaleString()} / day</td>
                                                        <td className="border-r border-black px-3 py-1.5 text-center">{activeSlip.workDays} days</td>
                                                        <td className="border-r border-black px-3 py-1.5 text-right font-bold text-green-600 print:text-black">₹{Math.floor(activeSlip.salaryByWorkDays).toLocaleString()}</td>
                                                        <td className="px-3 py-1.5 text-right text-slate-400">-</td>
                                                    </tr>
                                                    {activeSlip.overtimeHours > 0 && (
                                                        <tr className="border-b border-slate-200 dark:border-[#262235] print:border-black">
                                                            <td className="border-r border-black px-2 py-1.5 text-center">{sNo++}</td>
                                                            <td className="border-r border-black px-3 py-1.5 text-left font-semibold">Overtime Pay</td>
                                                            <td className="border-r border-black px-3 py-1.5 text-center">₹{activeHourlyRate.toLocaleString()} / hr</td>
                                                            <td className="border-r border-black px-3 py-1.5 text-center">{activeSlip.overtimeHours} hrs</td>
                                                            <td className="border-r border-black px-3 py-1.5 text-right font-bold text-green-600 print:text-black">₹{Math.floor(activeSlip.overtimeSalary).toLocaleString()}</td>
                                                            <td className="px-3 py-1.5 text-right text-slate-400">-</td>
                                                        </tr>
                                                    )}
                                                    {activeSlip.nightShiftDays > 0 && (
                                                        <tr className="border-b border-slate-200 dark:border-[#262235] print:border-black">
                                                            <td className="border-r border-black px-2 py-1.5 text-center">{sNo++}</td>
                                                            <td className="border-r border-black px-3 py-1.5 text-left font-semibold">Night Shift Allowance</td>
                                                            <td className="border-r border-black px-3 py-1.5 text-center">₹{Math.floor(activeSlip.nightShiftRate || 0).toLocaleString()} / shift</td>
                                                            <td className="border-r border-black px-3 py-1.5 text-center">{activeSlip.nightShiftDays} shifts</td>
                                                            <td className="border-r border-black px-3 py-1.5 text-right font-bold text-green-600 print:text-black">₹{Math.floor(activeSlip.nightShiftAllowance || 0).toLocaleString()}</td>
                                                            <td className="px-3 py-1.5 text-right text-slate-400">-</td>
                                                        </tr>
                                                    )}
                                                    {activeSlip.esic > 0 && (
                                                        <tr className="border-b border-slate-200 dark:border-[#262235] print:border-black">
                                                            <td className="border-r border-black px-2 py-1.5 text-center">{sNo++}</td>
                                                            <td className="border-r border-black px-3 py-1.5 text-left font-semibold text-red-600 print:text-black">ESIC Contribution</td>
                                                            <td className="border-r border-black px-3 py-1.5 text-center">-</td>
                                                            <td className="border-r border-black px-3 py-1.5 text-center">-</td>
                                                            <td className="border-r border-black px-3 py-1.5 text-right text-slate-400">-</td>
                                                            <td className="px-3 py-1.5 text-right font-bold text-red-500 print:text-black">₹{Math.floor(activeSlip.esic).toLocaleString()}</td>
                                                        </tr>
                                                    )}
                                                    {activeSlip.advance > 0 && (
                                                        <tr className="border-b border-slate-200 dark:border-[#262235] print:border-black">
                                                            <td className="border-r border-black px-2 py-1.5 text-center">{sNo++}</td>
                                                            <td className="border-r border-black px-3 py-1.5 text-left font-semibold text-red-600 print:text-black">Salary Advance</td>
                                                            <td className="border-r border-black px-3 py-1.5 text-center">-</td>
                                                            <td className="border-r border-black px-3 py-1.5 text-center">-</td>
                                                            <td className="border-r border-black px-3 py-1.5 text-right text-slate-400">-</td>
                                                            <td className="px-3 py-1.5 text-right font-bold text-red-500 print:text-black">₹{Math.floor(activeSlip.advance).toLocaleString()}</td>
                                                        </tr>
                                                    )}
                                                    {activeSlip.lunchDeduction > 0 && (
                                                        <tr className="border-b border-slate-200 dark:border-[#262235] print:border-black">
                                                            <td className="border-r border-black px-2 py-1.5 text-center">{sNo++}</td>
                                                            <td className="border-r border-black px-3 py-1.5 text-left font-semibold text-red-600 print:text-black">Lunch Deduction</td>
                                                            <td className="border-r border-black px-3 py-1.5 text-center">₹{Math.floor(activeSlip.lunchRate).toLocaleString()} / day</td>
                                                            <td className="border-r border-black px-3 py-1.5 text-center">{activeSlip.lunchDays} days</td>
                                                            <td className="border-r border-black px-3 py-1.5 text-right text-slate-400">-</td>
                                                            <td className="px-3 py-1.5 text-right font-bold text-red-500 print:text-black">₹{Math.floor(activeSlip.lunchDeduction).toLocaleString()}</td>
                                                        </tr>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </tbody>
                                </table>

                                {/* Summary Calculation (Totals) */}
                                <div className="flex justify-between items-stretch border-t border-black bg-slate-50 dark:bg-slate-900/10 print:bg-transparent">
                                    <div className="text-left text-xs font-bold p-3 pr-4 flex flex-col justify-start border-r border-black flex-grow">
                                        <span className="text-slate-500 print:text-gray-500 block uppercase text-[9px] mb-1">Net Pay (In Words):</span>
                                        <span className="font-extrabold text-slate-900 dark:text-white print:text-black">
                                            Rupees {convertNumberToWords(Math.floor(activeSlip.inHandSalary))} Only
                                        </span>
                                    </div>
                                    <div className="p-3 flex-shrink-0 w-80">
                                        <table className="w-full text-xs">
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
                                        {showSignature && (
                                            <img src={signature} alt="Signature" className="absolute top-1.5 left-0 right-0 mx-auto w-32 h-auto opacity-95 pointer-events-none" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Print Actions */}
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
        </div>
    );
}

export default ManagePayrolls;
