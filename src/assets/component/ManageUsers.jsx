import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

function ManageUsers() {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [activeTab, setActiveTab] = useState('accounts');
    const [loginLogs, setLoginLogs] = useState([]);
    const [logSearchTerm, setLogSearchTerm] = useState('');
    const [logsLoading, setLogsLoading] = useState(true);

    useEffect(() => {
        if (activeTab === 'logs') {
            fetchLoginLogs();
        }
    }, [activeTab]);

    const fetchLoginLogs = async () => {
        setLogsLoading(true);
        setError('');
        try {
            const response = await axios.get(`${API_BASE_URL}/api/admin/login-logs`);
            setLoginLogs(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error("Error fetching login logs:", err);
            setError("Failed to load login history logs.");
        } finally {
            setLogsLoading(false);
        }
    };

    const parseUserAgent = (ua) => {
        if (!ua) return 'N/A';
        if (ua.includes('Mobi')) {
            if (ua.includes('Android')) return 'Mobile (Android)';
            if (ua.includes('iPhone')) return 'Mobile (iPhone)';
            return 'Mobile Device';
        }
        if (ua.includes('Chrome')) return 'Chrome (Desktop)';
        if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari (Mac)';
        if (ua.includes('Firefox')) return 'Firefox (Desktop)';
        if (ua.includes('Edge')) return 'Edge (Desktop)';
        return 'Desktop Web Browser';
    };

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

    const filteredLogs = loginLogs.filter(log => 
        (log.name || '').toLowerCase().includes(logSearchTerm.toLowerCase()) ||
        (log.email || '').toLowerCase().includes(logSearchTerm.toLowerCase())
    );

    return (
        <div className="max-w-5xl mx-auto animate-fade-in">
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

            {/* Tab Switched Layout */}
            <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-[#262235]">
                <button
                    onClick={() => setActiveTab('accounts')}
                    className={`pb-3 px-4 text-sm font-bold border-b-2 transition duration-200 ${
                        activeTab === 'accounts'
                            ? 'border-indigo-600 text-indigo-600 dark:border-violet-400 dark:text-violet-400'
                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                    User Accounts
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`pb-3 px-4 text-sm font-bold border-b-2 transition duration-200 ${
                        activeTab === 'logs'
                            ? 'border-indigo-600 text-indigo-600 dark:border-violet-400 dark:text-violet-400'
                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                    Login History Logs
                </button>
            </div>

            {activeTab === 'accounts' ? (
                <>
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
                </>
            ) : (
                <>
                    {/* Search Logs Box */}
                    <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-lg rounded-xl p-6 mb-8 transition-colors duration-300">
                        <label htmlFor="logSearch" className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                            Search login logs
                        </label>
                        <input
                            id="logSearch"
                            type="text"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                            placeholder="Search by name or email address..."
                            value={logSearchTerm}
                            onChange={(e) => setLogSearchTerm(e.target.value)}
                        />
                    </div>

                    {logsLoading ? (
                        <div className="text-center py-10">
                            <div className="text-indigo-600 dark:text-violet-400 text-xl font-bold animate-pulse">Loading login history logs...</div>
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
                                            <th className="px-4 py-3.5 text-center">Login Time</th>
                                            <th className="px-4 py-3.5 text-center">IP Address</th>
                                            <th className="px-4 py-3.5">Browser/Device</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredLogs.length > 0 ? (
                                            filteredLogs.map((log, index) => (
                                                <tr key={log._id} className="border-b border-slate-100 dark:border-[#262235] hover:bg-slate-50 dark:hover:bg-[#201d2c]/50 transition duration-150">
                                                    <td className="px-4 py-4 text-center font-bold text-slate-400">{index + 1}</td>
                                                    <td className="px-4 py-4 font-semibold text-slate-900 dark:text-white">{log.name}</td>
                                                    <td className="px-4 py-4 text-slate-600 dark:text-gray-300 font-mono text-xs">{log.email}</td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                            log.role === 'admin' 
                                                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/30' 
                                                                : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200/30'
                                                        }`}>
                                                            {log.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center text-slate-600 dark:text-gray-300 whitespace-nowrap text-xs">
                                                        {new Date(log.loginTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'medium' })}
                                                    </td>
                                                    <td className="px-4 py-4 text-center text-slate-600 dark:text-gray-300 font-mono text-xs">
                                                        {log.ipAddress || 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-4 text-xs text-slate-500 dark:text-gray-400 max-w-[200px] truncate" title={log.userAgent}>
                                                        {log.userAgent ? parseUserAgent(log.userAgent) : 'N/A'}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="7" className="text-center py-8 text-slate-400 font-medium">
                                                    No login history logs found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

        </div>
    );
}

export default ManageUsers;
