import React, { useState, useEffect } from 'react';
import './printStyles.css';
import axios from 'axios';
import Header from './Header';
import Footer from './Footer';
import InvoiceDetails from './InvoiceDetails';
import UpdateInvoice from './UpdateInvoice';

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
        const response = await axios.get('https://billsbackend-git-main-abhidigiworlds-projects.vercel.app/api/invoices');
        setBills(response.data);
      } catch (error) {
        console.error('Error fetching bills:', error);
      }
    };

    fetchBills();
  }, [invoiceToUpdate]);

  const formatDate = (dateString) => {
    return dateString.slice(0, 10);
  };

  const handleDelete = async (id) => {
    const userConfirmed = window.confirm("Are you sure you want to delete this invoice?");
    if (userConfirmed) {
      try {
        await axios.delete(`https://billsbackend-git-main-abhidigiworlds-projects.vercel.app/api/invoices/${id}`);
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
    bill.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.companyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Header />
      <div className="container mx-auto print-hidden mb-12 pb-12">
        <h1 className="text-2xl font-bold m-4 text-center">All Bills</h1>
        {alertMessage && (
          <div className="bg-green-200 text-green-800 border border-green-600 py-2 px-4 mb-4">
            {alertMessage}
          </div>
        )}
        <div className="mb-4 p-4 bg-white shadow-lg rounded-lg">
          <label htmlFor="search" className="block text-gray-700 text-sm font-bold mb-2">
            Search by Invoice No or Company Name:
          </label>
          <input
            id="search"
            type="text"
            className="w-full px-3 py-2 border rounded shadow-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out"
            placeholder="Enter Invoice No or Company Name"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto border border-collapse">
            <thead>
              <tr className="bg-gray-200 text-left">
                <th className="px-4 py-2 md:w-1/6">Company Name</th>
                <th className="px-4 py-2 md:w-1/6">GSTIN</th>
                <th className="px-4 py-2 md:w-1/6">State</th>
                <th className="px-4 py-2 md:w-1/6">State Code</th>
                <th className="px-4 py-2 md:w-1/6">Invoice No</th>
                <th className="px-4 py-2 md:w-1/6">Invoice Date</th>
                <th className="px-4 py-2 md:w-1/6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.length > 0 ? (
                filteredBills.map((bill) => (
                  <tr key={bill._id} className="border-b">
                    <td className="px-4 py-2">{bill.companyName}</td>
                    <td className="px-4 py-2">{bill.gstin}</td>
                    <td className="px-4 py-2">{bill.state}</td>
                    <td className="px-4 py-2">{bill.stateCode}</td>
                    <td className="px-4 py-2">{bill.invoiceNo}</td>
                    <td className="px-4 py-2">{formatDate(bill.invoiceDate)}</td>
                    <td className="flex justify-center p-4 py-12">
                      <button
                        className="bg-red-500 text-white px-4 py-2 rounded-2xl hover:bg-red-600 mr-2 transition duration-300 transform hover:-translate-y-1 shadow-2xl shadow-red-500/50 hover:shadow-md"
                        onClick={() => handleDelete(bill._id)}
                      >
                        Delete
                      </button>
                      <button
                        className="bg-blue-500 text-white px-4 py-2 rounded-2xl hover:bg-blue-600 mr-2 transition duration-300 transform hover:-translate-y-1 shadow-2xl shadow-blue-500/50 hover:shadow-md"
                        onClick={() => handleViewDetails(bill._id)}
                      >
                        View
                      </button>
                      <button
                        className="bg-yellow-500 text-white px-4 py-2 rounded-2xl hover:bg-yellow-600 transition duration-300 transform hover:-translate-y-1 shadow-2xl shadow-yellow-500/50 hover:shadow-md"
                        onClick={() => handleUpdate(bill)}
                      >
                        Update
                      </button>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    No bills found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        {isUpdating ? (
          <UpdateInvoice invoice={invoiceToUpdate} onClose={handleUpdateClose} />
        ) : selectedInvoice ? (
          <InvoiceDetails invoiceId={selectedInvoice} />
        ) : (
          <>
            {alertMessage && (
              <div className="bg-green-200 text-green-800 border border-green-600  mb-4">
                {alertMessage}
              </div>
            )}

          </>
        )}
      </div>
      <Footer />
    </>
  );
}

export default Bills;
