import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { useSettings } from '../../context/SettingsContext';

function AttendanceRegister() {
    const { settings, refreshSettings } = useSettings();
    const [employees, setEmployees] = useState([]);
    const [attendanceLogs, setAttendanceLogs] = useState([]);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-indexed (1-12)
    const [shiftHours, setShiftHours] = useState(8);

    useEffect(() => {
        if (settings && settings.shift_hours) {
            setShiftHours(settings.shift_hours);
        }
    }, [settings]);

    const handleShiftHoursChange = async (newHours) => {
        setShiftHours(newHours);
        try {
            await axios.put(`${API_BASE_URL}/api/admin/system-settings`, {
                shift_hours: newHours
            });
            if (refreshSettings) {
                refreshSettings();
            }
        } catch (err) {
            console.error("Error saving shift hours setting:", err);
        }
    };

    const [loading, setLoading] = useState(true);

    // Modal Edit states
    const [selectedCell, setSelectedCell] = useState(null); // { employee, dayNum }
    const [modalForm, setModalForm] = useState({
        status: 'Absent',
        workedDay: true,
        workedNight: false,
        checkIn: '09:00',
        checkOut: '17:00',
        nightCheckIn: '20:00',
        nightCheckOut: '04:00',
        overtimeHours: 0,
        isNightShift: false,
        nightShiftHours: 0
    });

    // Blanket Edit states
    const [isBlanketModalOpen, setIsBlanketModalOpen] = useState(false);
    const [blanketForm, setBlanketForm] = useState({
        dayNum: 1,
        status: 'Present',
        workedDay: true,
        workedNight: false,
        checkIn: '09:30',
        checkOut: '17:30',
        nightCheckIn: '20:00',
        nightCheckOut: '04:00',
        overtimeHours: 0,
        isNightShift: false,
        nightShiftHours: 0
    });

    // Bulk Edit states
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
    const [bulkForm, setBulkForm] = useState({
        dayNum: 1,
        status: 'Present',
        workedDay: true,
        workedNight: false,
        checkIn: '09:30',
        checkOut: '17:30',
        nightCheckIn: '20:00',
        nightCheckOut: '04:00',
        overtimeHours: 0,
        isNightShift: false,
        nightShiftHours: 0
    });

    // Hover tooltip state
    const [hoveredCell, setHoveredCell] = useState(null);

    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Supervisor approvals & requests states
    const [activeTab, setActiveTab] = useState('register'); // 'register' or 'approvals'
    const [pendingApprovals, setPendingApprovals] = useState([]);
    const [requestLogs, setRequestLogs] = useState([]);
    const [logPage, setLogPage] = useState(1);
    const [logLimit, setLogLimit] = useState(10);
    const [logTotalPages, setLogTotalPages] = useState(1);
    const [logTotalCount, setLogTotalCount] = useState(0);
    const [supervisors, setSupervisors] = useState([]);
    const [manualRequestForm, setManualRequestForm] = useState({
        date: new Date().toISOString().split('T')[0],
        supervisorId: ''
    });
    const [approvalsLoading, setApprovalsLoading] = useState(false);
    const [submittingApprovalGroup, setSubmittingApprovalGroup] = useState(null);
    const [sendingRequest, setSendingRequest] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const triggerSuccess = (msg) => {
        setSuccessMessage(msg);
        setErrorMessage('');
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const triggerError = (msg) => {
        setErrorMessage(msg);
        setSuccessMessage('');
        setTimeout(() => setErrorMessage(''), 3000);
    };

    useEffect(() => {
        const today = new Date();
        if (today.getFullYear() === selectedYear && (today.getMonth() + 1) === selectedMonth) {
            setBlanketForm(prev => ({ ...prev, dayNum: today.getDate() }));
            setBulkForm(prev => ({ ...prev, dayNum: today.getDate() }));
        } else {
            setBlanketForm(prev => ({ ...prev, dayNum: 1 }));
            setBulkForm(prev => ({ ...prev, dayNum: 1 }));
        }
    }, [selectedYear, selectedMonth, isBlanketModalOpen, isBulkModalOpen]);

    useEffect(() => {
        fetchData();
    }, [selectedYear, selectedMonth, activeTab]);

    useEffect(() => {
        if (activeTab === 'approvals') {
            fetchApprovalsData();
        }
    }, [activeTab, logPage, logLimit]);

    useEffect(() => {
        const handleFocus = () => {
            fetchData(true);
            if (activeTab === 'approvals') {
                fetchApprovalsData(true);
            }
        };
        window.addEventListener('focus', handleFocus);

        let intervalId = null;
        if (activeTab === 'approvals') {
            intervalId = setInterval(() => {
                fetchApprovalsData(true);
            }, 30000); // Poll every 30 seconds
        }

        return () => {
            window.removeEventListener('focus', handleFocus);
            if (intervalId) clearInterval(intervalId);
        };
    }, [activeTab, logPage, logLimit]);

    const fetchData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const empRes = await axios.get(`${API_BASE_URL}/api/employees`);
            const attRes = await axios.get(`${API_BASE_URL}/api/attendance`);
            // Filter out discontinued and inactive employees from the attendance list
            setEmployees(Array.isArray(empRes.data) ? empRes.data.filter(emp => emp.status !== 'Discontinued' && emp.status !== 'Inactive') : []);
            setAttendanceLogs(Array.isArray(attRes.data) ? attRes.data : []);
        } catch (error) {
            console.error("Error fetching attendance register data:", error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const fetchApprovalsData = async (silent = false) => {
        if (!silent) setApprovalsLoading(true);
        try {
            const [pendingRes, logsRes, usersRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/attendance/pending-approvals?status=all`),
                axios.get(`${API_BASE_URL}/api/attendance/request-logs?page=${logPage}&limit=${logLimit}`),
                axios.get(`${API_BASE_URL}/api/users`)
            ]);

            if (pendingRes.data && pendingRes.data.success) {
                // Pre-calculate overtime for pending records if they have checkIn/checkOut but overtimeHours is 0
                const enriched = pendingRes.data.data.map(rec => {
                    if (rec.status === 'Present' && rec.workedDay && rec.checkIn && rec.checkOut) {
                        if (!rec.overtimeHours || rec.overtimeHours === 0) {
                            const dayCheckInStr = formatTimeFromDate(rec.checkIn, '');
                            const dayCheckOutStr = formatTimeFromDate(rec.checkOut, '');
                            const ot = calculateOvertime(dayCheckInStr, dayCheckOutStr, false);
                            return { ...rec, overtimeHours: ot };
                        }
                    }
                    return rec;
                });
                setPendingApprovals(enriched);
            }
            if (logsRes.data && logsRes.data.success) {
                if (logsRes.data.pagination) {
                    setRequestLogs(logsRes.data.data);
                    setLogTotalPages(logsRes.data.pagination.totalPages);
                    setLogTotalCount(logsRes.data.pagination.totalItems);
                } else {
                    const data = Array.isArray(logsRes.data.data) ? logsRes.data.data : [];
                    setRequestLogs(data);
                    setLogTotalPages(1);
                    setLogTotalCount(data.length);
                }
            }
            if (Array.isArray(usersRes.data)) {
                const sups = usersRes.data.filter(u => u.role === 'supervisor');
                setSupervisors(sups);
                if (sups.length > 0 && !manualRequestForm.supervisorId) {
                    setManualRequestForm(prev => ({ ...prev, supervisorId: sups[0]._id }));
                }
            }
        } catch (err) {
            console.error("Error fetching approvals data:", err);
            if (!silent) triggerError("Failed to load pending approvals and logs.");
        } finally {
            if (!silent) setApprovalsLoading(false);
        }
    };

    const handleSendRequest = async (e) => {
        e.preventDefault();
        if (!manualRequestForm.supervisorId || !manualRequestForm.date) {
            triggerError("Please select both a supervisor and a date.");
            return;
        }
        setSendingRequest(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/attendance/send-request`, {
                date: manualRequestForm.date,
                supervisorId: manualRequestForm.supervisorId
            });
            if (res.data && res.data.success) {
                triggerSuccess(res.data.message || "Manual request link sent successfully!");
                fetchApprovalsData();
            } else {
                triggerError(res.data.message || "Failed to send request.");
            }
        } catch (err) {
            console.error("Error sending manual request:", err);
            triggerError(err.response?.data?.message || "Failed to send attendance request.");
        } finally {
            setSendingRequest(false);
        }
    };

    const handlePendingFieldChange = (recordId, updatedFields) => {
        setPendingApprovals(prev => prev.map(rec => {
            if (rec._id === recordId) {
                let nextRec = { ...rec, ...updatedFields };

                if (nextRec.status === 'Present') {
                    const hasDay = nextRec.workedDay;
                    const hasNight = nextRec.workedNight;

                    const dayCheckInStr = formatTimeFromDate(nextRec.checkIn, '');
                    const dayCheckOutStr = formatTimeFromDate(nextRec.checkOut, '');
                    const nightCheckInStr = formatTimeFromDate(nextRec.nightCheckIn, '');
                    const nightCheckOutStr = formatTimeFromDate(nextRec.nightCheckOut, '');

                    if (hasDay) {
                        nextRec.overtimeHours = calculateOvertime(dayCheckInStr, dayCheckOutStr, false);
                    } else {
                        nextRec.overtimeHours = 0;
                    }

                    if (hasNight) {
                        nextRec.nightShiftHours = calculateTotalHours(nightCheckInStr, nightCheckOutStr, true);
                        nextRec.isNightShift = true;
                    } else {
                        nextRec.nightShiftHours = 0;
                        nextRec.isNightShift = false;
                    }
                } else {
                    nextRec.workedDay = false;
                    nextRec.workedNight = false;
                    nextRec.overtimeHours = 0;
                    nextRec.nightShiftHours = 0;
                    nextRec.isNightShift = false;
                }
                return nextRec;
            }
            return rec;
        }));
    };

    const handleTimeFieldChange = (recordId, field, timeVal, dateStr) => {
        let dateObjString = null;
        if (timeVal) {
            const tzOffset = '+05:30'; // Asia/Kolkata
            dateObjString = `${dateStr}T${timeVal}:00.000${tzOffset}`;
        }
        handlePendingFieldChange(recordId, { [field]: dateObjString });
    };

    const handleApproveGroup = async (groupKey, groupRecords) => {
        setSubmittingApprovalGroup(groupKey);
        try {
            const recordsToSend = groupRecords.map(rec => ({
                _id: rec._id,
                status: rec.status,
                workedDay: rec.status === 'Present' ? !!rec.workedDay : false,
                workedNight: rec.status === 'Present' ? !!rec.workedNight : false,
                checkIn: rec.status === 'Present' && rec.workedDay ? rec.checkIn : null,
                checkOut: rec.status === 'Present' && rec.workedDay ? rec.checkOut : null,
                nightCheckIn: rec.status === 'Present' && rec.workedNight ? rec.nightCheckIn : null,
                nightCheckOut: rec.status === 'Present' && rec.workedNight ? rec.nightCheckOut : null,
                overtimeHours: rec.status === 'Present' ? Number(rec.overtimeHours) || 0 : 0,
                isNightShift: rec.status === 'Present' ? !!rec.isNightShift : false,
                nightShiftHours: rec.status === 'Present' ? Number(rec.nightShiftHours) || 0 : 0
            }));

            const res = await axios.post(`${API_BASE_URL}/api/attendance/approve`, {
                records: recordsToSend
            });

            if (res.data && res.data.success) {
                triggerSuccess(res.data.message || "Group attendance approved successfully!");
                fetchApprovalsData();
                fetchData();
            } else {
                triggerError(res.data.message || "Failed to approve group attendance.");
            }
        } catch (err) {
            console.error("Error approving group:", err);
            triggerError(err.response?.data?.message || "Failed to approve attendance.");
        } finally {
            setSubmittingApprovalGroup(null);
        }
    };

    const handleRejectGroup = async (groupKey, groupRecords) => {
        if (!window.confirm("Are you sure you want to discard this supervisor submission? All pending changes in this group will be marked as rejected.")) {
            return;
        }
        setSubmittingApprovalGroup(groupKey);
        try {
            const ids = groupRecords.map(rec => rec._id);
            const res = await axios.post(`${API_BASE_URL}/api/attendance/reject`, { ids });

            if (res.data && res.data.success) {
                triggerSuccess("Group submission discarded successfully.");
                fetchApprovalsData();
            } else {
                triggerError(res.data.message || "Failed to reject group.");
            }
        } catch (err) {
            console.error("Error rejecting group:", err);
            triggerError(err.response?.data?.message || "Failed to reject group.");
        } finally {
            setSubmittingApprovalGroup(null);
        }
    };

    const getGroupedPendingApprovals = () => {
        const groups = {};
        pendingApprovals
            .filter(rec => rec.approvalStatus === 'pending')
            .forEach(rec => {
                const dateKey = rec.date;
                const supervisorId = rec.supervisorId?._id || 'unknown';
                const supervisorName = rec.supervisorId?.name || 'Unknown Supervisor';
                const supervisorEmail = rec.supervisorId?.email || '';
                const groupKey = `${dateKey}_${supervisorId}`;

                if (!groups[groupKey]) {
                    groups[groupKey] = {
                        date: dateKey,
                        supervisorId,
                        supervisorName,
                        supervisorEmail,
                        records: []
                    };
                }
                groups[groupKey].records.push(rec);
            });
        return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
    };

    const getGroupedProcessedApprovals = () => {
        const groups = {};
        pendingApprovals
            .filter(rec => rec.approvalStatus !== 'pending')
            .forEach(rec => {
                const dateKey = rec.date;
                const supervisorId = rec.supervisorId?._id || 'unknown';
                const supervisorName = rec.supervisorId?.name || 'Unknown Supervisor';
                const supervisorEmail = rec.supervisorId?.email || '';
                const groupKey = `${dateKey}_${supervisorId}`;

                if (!groups[groupKey]) {
                    groups[groupKey] = {
                        date: dateKey,
                        supervisorId,
                        supervisorName,
                        supervisorEmail,
                        approvalStatus: rec.approvalStatus,
                        updatedAt: rec.updatedAt,
                        records: []
                    };
                }
                groups[groupKey].records.push(rec);
                if (new Date(rec.updatedAt) > new Date(groups[groupKey].updatedAt)) {
                    groups[groupKey].updatedAt = rec.updatedAt;
                    groups[groupKey].approvalStatus = rec.approvalStatus;
                }
            });
        return Object.values(groups).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    };

    // Calculate days in the selected month
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // Get month name
    const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' });

    // Helpers to find logs for a specific employee and day
    const getLogForDay = (employeeId, dayNum) => {
        const dayStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        return attendanceLogs.find(log => {
            const empId = log.employeeId?._id || log.employeeId;
            return empId === employeeId && log.date === dayStr;
        });
    };

    const calculateTotalHours = (checkInStr, checkOutStr, isNightShiftVal) => {
        if (!checkInStr || !checkOutStr) return 0;
        const [inH, inM] = checkInStr.split(':').map(Number);
        const [outH, outM] = checkOutStr.split(':').map(Number);
        if (isNaN(inH) || isNaN(inM) || isNaN(outH) || isNaN(outM)) return 0;

        let inMinutes = inH * 60 + inM;
        let outMinutes = outH * 60 + outM;

        if (outMinutes < inMinutes || isNightShiftVal) {
            if (outMinutes < inMinutes) {
                outMinutes += 24 * 60;
            }
        }

        const diffHours = (outMinutes - inMinutes) / 60;
        return parseFloat(diffHours.toFixed(2));
    };

    function calculateOvertime(checkInStr, checkOutStr, isNightShiftVal) {
        if (!checkInStr || !checkOutStr) return 0;
        const [inH, inM] = checkInStr.split(':').map(Number);
        const [outH, outM] = checkOutStr.split(':').map(Number);
        if (isNaN(inH) || isNaN(inM) || isNaN(outH) || isNaN(outM)) return 0;

        let inMinutes = inH * 60 + inM;
        let outMinutes = outH * 60 + outM;

        if (outMinutes < inMinutes || isNightShiftVal) {
            if (outMinutes < inMinutes) {
                outMinutes += 24 * 60;
            }
        }

        const diffHours = (outMinutes - inMinutes) / 60;
        const ot = diffHours - shiftHours;
        return ot > 0 ? parseFloat(ot.toFixed(2)) : 0;
    }

    function formatTimeFromDate(dateStr, defaultVal = '') {
        if (!dateStr) return defaultVal;
        try {
            return new Date(dateStr).toLocaleTimeString('en-US', {
                timeZone: 'Asia/Kolkata',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        } catch (e) {
            return defaultVal;
        }
    }

    const handleModalFormChange = (updatedFields) => {
        setModalForm(prev => {
            let nextForm = { ...prev, ...updatedFields };

            if (nextForm.status === 'Present') {
                const hasDay = nextForm.workedDay;
                const hasNight = nextForm.workedNight;

                if (hasDay) {
                    nextForm.overtimeHours = calculateOvertime(nextForm.checkIn, nextForm.checkOut, false);
                } else {
                    nextForm.overtimeHours = 0;
                }

                if (hasNight) {
                    nextForm.nightShiftHours = calculateTotalHours(nextForm.nightCheckIn, nextForm.nightCheckOut, true);
                    nextForm.isNightShift = true;
                } else {
                    nextForm.nightShiftHours = 0;
                    nextForm.isNightShift = false;
                }
            } else {
                nextForm.workedDay = true;
                nextForm.workedNight = false;
                nextForm.overtimeHours = 0;
                nextForm.isNightShift = false;
                nextForm.nightShiftHours = 0;
            }
            return nextForm;
        });
    };

    const handleBlanketFormChange = (updatedFields) => {
        setBlanketForm(prev => {
            let nextForm = { ...prev, ...updatedFields };

            if (nextForm.status === 'Present') {
                const hasDay = nextForm.workedDay;
                const hasNight = nextForm.workedNight;

                if (hasDay) {
                    nextForm.overtimeHours = calculateOvertime(nextForm.checkIn, nextForm.checkOut, false);
                } else {
                    nextForm.overtimeHours = 0;
                }

                if (hasNight) {
                    nextForm.nightShiftHours = calculateTotalHours(nextForm.nightCheckIn, nextForm.nightCheckOut, true);
                    nextForm.isNightShift = true;
                } else {
                    nextForm.nightShiftHours = 0;
                    nextForm.isNightShift = false;
                }
            } else {
                nextForm.workedDay = true;
                nextForm.workedNight = false;
                nextForm.overtimeHours = 0;
                nextForm.isNightShift = false;
                nextForm.nightShiftHours = 0;
            }
            return nextForm;
        });
    };

    const handleBulkFormChange = (updatedFields) => {
        setBulkForm(prev => {
            let nextForm = { ...prev, ...updatedFields };

            if (nextForm.status === 'Present') {
                const hasDay = nextForm.workedDay;
                const hasNight = nextForm.workedNight;

                if (hasDay) {
                    nextForm.overtimeHours = calculateOvertime(nextForm.checkIn, nextForm.checkOut, false);
                } else {
                    nextForm.overtimeHours = 0;
                }

                if (hasNight) {
                    nextForm.nightShiftHours = calculateTotalHours(nextForm.nightCheckIn, nextForm.nightCheckOut, true);
                    nextForm.isNightShift = true;
                } else {
                    nextForm.nightShiftHours = 0;
                    nextForm.isNightShift = false;
                }
            } else {
                nextForm.workedDay = true;
                nextForm.workedNight = false;
                nextForm.overtimeHours = 0;
                nextForm.isNightShift = false;
                nextForm.nightShiftHours = 0;
            }
            return nextForm;
        });
    };

    const handleSelectEmployee = (empId) => {
        setSelectedEmployeeIds(prev =>
            prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
        );
    };

    const handleSelectAllEmployees = () => {
        if (selectedEmployeeIds.length === employees.length) {
            setSelectedEmployeeIds([]);
        } else {
            setSelectedEmployeeIds(employees.map(emp => emp._id));
        }
    };

    const handleSaveBulkAttendance = async () => {
        if (selectedEmployeeIds.length === 0) return;
        const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(bulkForm.dayNum).padStart(2, '0')}`;
        try {
            await axios.post(`${API_BASE_URL}/api/attendance/bulk-mark`, {
                employeeIds: selectedEmployeeIds,
                date: dateStr,
                status: bulkForm.status,
                workedDay: bulkForm.status === 'Present' ? bulkForm.workedDay : false,
                workedNight: bulkForm.status === 'Present' ? bulkForm.workedNight : false,
                checkIn: bulkForm.status === 'Present' && bulkForm.workedDay ? bulkForm.checkIn : null,
                checkOut: bulkForm.status === 'Present' && bulkForm.workedDay ? bulkForm.checkOut : null,
                nightCheckIn: bulkForm.status === 'Present' && bulkForm.workedNight ? bulkForm.nightCheckIn : null,
                nightCheckOut: bulkForm.status === 'Present' && bulkForm.workedNight ? bulkForm.nightCheckOut : null,
                overtimeHours: bulkForm.status === 'Present' ? bulkForm.overtimeHours : 0,
                isNightShift: bulkForm.status === 'Present' ? bulkForm.isNightShift : false,
                nightShiftHours: bulkForm.status === 'Present' ? bulkForm.nightShiftHours : 0
            });
            setIsBulkModalOpen(false);
            setSelectedEmployeeIds([]);
            triggerSuccess("Bulk attendance saved successfully!");
            fetchData();
        } catch (error) {
            console.error("Error saving bulk attendance:", error);
            triggerError("Failed to save bulk attendance.");
        }
    };

    const getCellDisplayInfo = (employeeId, dayNum) => {
        const log = getLogForDay(employeeId, dayNum);
        if (log) {
            const status = log.status;
            let display = '';
            let colorClass = '';
            let tooltip = '';

            const checkInStr = formatTimeFromDate(log.checkIn, '');
            const checkOutStr = formatTimeFromDate(log.checkOut, '');
            const nightCheckInStr = formatTimeFromDate(log.nightCheckIn, '');
            const nightCheckOutStr = formatTimeFromDate(log.nightCheckOut, '');

            if (status === 'Present') {
                const ot = log.overtimeHours || 0;
                const workedDay = !!log.checkIn;
                const workedNight = !!log.nightCheckIn || (log.isNightShift && log.nightShiftHours > 0);

                if (workedDay && workedNight) {
                    display = ot > 0 ? 'P☀️🌙⁺' : 'P☀️🌙';
                    colorClass = 'text-violet-600 dark:text-violet-400 font-black';
                } else if (workedNight) {
                    display = ot > 0 ? 'P🌙⁺' : 'P🌙';
                    colorClass = 'text-cyan-600 dark:text-cyan-400 font-bold';
                } else if (workedDay) {
                    display = ot > 0 ? 'P⁺' : 'P';
                    colorClass = ot > 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-green-600 dark:text-green-400';
                } else {
                    const ns = log.isNightShift || false;
                    if (ns && ot > 0) {
                        display = 'P🌙⁺';
                        colorClass = 'text-indigo-600 dark:text-violet-400 font-extrabold';
                    } else if (ns) {
                        display = 'P🌙';
                        colorClass = 'text-cyan-600 dark:text-cyan-400 font-bold';
                    } else if (ot > 0) {
                        display = 'P⁺';
                        colorClass = 'text-emerald-600 dark:text-emerald-400 font-bold';
                    } else {
                        display = 'P';
                        colorClass = 'text-green-600 dark:text-green-400';
                    }
                }

                tooltip = 'Present';
                if (workedDay || (!workedDay && !workedNight)) {
                    tooltip += ` | Day: ${checkInStr || '-'} to ${checkOutStr || '-'}`;
                }
                if (workedNight) {
                    tooltip += ` | Night: ${nightCheckInStr || '-'} to ${nightCheckOutStr || '-'}`;
                }
                if (workedNight) tooltip += ` | Night Shift: ${log.nightShiftHours || 0} hrs`;
                if (ot > 0) tooltip += ` | OT: ${ot} hrs`;
            } else if (status === 'Absent') {
                display = 'A';
                colorClass = 'text-red-500 dark:text-red-400/80';
                tooltip = 'Absent';
            } else if (status === 'Leave') {
                display = 'L';
                colorClass = 'text-amber-500 dark:text-amber-400';
                tooltip = 'Leave';
            } else if (status === 'Holiday') {
                display = 'H';
                colorClass = 'text-violet-500 dark:text-violet-400';
                tooltip = 'Holiday';
            }
            return { display, colorClass, tooltip };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const cellDate = new Date(selectedYear, selectedMonth - 1, dayNum);

        if (cellDate > today) {
            return { display: '-', colorClass: 'text-slate-400 dark:text-gray-500 font-normal', tooltip: 'Future Date' };
        } else {
            return { display: 'A', colorClass: 'text-red-500 dark:text-red-400/80', tooltip: 'Absent (No Record)' };
        }
    };

    // Calculate Overtime for a single day log
    const getOtForDay = (log) => {
        if (!log) return 0;
        if (typeof log.overtimeHours === 'number') {
            return log.overtimeHours;
        }
        if (!log.checkIn || !log.checkOut) return 0;
        const checkInTime = new Date(log.checkIn);
        const checkOutTime = new Date(log.checkOut);
        const diffHrs = (checkOutTime - checkInTime) / (1000 * 60 * 60);
        if (diffHrs > shiftHours) {
            return diffHrs - shiftHours;
        }
        return 0;
    };

    // Calculations for Summary
    const getEmployeeSummary = (employeeId) => {
        let presentDays = 0;
        let totalOtHours = 0;
        let totalNsHours = 0;

        for (let d = 1; d <= daysInMonth; d++) {
            const log = getLogForDay(employeeId, d);
            if (log) {
                if (log.status === 'Present' || log.status === 'Holiday') {
                    presentDays++;
                }
                totalOtHours += getOtForDay(log);
                totalNsHours += log.nightShiftHours || 0;
            }
        }

        return {
            presentDays,
            totalOtHours: parseFloat(totalOtHours.toFixed(2)), // Keep decimal precision for OT!
            totalNsHours: parseFloat(totalNsHours.toFixed(2)) // Keep decimal precision for NS hours!
        };
    };

    const handleCellClick = (employee, dayNum) => {
        const log = getLogForDay(employee._id, dayNum);
        setSelectedCell({ employee, dayNum });

        const defaultShift = employee.defaultShift || 'Day (09:30 - 17:30)';
        const isNight = defaultShift.includes('Night');

        let checkInTime = '09:30';
        let checkOutTime = '17:30';
        if (defaultShift.includes('09:00')) {
            checkInTime = '09:00';
            checkOutTime = '17:00';
        }
        let nightCheckInTime = '20:00';
        let nightCheckOutTime = '04:00';

        const timeMatch = defaultShift.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
        if (timeMatch) {
            if (isNight) {
                nightCheckInTime = timeMatch[1];
                nightCheckOutTime = timeMatch[2];
            } else {
                checkInTime = timeMatch[1];
                checkOutTime = timeMatch[2];
            }
        }

        if (log) {
            const hasCheckIn = !!log.checkIn;
            const hasNightCheckIn = !!log.nightCheckIn;
            setModalForm({
                status: log.status === 'Present' ? 'Present' : (log.status === 'Leave' ? 'Leave' : (log.status === 'Holiday' ? 'Holiday' : 'Absent')),
                workedDay: hasCheckIn || (!hasCheckIn && !hasNightCheckIn),
                workedNight: hasNightCheckIn,
                checkIn: formatTimeFromDate(log.checkIn, checkInTime),
                checkOut: formatTimeFromDate(log.checkOut, checkOutTime),
                nightCheckIn: formatTimeFromDate(log.nightCheckIn, nightCheckInTime),
                nightCheckOut: formatTimeFromDate(log.nightCheckOut, nightCheckOutTime),
                overtimeHours: log.overtimeHours || 0,
                isNightShift: log.isNightShift || false,
                nightShiftHours: log.nightShiftHours || 0
            });
        } else {
            // Default depending on whether it is in the future
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const cellDate = new Date(selectedYear, selectedMonth - 1, dayNum);

            if (cellDate > today) {
                setModalForm({
                    status: 'Present',
                    workedDay: !isNight,
                    workedNight: isNight,
                    checkIn: checkInTime,
                    checkOut: checkOutTime,
                    nightCheckIn: nightCheckInTime,
                    nightCheckOut: nightCheckOutTime,
                    overtimeHours: 0,
                    isNightShift: isNight,
                    nightShiftHours: isNight ? calculateTotalHours(nightCheckInTime, nightCheckOutTime, true) : 0
                });
            } else {
                setModalForm({
                    status: 'Absent',
                    workedDay: !isNight,
                    workedNight: isNight,
                    checkIn: checkInTime,
                    checkOut: checkOutTime,
                    nightCheckIn: nightCheckInTime,
                    nightCheckOut: nightCheckOutTime,
                    overtimeHours: 0,
                    isNightShift: isNight,
                    nightShiftHours: 0
                });
            }
        }
    };

    const handleSaveAttendance = async () => {
        if (!selectedCell) return;
        const { employee, dayNum } = selectedCell;
        const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

        try {
            await axios.post(`${API_BASE_URL}/api/attendance/admin-mark`, {
                employeeId: employee._id,
                date: dateStr,
                status: modalForm.status,
                workedDay: modalForm.status === 'Present' ? modalForm.workedDay : false,
                workedNight: modalForm.status === 'Present' ? modalForm.workedNight : false,
                checkIn: modalForm.status === 'Present' && modalForm.workedDay ? modalForm.checkIn : null,
                checkOut: modalForm.status === 'Present' && modalForm.workedDay ? modalForm.checkOut : null,
                nightCheckIn: modalForm.status === 'Present' && modalForm.workedNight ? modalForm.nightCheckIn : null,
                nightCheckOut: modalForm.status === 'Present' && modalForm.workedNight ? modalForm.nightCheckOut : null,
                overtimeHours: modalForm.status === 'Present' ? modalForm.overtimeHours : 0,
                isNightShift: modalForm.status === 'Present' ? modalForm.isNightShift : false,
                nightShiftHours: modalForm.status === 'Present' ? modalForm.nightShiftHours : 0
            });
            setSelectedCell(null);
            triggerSuccess("Attendance saved successfully!");
            fetchData();
        } catch (error) {
            console.error("Error saving manual attendance:", error);
            triggerError("Failed to save attendance.");
        }
    };

    const handleSaveBlanketAttendance = async () => {
        const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(blanketForm.dayNum).padStart(2, '0')}`;
        try {
            await axios.post(`${API_BASE_URL}/api/attendance/blanket-mark`, {
                date: dateStr,
                status: blanketForm.status,
                workedDay: blanketForm.status === 'Present' ? blanketForm.workedDay : false,
                workedNight: blanketForm.status === 'Present' ? blanketForm.workedNight : false,
                checkIn: blanketForm.status === 'Present' && blanketForm.workedDay ? blanketForm.checkIn : null,
                checkOut: blanketForm.status === 'Present' && blanketForm.workedDay ? blanketForm.checkOut : null,
                nightCheckIn: blanketForm.status === 'Present' && blanketForm.workedNight ? blanketForm.nightCheckIn : null,
                nightCheckOut: blanketForm.status === 'Present' && blanketForm.workedNight ? blanketForm.nightCheckOut : null,
                overtimeHours: blanketForm.status === 'Present' ? blanketForm.overtimeHours : 0,
                isNightShift: blanketForm.status === 'Present' ? blanketForm.isNightShift : false,
                nightShiftHours: blanketForm.status === 'Present' ? blanketForm.nightShiftHours : 0
            });
            setIsBlanketModalOpen(false);
            triggerSuccess("Blanket attendance marked successfully!");
            fetchData();
        } catch (error) {
            console.error("Error saving blanket attendance:", error);
            triggerError("Failed to save blanket attendance.");
        }
    };

    const downloadAttendanceCSV = () => {
        try {
            const headers = ["Sl", "Name", "Designation", "Location", ...daysArray.map(d => `Day ${d}`), "Work Days", "OT Hours", "NS Hours"];

            const rows = employees.map((emp, index) => {
                const summary = getEmployeeSummary(emp._id);
                const dailyStatuses = daysArray.map(day => {
                    const log = getLogForDay(emp._id, day);
                    if (log) {
                        const status = log.status;
                        if (status === 'Present') {
                            const workedDay = !!log.checkIn;
                            const workedNight = !!log.nightCheckIn || (log.isNightShift && log.nightShiftHours > 0);

                            const checkInStr = formatTimeFromDate(log.checkIn, '');
                            const checkOutStr = formatTimeFromDate(log.checkOut, '');
                            const nightCheckInStr = formatTimeFromDate(log.nightCheckIn, '');
                            const nightCheckOutStr = formatTimeFromDate(log.nightCheckOut, '');

                            let details = 'Present';
                            const shifts = [];

                            if (workedDay && checkInStr && checkOutStr) {
                                shifts.push(`Day: ${checkInStr}-${checkOutStr}`);
                            }
                            if (workedNight && nightCheckInStr && nightCheckOutStr) {
                                shifts.push(`Night: ${nightCheckInStr}-${nightCheckOutStr}`);
                            }

                            if (shifts.length > 0) {
                                details += ` [${shifts.join(', ')}]`;
                            }

                            const ot = log.overtimeHours || 0;
                            if (ot > 0) {
                                details += ` (OT: ${ot}h)`;
                            }

                            return details;
                        }
                        return status;
                    }
                    const cellDate = new Date(selectedYear, selectedMonth - 1, day);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (cellDate > today) return '-';
                    return 'Absent';
                });

                return [
                    index + 1,
                    emp.name,
                    emp.designation || '',
                    emp.location || '',
                    ...dailyStatuses,
                    summary.presentDays,
                    summary.totalOtHours,
                    summary.totalNsHours
                ];
            });

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(val => {
                    const strVal = String(val === null || val === undefined ? '' : val);
                    if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
                        return `"${strVal.replace(/"/g, '""')}"`;
                    }
                    return strVal;
                }).join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Attendance_Report_${monthName}_${selectedYear}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            triggerSuccess(`Attendance CSV report downloaded successfully!`);
        } catch (error) {
            console.error("Error generating CSV:", error);
            triggerError("Failed to export attendance data to CSV.");
        }
    };

    const groupedPending = getGroupedPendingApprovals();
    const groupedProcessed = getGroupedProcessedApprovals();
    const actualPendingCount = pendingApprovals.filter(rec => rec.approvalStatus === 'pending').length;

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '';
        try {
            return new Date(dateStr).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
                timeZone: 'Asia/Kolkata'
            });
        } catch (e) {
            return dateStr;
        }
    };

    const getTriggerBadge = (type) => {
        if (type === 'automatic') {
            return (
                <span className="px-2 py-0.5 bg-violet-50 dark:bg-violet-950/30 text-violet-750 dark:text-violet-400 border border-violet-100/35 rounded-full text-[10px] font-black uppercase tracking-wider">
                    Auto
                </span>
            );
        }
        return (
            <span className="px-2 py-0.5 bg-sky-50 dark:bg-sky-950/30 text-sky-750 dark:text-sky-450 border border-sky-100/35 rounded-full text-[10px] font-black uppercase tracking-wider">
                Manual
            </span>
        );
    };

    const getLogStatusBadge = (log) => {
        if (log.isSubmitted) {
            return (
                <span className="px-2.5 py-0.5 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-200/20 rounded-full text-[10px] font-extrabold">
                    ✓ Submitted
                </span>
            );
        }
        const isExpired = new Date() > new Date(log.expiresAt);
        if (isExpired) {
            return (
                <span className="px-2.5 py-0.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200/20 rounded-full text-[10px] font-extrabold">
                    ✕ Expired
                </span>
            );
        }
        return (
            <span className="px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-450 border border-amber-200/20 rounded-full text-[10px] font-extrabold animate-pulse">
                ● Pending
            </span>
        );
    };

    const formatDisplayDate = (dStr) => {
        if (!dStr) return '';
        try {
            return new Date(dStr).toLocaleDateString('en-IN', {
                dateStyle: 'long',
                timeZone: 'Asia/Kolkata'
            });
        } catch (e) {
            return dStr;
        }
    };

    return (
        <>
            <div className="max-w-7xl mx-auto animate-fade-in">
                {/* Premium Tab Navigation Bar */}
                <div className="flex border-b border-slate-200 dark:border-[#262235] mb-8 gap-8 justify-start print-hidden">
                    <button
                        onClick={() => setActiveTab('register')}
                        className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all duration-200 border-b-2 flex items-center gap-2 ${activeTab === 'register'
                                ? 'text-indigo-600 dark:text-violet-400 border-indigo-600 dark:border-violet-400 font-black'
                                : 'text-slate-400 dark:text-gray-500 border-transparent hover:text-slate-650 dark:hover:text-gray-300 font-bold'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Attendance Register
                    </button>
                    <button
                        onClick={() => setActiveTab('approvals')}
                        className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all duration-200 border-b-2 flex items-center gap-2 ${activeTab === 'approvals'
                                ? 'text-indigo-600 dark:text-violet-400 border-indigo-600 dark:border-violet-400 font-black'
                                : 'text-slate-400 dark:text-gray-500 border-transparent hover:text-slate-650 dark:hover:text-gray-300 font-bold'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Pending Approvals
                        {actualPendingCount > 0 && (
                            <span className="ml-1 px-2 py-0.5 bg-red-100 dark:bg-red-950 text-red-650 dark:text-red-400 rounded-full text-[10px] font-black animate-pulse">
                                {actualPendingCount}
                            </span>
                        )}
                    </button>
                </div>

                {activeTab === 'register' ? (
                    <>
                        {/* Filter Bar */}
                        <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-lg rounded-xl p-4 sm:p-6 mb-8 flex flex-wrap gap-4 sm:gap-6 items-center justify-between transition-colors duration-300 overflow-hidden">
                            <div className="flex flex-wrap gap-4 items-center">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Month</label>
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                        className="px-4 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                                    >
                                        {[
                                            { v: 1, n: 'January' }, { v: 2, n: 'February' }, { v: 3, n: 'March' }, { v: 4, n: 'April' },
                                            { v: 5, n: 'May' }, { v: 6, n: 'June' }, { v: 7, n: 'July' }, { v: 8, n: 'August' },
                                            { v: 9, n: 'September' }, { v: 10, n: 'October' }, { v: 11, n: 'November' }, { v: 12, n: 'December' }
                                        ].map(m => (
                                            <option key={m.v} value={m.v}>{m.n}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Year</label>
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                        className="px-4 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                                    >
                                        {Array.from({ length: new Date().getFullYear() + 5 - 2024 + 1 }, (_, i) => 2024 + i).map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Shift Hours</label>
                                    <input
                                        type="number"
                                        min="4"
                                        max="16"
                                        value={shiftHours}
                                        onChange={(e) => handleShiftHoursChange(parseInt(e.target.value) || 8)}
                                        className="w-24 px-4 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition text-center"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 sm:gap-4 items-center">
                                {selectedEmployeeIds.length > 0 && (
                                    <button
                                        onClick={() => setIsBulkModalOpen(true)}
                                        className="px-3 sm:px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-750 hover:to-teal-750 text-white font-bold rounded-lg text-[10px] sm:text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition duration-200 flex items-center gap-1.5 sm:gap-2 animate-fade-in"
                                    >
                                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        Bulk Mark ({selectedEmployeeIds.length})
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsBlanketModalOpen(true)}
                                    className="px-3 sm:px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-750 hover:to-violet-750 text-white font-bold rounded-lg text-[10px] sm:text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition duration-200 flex items-center gap-1.5 sm:gap-2"
                                >
                                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                    </svg>
                                    Blanket Mark
                                </button>
                                <button
                                    onClick={downloadAttendanceCSV}
                                    className="px-3 sm:px-4 py-2 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white font-bold rounded-lg text-[10px] sm:text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition duration-200 flex items-center gap-1.5 sm:gap-2"
                                >
                                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    <span className="hidden sm:inline">Download</span> CSV
                                </button>
                                <button
                                    onClick={() => fetchData()}
                                    className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-[#201d2c] dark:hover:bg-[#2c273e] text-slate-650 dark:text-gray-300 rounded-lg border border-slate-200 dark:border-[#37314e] transition flex-shrink-0"
                                    title="Refresh Register"
                                    disabled={loading}
                                >
                                    <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.72 2.78L21 8" />
                                        <polyline points="21 3 21 8 16 8" />
                                    </svg>
                                </button>

                                <div className="text-right text-xs print:hidden min-w-0 ml-auto">
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-gray-500 block uppercase tracking-wider whitespace-nowrap">Currently Showing</span>
                                    <span className="text-sm font-extrabold text-indigo-700 dark:text-violet-400 whitespace-nowrap">{monthName} {selectedYear}</span>
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="text-center py-10">
                                <div className="text-indigo-600 dark:text-violet-400 text-xl font-bold animate-pulse">Loading Attendance Records...</div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-xl rounded-xl p-4 sm:p-6 transition-colors duration-300">
                                {/* Desktop View: Widescreen Horizontal Table */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-xs text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-200 dark:border-[#262235] text-slate-500 dark:text-gray-400 font-bold uppercase">
                                                <th className="px-2 py-3 text-center border-r border-slate-100 dark:border-[#262235]">Sl</th>
                                                <th className="px-2 py-3 text-center border-r border-slate-100 dark:border-[#262235] print-hidden">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedEmployeeIds.length === employees.length && employees.length > 0}
                                                        onChange={handleSelectAllEmployees}
                                                        className="rounded text-violet-600 focus:ring-violet-500 bg-slate-100 dark:bg-[#201d2c] border-slate-300 dark:border-[#37314e] h-4 w-4 cursor-pointer"
                                                    />
                                                </th>
                                                <th className="px-3 py-3 min-w-[140px] border-r border-slate-100 dark:border-[#262235]">Name</th>
                                                <th className="px-3 py-3 min-w-[100px] border-r border-slate-100 dark:border-[#262235]">Designation</th>
                                                <th className="px-3 py-3 min-w-[100px] border-r border-slate-100 dark:border-[#262235]">Location</th>

                                                {/* Render day columns */}
                                                {daysArray.map(day => (
                                                    <th key={day} className="px-1.5 py-3 text-center min-w-[26px] border-r border-slate-100 dark:border-[#262235] last:border-r-0">
                                                        {day}
                                                    </th>
                                                ))}

                                                <th className="px-3 py-3 text-center min-w-[60px] border-l border-slate-100 dark:border-[#262235]">Work Days</th>
                                                <th className="px-3 py-3 text-center min-w-[60px] border-r border-slate-100 dark:border-[#262235]">OT Hrs</th>
                                                <th className="px-3 py-3 text-center min-w-[60px]">NS Hrs</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {employees.length > 0 ? (
                                                employees.map((emp, index) => {
                                                    const summary = getEmployeeSummary(emp._id);
                                                    return (
                                                        <tr key={emp._id} className="border-b border-slate-100 dark:border-[#262235] hover:bg-slate-50 dark:hover:bg-[#201d2c]/50 transition duration-150">
                                                            <td className="px-2 py-3 text-center font-bold text-slate-400 border-r border-slate-100 dark:border-[#262235]">{index + 1}</td>
                                                            <td className="px-2 py-3 text-center border-r border-slate-100 dark:border-[#262235] print-hidden">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedEmployeeIds.includes(emp._id)}
                                                                    onChange={() => handleSelectEmployee(emp._id)}
                                                                    className="rounded text-violet-650 focus:ring-violet-500 bg-slate-100 dark:bg-[#201d2c] border-slate-300 dark:border-[#37314e] h-4 w-4 cursor-pointer"
                                                                />
                                                            </td>
                                                            <td className="px-3 py-3 font-semibold text-slate-900 dark:text-white border-r border-slate-100 dark:border-[#262235]">{emp.name}</td>
                                                            <td className="px-3 py-3 text-slate-655 dark:text-gray-300 border-r border-slate-100 dark:border-[#262235]">{emp.designation || '-'}</td>
                                                            <td className="px-3 py-3 text-slate-655 dark:text-gray-300 border-r border-slate-100 dark:border-[#262235]">{emp.location || '-'}</td>

                                                            {/* Render status for each day */}
                                                            {daysArray.map(day => {
                                                                const cellInfo = getCellDisplayInfo(emp._id, day);
                                                                return (
                                                                    <td
                                                                        key={day}
                                                                        className={`px-1.5 py-3 text-center font-bold border-r border-slate-100 dark:border-[#262235] last:border-r-0 cursor-pointer hover:bg-indigo-100/30 dark:hover:bg-[#201d2c] transition duration-150 ${cellInfo.colorClass}`}
                                                                        onClick={() => handleCellClick(emp, day)}
                                                                        onMouseEnter={(e) => {
                                                                            const log = getLogForDay(emp._id, day);
                                                                            if (log) {
                                                                                const rect = e.currentTarget.getBoundingClientRect();
                                                                                setHoveredCell({
                                                                                    employeeName: emp.name,
                                                                                    date: `${day} ${monthName} ${selectedYear}`,
                                                                                    status: log.status,
                                                                                    checkIn: formatTimeFromDate(log.checkIn, null),
                                                                                    checkOut: formatTimeFromDate(log.checkOut, null),
                                                                                    nightCheckIn: formatTimeFromDate(log.nightCheckIn, null),
                                                                                    nightCheckOut: formatTimeFromDate(log.nightCheckOut, null),
                                                                                    isNightShift: log.isNightShift,
                                                                                    nightShiftHours: log.nightShiftHours || 0,
                                                                                    overtimeHours: log.overtimeHours,
                                                                                    x: rect.left,
                                                                                    y: rect.bottom + 5
                                                                                });
                                                                            }
                                                                        }}
                                                                        onMouseLeave={() => setHoveredCell(null)}
                                                                    >
                                                                        {cellInfo.display}
                                                                    </td>
                                                                );
                                                            })}

                                                            <td className="px-3 py-3 text-center font-bold text-green-600 dark:text-green-400 border-l border-slate-100 dark:border-[#262235]">
                                                                {summary.presentDays}
                                                            </td>
                                                            <td className="px-3 py-3 text-center font-bold text-indigo-600 dark:text-violet-400 border-r border-slate-100 dark:border-[#262235]">
                                                                {summary.totalOtHours}
                                                            </td>
                                                            <td className="px-3 py-3 text-center font-bold text-amber-600 dark:text-amber-400">
                                                                {summary.totalNsHours}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan={daysInMonth + 7} className="text-center py-6 font-medium text-gray-500">
                                                        No employees registered in the system.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile View: Accordions & Interactive Calendar Grid */}
                                <div className="md:hidden space-y-4">
                                    {employees.length > 0 ? (
                                        employees.map((emp, index) => {
                                            const summary = getEmployeeSummary(emp._id);
                                            return (
                                                <div key={emp._id} className="p-4 bg-slate-50 dark:bg-[#201d2c]/40 border border-slate-100 dark:border-[#2b273d] rounded-xl flex flex-col gap-3">
                                                    <div className="flex justify-between items-start border-b border-slate-200/50 dark:border-[#37314e]/50 pb-2">
                                                        <div className="flex items-start gap-2.5">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedEmployeeIds.includes(emp._id)}
                                                                onChange={() => handleSelectEmployee(emp._id)}
                                                                className="rounded text-violet-650 focus:ring-violet-500 bg-white dark:bg-[#181622] border-slate-300 dark:border-[#37314e] h-4.5 w-4.5 cursor-pointer mt-0.5"
                                                            />
                                                            <div>
                                                                <h4 className="text-sm font-black text-slate-900 dark:text-white">{emp.name}</h4>
                                                                <p className="text-xs text-slate-550 dark:text-gray-400 mt-0.5">{emp.designation || 'Staff'} • {emp.location || 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                                                    </div>

                                                    {/* Summary Stats Row */}
                                                    <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-200/30 dark:border-[#37314e]/30">
                                                        <div className="bg-white dark:bg-[#181622] p-2 rounded-lg text-center border border-slate-200/30 dark:border-[#2b273d]">
                                                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">Work Days</span>
                                                            <span className="text-xs font-black text-green-600 dark:text-green-400">{summary.presentDays}</span>
                                                        </div>
                                                        <div className="bg-white dark:bg-[#181622] p-2 rounded-lg text-center border border-slate-200/30 dark:border-[#2b273d]">
                                                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">OT Hours</span>
                                                            <span className="text-xs font-black text-indigo-600 dark:text-violet-400">{summary.totalOtHours}</span>
                                                        </div>
                                                        <div className="bg-white dark:bg-[#181622] p-2 rounded-lg text-center border border-slate-200/30 dark:border-[#2b273d]">
                                                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">NS Hours</span>
                                                            <span className="text-xs font-black text-amber-600 dark:text-amber-400">{summary.totalNsHours}</span>
                                                        </div>
                                                    </div>

                                                    {/* Calendar view */}
                                                    <div>
                                                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Month Calendar (Tap day to edit)</span>
                                                        <div className="grid grid-cols-7 gap-1.5">
                                                            {daysArray.map(day => {
                                                                const cellInfo = getCellDisplayInfo(emp._id, day);
                                                                return (
                                                                    <button
                                                                        key={day}
                                                                        onClick={() => handleCellClick(emp, day)}
                                                                        className={`h-8 rounded-lg flex flex-col justify-center items-center text-[10px] font-bold border transition relative hover:scale-105 active:scale-95 ${cellInfo.colorClass.includes('text-green') ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/30' :
                                                                                cellInfo.colorClass.includes('text-red') ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30' :
                                                                                    cellInfo.colorClass.includes('text-amber') ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30' :
                                                                                        cellInfo.colorClass.includes('text-violet') ? 'bg-violet-50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-900/30' :
                                                                                            cellInfo.colorClass.includes('text-cyan') ? 'bg-cyan-50 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-900/30' :
                                                                                                cellInfo.colorClass.includes('text-indigo') ? 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/30' :
                                                                                                    'bg-slate-50 dark:bg-[#181622] border-slate-200 dark:border-[#37314e]'
                                                                            } ${cellInfo.colorClass}`}
                                                                        title={cellInfo.tooltip}
                                                                    >
                                                                        <span className="text-[8px] text-slate-400 absolute top-0.5 left-1 font-normal">{day}</span>
                                                                        <span className="mt-1">{cellInfo.display}</span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-6 text-slate-400 text-sm font-medium">
                                            No active employee records found.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Legend Section */}
                        <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-lg rounded-xl p-6 mt-8 transition-colors duration-300 print-hidden">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Attendance Status Legend & Guide</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-4 text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 flex items-center justify-center font-bold rounded bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/30">P</span>
                                    <div>
                                        <p className="font-semibold text-slate-800 dark:text-white">Present</p>
                                        <p className="text-[10px] text-slate-400">Regular Shift</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 flex items-center justify-center font-bold rounded bg-green-50 dark:bg-green-950/20 text-emerald-600 dark:text-emerald-400 border border-green-200 dark:border-green-900/30">P⁺</span>
                                    <div>
                                        <p className="font-semibold text-slate-800 dark:text-white">Present + OT</p>
                                        <p className="text-[10px] text-slate-400">Overtime Hours</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 flex items-center justify-center font-bold rounded bg-cyan-50 dark:bg-cyan-950/20 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-900/30">P🌙</span>
                                    <div>
                                        <p className="font-semibold text-slate-800 dark:text-white">Night Shift</p>
                                        <p className="text-[10px] text-slate-400">Night Hours</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 flex items-center justify-center font-bold rounded bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-violet-400 border border-indigo-200 dark:border-indigo-900/30">P🌙⁺</span>
                                    <div>
                                        <p className="font-semibold text-slate-800 dark:text-white">Night + OT</p>
                                        <p className="text-[10px] text-slate-400">Overnight + OT</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 flex items-center justify-center font-bold rounded bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-900/30">P☀️🌙</span>
                                    <div>
                                        <p className="font-semibold text-slate-800 dark:text-white">Both Shifts</p>
                                        <p className="text-[10px] text-slate-400">Day & Night</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 flex items-center justify-center font-bold rounded bg-violet-100 dark:bg-violet-950/40 text-violet-750 dark:text-violet-350 border border-violet-300 dark:border-violet-900/40">P☀️🌙⁺</span>
                                    <div>
                                        <p className="font-semibold text-slate-800 dark:text-white">Both + OT</p>
                                        <p className="text-[10px] text-slate-400">Day/Night + OT</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 flex items-center justify-center font-bold rounded bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400/80 border border-red-200 dark:border-red-900/30">A</span>
                                    <div>
                                        <p className="font-semibold text-slate-800 dark:text-white">Absent</p>
                                        <p className="text-[10px] text-slate-400">No work log</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 flex items-center justify-center font-bold rounded bg-amber-50 dark:bg-amber-950/20 text-amber-500 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30">L</span>
                                    <div>
                                        <p className="font-semibold text-slate-800 dark:text-white">Leave</p>
                                        <p className="text-[10px] text-slate-400 font-normal">Approved leave</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 flex items-center justify-center font-bold rounded bg-violet-50 dark:bg-violet-950/20 text-violet-500 dark:text-violet-400 border border-violet-200 dark:border-violet-900/30">H</span>
                                    <div>
                                        <p className="font-semibold text-slate-800 dark:text-white">Holiday</p>
                                        <p className="text-[10px] text-slate-400 font-normal">Public holiday</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 flex items-center justify-center font-normal rounded bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-gray-500 border border-slate-200 dark:border-[#262235]">-</span>
                                    <div>
                                        <p className="font-semibold text-slate-800 dark:text-white">Unmarked</p>
                                        <p className="text-[10px] text-slate-400 font-normal">Future date</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#262235] text-[11px] text-slate-550 dark:text-gray-405 flex flex-wrap gap-4">
                                <span className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <strong>Interactive Tooltips:</strong> Hover over any daily cell to inspect detailed check-in, check-out, night shift status, and overtime hours instantly.
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                    <strong>Quick Edit:</strong> Click on any daily cell to manually override status, adjust time logs, or designate overtime hours.
                                </span>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="space-y-8 print-hidden">
                        {/* Manual Request Panel & Summary */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* manual form */}
                            <div className="lg:col-span-1 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-lg rounded-xl p-6 transition-colors duration-300">
                                <h3 className="text-sm font-black text-slate-905 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                                    <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                    Trigger Attendance Request
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-gray-400 mb-4 leading-relaxed font-semibold">
                                    Manually generate and email a secure, one-time attendance marking link to a supervisor. The link expires automatically in 24 hours.
                                </p>
                                <form onSubmit={handleSendRequest} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Supervisor</label>
                                        <select
                                            value={manualRequestForm.supervisorId}
                                            onChange={(e) => setManualRequestForm({ ...manualRequestForm, supervisorId: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-xs text-slate-900 dark:text-white font-bold"
                                        >
                                            {supervisors.length === 0 ? (
                                                <option value="">No supervisors registered</option>
                                            ) : (
                                                supervisors.map(s => (
                                                    <option key={s._id} value={s._id}>{s.name} ({s.email})</option>
                                                ))
                                            )}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Target Date</label>
                                        <input
                                            type="date"
                                            required
                                            value={manualRequestForm.date}
                                            onChange={(e) => setManualRequestForm({ ...manualRequestForm, date: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-xs text-slate-900 dark:text-white font-bold text-center"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={sendingRequest || supervisors.length === 0}
                                        className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-750 hover:to-violet-750 text-white font-bold py-2.5 px-4 rounded-lg text-xs uppercase tracking-wider shadow shadow-indigo-650/30 hover:shadow-lg transition flex items-center justify-center gap-1.5"
                                    >
                                        {sendingRequest ? (
                                            <>
                                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                                Send Email Request
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>

                            {/* Summary / Instructions Panel */}
                            <div className="lg:col-span-2 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-lg rounded-xl p-6 transition-colors duration-300">
                                <h3 className="text-sm font-black text-slate-905 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                                    <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    Supervisor Approval Workflow Guide
                                </h3>
                                <div className="space-y-4 text-xs text-slate-650 dark:text-gray-400 font-semibold leading-relaxed">
                                    <div className="flex gap-2">
                                        <span className="w-5 h-5 bg-indigo-50 dark:bg-violet-950/40 text-indigo-650 dark:text-violet-400 rounded-full flex items-center justify-center font-extrabold flex-shrink-0 text-[10px]">1</span>
                                        <p>
                                            <strong>Daily Auto Trigger:</strong> The system automatically sends verification links daily at <strong>6:00 PM IST</strong> to all users saved under the <strong>supervisor</strong> role.
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="w-5 h-5 bg-indigo-50 dark:bg-violet-950/40 text-indigo-655 dark:text-violet-400 rounded-full flex items-center justify-center font-extrabold flex-shrink-0 text-[10px]">2</span>
                                        <p>
                                            <strong>Submission & Lock:</strong> Once the supervisor marks attendance, they are locked out. Their logs appear in the pending list below.
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="w-5 h-5 bg-indigo-50 dark:bg-violet-950/40 text-indigo-655 dark:text-violet-400 rounded-full flex items-center justify-center font-extrabold flex-shrink-0 text-[10px]">3</span>
                                        <p>
                                            <strong>Admin Review & Publishing:</strong> You can edit any employee logs (status, hours, OT) directly inside the pending groups. Clicking <strong>Approve Sheet</strong> writes them to the main register.
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="w-5 h-5 bg-indigo-50 dark:bg-violet-950/40 text-indigo-655 dark:text-violet-400 rounded-full flex items-center justify-center font-extrabold flex-shrink-0 text-[10px]">4</span>
                                        <p>
                                            <strong>Discarding:</strong> If a mistake was made, clicking <strong>Discard</strong> rejects all logs in that group. The supervisor can then be manually re-requested for that date.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pending Approvals List */}
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                    <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Pending Supervisor Submissions ({groupedPending.length})
                                </h2>
                                <button
                                    onClick={() => fetchApprovalsData()}
                                    className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-[#201d2c] dark:hover:bg-[#2c273e] text-slate-655 dark:text-gray-300 rounded-lg border border-slate-200 dark:border-[#37314e] transition"
                                    title="Refresh Submissions"
                                    disabled={approvalsLoading}
                                >
                                    <svg className={`w-4 h-4 ${approvalsLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.72 2.78L21 8" />
                                        <polyline points="21 3 21 8 16 8" />
                                    </svg>
                                </button>
                            </div>

                            {approvalsLoading ? (
                                <div className="text-center py-12 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow rounded-xl">
                                    <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-slate-500 dark:text-gray-400 font-bold animate-pulse text-xs uppercase tracking-wider">Loading Submissions & Logs...</p>
                                </div>
                            ) : groupedPending.length === 0 ? (
                                <div className="text-center py-12 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow rounded-xl text-slate-500 dark:text-gray-400 transition-colors duration-300">
                                    <div className="w-16 h-16 bg-slate-100 dark:bg-[#201d2c] rounded-full flex items-center justify-center mx-auto text-slate-400 mb-4 border border-slate-200/30">
                                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                    </div>
                                    <p className="font-extrabold text-sm mb-1">No pending supervisor submissions</p>
                                    <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                                        All supervisor daily attendance records have been approved, or none have been submitted yet.
                                    </p>
                                </div>
                            ) : (
                                groupedPending.map(group => {
                                    const groupKey = `${group.date}_${group.supervisorId}`;
                                    const isSubmitting = submittingApprovalGroup === groupKey;

                                    return (
                                        <div
                                            key={groupKey}
                                            className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-xl rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl"
                                        >
                                            {/* Group Card Header */}
                                            <div className="bg-slate-50 dark:bg-[#201d2c] px-6 py-4 border-b border-slate-200 dark:border-[#262235] flex flex-wrap items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-indigo-100 dark:bg-violet-950/40 text-indigo-650 dark:text-violet-400 rounded-full flex items-center justify-center font-bold">
                                                        {group.supervisorName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-slate-900 dark:text-white">
                                                            {group.supervisorName}
                                                        </h4>
                                                        <p className="text-[10px] text-slate-500 dark:text-gray-500 font-semibold">
                                                            {group.supervisorEmail || 'No Email'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3.5 flex-wrap">
                                                    <span className="px-3.5 py-1.5 bg-indigo-50 dark:bg-violet-950/20 text-indigo-750 dark:text-violet-300 rounded-full text-xs font-black border border-indigo-100/30">
                                                        Sheet Date: {formatDisplayDate(group.date)}
                                                    </span>

                                                    <div className="flex gap-2.5">
                                                        <button
                                                            onClick={() => handleApproveGroup(groupKey, group.records)}
                                                            disabled={isSubmitting}
                                                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-md transition"
                                                        >
                                                            {isSubmitting ? 'Processing...' : 'Approve Sheet'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectGroup(groupKey, group.records)}
                                                            disabled={isSubmitting}
                                                            className="px-3.5 py-1.5 bg-red-650 hover:bg-red-750 text-white rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-md transition"
                                                        >
                                                            {isSubmitting ? 'Discarding...' : 'Discard'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Table of group employees */}
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-xs text-left border-collapse">
                                                    <thead>
                                                        <tr className="border-b border-slate-200 dark:border-[#262235] text-slate-500 dark:text-gray-400 font-extrabold uppercase bg-slate-50/50 dark:bg-[#181622]/30">
                                                            <th className="px-3 py-3 border-r border-slate-100 dark:border-[#262235]">Employee</th>
                                                            <th className="px-3 py-3 border-r border-slate-100 dark:border-[#262235] w-28">Status</th>
                                                            <th className="px-3 py-3 border-r border-slate-100 dark:border-[#262235] w-36">Shift Select</th>
                                                            <th className="px-3 py-3 border-r border-slate-100 dark:border-[#262235] min-w-[170px]">☀️ Day Shift Times</th>
                                                            <th className="px-3 py-3 border-r border-slate-100 dark:border-[#262235] min-w-[170px]">🌙 Night Shift Times</th>
                                                            <th className="px-3 py-3 border-r border-slate-100 dark:border-[#262235] text-center w-20">OT (Hrs)</th>
                                                            <th className="px-3 py-3 text-center w-20">NS (Hrs)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {group.records.map(rec => {
                                                            return (
                                                                <tr key={rec._id} className="border-b border-slate-100 dark:border-[#262235] hover:bg-slate-50/50 dark:hover:bg-[#201d2c]/20 transition duration-150">
                                                                    <td className="px-3 py-3.5 font-bold text-slate-900 dark:text-white border-r border-slate-100 dark:border-[#262235]">
                                                                        <div>{rec.employeeId?.name || 'Unknown Employee'}</div>
                                                                        <div className="text-[10px] text-slate-400 font-semibold">{rec.employeeId?.designation || '-'} • {rec.employeeId?.location || '-'}</div>
                                                                    </td>
                                                                    <td className="px-3 py-3.5 border-r border-slate-100 dark:border-[#262235]">
                                                                        <select
                                                                            value={rec.status}
                                                                            onChange={(e) => handlePendingFieldChange(rec._id, { status: e.target.value })}
                                                                            className="px-2 py-1 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-xs text-slate-900 dark:text-white font-bold"
                                                                        >
                                                                            <option value="Present">Present</option>
                                                                            <option value="Absent">Absent</option>
                                                                            <option value="Leave">Leave</option>
                                                                            <option value="Holiday">Holiday</option>
                                                                        </select>
                                                                    </td>
                                                                    <td className="px-3 py-3.5 border-r border-slate-100 dark:border-[#262235]">
                                                                        {rec.status === 'Present' ? (
                                                                            <div className="flex gap-4">
                                                                                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-xs text-slate-700 dark:text-gray-300">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        checked={!!rec.workedDay}
                                                                                        onChange={(e) => handlePendingFieldChange(rec._id, { workedDay: e.target.checked })}
                                                                                        className="rounded text-violet-600 border-slate-300 h-4.5 w-4.5 cursor-pointer"
                                                                                    />
                                                                                    Day
                                                                                </label>
                                                                                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-xs text-slate-700 dark:text-gray-300">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        checked={!!rec.workedNight}
                                                                                        onChange={(e) => handlePendingFieldChange(rec._id, { workedNight: e.target.checked })}
                                                                                        className="rounded text-violet-600 border-slate-300 h-4.5 w-4.5 cursor-pointer"
                                                                                    />
                                                                                    Night
                                                                                </label>
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-slate-400 dark:text-gray-500 font-semibold">-</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-3 py-3.5 border-r border-slate-100 dark:border-[#262235]">
                                                                        {rec.status === 'Present' && rec.workedDay ? (
                                                                            <div className="flex items-center gap-1.5">
                                                                                <input
                                                                                    type="time"
                                                                                    value={formatTimeFromDate(rec.checkIn, '09:30')}
                                                                                    onChange={(e) => handleTimeFieldChange(rec._id, 'checkIn', e.target.value, rec.date)}
                                                                                    className="px-2 py-1 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#37314e] rounded-lg text-xs text-slate-800 dark:text-white text-center"
                                                                                />
                                                                                <span className="text-slate-400 text-[10px]">-</span>
                                                                                <input
                                                                                    type="time"
                                                                                    value={formatTimeFromDate(rec.checkOut, '17:30')}
                                                                                    onChange={(e) => handleTimeFieldChange(rec._id, 'checkOut', e.target.value, rec.date)}
                                                                                    className="px-2 py-1 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#37314e] rounded-lg text-xs text-slate-800 dark:text-white text-center"
                                                                                />
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-slate-400 dark:text-gray-500 font-semibold">-</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-3 py-3.5 border-r border-slate-100 dark:border-[#262235]">
                                                                        {rec.status === 'Present' && rec.workedNight ? (
                                                                            <div className="flex items-center gap-1.5">
                                                                                <input
                                                                                    type="time"
                                                                                    value={formatTimeFromDate(rec.nightCheckIn, '20:00')}
                                                                                    onChange={(e) => handleTimeFieldChange(rec._id, 'nightCheckIn', e.target.value, rec.date)}
                                                                                    className="px-2 py-1 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#37314e] rounded-lg text-xs text-slate-800 dark:text-white text-center"
                                                                                />
                                                                                <span className="text-slate-400 text-[10px]">-</span>
                                                                                <input
                                                                                    type="time"
                                                                                    value={formatTimeFromDate(rec.nightCheckOut, '04:00')}
                                                                                    onChange={(e) => handleTimeFieldChange(rec._id, 'nightCheckOut', e.target.value, rec.date)}
                                                                                    className="px-2 py-1 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#37314e] rounded-lg text-xs text-slate-800 dark:text-white text-center"
                                                                                />
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-slate-400 dark:text-gray-500 font-semibold">-</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-3 py-3.5 border-r border-slate-100 dark:border-[#262235] text-center">
                                                                        {rec.status === 'Present' && rec.workedDay ? (
                                                                            <input
                                                                                type="number"
                                                                                step="0.5"
                                                                                min="0"
                                                                                max="8"
                                                                                value={rec.overtimeHours || 0}
                                                                                onChange={(e) => handlePendingFieldChange(rec._id, { overtimeHours: parseFloat(e.target.value) || 0 })}
                                                                                className="w-14 px-1.5 py-1 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#37314e] rounded-lg text-xs text-center font-bold text-indigo-650 dark:text-violet-400"
                                                                            />
                                                                        ) : (
                                                                            <span className="text-slate-400 dark:text-gray-500 font-semibold">-</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-3 py-3.5 text-center">
                                                                        {rec.status === 'Present' && rec.workedNight ? (
                                                                            <input
                                                                                type="number"
                                                                                step="0.5"
                                                                                min="0"
                                                                                max="16"
                                                                                value={rec.nightShiftHours || 0}
                                                                                onChange={(e) => handlePendingFieldChange(rec._id, { nightShiftHours: parseFloat(e.target.value) || 0 })}
                                                                                className="w-14 px-1.5 py-1 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#37314e] rounded-lg text-xs text-center font-bold text-amber-600 dark:text-amber-450"
                                                                            />
                                                                        ) : (
                                                                            <span className="text-slate-400 dark:text-gray-500 font-semibold">-</span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Processed Submissions History */}
                        <div className="space-y-6">
                            <div
                                className="flex items-center justify-between cursor-pointer bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-md rounded-xl p-4 transition duration-200 select-none"
                                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                            >
                                <h2 className="text-base font-black text-slate-905 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                    <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    Processed Submissions History ({groupedProcessed.length})
                                </h2>
                                <div className="text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white transition">
                                    {isHistoryOpen ? (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    )}
                                </div>
                            </div>

                            {isHistoryOpen && (
                                <div className="space-y-6 animate-fade-in">
                                    {approvalsLoading ? (
                                        <div className="text-center py-12 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow rounded-xl">
                                            <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                            <p className="text-slate-500 dark:text-gray-400 font-bold animate-pulse text-xs uppercase tracking-wider">Loading Processed Submissions...</p>
                                        </div>
                                    ) : groupedProcessed.length === 0 ? (
                                        <div className="text-center py-12 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow rounded-xl text-slate-500 dark:text-gray-400 transition-colors duration-300">
                                            <div className="w-16 h-16 bg-slate-100 dark:bg-[#201d2c] rounded-full flex items-center justify-center mx-auto text-slate-400 mb-4 border border-slate-200/30">
                                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                            </div>
                                            <p className="font-extrabold text-sm mb-1">No processed submissions history</p>
                                            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                                                No daily supervisor attendance sheets have been approved or rejected yet.
                                            </p>
                                        </div>
                                    ) : (
                                        groupedProcessed.map(group => {
                                            const groupKey = `processed_${group.date}_${group.supervisorId}`;
                                            return (
                                                <div
                                                    key={groupKey}
                                                    className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-lg rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl opacity-90 hover:opacity-100"
                                                >
                                                    {/* Group Card Header */}
                                                    <div className="bg-slate-50/70 dark:bg-[#201d2c]/70 px-6 py-4 border-b border-slate-200 dark:border-[#262235] flex flex-wrap items-center justify-between gap-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-slate-100 dark:bg-[#201d2c] text-slate-650 dark:text-gray-300 rounded-full flex items-center justify-center font-bold">
                                                                {group.supervisorName.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-black text-slate-800 dark:text-white">
                                                                    {group.supervisorName}
                                                                </h4>
                                                                <p className="text-[10px] text-slate-550 dark:text-gray-500 font-semibold">
                                                                    {group.supervisorEmail || 'No Email'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            <span className="px-3 py-1 bg-slate-100 dark:bg-[#201d2c] text-slate-700 dark:text-gray-300 rounded-full text-xs font-bold border border-slate-200/30">
                                                                Sheet Date: {formatDisplayDate(group.date)}
                                                            </span>

                                                            {group.approvalStatus === 'approved' ? (
                                                                <span className="px-3 py-1 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200/20 rounded-full text-xs font-black flex items-center gap-1">
                                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                    Approved
                                                                </span>
                                                            ) : (
                                                                <span className="px-3 py-1 bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 border border-red-200/20 rounded-full text-xs font-black flex items-center gap-1">
                                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                                    </svg>
                                                                    Rejected / Discarded
                                                                </span>
                                                            )}

                                                            <span className="text-[11px] text-slate-550 dark:text-gray-400 font-bold">
                                                                Actioned: {formatDateTime(group.updatedAt)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Table of group employees */}
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-xs text-left border-collapse">
                                                            <thead>
                                                                <tr className="border-b border-slate-200 dark:border-[#262235] text-slate-500 dark:text-gray-400 font-extrabold uppercase bg-slate-50/30 dark:bg-[#181622]/20">
                                                                    <th className="px-3 py-3 border-r border-slate-100 dark:border-[#262235]">Employee</th>
                                                                    <th className="px-3 py-3 border-r border-slate-100 dark:border-[#262235] w-28">Status</th>
                                                                    <th className="px-3 py-3 border-r border-slate-100 dark:border-[#262235] w-36">Shift Worked</th>
                                                                    <th className="px-3 py-3 border-r border-slate-100 dark:border-[#262235] min-w-[170px]">☀️ Day Shift Times</th>
                                                                    <th className="px-3 py-3 border-r border-slate-100 dark:border-[#262235] min-w-[170px]">🌙 Night Shift Times</th>
                                                                    <th className="px-3 py-3 border-r border-slate-100 dark:border-[#262235] text-center w-20">OT (Hrs)</th>
                                                                    <th className="px-3 py-3 text-center w-20">NS (Hrs)</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {group.records.map(rec => {
                                                                    const shifts = [];
                                                                    if (rec.status === 'Present') {
                                                                        if (rec.workedDay) shifts.push('Day');
                                                                        if (rec.workedNight) shifts.push('Night');
                                                                    }
                                                                    return (
                                                                        <tr key={rec._id} className="border-b border-slate-100 dark:border-[#262235] hover:bg-slate-50/30 dark:hover:bg-[#201d2c]/10 transition duration-150">
                                                                            <td className="px-3 py-3 font-semibold text-slate-800 dark:text-gray-200 border-r border-slate-100 dark:border-[#262235]">
                                                                                <div>{rec.employeeId?.name || 'Unknown Employee'}</div>
                                                                                <div className="text-[10px] text-slate-400 font-semibold">{rec.employeeId?.designation || '-'} • {rec.employeeId?.location || '-'}</div>
                                                                            </td>
                                                                            <td className="px-3 py-3 border-r border-slate-100 dark:border-[#262235] font-bold">
                                                                                {rec.status === 'Present' ? (
                                                                                    <span className="text-green-600 dark:text-green-400">Present</span>
                                                                                ) : rec.status === 'Absent' ? (
                                                                                    <span className="text-red-500 dark:text-red-400/80">Absent</span>
                                                                                ) : rec.status === 'Leave' ? (
                                                                                    <span className="text-amber-500 dark:text-amber-400">Leave</span>
                                                                                ) : (
                                                                                    <span className="text-violet-500 dark:text-violet-400">Holiday</span>
                                                                                )}
                                                                            </td>
                                                                            <td className="px-3 py-3 border-r border-slate-100 dark:border-[#262235] text-slate-650 dark:text-gray-300 font-medium">
                                                                                {rec.status === 'Present' && shifts.length > 0 ? shifts.join(' & ') : '-'}
                                                                            </td>
                                                                            <td className="px-3 py-3 border-r border-slate-100 dark:border-[#262235] text-slate-650 dark:text-gray-300 font-semibold">
                                                                                {rec.status === 'Present' && rec.workedDay ? (
                                                                                    <span>
                                                                                        {formatTimeFromDate(rec.checkIn, '09:30')} - {formatTimeFromDate(rec.checkOut, '17:30')}
                                                                                    </span>
                                                                                ) : '-'}
                                                                            </td>
                                                                            <td className="px-3 py-3 border-r border-slate-100 dark:border-[#262235] text-slate-650 dark:text-gray-300 font-semibold">
                                                                                {rec.status === 'Present' && rec.workedNight ? (
                                                                                    <span>
                                                                                        {formatTimeFromDate(rec.nightCheckIn, '20:00')} - {formatTimeFromDate(rec.nightCheckOut, '04:00')}
                                                                                    </span>
                                                                                ) : '-'}
                                                                            </td>
                                                                            <td className="px-3 py-3 border-r border-slate-100 dark:border-[#262235] text-center font-bold text-indigo-600 dark:text-violet-400">
                                                                                {rec.status === 'Present' && rec.workedDay && rec.overtimeHours > 0 ? rec.overtimeHours : '-'}
                                                                            </td>
                                                                            <td className="px-3 py-3 text-center font-bold text-amber-600 dark:text-amber-400">
                                                                                {rec.status === 'Present' && rec.workedNight && rec.nightShiftHours > 0 ? rec.nightShiftHours : '-'}
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Request Logs Panel */}
                        <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-lg rounded-xl p-6 transition-colors duration-300">
                            <h3 className="text-sm font-black text-slate-905 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                                <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                Generated Request History & Logs
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-[#262235] text-slate-500 dark:text-gray-400 font-extrabold uppercase bg-slate-50/50 dark:bg-[#181622]/30">
                                            <th className="px-3 py-3 w-36">Target Date</th>
                                            <th className="px-3 py-3">Supervisor</th>
                                            <th className="px-3 py-3 w-32">Trigger Type</th>
                                            <th className="px-3 py-3 w-48">Sent Time</th>
                                            <th className="px-3 py-3 w-36">Link Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {requestLogs.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="text-center py-6 text-slate-400 dark:text-gray-500 font-semibold">
                                                    No request links have been generated yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            requestLogs.map(log => (
                                                <tr key={log._id} className="border-b border-slate-100 dark:border-[#262235] hover:bg-slate-50/30 dark:hover:bg-[#201d2c]/15">
                                                    <td className="px-3 py-3 font-bold text-slate-800 dark:text-white">
                                                        {formatDisplayDate(log.date)}
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <div className="font-bold text-slate-900 dark:text-white">{log.supervisorId?.name || 'Unknown'}</div>
                                                        <div className="text-[10px] text-slate-400 font-semibold">{log.email}</div>
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        {getTriggerBadge(log.triggerType)}
                                                    </td>
                                                    <td className="px-3 py-3 text-slate-550 dark:text-gray-400 font-bold">
                                                        {formatDateTime(log.createdAt)}
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        {getLogStatusBadge(log)}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls for Link request logs */}
                            {requestLogs.length > 0 && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-100 dark:border-[#262235]/65 text-slate-650 dark:text-gray-300 text-xs font-semibold select-none">
                                    {/* Left: Size Selector & Total count info */}
                                    <div className="flex items-center gap-4 flex-wrap">
                                        <div className="flex items-center gap-2">
                                            <span>Show</span>
                                            <select
                                                value={logLimit}
                                                onChange={(e) => {
                                                    setLogLimit(Number(e.target.value));
                                                    setLogPage(1);
                                                }}
                                                className="px-2.5 py-1 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer font-bold transition"
                                            >
                                                <option value={10}>10</option>
                                                <option value={20}>20</option>
                                                <option value={50}>50</option>
                                            </select>
                                            <span>logs per page</span>
                                        </div>
                                        <span className="text-slate-300 dark:text-slate-700">|</span>
                                        <span>
                                            Showing {logTotalCount === 0 ? 0 : (logPage - 1) * logLimit + 1} to {Math.min(logPage * logLimit, logTotalCount)} of {logTotalCount} request logs
                                        </span>
                                    </div>

                                    {/* Right: Next / Prev navigation buttons */}
                                    <div className="flex items-center gap-1">
                                        <button
                                            disabled={logPage === 1}
                                            onClick={() => setLogPage(1)}
                                            className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[#201d2c] disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer text-slate-500 hover:text-indigo-600 dark:hover:text-violet-400"
                                            title="First Page"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
                                            </svg>
                                        </button>

                                        <button
                                            disabled={logPage === 1}
                                            onClick={() => setLogPage(prev => Math.max(prev - 1, 1))}
                                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[#201d2c] disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer text-slate-500 hover:text-indigo-600 dark:hover:text-violet-400"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                            </svg>
                                            <span>Prev</span>
                                        </button>

                                        <div className="flex items-center gap-1 mx-1.5">
                                            {Array.from({ length: logTotalPages }).map((_, index) => {
                                                const pageNum = index + 1;
                                                if (
                                                    logTotalPages <= 5 ||
                                                    pageNum === 1 ||
                                                    pageNum === logTotalPages ||
                                                    Math.abs(pageNum - logPage) <= 1
                                                ) {
                                                    return (
                                                        <button
                                                            key={pageNum}
                                                            onClick={() => setLogPage(pageNum)}
                                                            className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition ${logPage === pageNum
                                                                    ? 'bg-indigo-600 dark:bg-violet-600 text-white shadow-sm'
                                                                    : 'hover:bg-slate-50 dark:hover:bg-[#201d2c] text-slate-650 dark:text-gray-300'
                                                                }`}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    );
                                                }
                                                if (
                                                    (pageNum === 2 && logPage > 3) ||
                                                    (pageNum === logTotalPages - 1 && logPage < logTotalPages - 2)
                                                ) {
                                                    return (
                                                        <span key={pageNum} className="text-slate-450 px-0.5 select-none font-bold">
                                                            ...
                                                        </span>
                                                    );
                                                }
                                                return null;
                                            })}
                                        </div>

                                        <button
                                            disabled={logPage === logTotalPages}
                                            onClick={() => setLogPage(prev => Math.min(prev + 1, logTotalPages))}
                                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[#201d2c] disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer text-slate-500 hover:text-indigo-600 dark:hover:text-violet-400"
                                        >
                                            <span>Next</span>
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                            </svg>
                                        </button>

                                        <button
                                            disabled={logPage === logTotalPages}
                                            onClick={() => setLogPage(logTotalPages)}
                                            className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[#201d2c] disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer text-slate-500 hover:text-indigo-600 dark:hover:text-violet-400"
                                            title="Last Page"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>


            {/* Attendance Override Modal */}
            {selectedCell && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-65 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] w-full max-w-sm rounded-xl p-6 shadow-2xl relative transition-all duration-300 animate-slide-down">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-[#262235] pb-2 mb-4">
                            Mark Attendance
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-gray-400 mb-4">
                            Employee: <span className="font-bold text-slate-800 dark:text-white">{selectedCell.employee.name}</span><br />
                            Date: <span className="font-bold text-slate-800 dark:text-white">{selectedCell.dayNum} {monthName} {selectedYear}</span>
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Status</label>
                                <select
                                    value={modalForm.status}
                                    onChange={(e) => handleModalFormChange({ status: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition font-medium"
                                >
                                    <option value="Present">Present</option>
                                    <option value="Absent">Absent</option>
                                    <option value="Leave">Leave</option>
                                    <option value="Holiday">Holiday</option>
                                </select>
                            </div>

                            {modalForm.status === 'Present' && (
                                <div className="space-y-4 animate-fade-in print-hidden">
                                    {/* Day Shift Section */}
                                    <div className="flex flex-col bg-slate-50 dark:bg-[#201d2c] p-3 rounded-lg border border-slate-200 dark:border-[#37314e] transition">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-bold text-slate-700 dark:text-gray-200 uppercase tracking-wider cursor-pointer select-none flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={modalForm.workedDay}
                                                    onChange={(e) => handleModalFormChange({ workedDay: e.target.checked })}
                                                    className="rounded text-violet-600 focus:ring-violet-500 bg-slate-100 dark:bg-[#201d2c] border-slate-300 dark:border-[#37314e] h-4 w-4"
                                                />
                                                ☀️ Day Shift
                                            </label>
                                            {modalForm.workedDay && modalForm.overtimeHours > 0 && (
                                                <span className="text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                                                    OT: {modalForm.overtimeHours} hrs
                                                </span>
                                            )}
                                        </div>

                                        {modalForm.workedDay && (
                                            <div className="grid grid-cols-2 gap-3 mt-1 animate-fade-in">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Check In</label>
                                                    <input
                                                        type="time"
                                                        value={modalForm.checkIn}
                                                        onChange={(e) => handleModalFormChange({ checkIn: e.target.value })}
                                                        className="w-full px-2.5 py-1.5 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#37314e] rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition text-center animate-fade-in"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Check Out</label>
                                                    <input
                                                        type="time"
                                                        value={modalForm.checkOut}
                                                        onChange={(e) => handleModalFormChange({ checkOut: e.target.value })}
                                                        className="w-full px-2.5 py-1.5 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#37314e] rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition text-center animate-fade-in"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Night Shift Section */}
                                    <div className="flex flex-col bg-slate-50 dark:bg-[#201d2c] p-3 rounded-lg border border-slate-200 dark:border-[#37314e] transition">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-bold text-slate-700 dark:text-gray-200 uppercase tracking-wider cursor-pointer select-none flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={modalForm.workedNight}
                                                    onChange={(e) => handleModalFormChange({ workedNight: e.target.checked })}
                                                    className="rounded text-violet-600 focus:ring-violet-500 bg-slate-100 dark:bg-[#201d2c] border-slate-300 dark:border-[#37314e] h-4 w-4"
                                                />
                                                🌙 Night Shift
                                            </label>
                                            {modalForm.workedNight && modalForm.nightShiftHours > 0 && (
                                                <span className="text-[10px] font-extrabold bg-cyan-100 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 px-2 py-0.5 rounded-full">
                                                    NS: {modalForm.nightShiftHours} hrs
                                                </span>
                                            )}
                                        </div>

                                        {modalForm.workedNight && (
                                            <div className="grid grid-cols-2 gap-3 mt-1 animate-fade-in">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Check In</label>
                                                    <input
                                                        type="time"
                                                        value={modalForm.nightCheckIn}
                                                        onChange={(e) => handleModalFormChange({ nightCheckIn: e.target.value })}
                                                        className="w-full px-2.5 py-1.5 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#37314e] rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition text-center animate-fade-in"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Check Out</label>
                                                    <input
                                                        type="time"
                                                        value={modalForm.nightCheckOut}
                                                        onChange={(e) => handleModalFormChange({ nightCheckOut: e.target.value })}
                                                        className="w-full px-2.5 py-1.5 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#37314e] rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition text-center animate-fade-in"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Manual Overrides Display/Adjust */}
                                    <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-[#201d2c] p-3 rounded-lg border border-slate-200 dark:border-[#37314e] text-xs">
                                        <div className="flex items-center justify-between col-span-2 pb-1.5 border-b border-slate-200 dark:border-[#37314e] font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                                            <span>Manual adjustments</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <label className="font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">OT (Hrs):</label>
                                            <input
                                                type="number"
                                                step="0.5"
                                                min="0"
                                                value={modalForm.overtimeHours}
                                                onChange={(e) => setModalForm(prev => ({ ...prev, overtimeHours: parseFloat(e.target.value) || 0 }))}
                                                className="w-16 px-2 py-1 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#37314e] rounded text-sm text-center text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 font-semibold"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <label className="font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">NS (Hrs):</label>
                                            <input
                                                type="number"
                                                step="0.5"
                                                min="0"
                                                value={modalForm.nightShiftHours}
                                                onChange={(e) => setModalForm(prev => ({ ...prev, nightShiftHours: parseFloat(e.target.value) || 0 }))}
                                                className="w-16 px-2 py-1 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#37314e] rounded text-sm text-center text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 font-semibold"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 mt-6 print-hidden">
                            <button
                                onClick={handleSaveAttendance}
                                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 rounded-lg shadow transition duration-200 text-sm"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => setSelectedCell(null)}
                                className="w-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-gray-300 font-bold py-2.5 rounded-lg shadow transition duration-200 text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Blanket Mark Attendance Modal */}
            {isBlanketModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-65 backdrop-blur-sm flex items-center justify-center p-4 print-hidden">
                    <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] w-full max-w-sm rounded-xl p-6 shadow-2xl relative transition-all duration-300 animate-slide-down">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-[#262235] pb-2 mb-4">
                            Blanket Attendance Mark
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-gray-400 mb-4">
                            Apply a blanket status to **all** employees for a single day of {monthName} {selectedYear}.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Select Day of Month</label>
                                <select
                                    value={blanketForm.dayNum}
                                    onChange={(e) => setBlanketForm({ ...blanketForm, dayNum: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition font-medium"
                                >
                                    {daysArray.map(day => (
                                        <option key={day} value={day}>{day} ({new Date(selectedYear, selectedMonth - 1, day).toLocaleString('default', { weekday: 'short' })})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Blanket Status</label>
                                <select
                                    value={blanketForm.status}
                                    onChange={(e) => handleBlanketFormChange({ status: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition font-medium"
                                >
                                    <option value="Present">Present</option>
                                    <option value="Absent">Absent</option>
                                    <option value="Leave">Leave</option>
                                    <option value="Holiday">Holiday</option>
                                </select>
                            </div>

                            {blanketForm.status === 'Present' && (
                                <div className="space-y-4 animate-fade-in">
                                    {/* Day Shift Section */}
                                    <div className="flex flex-col bg-slate-50 dark:bg-[#201d2c] p-3 rounded-lg border border-slate-200 dark:border-[#37314e] transition">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-bold text-slate-700 dark:text-gray-200 uppercase tracking-wider cursor-pointer select-none flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={blanketForm.workedDay}
                                                    onChange={(e) => handleBlanketFormChange({ workedDay: e.target.checked })}
                                                    className="rounded text-violet-600 focus:ring-violet-500 bg-slate-100 dark:bg-[#201d2c] border-slate-300 dark:border-[#37314e] h-4 w-4"
                                                />
                                                ☀️ Day Shift
                                            </label>
                                            {blanketForm.workedDay && blanketForm.overtimeHours > 0 && (
                                                <span className="text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                                                    OT: {blanketForm.overtimeHours} hrs
                                                </span>
                                            )}
                                        </div>

                                        {blanketForm.workedDay && (
                                            <div className="grid grid-cols-2 gap-3 mt-1 animate-fade-in">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Check In</label>
                                                    <input
                                                        type="time"
                                                        value={blanketForm.checkIn}
                                                        onChange={(e) => handleBlanketFormChange({ checkIn: e.target.value })}
                                                        className="w-full px-2.5 py-1.5 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#37314e] rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition text-center animate-fade-in"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Check Out</label>
                                                    <input
                                                        type="time"
                                                        value={blanketForm.checkOut}
                                                        onChange={(e) => handleBlanketFormChange({ checkOut: e.target.value })}
                                                        className="w-full px-2.5 py-1.5 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#37314e] rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition text-center animate-fade-in"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Night Shift Section */}
                                    <div className="flex flex-col bg-slate-50 dark:bg-[#201d2c] p-3 rounded-lg border border-slate-200 dark:border-[#37314e] transition">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-bold text-slate-700 dark:text-gray-200 uppercase tracking-wider cursor-pointer select-none flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={blanketForm.workedNight}
                                                    onChange={(e) => handleBlanketFormChange({ workedNight: e.target.checked })}
                                                    className="rounded text-violet-600 focus:ring-violet-500 bg-slate-100 dark:bg-[#201d2c] border-slate-300 dark:border-[#37314e] h-4 w-4"
                                                />
                                                🌙 Night Shift
                                            </label>
                                            {blanketForm.workedNight && blanketForm.nightShiftHours > 0 && (
                                                <span className="text-[10px] font-extrabold bg-cyan-100 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 px-2 py-0.5 rounded-full">
                                                    NS: {blanketForm.nightShiftHours} hrs
                                                </span>
                                            )}
                                        </div>

                                        {blanketForm.workedNight && (
                                            <div className="grid grid-cols-2 gap-3 mt-1 animate-fade-in">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Check In</label>
                                                    <input
                                                        type="time"
                                                        value={blanketForm.nightCheckIn}
                                                        onChange={(e) => handleBlanketFormChange({ nightCheckIn: e.target.value })}
                                                        className="w-full px-2.5 py-1.5 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#37314e] rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition text-center animate-fade-in"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Check Out</label>
                                                    <input
                                                        type="time"
                                                        value={blanketForm.nightCheckOut}
                                                        onChange={(e) => handleBlanketFormChange({ nightCheckOut: e.target.value })}
                                                        className="w-full px-2.5 py-1.5 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#37314e] rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition text-center animate-fade-in"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Manual Overrides Display/Adjust */}
                                    <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-[#201d2c] p-3 rounded-lg border border-slate-200 dark:border-[#37314e] text-xs">
                                        <div className="flex items-center justify-between col-span-2 pb-1.5 border-b border-slate-200 dark:border-[#37314e] font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                                            <span>Manual adjustments</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <label className="font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">OT (Hrs):</label>
                                            <input
                                                type="number"
                                                step="0.5"
                                                min="0"
                                                value={blanketForm.overtimeHours}
                                                onChange={(e) => setBlanketForm(prev => ({ ...prev, overtimeHours: parseFloat(e.target.value) || 0 }))}
                                                className="w-16 px-2 py-1 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#37314e] rounded text-sm text-center text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 font-semibold"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <label className="font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">NS (Hrs):</label>
                                            <input
                                                type="number"
                                                step="0.5"
                                                min="0"
                                                value={blanketForm.nightShiftHours}
                                                onChange={(e) => setBlanketForm(prev => ({ ...prev, nightShiftHours: parseFloat(e.target.value) || 0 }))}
                                                className="w-16 px-2 py-1 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#37314e] rounded text-sm text-center text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 font-semibold"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 mt-6 print-hidden">
                            <button
                                onClick={handleSaveBlanketAttendance}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg shadow transition duration-200 text-sm"
                            >
                                Apply All
                            </button>
                            <button
                                onClick={() => setIsBlanketModalOpen(false)}
                                className="w-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-gray-300 font-bold py-2.5 rounded-lg shadow transition duration-200 text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Mark Attendance Modal */}
            {isBulkModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-65 backdrop-blur-sm flex items-center justify-center p-4 print-hidden">
                    <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] w-full max-w-sm rounded-xl p-6 shadow-2xl relative transition-all duration-300 animate-slide-down">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-[#262235] pb-2 mb-4">
                            Bulk Mark Selected
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-gray-400 mb-4">
                            Marking attendance for <span className="font-bold text-indigo-600 dark:text-violet-400">{selectedEmployeeIds.length} selected employees</span> for a single day of {monthName} {selectedYear}.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Select Day of Month</label>
                                <select
                                    value={bulkForm.dayNum}
                                    onChange={(e) => setBulkForm({ ...bulkForm, dayNum: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition font-medium"
                                >
                                    {daysArray.map(day => (
                                        <option key={day} value={day}>{day} ({new Date(selectedYear, selectedMonth - 1, day).toLocaleString('default', { weekday: 'short' })})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Status</label>
                                <select
                                    value={bulkForm.status}
                                    onChange={(e) => handleBulkFormChange({ status: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition font-medium"
                                >
                                    <option value="Present">Present</option>
                                    <option value="Absent">Absent</option>
                                    <option value="Leave">Leave</option>
                                    <option value="Holiday">Holiday</option>
                                </select>
                            </div>

                            {bulkForm.status === 'Present' && (
                                <div className="space-y-4 animate-fade-in">
                                    {/* Day Shift Section */}
                                    <div className="flex flex-col bg-slate-50 dark:bg-[#201d2c] p-3 rounded-lg border border-slate-200 dark:border-[#37314e] transition">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-bold text-slate-700 dark:text-gray-200 uppercase tracking-wider cursor-pointer select-none flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={bulkForm.workedDay}
                                                    onChange={(e) => handleBulkFormChange({ workedDay: e.target.checked })}
                                                    className="rounded text-violet-600 focus:ring-violet-500 bg-slate-100 dark:bg-[#201d2c] border-slate-300 dark:border-[#37314e] h-4 w-4"
                                                />
                                                ☀️ Day Shift
                                            </label>
                                            {bulkForm.workedDay && bulkForm.overtimeHours > 0 && (
                                                <span className="text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                                                    OT: {bulkForm.overtimeHours} hrs
                                                </span>
                                            )}
                                        </div>

                                        {bulkForm.workedDay && (
                                            <div className="grid grid-cols-2 gap-3 mt-1 animate-fade-in">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Check In</label>
                                                    <input
                                                        type="time"
                                                        value={bulkForm.checkIn}
                                                        onChange={(e) => handleBulkFormChange({ checkIn: e.target.value })}
                                                        className="w-full px-2.5 py-1.5 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#37314e] rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition text-center animate-fade-in"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Check Out</label>
                                                    <input
                                                        type="time"
                                                        value={bulkForm.checkOut}
                                                        onChange={(e) => handleBulkFormChange({ checkOut: e.target.value })}
                                                        className="w-full px-2.5 py-1.5 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#37314e] rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition text-center animate-fade-in"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Night Shift Section */}
                                    <div className="flex flex-col bg-slate-50 dark:bg-[#201d2c] p-3 rounded-lg border border-slate-200 dark:border-[#37314e] transition">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-bold text-slate-700 dark:text-gray-200 uppercase tracking-wider cursor-pointer select-none flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={bulkForm.workedNight}
                                                    onChange={(e) => handleBulkFormChange({ workedNight: e.target.checked })}
                                                    className="rounded text-violet-600 focus:ring-violet-500 bg-slate-100 dark:bg-[#201d2c] border-slate-300 dark:border-[#37314e] h-4 w-4"
                                                />
                                                🌙 Night Shift
                                            </label>
                                            {bulkForm.workedNight && bulkForm.nightShiftHours > 0 && (
                                                <span className="text-[10px] font-extrabold bg-cyan-100 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 px-2 py-0.5 rounded-full">
                                                    NS: {bulkForm.nightShiftHours} hrs
                                                </span>
                                            )}
                                        </div>

                                        {bulkForm.workedNight && (
                                            <div className="grid grid-cols-2 gap-3 mt-1 animate-fade-in">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Check In</label>
                                                    <input
                                                        type="time"
                                                        value={bulkForm.nightCheckIn}
                                                        onChange={(e) => handleBulkFormChange({ nightCheckIn: e.target.value })}
                                                        className="w-full px-2.5 py-1.5 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#37314e] rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition text-center animate-fade-in"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Check Out</label>
                                                    <input
                                                        type="time"
                                                        value={bulkForm.nightCheckOut}
                                                        onChange={(e) => handleBulkFormChange({ nightCheckOut: e.target.value })}
                                                        className="w-full px-2.5 py-1.5 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#37314e] rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition text-center animate-fade-in"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Manual Overrides Display/Adjust */}
                                    <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-[#201d2c] p-3 rounded-lg border border-slate-200 dark:border-[#37314e] text-xs">
                                        <div className="flex items-center justify-between col-span-2 pb-1.5 border-b border-slate-200 dark:border-[#37314e] font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                                            <span>Manual adjustments</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <label className="font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">OT (Hrs):</label>
                                            <input
                                                type="number"
                                                step="0.5"
                                                min="0"
                                                value={bulkForm.overtimeHours}
                                                onChange={(e) => setBulkForm(prev => ({ ...prev, overtimeHours: parseFloat(e.target.value) || 0 }))}
                                                className="w-16 px-2 py-1 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#37314e] rounded text-sm text-center text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 font-semibold"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <label className="font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">NS (Hrs):</label>
                                            <input
                                                type="number"
                                                step="0.5"
                                                min="0"
                                                value={bulkForm.nightShiftHours}
                                                onChange={(e) => setBulkForm(prev => ({ ...prev, nightShiftHours: parseFloat(e.target.value) || 0 }))}
                                                className="w-16 px-2 py-1 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#37314e] rounded text-sm text-center text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 font-semibold"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 mt-6 print-hidden">
                            <button
                                onClick={handleSaveBulkAttendance}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg shadow transition duration-200 text-sm"
                            >
                                Save Changes
                            </button>
                            <button
                                onClick={() => setIsBulkModalOpen(false)}
                                className="w-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-gray-300 font-bold py-2.5 rounded-lg shadow transition duration-200 text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Custom Hover Tooltip */}
            {hoveredCell && (
                <div
                    className="fixed z-50 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#37314e] text-slate-800 dark:text-gray-200 p-4 rounded-xl shadow-2xl text-xs space-y-2 pointer-events-none transition-all duration-150 print-hidden"
                    style={{
                        left: `${hoveredCell.x}px`,
                        top: `${hoveredCell.y}px`,
                        minWidth: '220px',
                        transform: 'translateX(-50%)',
                        marginLeft: '13px'
                    }}
                >
                    <div className="font-extrabold text-indigo-700 dark:text-violet-400 border-b border-slate-100 dark:border-[#262235] pb-1.5 mb-1.5 uppercase tracking-wide">
                        {hoveredCell.employeeName}
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-400 dark:text-gray-500">Date:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{hoveredCell.date}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-400 dark:text-gray-500">Status:</span>
                        <span className="font-bold text-green-600 dark:text-green-400">{hoveredCell.status}</span>
                    </div>
                    {hoveredCell.status === 'Present' && (
                        <>
                            {(hoveredCell.checkIn || hoveredCell.checkOut) && (
                                <div className="flex justify-between">
                                    <span className="text-slate-400 dark:text-gray-500">☀️ Day Shift:</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">
                                        {hoveredCell.checkIn || '-'} to {hoveredCell.checkOut || '-'}
                                    </span>
                                </div>
                            )}
                            {(hoveredCell.nightCheckIn || hoveredCell.nightCheckOut || hoveredCell.isNightShift) && (
                                <div className="flex justify-between">
                                    <span className="text-slate-400 dark:text-gray-500">🌙 Night Shift:</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">
                                        {hoveredCell.nightCheckIn || '-'} to {hoveredCell.nightCheckOut || '-'}
                                    </span>
                                </div>
                            )}
                            {hoveredCell.isNightShift && (
                                <div className="flex justify-between">
                                    <span className="text-slate-400 dark:text-gray-500">Night Duration:</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">
                                        {hoveredCell.nightShiftHours || 0} hrs
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-slate-400 dark:text-gray-500">Overtime:</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                    {hoveredCell.overtimeHours > 0 ? `${hoveredCell.overtimeHours} hrs` : 'None'}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Centered Premium Overlay Modal for Notifications */}
            {(successMessage || errorMessage) && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in print-hidden">
                    <div className="bg-white dark:bg-[#181622]/95 border border-slate-200 dark:border-[#262235] shadow-2xl rounded-2xl p-6 sm:p-8 w-full max-w-sm text-center relative transition-all duration-300 animate-slide-down">
                        {/* Close button */}
                        <button
                            onClick={() => {
                                setSuccessMessage('');
                                setErrorMessage('');
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
                                <p className="text-sm text-slate-600 dark:text-gray-300">{errorMessage}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

export default AttendanceRegister;
