import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './Header';
import Footer from './Footer';
import { API_BASE_URL } from '../../config';

function AddEmployee() {
    const [employees, setEmployees] = useState([]);
    const [employee, setEmployee] = useState({ name: '', email: '', dateOfJoining: '', grossSalary: 0, status: 'Active' });
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
            setEmployee({ ...employee, [name]: parseFloat(value) || 0 });
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
            setEmployee({ name: '', email: '', dateOfJoining: '', grossSalary: 0, status: 'Active' });
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
        <>
            <Header />
            <div className="p-6 bg-indigo-50 min-h-screen mb-8">
                <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">
                    {isEditing ? 'Edit Employee' : 'Add Employee'}
                </h2>

                {error && (
                    <div className="max-w-md mx-auto mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-6 mb-8 max-w-lg mx-auto">
                    <div className="mb-4">
                        <label className="block text-gray-700 font-semibold mb-2">Name</label>
                        <input
                            type="text"
                            name="name"
                            placeholder="Employee Name"
                            value={employee.name}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 font-semibold mb-2">Email</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="employee@company.com"
                            value={employee.email}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 font-semibold mb-2">Date of Joining</label>
                        <input
                            type="date"
                            name="dateOfJoining"
                            value={employee.dateOfJoining}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 font-semibold mb-2">Gross Salary (Monthly)</label>
                        <input
                            type="number"
                            name="grossSalary"
                            placeholder="Gross Salary"
                            value={employee.grossSalary || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-gray-700 font-semibold mb-2">Status</label>
                        <select
                            name="status"
                            value={employee.status}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>

                    <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-blue-600 transition duration-300 w-full font-bold">
                        {isEditing ? 'Update Employee' : 'Add Employee'}
                    </button>
                </form>

                <h3 className="text-xl font-semibold mb-4 text-blue-600 text-center">Employee List</h3>

                <div className="overflow-x-auto bg-white shadow-lg rounded-lg max-w-4xl mx-auto">
                    {employees.length > 0 ? (
                        <table className="min-w-full bg-white">
                            <thead>
                                <tr>
                                    <th className="px-6 py-3 border-b-2 border-gray-200 bg-blue-500 text-white font-semibold text-left">Name</th>
                                    <th className="px-6 py-3 border-b-2 border-gray-200 bg-blue-500 text-white font-semibold text-left">Email</th>
                                    <th className="px-6 py-3 border-b-2 border-gray-200 bg-blue-500 text-white font-semibold text-left">Date of Joining</th>
                                    <th className="px-6 py-3 border-b-2 border-gray-200 bg-blue-500 text-white font-semibold text-left">Gross Salary</th>
                                    <th className="px-6 py-3 border-b-2 border-gray-200 bg-blue-500 text-white font-semibold text-left">Status</th>
                                    <th className="px-6 py-3 border-b-2 border-gray-200 bg-blue-500 text-white font-semibold text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map((emp) => (
                                    <tr key={emp._id} className="hover:bg-gray-100 transition duration-200">
                                        <td className="px-6 py-4 border-b border-gray-200">{emp.name}</td>
                                        <td className="px-6 py-4 border-b border-gray-200">{emp.email || '-'}</td>
                                        <td className="px-6 py-4 border-b border-gray-200">{emp.dateOfJoining?.split('T')[0]}</td>
                                        <td className="px-6 py-4 border-b border-gray-200">₹{emp.grossSalary}</td>
                                        <td className="px-6 py-4 border-b border-gray-200">{emp.status}</td>
                                        <td className="px-6 py-4 border-b border-gray-200 flex gap-2">
                                            <button
                                                onClick={() => handleEdit(emp)}
                                                className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 transition duration-300"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(emp._id)}
                                                className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition duration-300"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-gray-500 text-center py-4">No employees found.</p>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
}

export default AddEmployee;
