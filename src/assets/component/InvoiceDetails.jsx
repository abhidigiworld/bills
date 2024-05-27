import React, { useState, useEffect } from 'react';
import './printStyles.css';
import axios from 'axios';
import logo from '../images/LOGO.png';

function InvoiceDetails({ invoiceId }) {
    const [invoiceDetails, setInvoiceDetails] = useState({});
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [freightCharges, setFreightCharges] = useState(0);
    const [cgst, setCGST] = useState(0);
    const [sgst, setSGST] = useState(0);
    const [igst, setIGST] = useState(0);
    const [grandTotal, setGrandTotal] = useState(0);
    const [grandTotalInWords, setGrandTotalInWords] = useState('');

    useEffect(() => {
        const fetchInvoiceDetails = async () => {
            try {
                const response = await axios.get(`https://billsbackend-git-main-abhidigiworlds-projects.vercel.app/api/invoices/${invoiceId}`);
                const data = response.data;
                setInvoiceDetails(data);
                setItems(data.items);
                // Calculate total, taxes, and grand total
                const subTotal = data.items.reduce((acc, item) => acc + item.totalValue, 0);
                const gst = 0.09; // 9% GST
                const cgst = gst * subTotal;
                const sgst = gst * subTotal;
                const igst = 0; // Assuming IGST is not applicable
                const total = subTotal + data.freightCharges + cgst + sgst + igst;
                setTotal(total);
                setFreightCharges(data.freightCharges);
                setCGST(cgst);
                setSGST(sgst);
                setIGST(igst);
                setGrandTotal(total);
                // Convert grand total to words
                // Function to convert total to words can be implemented here
                setGrandTotalInWords('Grand Total in words');
            } catch (error) {
                console.error('Error fetching invoice details:', error);
            }
        };

        fetchInvoiceDetails();
    }, [invoiceId]);

    // Render nothing if invoiceDetails is empty
    if (Object.keys(invoiceDetails).length === 0) {
        return null;
    }

    return (
        <div className='printdata border'>
            <p className="text-lg font-bold bg-gray-300">Tax Invoice</p>
            <div className="flex justify-between px-4 py-2 bg-gray-300">
                <div className="flex items-center">
                    <img src={logo} alt="Your Company Logo" className="w-16 h-16 mr-2" />
                    <p className="text-lg font-bold">Sakshi Enterprises</p>
                </div>
                <div className="text-right">
                    <p className="text-sm">GSTIN: 070URPS6573P1ZY</p>
                    <p className="text-sm">M.: 9650650297</p>
                </div>
            </div>
            <div className="bg-gray-100 p-4">
                <div className="grid grid-cols-1 gap-4 mt-2 sm:grid-cols-2">
                    <div className='text-left'>
                        <p className="text-sm">M/s: <span className="font-semibold">{invoiceDetails.msInput}</span></p>
                        <p className="text-sm">GSTIN: <span className="font-semibold">{invoiceDetails.gstin}</span></p>
                        <p className="text-sm">State: <span className="font-semibold">{invoiceDetails.state}</span></p>
                    </div>
                    <div className='text-left'>
                        <p className="text-sm">State Code: <span className="font-semibold">{invoiceDetails.stateCode}</span></p>
                        <p className="text-sm">Invoice No: <span className="font-semibold">{invoiceDetails.invoiceNo}</span></p>
                        <p className="text-sm">Invoice Date: <span className="font-semibold">{invoiceDetails.invoiceDate}</span></p>
                    </div>
                </div>
            </div>
            <div className="bg-gray-100">
                <table className="w-full table-auto sm:min-w-full">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="px-4 py-2">S.No</th>
                            <th className="px-4 py-2">Description</th>
                            <th className="px-4 py-2">HSN/SAC Code</th>
                            <th className="px-4 py-2">Quantity</th>
                            <th className="px-4 py-2">Rate</th>
                            <th className="px-4 py-2">Total Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={index} className="text-center">
                                <td className="border px-4 py-2">{index + 1}</td>
                                <td className="border px-4 py-2">{item.description}</td>
                                <td className="border px-4 py-2">{item.hsnAsc}</td>
                                <td className="border px-4 py-2">{item.quantity}</td>
                                <td className="border px-4 py-2">{item.rate}</td>
                                <td className="border px-4 py-2">{item.totalValue}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="bg-gray-100 p-4">
                <div className="grid grid-cols-1 gap-4 mt -2 sm:grid-cols-2">
                    <div>
                        <p className="text-sm">Grand Total (In Words): <span className="font-semibold">{grandTotalInWords}</span></p>
                    </div>
                    <div className='text-left'>
                        {/* Add conditional rendering to check if the values are defined before accessing toFixed */}
                        <p className="text-sm">Total: <span className="font-semibold">{total !== undefined ? total.toFixed(2) : '-'}</span></p>
                        <p className="text-sm">Freight Charges: <span className="font-semibold">{freightCharges !== undefined ? freightCharges.toFixed(2) : '-'}</span></p>
                        <p className="text-sm">CGST: <span className="font-semibold">{cgst !== undefined ? cgst.toFixed(2) : '-'}</span></p>
                        <p className="text-sm">SGST: <span className="font-semibold">{sgst !== undefined ? sgst.toFixed(2) : '-'}</span></p>
                        <p className="text-sm">IGST: <span className="font-semibold">{igst !== undefined ? igst.toFixed(2) : '-'}</span></p>
                        <p className="text-sm">Grand Total: <span className="font-semibold">{grandTotal !== undefined ? grandTotal.toFixed(2) : '-'}</span></p>
                    </div>
                </div>
            </div>

            <div className="bg-gray-200 p-4 px-8 flex justify-between">
                <div>
                    <p className="text-sm text-gray-500">Terms & Conditions: </p>
                    <ul className="list-disc pl-4 text-gray-600 text-left">
                        <li>All disputes are subject to jurisdiction of Delhi Courts</li>
                        <li>Payment should be made by cash/cheque/draft only.</li>
                        <li>Late payment will be charged if bill unpaid for 15 days.</li>
                    </ul>
                </div>
                <div className="text-right relative">
                    <p className="text-sm">For Sakshi Enterprises</p>
                    <p className="text-sm absolute bottom-0 right-0">Authority Signature</p>
                </div>
            </div>
        </div>
    );
}

export default InvoiceDetails;
