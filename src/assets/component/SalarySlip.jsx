import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './Header';
import Footer from './Footer';

function SalarySlip() {
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [salarySlip, setSalarySlip] = useState({
        month: new Date().toLocaleString('default', { month: 'long' }),
        workDays: 0,
        otHours: 0,
        otSalary: 0,
        advance: 0,
        esic: 0,
        inHand: 0,
    });

    useEffect(() => {
        fetchActiveEmployees();
    }, []);

    const fetchActiveEmployees = async () => {
        try {
            const response = await axios.get('https://billsbackend-git-main-abhidigiworlds-projects.vercel.app/api/employees/active');
            setEmployees(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Error fetching active employees:", error);
            setEmployees([]);
        }
    };

    const handleEmployeeSelect = (e) => {
        const emp = employees.find(emp => emp._id === e.target.value);
        setSelectedEmployee(emp);
    };

    const calculateInHand = () => {
        const dailySalary = selectedEmployee ? selectedEmployee.grossSalary / 30 : 0;
        const totalSalary = (salarySlip.workDays * dailySalary) + salarySlip.otSalary;
        return totalSalary - salarySlip.esic - salarySlip.advance;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSalarySlip({ ...salarySlip, [name]: parseFloat(value) || 0 });
    };

    const handleSubmit = async () => {
        const inHand = calculateInHand();
        await axios.post('https://billsbackend-git-main-abhidigiworlds-projects.vercel.app/api/salary-slip', { ...salarySlip, employeeId: selectedEmployee._id, inHand });
        alert('Salary Slip Saved!');
    };

    return (
        <>
            <Header />
            <div className="p-6 max-w-xl mx-auto bg-white shadow-lg rounded-lg">
                <h2 className="text-2xl font-semibold text-center mb-4">Generate Salary Slip</h2>

                <select
                    onChange={handleEmployeeSelect}
                    defaultValue=""
                    className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="" disabled>Select Employee</option>
                    {employees.length > 0 ? (
                        employees.map(emp => (
                            <option key={emp._id} value={emp._id}>{emp.name}</option>
                        ))
                    ) : (
                        <option disabled>No active employees found</option>
                    )}
                </select>

                {selectedEmployee && (
                    <div>
                        <div className="mb-4">
                            <input
                                type="number"
                                name="workDays"
                                placeholder="Work Days"
                                onChange={handleInputChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="mb-4">
                            <input
                                type="number"
                                name="otHours"
                                placeholder="OT Hours"
                                onChange={handleInputChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="mb-4">
                            <input
                                type="number"
                                name="otSalary"
                                placeholder="OT Salary"
                                onChange={handleInputChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="mb-4">
                            <input
                                type="number"
                                name="advance"
                                placeholder="Advance"
                                onChange={handleInputChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="mb-4">
                            <input
                                type="number"
                                name="esic"
                                placeholder="ESIC"
                                onChange={handleInputChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex space-x-4">
                            <button
                                onClick={handleSubmit}
                                className="w-full bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                Generate Salary Slip
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="w-full bg-gray-300 p-3 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            >
                                Print
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </>
    );
}

export default SalarySlip;
