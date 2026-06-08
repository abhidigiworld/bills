import React, { useState, useEffect } from 'react';
import './printStyles.css';
import axios from 'axios';
import InvoiceDetails from './InvoiceDetails';
import UpdateInvoice from './UpdateInvoice';
import { API_BASE_URL } from '../../config';

function Bills() {
  const [bills, setBills] = useState([]);
  const [alertMessage, setAlertMessage] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [invoiceToUpdate, setInvoiceToUpdate] = useState(null);

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/invoices`);
        setBills(response.data);
      } catch (error) {
        console.error('Error fetching bills:', error);
      }
    };

    fetchBills();
  }, [invoiceToUpdate]);

  const formatDate = (dateString) => {
    return dateString ? dateString.slice(0, 10) : '-';
  };

  const handleDelete = async (id) => {
    const userConfirmed = window.confirm("Are you sure you want to delete this invoice?");
    if (userConfirmed) {
      try {
        await axios.delete(`${API_BASE_URL}/api/invoices/${id}`);
        setBills(bills.filter((bill) => bill._id !== id));
        setAlertMessage('Invoice deleted successfully');
      } catch (error) {
        console.error('Error deleting bill:', error);
        setAlertMessage('An error occurred while deleting the invoice');
      }
    }
  };

  const handleViewDetails = (id) => {
    setSelectedInvoice(id);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleUpdate = (bill) => {
    setInvoiceToUpdate(bill);
    setIsUpdating(true);
  };

  const handleUpdateClose = () => {
    setIsUpdating(false);
    setInvoiceToUpdate(null);
  };

  const filteredBills = bills.filter((bill) =>
    (bill.invoiceNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (bill.companyName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return (
        <svg className="w-3.5 h-3.5 ml-1.5 opacity-40 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 8.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
        </svg>
      );
    }
    if (sortConfig.direction === 'asc') {
      return (
        <svg className="w-3.5 h-3.5 ml-1.5 text-indigo-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
        </svg>
      );
    }
    return (
      <svg className="w-3.5 h-3.5 ml-1.5 text-indigo-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      </svg>
    );
  };

  const sortedBills = React.useMemo(() => {
    let sortableBills = [...filteredBills];
    if (sortConfig.key !== null) {
      sortableBills.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (aValue === undefined || aValue === null) aValue = '';
        if (bValue === undefined || bValue === null) bValue = '';

        if (sortConfig.key === 'stateCode') {
          const aNum = parseFloat(aValue);
          const bNum = parseFloat(bValue);
          if (!isNaN(aNum) && !isNaN(bNum)) {
            aValue = aNum;
            bValue = bNum;
          }
        }

        if (sortConfig.key === 'invoiceDate') {
          const aDate = new Date(aValue);
          const bDate = new Date(bValue);
          if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
            aValue = aDate.getTime();
            bValue = bDate.getTime();
          }
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc'
            ? aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: 'base' })
            : bValue.localeCompare(aValue, undefined, { numeric: true, sensitivity: 'base' });
        } else {
          if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
          }
          if (aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1;
          }
          return 0;
        }
      });
    }
    return sortableBills;
  }, [filteredBills, sortConfig]);

  return (
    <div className={`max-w-6xl mx-auto animate-fade-in ${selectedInvoice || isUpdating ? 'print-hidden' : ''}`}>
      {alertMessage && (
        <div className="max-w-md mx-auto mb-6 bg-green-100 dark:bg-green-950/40 border border-green-400 dark:border-green-900/50 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg text-center text-sm font-medium">
          {alertMessage}
        </div>
      )}

      {/* Search Box */}
      <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-lg rounded-xl p-6 mb-8 transition-colors duration-300">
        <label htmlFor="search" className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Search by Invoice No or Company Name
        </label>
        <input
          id="search"
          type="text"
          className="w-full px-4 py-3 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
          placeholder="Enter Invoice No or Company Name..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      {/* Invoices List Table */}
      <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-xl rounded-xl p-4 transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#262235] text-slate-500 dark:text-gray-400 font-bold uppercase text-xs select-none">
                <th className="px-4 py-3 cursor-pointer group hover:text-indigo-600 dark:hover:text-violet-400 transition-colors" onClick={() => handleSort('companyName')}>
                  <div className="flex items-center">
                    Company Name
                    {getSortIcon('companyName')}
                  </div>
                </th>
                <th className="px-4 py-3 cursor-pointer group hover:text-indigo-600 dark:hover:text-violet-400 transition-colors" onClick={() => handleSort('gstin')}>
                  <div className="flex items-center">
                    GSTIN
                    {getSortIcon('gstin')}
                  </div>
                </th>
                <th className="px-4 py-3 cursor-pointer group hover:text-indigo-600 dark:hover:text-violet-400 transition-colors" onClick={() => handleSort('state')}>
                  <div className="flex items-center">
                    State
                    {getSortIcon('state')}
                  </div>
                </th>
                <th className="px-4 py-3 text-center cursor-pointer group hover:text-indigo-600 dark:hover:text-violet-400 transition-colors" onClick={() => handleSort('stateCode')}>
                  <div className="flex items-center justify-center">
                    State Code
                    {getSortIcon('stateCode')}
                  </div>
                </th>
                <th className="px-4 py-3 text-center cursor-pointer group hover:text-indigo-600 dark:hover:text-violet-400 transition-colors" onClick={() => handleSort('invoiceNo')}>
                  <div className="flex items-center justify-center">
                    Invoice No
                    {getSortIcon('invoiceNo')}
                  </div>
                </th>
                <th className="px-4 py-3 text-center cursor-pointer group hover:text-indigo-600 dark:hover:text-violet-400 transition-colors" onClick={() => handleSort('invoiceDate')}>
                  <div className="flex items-center justify-center">
                    Invoice Date
                    {getSortIcon('invoiceDate')}
                  </div>
                </th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedBills.length > 0 ? (
                sortedBills.map((bill) => (
                  <tr key={bill._id} className="border-b border-slate-100 dark:border-[#262235] hover:bg-slate-50 dark:hover:bg-[#201d2c]/50 transition duration-150">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{bill.companyName}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-gray-300">{bill.gstin || '-'}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-gray-300">{bill.state}</td>
                    <td className="px-4 py-3 text-center text-slate-600 dark:text-gray-300">{bill.stateCode}</td>
                    <td className="px-4 py-3 text-center font-mono text-slate-900 dark:text-white font-bold">{bill.invoiceNo}</td>
                    <td className="px-4 py-3 text-center text-slate-600 dark:text-gray-300">{formatDate(bill.invoiceDate)}</td>
                    <td className="px-4 py-3 flex items-center justify-center gap-2">
                      <button
                        className="bg-indigo-600 hover:bg-indigo-700 dark:bg-violet-600 dark:hover:bg-violet-700 text-white font-bold py-1.5 px-3 rounded-md text-xs transition duration-200 shadow-sm"
                        onClick={() => handleViewDetails(bill._id)}
                      >
                        View
                      </button>
                      <button
                        className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-1.5 px-3 rounded-md text-xs transition duration-200 shadow-sm"
                        onClick={() => handleUpdate(bill)}
                      >
                        Update
                      </button>
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-1.5 px-3 rounded-md text-xs transition duration-200 shadow-sm"
                        onClick={() => handleDelete(bill._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-6 font-medium text-gray-500">
                    No invoices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details/Update modals */}
      {isUpdating && (
        <UpdateInvoice invoice={invoiceToUpdate} onClose={handleUpdateClose} />
      )}
      {selectedInvoice && (
        <InvoiceDetails invoiceId={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
      )}
    </div>
  );
}

export default Bills;
