import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import Footer from './Footer';
import { API_BASE_URL } from '../../config';

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
        advance: 0,
        esic: 0,
        lunchDays: 0,
        lunchRate: 0,
        shiftHours: 8
    });

    // Slip Print/View State
    const [activeSlip, setActiveSlip] = useState(null);

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
        const totalSalary = Math.floor(salaryByWorkDays + otSalary);

        const lunchDeduction = Math.floor(editForm.lunchDays * editForm.lunchRate);
        const inHandSalary = Math.floor(totalSalary - editForm.esic - editForm.advance - lunchDeduction);

        return {
            calendarDays,
            dailyRate,
            salaryByWorkDays,
            hourlyOtRate,
            otSalary,
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

    return (
        <div className="flex flex-col min-h-screen bg-indigo-50 dark:bg-[#110f18] text-slate-800 dark:text-gray-200 transition-colors duration-300">
            <Header />
            <main className="flex-grow p-4 sm:p-6 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <Link
                        to="/Main"
                        className="inline-flex items-center gap-2 mb-6 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#3e3857] hover:bg-slate-100 dark:hover:bg-[#201d2c] text-xs font-bold text-slate-600 dark:text-gray-300 transition duration-200 shadow-sm print:hidden"
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
                        <div className="max-w-md mx-auto mb-6 bg-red-100 dark:bg-red-950/40 border border-red-400 dark:border-red-900/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-center text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {successMessage && (
                        <div className="max-w-md mx-auto mb-6 bg-green-100 dark:bg-green-950/40 border border-green-400 dark:border-green-900/50 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl text-center text-sm font-medium">
                            {successMessage}
                        </div>
                    )}

                    {/* Filter Bar */}
                    <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-lg rounded-[2rem] p-6 mb-8 flex flex-wrap gap-4 items-center transition-colors duration-300">
                        <div className="w-full sm:w-auto flex-grow">
                            <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Employee</label>
                            <select
                                value={selectedEmployeeId}
                                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
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
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
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
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
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
                                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#3e3857] hover:bg-slate-100 dark:hover:bg-[#201d2c] text-xs font-bold transition duration-200"
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
                        <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-xl rounded-[2rem] p-6 transition-colors duration-300">
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
                                                                    className="text-violet-600 hover:text-violet-700 font-bold px-2 py-1.5 rounded-lg border border-violet-200 dark:border-violet-900/35 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => setActiveSlip(slip)}
                                                                    className="text-indigo-600 hover:text-indigo-700 font-bold px-2 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-900/35 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition"
                                                                >
                                                                    Print
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteSlip(slip._id, empName, slip.monthOfSalary)}
                                                                    className="text-red-500 hover:text-red-600 font-bold px-2 py-1.5 rounded-lg border border-red-200 dark:border-red-900/35 hover:bg-red-50 dark:hover:bg-red-950/20 transition"
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
                    <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] w-full max-w-lg rounded-[2rem] p-6 shadow-2xl relative transition-all duration-300 animate-slide-down">
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
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">O.T. (Hours)</label>
                                    <input
                                        type="number"
                                        value={editForm.otHours}
                                        onChange={(e) => setEditForm({ ...editForm, otHours: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
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
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">ESIC Deduction</label>
                                    <input
                                        type="number"
                                        value={editForm.esic}
                                        onChange={(e) => setEditForm({ ...editForm, esic: Math.floor(parseFloat(e.target.value)) || 0 })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
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
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition text-center"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Lunch Rate</label>
                                    <input
                                        type="number"
                                        value={editForm.lunchRate}
                                        onChange={(e) => setEditForm({ ...editForm, lunchRate: Math.floor(parseFloat(e.target.value)) || 0 })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition text-center"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Shift Hours</label>
                                    <input
                                        type="number"
                                        value={editForm.shiftHours}
                                        onChange={(e) => setEditForm({ ...editForm, shiftHours: parseInt(e.target.value) || 8 })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition text-center"
                                    />
                                </div>
                            </div>

                            {/* Recalculated Breakdown Live Preview */}
                            <div className="bg-slate-50 dark:bg-[#201d2c]/40 p-4 rounded-2xl border border-slate-200/50 dark:border-[#262235] text-xs space-y-1.5 transition-colors">
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
                                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 rounded-xl shadow transition duration-200 text-sm"
                            >
                                Save Changes
                            </button>
                            <button
                                onClick={() => setEditingSlip(null)}
                                className="w-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-gray-300 font-bold py-2.5 rounded-xl shadow transition duration-200 text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PRINT PREVIEW MODAL */}
            {activeSlip && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] w-full max-w-xl rounded-[2rem] p-6 shadow-2xl relative transition-colors duration-300 animate-slide-down print:p-0 print:border-none print:shadow-none print:bg-white print:text-black">

                        {/* Slip Printable Block */}
                        <div className="printdata font-sans text-slate-800 dark:text-gray-200 print:text-black">
                            <h2 className="text-xl font-extrabold text-center text-indigo-950 dark:text-white print:text-black uppercase tracking-wider mb-1">
                                Sakshi Enterprises
                            </h2>
                            <p className="text-center text-slate-400 dark:text-slate-500 print:text-gray-600 text-xs font-semibold uppercase tracking-wider mb-6">
                                Salary Statement - {activeSlip.monthOfSalary}
                            </p>

                            <div className="grid grid-cols-2 gap-4 border-b border-t border-slate-200 dark:border-[#262235] py-4 mb-4 text-xs">
                                <div className="space-y-1.5">
                                    <p><span className="text-slate-500 dark:text-gray-400 print:text-gray-500 font-semibold block uppercase text-[10px]">Employee Name:</span> <span className="font-bold text-slate-900 dark:text-white print:text-black text-sm">{activeSlip.employeeId?.name || 'Staff'}</span></p>
                                    <p><span className="text-slate-500 dark:text-gray-400 print:text-gray-500 font-semibold block uppercase text-[10px]">Designation:</span> <span className="font-medium text-slate-700 dark:text-gray-300 print:text-black">{activeSlip.employeeId?.designation || '-'}</span></p>
                                </div>
                                <div className="space-y-1.5 text-right">
                                    <p><span className="text-slate-500 dark:text-gray-400 print:text-gray-500 font-semibold block uppercase text-[10px]">Gross Salary (Monthly):</span> <span className="font-bold text-slate-900 dark:text-white print:text-black text-sm">₹{Math.floor(activeSlip.employeeId?.grossSalary || 0).toLocaleString()}</span></p>
                                    <p><span className="text-slate-500 dark:text-gray-400 print:text-gray-500 font-semibold block uppercase text-[10px]">Date of Joining:</span> <span className="font-medium text-slate-700 dark:text-gray-300 print:text-black">{activeSlip.employeeId?.dateOfJoining ? new Date(activeSlip.employeeId.dateOfJoining).toLocaleDateString() : '-'}</span></p>
                                </div>
                            </div>

                            <div className="space-y-2 border-b border-slate-200 dark:border-[#262235] pb-4 mb-4 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-gray-400 print:text-gray-600">No. of Workday:</span>
                                    <span className="font-bold text-slate-800 dark:text-white print:text-black">{activeSlip.workDays} days</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-gray-400 print:text-gray-600">Salary earned:</span>
                                    <span className="font-semibold text-slate-800 dark:text-white print:text-black">₹{Math.floor(activeSlip.salaryByWorkDays || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-gray-400 print:text-gray-600">O.T. ({activeSlip.overtimeHours || 0} hrs):</span>
                                    <span className="font-semibold text-slate-800 dark:text-white print:text-black">₹{Math.floor(activeSlip.overtimeSalary || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between border-t border-slate-100 dark:border-[#262235] pt-2 font-bold text-slate-900 dark:text-white print:text-black">
                                    <span>Total Salary (Gross):</span>
                                    <span>₹{Math.floor(activeSlip.totalSalary || 0).toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="space-y-2 border-b border-slate-200 dark:border-[#262235] pb-4 mb-4 text-xs text-red-600 dark:text-red-400 print:text-black">
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

                            <div className="flex justify-between items-center bg-indigo-50 dark:bg-[#201d2c] p-4 rounded-2xl mb-6 transition-colors duration-300 print:bg-gray-100 print:text-black">
                                <span className="font-extrabold text-slate-900 dark:text-white print:text-black text-xs uppercase tracking-wider">Net In Hand:</span>
                                <span className="font-extrabold text-indigo-700 dark:text-violet-400 print:text-black text-lg">₹{Math.floor(activeSlip.inHandSalary || 0).toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Print Actions */}
                        <div className="flex gap-4 print:hidden">
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
            )}
        </div>
    );
}

export default ManagePayrolls;
