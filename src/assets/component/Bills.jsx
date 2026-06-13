import React, { useState, useEffect } from 'react';
import './printStyles.css';
import axios from 'axios';
import InvoiceDetails from './InvoiceDetails';
import UpdateInvoice from './UpdateInvoice';
import { API_BASE_URL } from '../../config';

function Bills() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [invoiceToUpdate, setInvoiceToUpdate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchBills = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/invoices`);
      setBills(response.data);
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      fetchBills(true);
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const formatDate = (dateString) => {
    return dateString ? dateString.slice(0, 10) : '-';
  };

  const handleDelete = async (id) => {
    const userConfirmed = window.confirm("Are you sure you want to delete this invoice?");
    if (userConfirmed) {
      try {
        await axios.delete(`${API_BASE_URL}/api/invoices/${id}`);
        setBills(bills.filter((bill) => bill._id !== id));
        setSuccessMessage('Invoice deleted successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (error) {
        console.error('Error deleting bill:', error);
        setErrorMessage('An error occurred while deleting the invoice');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    }
  };

  const handleViewDetails = (id) => {
    setSelectedInvoice(id);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleUpdate = (bill) => {
    setInvoiceToUpdate(bill);
    setIsUpdating(true);
  };

  const handleUpdateClose = (isUpdated) => {
    setIsUpdating(false);
    setInvoiceToUpdate(null);
    if (isUpdated === true) {
      fetchBills(true);
    }
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
    setCurrentPage(1);
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

  const totalItems = sortedBills.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  // Auto-adjust currentPage if it exceeds totalPages due to filtering/search
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalItems, itemsPerPage, totalPages, currentPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const displayedBills = React.useMemo(() => {
    return sortedBills.slice(startIndex, endIndex);
  }, [sortedBills, startIndex, endIndex]);

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className={`flex justify-between items-center mb-6 ${selectedInvoice || isUpdating ? 'print-hidden' : ''}`}>
        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Existing Bills & Invoices</h3>
        <button
          onClick={() => fetchBills()}
          className="p-2 bg-white hover:bg-slate-50 dark:bg-[#181622] dark:hover:bg-[#201d2c] text-slate-650 dark:text-gray-300 rounded-lg border border-slate-200 dark:border-[#262235] transition shadow-md"
          title="Refresh Bills"
          disabled={loading}
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.72 2.78L21 8" />
            <polyline points="21 3 21 8 16 8" />
          </svg>
        </button>
      </div>

      {/* Search Box */}
      <div className={`bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-lg rounded-xl p-6 mb-8 transition-colors duration-300 ${selectedInvoice || isUpdating ? 'print-hidden' : ''}`}>
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
      <div className={`bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-xl rounded-xl p-4 transition-colors duration-300 ${selectedInvoice || isUpdating ? 'print-hidden' : ''}`}>
        <div className="hidden md:block overflow-x-auto">
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
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-10">
                    <div className="text-indigo-600 dark:text-violet-400 text-base font-bold animate-pulse">
                      Loading invoices...
                    </div>
                  </td>
                </tr>
              ) : displayedBills.length > 0 ? (
                displayedBills.map((bill) => (
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

        {/* Mobile View Card List */}
        <div className="block md:hidden space-y-4">
          {loading ? (
            <div className="text-center py-10">
              <div className="text-indigo-600 dark:text-violet-400 text-base font-bold animate-pulse">
                Loading invoices...
              </div>
            </div>
          ) : displayedBills.length > 0 ? (
            displayedBills.map((bill) => (
              <div key={bill._id} className="bg-slate-50 dark:bg-[#201d2c]/40 border border-slate-200/50 dark:border-[#262235]/65 rounded-2xl p-4 space-y-3 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div className="min-w-0 flex-1 pr-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{bill.companyName}</h4>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">GSTIN: {bill.gstin || '-'}</p>
                  </div>
                  <span className="bg-indigo-50 dark:bg-[#201d2c] text-indigo-650 dark:text-violet-450 border border-indigo-100/10 px-2.5 py-1 rounded-lg text-[10px] font-black font-mono shrink-0">
                    #{bill.invoiceNo}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-slate-100 dark:border-[#262235]/50 py-2">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Date</span>
                    <span className="text-slate-800 dark:text-gray-200 font-semibold">{formatDate(bill.invoiceDate)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">State</span>
                    <span className="text-slate-800 dark:text-gray-200 font-semibold">{bill.state} ({bill.stateCode})</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 dark:bg-violet-600 dark:hover:bg-violet-700 text-white font-bold py-2 rounded-xl text-xs transition shadow-sm text-center"
                    onClick={() => handleViewDetails(bill._id)}
                  >
                    View
                  </button>
                  <button
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 rounded-xl text-xs transition shadow-sm text-center"
                    onClick={() => handleUpdate(bill)}
                  >
                    Update
                  </button>
                  <button
                    className="bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 text-rose-600 dark:text-rose-450 font-bold p-2 rounded-xl text-xs transition shadow-sm flex items-center justify-center shrink-0 border border-rose-200/10"
                    onClick={() => handleDelete(bill._id)}
                    title="Delete Invoice"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 font-medium text-gray-500 bg-slate-50 dark:bg-[#201d2c]/20 rounded-xl p-4">
              No invoices found.
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {sortedBills.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-100 dark:border-[#262235]/65 print-hidden text-slate-600 dark:text-gray-300 text-xs font-semibold select-none">
            {/* Left: Size Selector & Total count info */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span>Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer font-bold transition"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>invoices per page</span>
              </div>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span>
                Showing {totalItems === 0 ? 0 : startIndex + 1} to {endIndex} of {totalItems} invoices
              </span>
            </div>

            {/* Right: Next / Prev navigation buttons */}
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[#201d2c] disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer text-slate-500 hover:text-indigo-600 dark:hover:text-violet-400"
                title="First Page"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
                </svg>
              </button>
              
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[#201d2c] disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer text-slate-500 hover:text-indigo-600 dark:hover:text-violet-400"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                <span>Prev</span>
              </button>

              <div className="flex items-center gap-1 mx-1.5">
                {Array.from({ length: totalPages }).map((_, index) => {
                  const pageNum = index + 1;
                  // Only display current page, one before, and one after, or first/last if small range
                  if (
                    totalPages <= 5 ||
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    Math.abs(pageNum - currentPage) <= 1
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition ${
                          currentPage === pageNum
                            ? 'bg-indigo-600 dark:bg-violet-600 text-white shadow-sm'
                            : 'hover:bg-slate-50 dark:hover:bg-[#201d2c] text-slate-600 dark:text-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  if (
                    (pageNum === 2 && currentPage > 3) ||
                    (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                  ) {
                    return (
                      <span key={pageNum} className="text-slate-450 px-0.5 select-none">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[#201d2c] disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer text-slate-500 hover:text-indigo-600 dark:hover:text-violet-400"
              >
                <span>Next</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
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

      {/* Details/Update modals */}
      {isUpdating && (
        <UpdateInvoice invoice={invoiceToUpdate} onClose={handleUpdateClose} />
      )}
      {selectedInvoice && (
        <InvoiceDetails invoiceId={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
      )}

      {/* Centered Premium Overlay Modal for Notifications */}
      {(successMessage || errorMessage) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in print-hidden">
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
    </div>
  );
}

export default Bills;
