import React, { useState, useEffect } from 'react';
import axios from 'axios';
import InvoiceComponent from './InvoiceComponent';
import './printStyles.css';
import { API_BASE_URL } from '../../config';

function InvoiceForm() {
  const [msInput, setMsInput] = useState('');
  const [gstin, setGstin] = useState('');
  const [state, setState] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [invoiceDetails, setInvoiceDetails] = useState(null); // State to hold invoice details
  const [submitted, setSubmitted] = useState(false); // State to track if form has been submitted
  const [errors, setErrors] = useState({}); // State to track validation errors

  const handleDateChange = (e) => {
    setInvoiceDate(e.target.value);
  };

  // Function to fetch last invoice number from backend
  const fetchLastInvoiceNumber = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/invoices`);
      const data = response.data;
      if (data && data.length > 0) {
        let maxInvoiceNumber = 0;
        data.forEach((invoice) => {
          const num = parseInt(invoice.invoiceNo, 10);
          if (!isNaN(num) && num > maxInvoiceNumber) {
            maxInvoiceNumber = num;
          }
        });

        const nextInvoiceNumber = String(maxInvoiceNumber + 1).padStart(3, '0');
        setInvoiceNo(nextInvoiceNumber);
      } else {
        setInvoiceNo('001');
      }
    } catch (error) {
      console.error('Error fetching last invoice number:', error);
      setInvoiceNo('001');
    }
  };

  useEffect(() => {
    fetchLastInvoiceNumber();
  }, []);

  const handleSubmit = () => {
    const newErrors = {};
    if (!msInput.trim()) {
      newErrors.msInput = 'M/s is required';
    }
    if (!gstin.trim()) {
      newErrors.gstin = 'GSTIN is required';
    }
    if (!state.trim()) {
      newErrors.state = 'State is required';
    }
    if (!stateCode.trim()) {
      newErrors.stateCode = 'State Code is required';
    }
    if (!invoiceNo.trim()) {
      newErrors.invoiceNo = 'Invoice No is required';
    }
    if (!invoiceDate.trim()) {
      newErrors.invoiceDate = 'Invoice Date is required';
    }
    if (Object.keys(newErrors).length === 0) {
      const newInvoiceDetails = {
        msInput: msInput,
        gstin: gstin,
        state: state,
        stateCode: stateCode,
        invoiceNo: invoiceNo,
        invoiceDate: invoiceDate
      };
      setInvoiceDetails(newInvoiceDetails); // Set invoice details state
      setSubmitted(true); // Set submitted state to true
      setErrors('');
    } else {
      setErrors(newErrors); // Set validation errors
    }
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-xl rounded-xl overflow-hidden p-6 sm:p-8 print-hidden transition-colors duration-300">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">M/s (Company Name)</label>
            <input
              type="text"
              placeholder="Enter recipient name"
              value={msInput}
              onChange={(e) => setMsInput(e.target.value)}
              className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border rounded-lg text-sm text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition ${errors.msInput ? 'border-red-500' : 'border-slate-200 dark:border-[#37314e]'}`}
            />
            {errors.msInput && <p className="text-red-500 text-xs mt-1 font-medium">{errors.msInput}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">GSTIN</label>
            <input
              type="text"
              placeholder="Enter GSTIN number"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border rounded-lg text-sm text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition ${errors.gstin ? 'border-red-500' : 'border-slate-200 dark:border-[#37314e]'}`}
            />
            {errors.gstin && <p className="text-red-500 text-xs mt-1 font-medium">{errors.gstin}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">State</label>
            <input
              type="text"
              placeholder="Enter state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border rounded-lg text-sm text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition ${errors.state ? 'border-red-500' : 'border-slate-200 dark:border-[#37314e]'}`}
            />
            {errors.state && <p className="text-red-500 text-xs mt-1 font-medium">{errors.state}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">State Code</label>
            <input
              type="text"
              placeholder="Enter state code"
              value={stateCode}
              onChange={(e) => setStateCode(e.target.value)}
              className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border rounded-lg text-sm text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition ${errors.stateCode ? 'border-red-500' : 'border-slate-200 dark:border-[#37314e]'}`}
            />
            {errors.stateCode && <p className="text-red-500 text-xs mt-1 font-medium">{errors.stateCode}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Invoice Number</label>
            <input
              type="number"
              placeholder="Enter invoice number"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border rounded-lg text-sm text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition ${errors.invoiceNo ? 'border-red-500' : 'border-slate-200 dark:border-[#37314e]'}`}
            />
            {errors.invoiceNo && <p className="text-red-500 text-xs mt-1 font-medium">{errors.invoiceNo}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Invoice Date</label>
            <input
              type="date"
              value={invoiceDate}
              onChange={handleDateChange}
              className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-[#201d2c] border rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition ${errors.invoiceDate ? 'border-red-500' : 'border-slate-200 dark:border-[#37314e]'}`}
            />
            {errors.invoiceDate && <p className="text-red-500 text-xs mt-1 font-medium">{errors.invoiceDate}</p>}
          </div>

          <div className="sm:col-span-2 flex justify-end pt-2">
            <button
              onClick={handleSubmit}
              className="bg-indigo-600 hover:bg-indigo-700 dark:bg-violet-600 dark:hover:bg-violet-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-md transition duration-200 transform hover:scale-[1.01] active:scale-[0.99] text-sm"
            >
              Create Invoice
            </button>
          </div>
        </div>
      </div>

      {invoiceDetails && (
        <div className="mt-8">
          <InvoiceComponent invoiceDetails={invoiceDetails} />
        </div>
      )}
    </div>
  );
}

export default InvoiceForm;
