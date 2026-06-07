import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import Footer from './Footer';
import { API_BASE_URL } from '../../config';

function AddEmployee() {
    const [employees, setEmployees] = useState([]);
    const [employee, setEmployee] = useState({ 
        name: '', 
        email: '', 
        dateOfJoining: '', 
        grossSalary: 0, 
        designation: '',
        location: '',
        status: 'Active' 
    });
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchEmployees();
    }, []);

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
        } else if (name === 'grossSalary') {
            setEmployee({ ...employee, [name]: Math.floor(parseFloat(value)) || 0 });
        } else {
            setEmployee({ ...employee, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!employee.email.trim()) {
            setError('Email is required');
            return;
        }

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
                designation: '',
                location: '',
                status: 'Active' 
            });
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
        });
        setIsEditing(true);
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
        <div className="flex flex-col min-h-screen bg-indigo-50 dark:bg-[#110f18] text-slate-800 dark:text-gray-200 transition-colors duration-300">
            <Header />
            <main className="flex-grow p-4 sm:p-6 md:p-8">
                <div className="max-w-5xl mx-auto">
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
                        {isEditing ? 'Edit Employee Profile' : 'Register New Employee'}
                    </h2>

                    {error && (
                        <div className="max-w-lg mx-auto mb-6 bg-red-100 dark:bg-red-950/40 border border-red-400 dark:border-red-900/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-center text-sm font-medium animate-shake">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-xl rounded-xl p-6 sm:p-8 mb-10 max-w-lg mx-auto transition-colors duration-300">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Employee Name"
                                    value={employee.name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="name@company.com"
                                    value={employee.email}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Designation</label>
                                <input
                                    type="text"
                                    name="designation"
                                    placeholder="e.g. Developer, Staff"
                                    value={employee.designation}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Location</label>
                                <input
                                    type="text"
                                    name="location"
                                    placeholder="e.g. New Delhi"
                                    value={employee.location}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Date of Joining</label>
                                <input
                                    type="date"
                                    name="dateOfJoining"
                                    value={employee.dateOfJoining}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Gross Salary (Monthly)</label>
                                <input
                                    type="number"
                                    name="grossSalary"
                                    placeholder="Gross Salary in ₹"
                                    value={employee.grossSalary || ''}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                                    required
                                />
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Status</label>
                            <select
                                name="status"
                                value={employee.status}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                            >
                                <option value="Active">Active</option>
                                <option value="On Hold">On Hold</option>
                                <option value="On Holiday">On Holiday</option>
                                <option value="Inactive">Inactive</option>
                                <option value="Discontinued">Discontinued</option>
                            </select>
                        </div>

                        <button 
                            type="submit" 
                            className="bg-indigo-600 hover:bg-indigo-700 dark:bg-violet-600 dark:hover:bg-violet-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition duration-200 transform hover:scale-[1.01] active:scale-[0.99] w-full text-sm"
                        >
                            {isEditing ? 'Update Employee Profile' : 'Register Employee'}
                        </button>
                    </form>

                    <h3 className="text-2xl font-extrabold mb-4 text-indigo-900 dark:text-white text-center">Registered Employees</h3>

                    <div className="overflow-x-auto bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-xl rounded-xl p-4 transition-colors duration-300">
                        {employees.length > 0 ? (
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-[#262235] text-slate-500 dark:text-gray-400 font-bold uppercase text-xs">
                                        <th className="px-4 py-3">Name</th>
                                        <th className="px-4 py-3">Email</th>
                                        <th className="px-4 py-3">Designation</th>
                                        <th className="px-4 py-3">Location</th>
                                        <th className="px-4 py-3">Joined Date</th>
                                        <th className="px-4 py-3">Gross Salary</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employees.map((emp) => (
                                        <tr key={emp._id} className="border-b border-slate-100 dark:border-[#262235] hover:bg-slate-50 dark:hover:bg-[#201d2c]/50 transition duration-150">
                                            <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{emp.name}</td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-gray-300">{emp.email || '-'}</td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-gray-300">{emp.designation || '-'}</td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-gray-300">{emp.location || '-'}</td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-gray-300">
                                                {emp.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-slate-700 dark:text-gray-200">₹{Math.floor(emp.grossSalary)?.toLocaleString()}</td>
                                            <td className="px-4 py-3">
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
                                            <td className="px-4 py-3 flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(emp)}
                                                    className="bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-md text-xs font-bold transition duration-200"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(emp._id)}
                                                    className="bg-red-50 dark:bg-red-950 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-md text-xs font-bold transition duration-200"
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
            </main>
            <Footer />
        </div>
    );
}

export default AddEmployee;
