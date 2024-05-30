import React, { useState, useEffect } from 'react';
import InvoiceComponent from './InvoiceComponent';
import './printStyles.css';
import Header from './Header';
import Footer from './Footer';

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
    const response = await fetch('https://billsbackend-git-main-abhidigiworlds-projects.vercel.app/api/invoices');
    const data = await response.json();
    if (data && data.length > 0) {
      const lastInvoice = data[data.length - 1];
      const lastInvoiceNumber = parseInt(lastInvoice.invoiceNo, 10);
      if (!isNaN(lastInvoiceNumber)) {
        const nextInvoiceNumber = String(lastInvoiceNumber + 1).padStart(3, '0');
        setInvoiceNo(nextInvoiceNumber);
      } else {
        console.error('Invalid invoice number format:', lastInvoice.invoiceNo);
      }
    } else {
      console.error('No invoices data found');
    }
  } catch (error) {
    console.error('Error fetching last invoice number:', error);
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
    <>
      <Header />
      <div className="container mx-auto mt-8 px-4">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-6 print-hidden">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Create New Invoice</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <input type="text" placeholder="M/s" value={msInput} onChange={(e) => setMsInput(e.target.value)} className={`border-2 border-gray-200 w-full px-4 py-2 rounded focus:outline-none ${errors.msInput ? 'border-red-500' : ''}`} />
                {errors.msInput && <p className="text-red-500 text-sm mt-1">{errors.msInput}</p>}
              </div>
              <div>
                <input type="text" placeholder="GSTIN" value={gstin} onChange={(e) => setGstin(e.target.value)} className={`border-2 border-gray-200 w-full px-4 py-2 rounded focus:outline-none ${errors.gstin ? 'border-red-500' : ''}`} />
                {errors.gstin && <p className="text-red-500 text-sm mt-1">{errors.gstin}</p>}
              </div>
              <div>
                <input type="text" placeholder="State" value={state} onChange={(e) => setState(e.target.value)} className={`border-2 border-gray-200 w-full px-4 py-2 rounded focus:outline-none ${errors.state ? 'border-red-500' : ''}`} />
                {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
              </div>
              <div>
                <input type="text" placeholder="State Code" value={stateCode} onChange={(e) => setStateCode(e.target.value)} className={`border-2 border-gray-200 w-full px-4 py-2 rounded focus:outline-none ${errors.stateCode ? 'border-red-500' : ''}`} />
                {errors.stateCode && <p className="text-red-500 text-sm mt-1">{errors.stateCode}</p>}
              </div>
              <div>
                <input type="number" placeholder="Invoice No" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} className={`border-2 border-gray-200 w-full px-4 py-2 rounded focus:outline-none ${errors.invoiceNo ? 'border-red-500' : ''}`} />
                {errors.invoiceNo && <p className="text-red-500 text-sm mt-1">{errors.invoiceNo}</p>}
              </div>
              <div>
                <input type="date" value={invoiceDate} onChange={handleDateChange} className={`border-2 border-gray-200 w-full px-4 py-2 rounded focus:outline-none ${errors.invoiceDate ? 'border-red-500' : ''}`} />
                {errors.invoiceDate && <p className="text-red-500 text-sm mt-1">{errors.invoiceDate}</p>}
              </div>
              <div className="col-span-2 flex justify-end">
                <button onClick={handleSubmit} className="bg-blue-500 text-white px-6 py-2 rounded focus:outline-none hover:bg-blue-600 transition-colors duration-300">Submit</button>
              </div>
            </div>
          </div>
        </div>
        <br />
        {invoiceDetails && <InvoiceComponent invoiceDetails={invoiceDetails} />} {/* Render InvoiceComponent if invoice details are available */}
      </div>
      <Footer />
    </>
  );
}

export default InvoiceForm;
