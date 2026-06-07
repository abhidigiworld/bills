import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './printStyles.css';
import axios from 'axios';
import Header from './Header';
import Footer from './Footer';
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

  return (
    <div className="flex flex-col min-h-screen bg-indigo-50 dark:bg-[#110f18] text-slate-800 dark:text-gray-200 transition-colors duration-300">
      <Header />
      <main className="flex-grow p-4 sm:p-6 md:p-8 print-hidden">
        <div className="max-w-6xl mx-auto">
          <Link 
            to="/Main" 
            className="inline-flex items-center gap-2 mb-6 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#3e3857] hover:bg-slate-100 dark:hover:bg-[#201d2c] text-xs font-bold text-slate-600 dark:text-gray-300 transition duration-200 shadow-sm print:hidden"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold mb-6 text-center text-indigo-900 dark:text-white tracking-tight">
            Existing Invoices
          </h1>

          {alertMessage && (
            <div className="max-w-md mx-auto mb-6 bg-green-100 dark:bg-green-950/40 border border-green-400 dark:border-green-900/50 text-green-700 dark:text-green-400 px-4 py-3 rounded-2xl text-center text-sm font-medium">
              {alertMessage}
            </div>
          )}

          {/* Search Box */}
          <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-lg rounded-[2rem] p-6 mb-8 transition-colors duration-300">
            <label htmlFor="search" className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Search by Invoice No or Company Name
            </label>
            <input
              id="search"
              type="text"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-xl text-sm text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
              placeholder="Enter Invoice No or Company Name..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>

          {/* Invoices List Table */}
          <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-xl rounded-[2rem] p-4 transition-colors duration-300">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-[#262235] text-slate-500 dark:text-gray-400 font-bold uppercase text-xs">
                    <th className="px-4 py-3">Company Name</th>
                    <th className="px-4 py-3">GSTIN</th>
                    <th className="px-4 py-3">State</th>
                    <th className="px-4 py-3 text-center">State Code</th>
                    <th className="px-4 py-3 text-center">Invoice No</th>
                    <th className="px-4 py-3 text-center">Invoice Date</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.length > 0 ? (
                    filteredBills.map((bill) => (
                      <tr key={bill._id} className="border-b border-slate-100 dark:border-[#262235] hover:bg-slate-50 dark:hover:bg-[#201d2c]/50 transition duration-150">
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{bill.companyName}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-gray-300">{bill.gstin || '-'}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-gray-300">{bill.state}</td>
                        <td className="px-4 py-3 text-center text-slate-600 dark:text-gray-300">{bill.stateCode}</td>
                        <td className="px-4 py-3 text-center font-mono text-slate-900 dark:text-white font-bold">{bill.invoiceNo}</td>
                        <td className="px-4 py-3 text-center text-slate-600 dark:text-gray-300">{formatDate(bill.invoiceDate)}</td>
                        <td className="px-4 py-3 flex items-center justify-center gap-2">
                          <button
                            className="bg-indigo-600 hover:bg-indigo-700 dark:bg-violet-600 dark:hover:bg-violet-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition duration-200 shadow-sm"
                            onClick={() => handleViewDetails(bill._id)}
                          >
                            View
                          </button>
                          <button
                            className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition duration-200 shadow-sm"
                            onClick={() => handleUpdate(bill)}
                          >
                            Update
                          </button>
                          <button
                            className="bg-red-500 hover:bg-red-600 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition duration-200 shadow-sm"
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
        </div>
      </main>

      {/* Details/Update overlays */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
        {isUpdating ? (
          <UpdateInvoice invoice={invoiceToUpdate} onClose={handleUpdateClose} />
        ) : selectedInvoice ? (
          <InvoiceDetails invoiceId={selectedInvoice} />
        ) : null}
      </div>
      <Footer />
    </div>
  );
}

export default Bills;
