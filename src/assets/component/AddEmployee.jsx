import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

function AddEmployee() {
    const [employees, setEmployees] = useState([]);
    const [employee, setEmployee] = useState({ 
        name: '', 
        email: '', 
        dateOfJoining: '', 
        grossSalary: 0, 
        hra: 0,
        designation: '',
        location: '',
        status: 'Active',
        defaultShift: 'Day (09:30 - 17:30)'
    });
    const [isEditing, setIsEditing] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchEmployees();
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
                setIsEditing(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    const fetchEmployees = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/employees`);
            setEmployees(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Error fetching employees:", error);
            setEmployees([]);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'dateOfJoining') {
            const formattedDate = value.split('T')[0];
            setEmployee({ ...employee, [name]: formattedDate });
        } else if (name === 'grossSalary' || name === 'hra') {
            setEmployee({ ...employee, [name]: Math.floor(parseFloat(value)) || 0 });
        } else {
            setEmployee({ ...employee, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            if (isEditing) {
                await axios.put(`${API_BASE_URL}/api/employees/${employee._id}`, employee);
                setIsEditing(false);
            } else {
                await axios.post(`${API_BASE_URL}/api/employees`, employee);
            }
            setEmployee({ 
                name: '', 
                email: '', 
                dateOfJoining: '', 
                grossSalary: 0, 
                hra: 0,
                designation: '',
                location: '',
                status: 'Active',
                defaultShift: 'Day (09:30 - 17:30)'
            });
            setIsOpen(false);
            fetchEmployees();
        } catch (error) {
            console.error("Error saving employee:", error);
            setError(error.response?.data?.error || 'Failed to save employee profile. Ensure email is unique.');
        }
    };

    const handleEdit = (emp) => {
        const formattedDate = new Date(emp.dateOfJoining).toISOString().split('T')[0];
        setEmployee({
            ...emp,
            dateOfJoining: formattedDate,
            designation: emp.designation || '',
            location: emp.location || '',
            hra: emp.hra || 0,
            defaultShift: emp.defaultShift || 'Day (09:30 - 17:30)'
        });
        setIsEditing(true);
        setIsOpen(true);
    };

    const handleDelete = async (id) => {
        const isConfirmed = window.confirm("Are you sure you want to delete this employee?");
        if (isConfirmed) {
            try {
                await axios.delete(`${API_BASE_URL}/api/employees/${id}`);
                fetchEmployees();
            } catch (error) {
                console.error("Error deleting employee:", error);
            }
        }
    };

    return (
        <div className="max-w-5xl mx-auto animate-fade-in">
            {/* Header row: Title on the left, Add button on the right */}
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Registered Employees</h3>
                <button
                    onClick={() => {
                        setEmployee({ 
                            name: '', 
                            email: '', 
                            dateOfJoining: '', 
                            grossSalary: 0, 
                            hra: 0,
                            designation: '',
                            location: '',
                            status: 'Active',
                            defaultShift: 'Day (09:30 - 17:30)'
                        });
                        setError('');
                        setIsEditing(false);
                        setIsOpen(true);
                    }}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-violet-600 dark:hover:bg-violet-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all duration-200 shadow-md hover:scale-[1.02] active:scale-[0.98]"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span>Add Employee</span>
                </button>
            </div>

            {/* Registered Employees Table */}
            <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-xl rounded-xl p-6 transition-colors duration-300">
                <div className="overflow-x-auto">
                    {employees.length > 0 ? (
                        <table className="w-full text-sm text-left border-collapse table-auto">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-[#262235] text-slate-500 dark:text-gray-400 font-bold uppercase text-xs">
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3 whitespace-nowrap">Email</th>
                                    <th className="px-4 py-3">Designation</th>
                                    <th className="px-4 py-3">Location</th>
                                    <th className="px-4 py-3 whitespace-nowrap">Joined Date</th>
                                    <th className="px-4 py-3 whitespace-nowrap">Gross Salary</th>
                                    <th className="px-4 py-3 whitespace-nowrap">Shift</th>
                                    <th className="px-4 py-3 whitespace-nowrap">Status</th>
                                    <th className="px-4 py-3 text-center whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map((emp) => (
                                    <tr key={emp._id} className="border-b border-slate-100 dark:border-[#262235] hover:bg-slate-50 dark:hover:bg-[#201d2c]/50 transition duration-150">
                                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{emp.name}</td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-gray-300 font-mono text-xs whitespace-nowrap">{emp.email || '-'}</td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-gray-300">{emp.designation || '-'}</td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-gray-300">{emp.location || '-'}</td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-gray-300 whitespace-nowrap">
                                            {emp.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-slate-700 dark:text-gray-200 whitespace-nowrap">₹{Math.floor(emp.grossSalary)?.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-gray-300 whitespace-nowrap">
                                            <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full ${
                                                emp.defaultShift === 'Night' ? 'bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400' :
                                                'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400'
                                            }`}>
                                                {emp.defaultShift || 'Day'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full ${
                                                emp.status === 'Active' ? 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400' :
                                                emp.status === 'On Hold' ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400' :
                                                emp.status === 'On Holiday' ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400' :
                                                emp.status === 'Discontinued' ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400' :
                                                'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400'
                                            }`}>
                                                {emp.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 flex items-center justify-center gap-2 whitespace-nowrap">
                                            <button
                                                onClick={() => handleEdit(emp)}
                                                className="bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 dark:hover:bg-[#312a44] text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-md text-xs font-bold transition duration-200"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(emp._id)}
                                                className="bg-red-50 dark:bg-red-950 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-md text-xs font-bold transition duration-200"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-gray-500 text-center py-6 font-medium">No employees registered in the system.</p>
                    )}
                </div>
            </div>

            {/* REGISTRATION & EDIT MODAL OVERLAY */}
            {isOpen && (
                <div 
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setIsOpen(false);
                            setIsEditing(false);
                            setError('');
                        }
                    }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
                >
                    <div className="relative bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-2xl rounded-2xl w-full max-w-lg overflow-y-auto p-6 sm:p-8 transition-colors duration-300 animate-slide-down">
                        {/* Close button */}
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                setIsEditing(false);
                                setError('');
                            }}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Close"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <h3 className="text-lg font-black text-indigo-950 dark:text-white pb-2 border-b border-slate-100 dark:border-[#262235] mb-4">
                                {isEditing ? 'Edit Employee Profile' : 'Register New Employee'}
                            </h3>

                            {error && (
                                <div className="mb-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 px-4 py-2.5 rounded-lg text-center text-xs font-semibold">
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="Employee Name"
                                        value={employee.name}
                                        onChange={handleInputChange}
                                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-xs text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Email (Optional)</label>
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="name@company.com"
                                        value={employee.email}
                                        onChange={handleInputChange}
                                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-xs text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Designation</label>
                                    <input
                                        type="text"
                                        name="designation"
                                        placeholder="e.g. Developer, Staff"
                                        value={employee.designation}
                                        onChange={handleInputChange}
                                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-xs text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Location</label>
                                    <input
                                        type="text"
                                        name="location"
                                        placeholder="e.g. New Delhi"
                                        value={employee.location}
                                        onChange={handleInputChange}
                                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-xs text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Date of Joining</label>
                                    <input
                                        type="date"
                                        name="dateOfJoining"
                                        value={employee.dateOfJoining}
                                        onChange={handleInputChange}
                                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Gross Salary (Monthly)</label>
                                    <input
                                        type="number"
                                        name="grossSalary"
                                        placeholder="Gross Salary in ₹"
                                        value={employee.grossSalary || ''}
                                        onChange={handleInputChange}
                                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-xs text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">HRA (House Rent Allowance - Optional)</label>
                                    <input
                                        type="number"
                                        name="hra"
                                        placeholder="HRA in ₹ (e.g. 3000)"
                                        value={employee.hra || ''}
                                        onChange={handleInputChange}
                                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-xs text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Status</label>
                                    <select
                                        name="status"
                                        value={employee.status}
                                        onChange={handleInputChange}
                                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition cursor-pointer"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="On Hold">On Hold</option>
                                        <option value="On Holiday">On Holiday</option>
                                        <option value="Inactive">Inactive</option>
                                        <option value="Discontinued">Discontinued</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Default Shift</label>
                                    <select
                                        name="defaultShift"
                                        value={employee.defaultShift || 'Day (09:30 - 17:30)'}
                                        onChange={handleInputChange}
                                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition cursor-pointer"
                                    >
                                        <option value="Day (09:30 - 17:30)">Day Shift (09:30 - 17:30)</option>
                                        <option value="Day (09:00 - 17:00)">Day Shift (09:00 - 17:00)</option>
                                        <option value="Night (20:00 - 04:00)">Night Shift (20:00 - 04:00)</option>
                                    </select>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                className="bg-indigo-600 hover:bg-indigo-700 dark:bg-violet-600 dark:hover:bg-violet-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg transition duration-200 transform hover:scale-[1.01] active:scale-[0.99] w-full text-xs mt-6"
                            >
                                {isEditing ? 'Update Employee Profile' : 'Register Employee'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AddEmployee;
