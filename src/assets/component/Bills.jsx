import React, { useState, useEffect } from 'react';
import './printStyles.css';
import axios from 'axios';
import Header from './Header';
import Footer from './Footer';
import InvoiceDetails from './InvoiceDetails';

function Bills() {
  const [bills, setBills] = useState([]);
  const [alertMessage, setAlertMessage] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null); // State to track the selected invoice
  const [searchTerm, setSearchTerm] = useState(''); // State to track the search term

  useEffect(() => {
    // Function to fetch all bills from the server
    const fetchBills = async () => {
      try {
        const response = await axios.get('https://billsbackend-git-main-abhidigiworlds-projects.vercel.app/api/invoices');
        setBills(response.data);
      } catch (error) {
        console.error('Error fetching bills:', error);
      }
    };

    // Call the fetchBills function when the component mounts
    fetchBills();
  }, []); // Empty dependency array to ensure the effect runs only once

  const formatDate = (dateString) => {
    return dateString.slice(0, 10); // Slicing the first 10 characters to get 'YYYY-MM-DD'
  };

  const handleDelete = async (id) => {
    // Show a confirmation dialog
    const userConfirmed = window.confirm("Are you sure you want to delete this invoice?");

    if (userConfirmed) {
      try {
        await axios.delete(`https://billsbackend-git-main-abhidigiworlds-projects.vercel.app/api/invoices/${id}`);
        // Update the local state by filtering out the deleted invoice
        setBills(bills.filter((bill) => bill._id !== id));
        setAlertMessage('Invoice deleted successfully');
      } catch (error) {
        console.error('Error deleting bill:', error);
        setAlertMessage('An error occurred while deleting the invoice');
      }
    }
  };

  // Function to handle view details button click
  const handleViewDetails = (id) => {
    setSelectedInvoice(id);
  };

  // Function to handle search input change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Filtered bills based on search term
  const filteredBills = bills.filter((bill) =>
    bill.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.companyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Header />
      <div className="container mx-auto print-hidden mb-12 pb-12">
        <h1 className="text-2xl font-bold mb-4">All Bills</h1>
        {alertMessage && (
          <div className="bg-green-200 text-green-800 border border-green-600 py-2 px-4 mb-4">
            {alertMessage}
          </div>
        )}
        <div className="mb-4">
          <label htmlFor="search" className="block text-gray-700 text-sm font-bold mb-2">
            Search by Invoice No or Company Name:
          </label>
          <input
            id="search"
            type="text"
            className="w-full px-3 py-2 border rounded"
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
                    <td className="px-4 py-2 flex justify-center md:justify-end">
                      <button
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 mr-2"
                        onClick={() => handleDelete(bill._id)}
                      >
                        Delete
                      </button>
                      <button
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                        onClick={() => handleViewDetails(bill._id)}
                      >
                        View Details
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
      <Footer />
      {selectedInvoice && <InvoiceDetails invoiceId={selectedInvoice} />}
    </>
  );
}

export default Bills;
