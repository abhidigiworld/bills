import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import Footer from './Footer';
import { API_BASE_URL } from '../../config';

function ManageUsers() {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get(`${API_BASE_URL}/api/users`);
            setUsers(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error("Error fetching users:", err);
            setError("Failed to load user accounts.");
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        setError('');
        setSuccessMessage('');
        try {
            const userToUpdate = users.find(u => u._id === userId);
            const res = await axios.put(`${API_BASE_URL}/api/users/${userId}`, {
                ...userToUpdate,
                role: newRole
            });
            setSuccessMessage(`Role for ${res.data.name} updated to ${newRole}!`);
            fetchUsers();
        } catch (err) {
            console.error("Error updating user role:", err);
            setError("Failed to update user role.");
        }
    };

    const handleVerificationToggle = async (userId, currentStatus) => {
        setError('');
        setSuccessMessage('');
        try {
            const userToUpdate = users.find(u => u._id === userId);
            const res = await axios.put(`${API_BASE_URL}/api/users/${userId}`, {
                ...userToUpdate,
                isVerified: !currentStatus
            });
            setSuccessMessage(`${res.data.name}'s verification status updated!`);
            fetchUsers();
        } catch (err) {
            console.error("Error updating user verification:", err);
            setError("Failed to update verification status.");
        }
    };

    const handleDeleteUser = async (userId, name) => {
        const confirmDelete = window.confirm(`Are you sure you want to delete user account "${name}"?`);
        if (!confirmDelete) return;

        setError('');
        setSuccessMessage('');
        try {
            await axios.delete(`${API_BASE_URL}/api/users/${userId}`);
            setSuccessMessage(`User "${name}" deleted successfully.`);
            fetchUsers();
        } catch (err) {
            console.error("Error deleting user:", err);
            setError("Failed to delete user account.");
        }
    };

    const filteredUsers = users.filter(user => 
        (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                        Manage User Accounts
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

                    {/* Search / Action Box */}
                    <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-lg rounded-xl p-6 mb-8 transition-colors duration-300">
                        <label htmlFor="userSearch" className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                            Search registered accounts
                        </label>
                        <input
                            id="userSearch"
                            type="text"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                            placeholder="Search by name or email address..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {loading ? (
                        <div className="text-center py-10">
                            <div className="text-indigo-600 dark:text-violet-400 text-xl font-bold animate-pulse">Loading accounts...</div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-xl rounded-xl p-6 transition-colors duration-300">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-[#262235] text-slate-500 dark:text-gray-400 font-bold uppercase text-xs">
                                            <th className="px-4 py-3.5 text-center">Sl</th>
                                            <th className="px-4 py-3.5">Name</th>
                                            <th className="px-4 py-3.5">Email</th>
                                            <th className="px-4 py-3.5 text-center">Role</th>
                                            <th className="px-4 py-3.5 text-center">Verification</th>
                                            <th className="px-4 py-3.5 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.length > 0 ? (
                                            filteredUsers.map((user, index) => (
                                                <tr key={user._id} className="border-b border-slate-100 dark:border-[#262235] hover:bg-slate-50 dark:hover:bg-[#201d2c]/50 transition duration-150">
                                                    <td className="px-4 py-4 text-center font-bold text-slate-400">{index + 1}</td>
                                                    <td className="px-4 py-4 font-semibold text-slate-900 dark:text-white">{user.name}</td>
                                                    <td className="px-4 py-4 text-slate-600 dark:text-gray-300 font-mono text-xs">{user.email}</td>
                                                    <td className="px-4 py-4 text-center">
                                                        <select
                                                            value={user.role || 'user'}
                                                            onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                                            className="px-2.5 py-1.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-md text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition font-medium"
                                                        >
                                                            <option value="user">User</option>
                                                            <option value="admin">Admin</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <button
                                                            onClick={() => handleVerificationToggle(user._id, user.isVerified)}
                                                            className={`px-3 py-1 rounded-full text-xs font-bold transition duration-200 ${
                                                                user.isVerified
                                                                    ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
                                                                    : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                                                            }`}
                                                        >
                                                            {user.isVerified ? 'Verified ✓' : 'Unverified ✗'}
                                                        </button>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <button
                                                            onClick={() => handleDeleteUser(user._id, user.name)}
                                                            className="text-red-500 hover:text-red-600 font-bold text-xs px-3 py-1.5 rounded-md border border-red-200 dark:border-red-900/35 hover:bg-red-50 dark:hover:bg-red-950/20 transition duration-150"
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="text-center py-8 text-slate-400 font-medium">
                                                    No registered user accounts found.
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

export default ManageUsers;
