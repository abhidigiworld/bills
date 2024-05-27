import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './Header';
import Footer from './Footer';
import InvoiceDetails from './InvoiceDetails'; 

function Bills() {
  const [bills, setBills] = useState([]);
  const [alertMessage, setAlertMessage] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null); // State to track the selected invoice

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

  const handleDelete = async (id) => {
    try {
      await axios.delete(`https://billsbackend-git-main-abhidigiworlds-projects.vercel.app/api/invoices/${id}`);
      // Update the local state by filtering out the deleted invoice
      setBills(bills.filter((bill) => bill._id !== id));
      setAlertMessage('Invoice deleted successfully');
    } catch (error) {
      console.error('Error deleting bill:', error);
      setAlertMessage('An error occurred while deleting the invoice');
    }
  };

  // Function to handle view details button click
  const handleViewDetails = (id) => {
    setSelectedInvoice(id);
  };

  return (
    <>
      <Header />
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold mb-4">All Bills</h1>
        {alertMessage && (
          <div className="bg-green-200 text-green-800 border border-green-600 py-2 px-4 mb-4">
            {alertMessage}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-200">
                <th className="px-4 py-2">Company Name</th>
                <th className="px-4 py-2">GSTIN</th>
                <th className="px-4 py-2">State</th>
                <th className="px-4 py-2">State Code</th>
                <th className="px-4 py-2">Invoice No</th>
                <th className="px-4 py-2">Invoice Date</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => (
                <tr key={bill._id} className="border-b">
                  <td className="px-4 py-2">{bill.companyName}</td>
                  <td className="px-4 py-2">{bill.gstin}</td>
                  <td className="px-4 py-2">{bill.state}</td>
                  <td className="px-4 py-2">{bill.stateCode}</td>
                  <td className="px-4 py-2">{bill.invoiceNo}</td>
                  <td className="px-4 py-2">{bill.invoiceDate}</td>
                  <td className="px-4 py-2">
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 mr-2"
                      onClick={() => handleDelete(bill._id)}
                    >
                      Delete
                    </button>
                    <button
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                      onClick={() => handleViewDetails(bill._id)} // Pass the invoice id
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Footer />
      {selectedInvoice && <InvoiceDetails invoiceId={selectedInvoice} />} {/* Render InvoiceDetails component if selectedInvoice is not null */}
    </>
  );
}

export default Bills;
