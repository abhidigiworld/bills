import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { useSettings } from '../../context/SettingsContext';

// Helper to resize/compress image to keep base64 sizes minimal (<30KB)
const compressAndConvertToBase64 = (file, callback) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            const maxDim = 300;
            if (width > maxDim || height > maxDim) {
                if (width > height) {
                    height = Math.round((height * maxDim) / width);
                    width = maxDim;
                } else {
                    width = Math.round((width * maxDim) / height);
                    height = maxDim;
                }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Output compressed JPG base64
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            callback(compressedBase64);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
};

function ManageUsers() {
    const { settings, refreshSettings } = useSettings();
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [activeTab, setActiveTab] = useState('accounts');
    const [loginLogs, setLoginLogs] = useState([]);
    const [logSearchTerm, setLogSearchTerm] = useState('');
    const [logsLoading, setLogsLoading] = useState(true);

    // Backup system states
    const [backupEmail, setBackupEmail] = useState('');
    const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [emailTriggering, setEmailTriggering] = useState(false);
    const [dbStorageSize, setDbStorageSize] = useState(0);

    // Attendance automation states
    const [attendanceTriggerTime, setAttendanceTriggerTime] = useState('18:00');
    const [attendanceTriggerRecipients, setAttendanceTriggerRecipients] = useState([]);
    const [attendanceSaving, setAttendanceSaving] = useState(false);
    const [dbStorageLimit, setDbStorageLimit] = useState(512 * 1024 * 1024);

    // Branding state
    const [brandingForm, setBrandingForm] = useState({
        company_name: '',
        company_subtitle: '',
        company_gstin: '',
        company_phone: '',
        company_email: '',
        company_address: '',
        company_logo: '',
        company_signature: '',
        company_stamp: ''
    });
    const [brandingSaving, setBrandingSaving] = useState(false);

    useEffect(() => {
        if (settings) {
            setBrandingForm({
                company_name: settings.company_name || '',
                company_subtitle: settings.company_subtitle || '',
                company_gstin: settings.company_gstin || '',
                company_phone: settings.company_phone || '',
                company_email: settings.company_email || '',
                company_address: settings.company_address || '',
                company_logo: settings.company_logo || '',
                company_signature: settings.company_signature || '',
                company_stamp: settings.company_stamp || ''
            });
        }
    }, [settings]);

    const handleBrandingFormChange = (e) => {
        setBrandingForm({
            ...brandingForm,
            [e.target.name]: e.target.value
        });
    };

    const handleFileChange = (e, field) => {
        const file = e.target.files[0];
        if (!file) return;

        compressAndConvertToBase64(file, (base64) => {
            setBrandingForm(prev => ({
                ...prev,
                [field]: base64
            }));
        });
    };

    const handleSaveBranding = async (e) => {
        e.preventDefault();
        setBrandingSaving(true);
        setError('');
        setSuccessMessage('');
        try {
            const response = await axios.put(`${API_BASE_URL}/api/admin/system-settings`, brandingForm);
            if (response.data && response.data.success) {
                triggerSuccess("Company branding settings updated successfully!");
                refreshSettings();
            } else {
                triggerError("Failed to update branding settings.");
            }
        } catch (err) {
            console.error("Error saving branding settings:", err);
            triggerError("Failed to save branding settings.");
        } finally {
            setBrandingSaving(false);
        }
    };

    const triggerSuccess = (msg) => {
        setSuccessMessage(msg);
        setError('');
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const triggerError = (msg) => {
        setError(msg);
        setSuccessMessage('');
        setTimeout(() => setError(''), 3000);
    };

    const fetchBackupSettings = async (silent = false) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/admin/backup-settings`);
            if (response.data && response.data.success) {
                setBackupEmail(response.data.data.backup_email || '');
                setAutoBackupEnabled(response.data.data.auto_backup_enabled === true);
                setAttendanceTriggerTime(response.data.data.attendance_trigger_time || '18:00');
                setAttendanceTriggerRecipients(response.data.data.attendance_trigger_recipients || []);
                if (response.data.data.storageSize !== undefined) {
                    setDbStorageSize(response.data.data.storageSize);
                }
                if (response.data.data.storageLimit !== undefined) {
                    setDbStorageLimit(response.data.data.storageLimit);
                }
            }
        } catch (err) {
            console.error("Error fetching backup settings:", err);
            triggerError("Failed to load database backup settings.");
        }
    };

    const handleSaveAttendanceSettings = async (e) => {
        e.preventDefault();
        setAttendanceSaving(true);
        setError('');
        setSuccessMessage('');
        try {
            const response = await axios.post(`${API_BASE_URL}/api/admin/backup-settings`, {
                attendance_trigger_time: attendanceTriggerTime,
                attendance_trigger_recipients: attendanceTriggerRecipients
            });
            if (response.data && response.data.success) {
                triggerSuccess("Attendance auto-trigger settings saved successfully!");
            } else {
                triggerError("Failed to save auto-trigger settings.");
            }
        } catch (err) {
            console.error("Error saving auto-trigger settings:", err);
            triggerError("Failed to save auto-trigger settings.");
        } finally {
            setAttendanceSaving(false);
        }
    };

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setSettingsSaving(true);
        setError('');
        setSuccessMessage('');
        try {
            const response = await axios.post(`${API_BASE_URL}/api/admin/backup-settings`, {
                backup_email: backupEmail,
                auto_backup_enabled: autoBackupEnabled
            });
            if (response.data && response.data.success) {
                triggerSuccess("Database backup settings saved successfully!");
            } else {
                triggerError("Failed to save backup settings.");
            }
        } catch (err) {
            console.error("Error saving backup settings:", err);
            triggerError("Failed to save backup settings.");
        } finally {
            setSettingsSaving(false);
        }
    };

    const handleSendBackupEmailNow = async () => {
        setEmailTriggering(true);
        setError('');
        setSuccessMessage('');
        try {
            triggerSuccess("Generating backup and sending email. Please wait...");
            const response = await axios.post(`${API_BASE_URL}/api/admin/email-backup`, {
                email: backupEmail
            });
            if (response.data && response.data.success) {
                triggerSuccess(response.data.message || "Database backup emailed successfully!");
            } else {
                triggerError("Failed to send backup email.");
            }
        } catch (err) {
            console.error("Error sending backup email:", err);
            triggerError("Failed to send database backup email via SMTP.");
        } finally {
            setEmailTriggering(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'accounts') {
            fetchUsers();
        } else if (activeTab === 'logs') {
            fetchLoginLogs();
        } else if (activeTab === 'backup') {
            fetchBackupSettings();
            fetchUsers();
        }
    }, [activeTab]);

    useEffect(() => {
        const handleFocus = () => {
            if (activeTab === 'accounts') {
                fetchUsers(true);
            } else if (activeTab === 'logs') {
                fetchLoginLogs(true);
            } else if (activeTab === 'backup') {
                fetchBackupSettings(true);
                fetchUsers(true);
            }
        };
        window.addEventListener('focus', handleFocus);
        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, [activeTab]);

    const fetchLoginLogs = async (silent = false) => {
        if (!silent) setLogsLoading(true);
        setError('');
        try {
            const response = await axios.get(`${API_BASE_URL}/api/admin/login-logs`);
            setLoginLogs(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error("Error fetching login logs:", err);
            triggerError("Failed to load login history logs.");
        } finally {
            if (!silent) setLogsLoading(false);
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

    const fetchUsers = async (silent = false) => {
        if (!silent) setLoading(true);
        setError('');
        try {
            const response = await axios.get(`${API_BASE_URL}/api/users`);
            setUsers(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error("Error fetching users:", err);
            triggerError("Failed to load user accounts.");
        } finally {
            if (!silent) setLoading(false);
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
            triggerSuccess(`Role for ${res.data.name} updated to ${newRole}!`);
            fetchUsers();
        } catch (err) {
            console.error("Error updating user role:", err);
            triggerError("Failed to update user role.");
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
            triggerSuccess(`${res.data.name}'s verification status updated!`);
            fetchUsers();
        } catch (err) {
            console.error("Error updating user verification:", err);
            triggerError("Failed to update verification status.");
        }
    };

    const handleDeleteUser = async (userId, name) => {
        const confirmDelete = window.confirm(`Are you sure you want to delete user account "${name}"?`);
        if (!confirmDelete) return;

        setError('');
        setSuccessMessage('');
        try {
            await axios.delete(`${API_BASE_URL}/api/users/${userId}`);
            triggerSuccess(`User "${name}" deleted successfully.`);
            fetchUsers();
        } catch (err) {
            console.error("Error deleting user:", err);
            triggerError("Failed to delete user account.");
        }
    };

    const handleDownloadBackup = async () => {
        try {
            triggerSuccess("Compiling database backup...");
            const response = await axios.get(`${API_BASE_URL}/api/admin/backup`, {
                responseType: 'blob'
            });
            
            const blob = new Blob([response.data], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const today = new Date().toISOString().split('T')[0];
            a.download = `backup_sakshi_enterprises_${today}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            triggerSuccess("Database backup downloaded successfully!");
        } catch (err) {
            console.error("Error downloading backup:", err);
            triggerError("Failed to generate database backup.");
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
            {/* Tab Switched Layout */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-200 dark:border-[#262235]">
                <div className="flex gap-2">
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
                    <button
                        onClick={() => setActiveTab('backup')}
                        className={`pb-3 px-4 text-sm font-bold border-b-2 transition duration-200 ${
                            activeTab === 'backup'
                                ? 'border-indigo-600 text-indigo-600 dark:border-violet-400 dark:text-violet-400'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                    >
                        Database Backups
                    </button>
                    <button
                        onClick={() => setActiveTab('branding')}
                        className={`pb-3 px-4 text-sm font-bold border-b-2 transition duration-200 ${
                            activeTab === 'branding'
                                ? 'border-indigo-600 text-indigo-600 dark:border-violet-400 dark:text-violet-400'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                    >
                        Company Branding
                    </button>
                </div>
                {/* Manual Refresh Button */}
                <button
                    onClick={() => {
                        if (activeTab === 'accounts') fetchUsers();
                        else if (activeTab === 'logs') fetchLoginLogs();
                        else if (activeTab === 'backup') fetchBackupSettings();
                    }}
                    className="p-2 mb-3 bg-white hover:bg-slate-50 dark:bg-[#181622] dark:hover:bg-[#201d2c] text-slate-655 dark:text-gray-300 rounded-lg border border-slate-200 dark:border-[#262235] transition shadow-md"
                    title="Refresh Data"
                    disabled={activeTab === 'accounts' ? loading : activeTab === 'logs' ? logsLoading : false}
                >
                    <svg className={`w-4 h-4 ${(activeTab === 'accounts' ? loading : activeTab === 'logs' ? logsLoading : false) ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.72 2.78L21 8" />
                        <polyline points="21 3 21 8 16 8" />
                    </svg>
                </button>
            </div>

            {activeTab === 'accounts' && (
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
                        <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-xl rounded-xl p-4 sm:p-6 transition-colors duration-300">
                            {/* Desktop View Table */}
                            <div className="hidden md:block overflow-x-auto">
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
                                                            <option value="supervisor">Supervisor</option>
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
                                                            className="text-red-500 hover:text-red-655 font-bold text-xs px-3 py-1.5 rounded-md border border-red-200 dark:border-red-900/35 hover:bg-red-50 dark:hover:bg-red-950/20 transition duration-150"
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

                            {/* Mobile View Card Grid */}
                            <div className="md:hidden space-y-4">
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map((user, index) => (
                                        <div key={user._id} className="p-4 bg-slate-50 dark:bg-[#201d2c]/40 border border-slate-100 dark:border-[#2b273d] rounded-xl flex flex-col gap-3">
                                            <div className="flex justify-between items-start border-b border-slate-200/50 dark:border-[#37314e]/50 pb-2">
                                                <div>
                                                    <span className="text-[11px] font-bold text-slate-400">#{index + 1}</span>
                                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{user.name}</h4>
                                                    <p className="text-xs text-slate-500 dark:text-gray-400 font-mono mt-0.5 truncate max-w-[240px]" title={user.email}>{user.email}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteUser(user._id, user.name)}
                                                    className="text-red-500 hover:text-red-655 font-bold text-xs px-2.5 py-1.5 rounded-md border border-red-200 dark:border-red-900/35 hover:bg-red-50 dark:hover:bg-red-950/20 transition duration-150"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 pt-1">
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Role</span>
                                                    <select
                                                        value={user.role || 'user'}
                                                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                                        className="w-full px-2 py-1.5 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#37314e] rounded-md text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition font-medium"
                                                    >
                                                        <option value="user">User</option>
                                                        <option value="supervisor">Supervisor</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Verification</span>
                                                    <button
                                                        onClick={() => handleVerificationToggle(user._id, user.isVerified)}
                                                        className={`w-full py-1.5 rounded-md text-xs font-bold transition duration-200 ${
                                                            user.isVerified
                                                                ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
                                                                : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                                                        }`}
                                                    >
                                                        {user.isVerified ? 'Verified ✓' : 'Unverified ✗'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6 text-slate-400 text-sm font-medium">
                                        No registered user accounts found.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}

            {activeTab === 'logs' && (
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
                        <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-xl rounded-xl p-4 sm:p-6 transition-colors duration-300">
                            {/* Desktop View Table */}
                            <div className="hidden md:block overflow-x-auto">
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

                            {/* Mobile View Card Grid */}
                            <div className="md:hidden space-y-4">
                                {filteredLogs.length > 0 ? (
                                    filteredLogs.map((log, index) => (
                                        <div key={log._id} className="p-4 bg-slate-50 dark:bg-[#201d2c]/40 border border-slate-100 dark:border-[#2b273d] rounded-xl flex flex-col gap-2">
                                            <div className="flex justify-between items-center border-b border-slate-200/50 dark:border-[#37314e]/50 pb-2">
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400">#{index + 1}</span>
                                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{log.name}</h4>
                                                    <p className="text-xs text-slate-500 dark:text-gray-400 font-mono mt-0.5 max-w-[180px] truncate">{log.email}</p>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                                    log.role === 'admin' 
                                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/30' 
                                                        : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200/30'
                                                }`}>
                                                    {log.role}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">IP Address</span>
                                                    <span className="font-mono text-slate-700 dark:text-gray-300">{log.ipAddress || 'N/A'}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Device</span>
                                                    <span className="text-slate-700 dark:text-gray-350 truncate" title={log.userAgent}>
                                                        {log.userAgent ? parseUserAgent(log.userAgent) : 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col pt-1.5 border-t border-slate-100 dark:border-[#2b273d]/50">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Login Time</span>
                                                <span className="text-[11px] text-slate-600 dark:text-gray-300">
                                                    {new Date(log.loginTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'medium' })}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6 text-slate-400 text-sm font-medium">
                                        No login history logs found.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}

            {activeTab === 'backup' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                    {/* Database Space Usage Status Bar */}
                    <div className="col-span-1 md:col-span-2 bg-white dark:bg-[#181622] border border-slate-200/50 dark:border-[#262235]/65 shadow-xl rounded-xl p-6 transition-colors duration-300">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-slate-900 dark:text-white">Database Space Capacity</h4>
                                    <p className="text-xs text-slate-500 dark:text-gray-400">MongoDB free-tier storage size allocation</p>
                                </div>
                            </div>
                            <span className="text-xs font-black text-indigo-650 dark:text-violet-400">
                                {((dbStorageSize / (1024 * 1024)) || 0).toFixed(2)} MB / {((dbStorageLimit / (1024 * 1024)) || 512).toFixed(0)} MB ({((dbStorageSize / dbStorageLimit) * 100).toFixed(2)}%)
                            </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-[#201d2c] rounded-full h-3.5 overflow-hidden border border-slate-200/50 dark:border-[#2a243b]">
                            <div 
                                className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500" 
                                style={{ width: `${Math.min(100, Math.max(0.5, (dbStorageSize / dbStorageLimit) * 100))}%` }}
                            />
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-gray-500 mt-2.5 leading-relaxed">
                            Our automatic image compression keeps file uploads extremely lightweight (under 30 KB per asset). At the current storage efficiency, this database can securely hold hundreds of thousands of additional invoices and salary records.
                        </p>
                    </div>

                    {/* Settings Form Card */}
                    <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-xl rounded-xl p-6 transition-colors duration-300">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2.5 bg-indigo-50 dark:bg-violet-950/30 text-indigo-600 dark:text-violet-400 rounded-lg">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white">Backup Settings</h3>
                                <p className="text-xs text-slate-500 dark:text-gray-400">Configure email delivery and monthly schedulers</p>
                            </div>
                        </div>

                        <form onSubmit={handleSaveSettings} className="space-y-5">
                            <div>
                                <label htmlFor="backupEmailInput" className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                    Recipient Email Address
                                </label>
                                <select
                                    id="backupEmailInput"
                                    required
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                                    value={backupEmail}
                                    onChange={(e) => setBackupEmail(e.target.value)}
                                >
                                    <option value="" disabled>Select an administrator email</option>
                                    {users.filter(u => u.role === 'admin').map(admin => (
                                        <option key={admin._id} value={admin.email}>{admin.name} ({admin.email})</option>
                                    ))}
                                    {backupEmail && !users.some(u => u.email === backupEmail && u.role === 'admin') && (
                                        <option value={backupEmail}>{backupEmail} (Invalid/Inactive Admin)</option>
                                    )}
                                </select>
                                <p className="text-[11px] text-slate-400 mt-1">
                                    Automated backups will be sent to the selected administrator&apos;s email.
                                </p>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-[#201d2c] border border-slate-100 dark:border-[#2b273d] rounded-lg">
                                <div className="flex items-center h-5 mt-0.5">
                                    <input
                                        id="autoBackupToggle"
                                        type="checkbox"
                                        className="h-4.5 w-4.5 text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-[#37314e] rounded"
                                        checked={autoBackupEnabled}
                                        onChange={(e) => setAutoBackupEnabled(e.target.checked)}
                                    />
                                </div>
                                <div className="text-sm">
                                    <label htmlFor="autoBackupToggle" className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide">
                                        Enable Monthly Backups
                                    </label>
                                    <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                                        Automatically compile database and email it on the 1st of every month at 12:00 AM (Asia/Kolkata timezone).
                                    </p>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={settingsSaving}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-violet-600 dark:hover:bg-violet-700 text-white font-bold py-2.5 px-4 rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 transition duration-200 text-sm flex justify-center items-center gap-2"
                            >
                                {settingsSaving ? 'Saving...' : 'Save Settings'}
                            </button>
                        </form>
                    </div>

                    {/* Attendance Automation Settings Card */}
                    <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-xl rounded-xl p-6 transition-colors duration-300">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2.5 bg-indigo-50 dark:bg-violet-950/30 text-indigo-600 dark:text-violet-400 rounded-lg">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white">Attendance Auto-Trigger Settings</h3>
                                <p className="text-xs text-slate-500 dark:text-gray-400">Configure daily trigger time (IST) and supervisors list</p>
                            </div>
                        </div>

                        <form onSubmit={handleSaveAttendanceSettings} className="space-y-5">
                            <div>
                                <label htmlFor="attendanceTriggerTimeInput" className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                    Daily Trigger Time (Asia/Kolkata IST)
                                </label>
                                <input
                                    id="attendanceTriggerTimeInput"
                                    type="time"
                                    required
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                                    value={attendanceTriggerTime}
                                    onChange={(e) => setAttendanceTriggerTime(e.target.value)}
                                />
                                <p className="text-[11px] text-slate-400 mt-1">
                                    Automatic email will be sent at the chosen time daily (except holidays).
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                    Select Supervisor Recipients
                                </label>
                                <div className="space-y-2 max-h-40 overflow-y-auto p-3 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg">
                                    {users.filter(u => u.role === 'supervisor').length === 0 ? (
                                        <p className="text-xs text-slate-400 py-1">No active supervisors registered.</p>
                                    ) : (
                                        users.filter(u => u.role === 'supervisor').map(supervisor => {
                                            const isChecked = attendanceTriggerRecipients.includes(supervisor._id);
                                            return (
                                                <label key={supervisor._id} className="flex items-center gap-3 cursor-pointer text-sm text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition">
                                                    <input
                                                        type="checkbox"
                                                        className="h-4.5 w-4.5 text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-[#37314e] rounded"
                                                        checked={isChecked}
                                                        onChange={() => {
                                                            if (isChecked) {
                                                                setAttendanceTriggerRecipients(prev => prev.filter(id => id !== supervisor._id));
                                                            } else {
                                                                setAttendanceTriggerRecipients(prev => [...prev, supervisor._id]);
                                                            }
                                                        }}
                                                    />
                                                    <div className="truncate">
                                                        <span className="font-semibold">{supervisor.name}</span>
                                                        <span className="text-xs text-slate-400 dark:text-gray-500 ml-1">({supervisor.email})</span>
                                                    </div>
                                                </label>
                                            );
                                        })
                                    )}
                                </div>
                                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                                    If no supervisors are selected, emails will default to being sent to <strong>all</strong> active supervisors.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={attendanceSaving}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-violet-600 dark:hover:bg-violet-700 text-white font-bold py-2.5 px-4 rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 transition duration-200 text-sm flex justify-center items-center gap-2"
                            >
                                {attendanceSaving ? 'Saving...' : 'Save Automation Settings'}
                            </button>
                        </form>
                    </div>

                    {/* Quick Trigger Card */}
                    <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-xl rounded-xl p-6 transition-colors duration-300 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2.5 bg-indigo-50 dark:bg-violet-950/30 text-indigo-600 dark:text-violet-400 rounded-lg">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900 dark:text-white">On-Demand Actions</h3>
                                    <p className="text-xs text-slate-500 dark:text-gray-400">Instantly trigger off-site or local backups</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 border border-indigo-100 dark:border-violet-950/40 bg-indigo-50/20 dark:bg-violet-950/10 rounded-xl">
                                    <h4 className="text-xs font-black text-indigo-900 dark:text-violet-300 uppercase tracking-wider mb-1">
                                        SMTP Email Backup
                                    </h4>
                                    <p className="text-xs text-slate-600 dark:text-gray-400 mb-3">
                                        Generates a database backup JSON file and emails it directly to the configured recipient address. Perfect for secure, off-site storage.
                                    </p>
                                    <button
                                        onClick={handleSendBackupEmailNow}
                                        disabled={emailTriggering || !backupEmail}
                                        className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-violet-600 dark:hover:bg-violet-700 text-white font-bold rounded-lg shadow transition duration-200 text-xs flex justify-center items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        {emailTriggering ? 'Sending Email...' : 'Email Database Backup Now'}
                                    </button>
                                </div>

                                <div className="p-4 border border-slate-200 dark:border-[#37314e] bg-slate-50/40 dark:bg-[#201d2c]/20 rounded-xl">
                                    <h4 className="text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                                        Local File Download
                                    </h4>
                                    <p className="text-xs text-slate-600 dark:text-gray-400 mb-3">
                                        Generates a database backup JSON file and downloads it instantly through your browser.
                                    </p>
                                    <button
                                        onClick={handleDownloadBackup}
                                        className="w-full py-2 px-3 bg-slate-700 hover:bg-slate-800 dark:bg-[#2d283e] dark:hover:bg-[#39334f] text-white font-bold rounded-lg shadow transition duration-200 text-xs flex justify-center items-center gap-2 border border-transparent dark:border-[#4d4469]"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download JSON Backup File
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 text-[11px] text-slate-400 dark:text-gray-500 bg-slate-50 dark:bg-[#1f1b2c] p-3 rounded-lg border border-slate-100 dark:border-[#2a243b] text-center">
                            <strong>Security Note:</strong> All backups exclude password hashes for safety.
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'branding' && (
                <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-xl rounded-xl p-6 transition-colors duration-300">
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-[#262235] pb-3">
                        <div className="p-2.5 bg-indigo-50 dark:bg-violet-950/30 text-indigo-600 dark:text-violet-400 rounded-lg">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-base font-black text-slate-900 dark:text-white">Company Branding & Profiles</h3>
                            <p className="text-xs text-slate-500 dark:text-gray-400">Configure global business titles, invoice metadata, and security stamps</p>
                        </div>
                    </div>

                    <form onSubmit={handleSaveBranding} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Company Name</label>
                                <input
                                    type="text"
                                    name="company_name"
                                    value={brandingForm.company_name}
                                    onChange={handleBrandingFormChange}
                                    required
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Brand Subtitle</label>
                                <input
                                    type="text"
                                    name="company_subtitle"
                                    value={brandingForm.company_subtitle}
                                    onChange={handleBrandingFormChange}
                                    required
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">GSTIN Code</label>
                                <input
                                    type="text"
                                    name="company_gstin"
                                    value={brandingForm.company_gstin}
                                    onChange={handleBrandingFormChange}
                                    required
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Telephone / Contact No.</label>
                                <input
                                    type="text"
                                    name="company_phone"
                                    value={brandingForm.company_phone}
                                    onChange={handleBrandingFormChange}
                                    required
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Support Email Address</label>
                                <input
                                    type="email"
                                    name="company_email"
                                    value={brandingForm.company_email}
                                    onChange={handleBrandingFormChange}
                                    required
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Postal Office Address</label>
                            <textarea
                                name="company_address"
                                value={brandingForm.company_address}
                                onChange={handleBrandingFormChange}
                                required
                                rows="2"
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100 dark:border-[#262235]">
                            {/* Logo Upload */}
                            <div className="flex flex-col items-center p-4 bg-slate-50 dark:bg-[#201d2c]/30 rounded-xl border border-slate-100 dark:border-[#2a243b]">
                                <span className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-3">Company Logo</span>
                                <div className="w-24 h-24 rounded-lg bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] flex items-center justify-center overflow-hidden mb-3 relative group">
                                    {brandingForm.company_logo ? (
                                        <img src={brandingForm.company_logo} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                                    ) : (
                                        <span className="text-[10px] text-slate-400 uppercase text-center font-bold">Default Logo</span>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    id="companyLogoUpload"
                                    className="hidden"
                                    onChange={(e) => handleFileChange(e, 'company_logo')}
                                />
                                <div className="flex flex-col items-center gap-1.5 w-full">
                                    <label
                                        htmlFor="companyLogoUpload"
                                        className="cursor-pointer text-center bg-slate-200 hover:bg-slate-300 dark:bg-[#262235] dark:hover:bg-[#342f49] px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-gray-300 transition w-full"
                                    >
                                        {brandingForm.company_logo ? 'Change Image' : 'Upload Image'}
                                    </label>
                                    {brandingForm.company_logo && (
                                        <button
                                            type="button"
                                            onClick={() => setBrandingForm(prev => ({ ...prev, company_logo: '' }))}
                                            className="text-[10px] text-red-500 hover:text-red-650 dark:text-red-400 dark:hover:text-red-300 font-bold transition hover:underline"
                                        >
                                            Revert to Default
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Signature Upload */}
                            <div className="flex flex-col items-center p-4 bg-slate-50 dark:bg-[#201d2c]/30 rounded-xl border border-slate-100 dark:border-[#2a243b]">
                                <span className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-3">Authorized Signature</span>
                                <div className="w-24 h-24 rounded-lg bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] flex items-center justify-center overflow-hidden mb-3 relative group">
                                    {brandingForm.company_signature ? (
                                        <img src={brandingForm.company_signature} alt="Signature Preview" className="max-w-full max-h-full object-contain" />
                                    ) : (
                                        <span className="text-[10px] text-slate-400 uppercase text-center font-bold">Default Sign</span>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    id="companySignatureUpload"
                                    className="hidden"
                                    onChange={(e) => handleFileChange(e, 'company_signature')}
                                />
                                <div className="flex flex-col items-center gap-1.5 w-full">
                                    <label
                                        htmlFor="companySignatureUpload"
                                        className="cursor-pointer text-center bg-slate-200 hover:bg-slate-300 dark:bg-[#262235] dark:hover:bg-[#342f49] px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-gray-300 transition w-full"
                                    >
                                        {brandingForm.company_signature ? 'Change Image' : 'Upload Image'}
                                    </label>
                                    {brandingForm.company_signature && (
                                        <button
                                            type="button"
                                            onClick={() => setBrandingForm(prev => ({ ...prev, company_signature: '' }))}
                                            className="text-[10px] text-red-500 hover:text-red-650 dark:text-red-400 dark:hover:text-red-300 font-bold transition hover:underline"
                                        >
                                            Revert to Default
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Stamp Upload */}
                            <div className="flex flex-col items-center p-4 bg-slate-50 dark:bg-[#201d2c]/30 rounded-xl border border-slate-100 dark:border-[#2a243b]">
                                <span className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-3">Official Seal / Stamp</span>
                                <div className="w-24 h-24 rounded-lg bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] flex items-center justify-center overflow-hidden mb-3 relative group">
                                    {brandingForm.company_stamp ? (
                                        <img src={brandingForm.company_stamp} alt="Stamp Preview" className="max-w-full max-h-full object-contain" />
                                    ) : (
                                        <span className="text-[10px] text-slate-400 uppercase text-center font-bold">Default Seal</span>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    id="companyStampUpload"
                                    className="hidden"
                                    onChange={(e) => handleFileChange(e, 'company_stamp')}
                                />
                                <div className="flex flex-col items-center gap-1.5 w-full">
                                    <label
                                        htmlFor="companyStampUpload"
                                        className="cursor-pointer text-center bg-slate-200 hover:bg-slate-300 dark:bg-[#262235] dark:hover:bg-[#342f49] px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-gray-300 transition w-full"
                                    >
                                        {brandingForm.company_stamp ? 'Change Image' : 'Upload Image'}
                                    </label>
                                    {brandingForm.company_stamp && (
                                        <button
                                            type="button"
                                            onClick={() => setBrandingForm(prev => ({ ...prev, company_stamp: '' }))}
                                            className="text-[10px] text-red-500 hover:text-red-655 dark:text-red-400 dark:hover:text-red-300 font-bold transition hover:underline"
                                        >
                                            Revert to Default
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={brandingSaving}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-violet-600 dark:hover:bg-violet-700 text-white font-bold py-2.5 px-4 rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 transition duration-200 text-sm flex justify-center items-center gap-2"
                        >
                            {brandingSaving ? 'Saving Changes...' : 'Save Branding Details'}
                        </button>
                    </form>
                </div>
            )}

            {/* Centered Premium Overlay Modal for Notifications */}
            {(successMessage || error) && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in print-hidden">
                    <div className="bg-white dark:bg-[#181622]/95 border border-slate-200 dark:border-[#262235] shadow-2xl rounded-2xl p-6 sm:p-8 w-full max-w-sm text-center relative transition-all duration-300 animate-slide-down">
                        {/* Close button */}
                        <button
                            onClick={() => {
                                setSuccessMessage('');
                                setError('');
                            }}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Close"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {successMessage ? (
                            <div className="space-y-4">
                                <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-950/40 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">Success!</h3>
                                <p className="text-sm text-slate-600 dark:text-gray-300">{successMessage}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-950/40 rounded-full flex items-center justify-center text-red-600 dark:text-red-400">
                                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">Notification</h3>
                                <p className="text-sm text-slate-600 dark:text-gray-300">{error}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ManageUsers;
