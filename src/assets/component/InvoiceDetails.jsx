import React, { useState, useEffect } from 'react';
import './printStyles.css';
import axios from 'axios';
import logo from '../images/LOGO.png';
import signature from '../images/sign.png';
import stamp from '../images/stamp.png';

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
    const [subtotal, setSubtotal] = useState('');
    const [firstPart, setFirstPart] = useState('');
    const [secondPart, setSecondPart] = useState('');


    useEffect(() => {
        if (invoiceDetails.companyName) {
            // Split the address by the first comma encountered
            const firstCommaIndex = invoiceDetails.companyName.indexOf(',');
            if (firstCommaIndex !== -1) {
                const first = invoiceDetails.companyName.substring(0, firstCommaIndex).trim();
                const second = invoiceDetails.companyName.substring(firstCommaIndex + 1).trim();
                setFirstPart(first);
                setSecondPart(second);
            } else {
                // If no comma found, set the whole address in the first part
                setFirstPart(invoiceDetails.companyName);
            }
        } else {
            // Handle case when companyName is undefined
            setFirstPart('');
            setSecondPart('');
        }
    }, [invoiceDetails.companyName]);

    useEffect(() => {
        const fetchInvoiceDetails = async () => {
            try {
                const response = await axios.get(`https://billsbackend-git-main-abhidigiworlds-projects.vercel.app/api/invoices/${invoiceId}`);
                const data = response.data;
                setInvoiceDetails(data);
                setItems(data.items);
                // Calculate total, taxes, and grand total
                const subTotal = data.items.reduce((acc, item) => acc + item.totalValue, 0);
                setSubtotal(subTotal);
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

    const handlePrint = () => {
        window.print();
        console.log('Printing invoice...');
    };

    const formatDate = (dateString) => {
        return dateString.slice(0, 10); // Slicing the first 10 characters to get 'YYYY-MM-DD'
    };


    return (
        <>
            <div className='printdata border-2 my-4 font-mono mx-4'>
                <p className="text-lg font-bold bg-gray-300 text-center">Tax Invoice</p>
                <div className="flex justify-between items-center px-4 py-2 bg-gray-300">
                    <div className="flex items-center">
                        <img src={logo} alt="Your Company Logo" className="w-20 h-20 mr-2" />
                    </div>
                    <div className="flex-1 text-center">
                        <p className="text-lg font-bold font-custom text-center">Sakshi Enterprises</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-bold">GSTIN: 070URPS6573P1ZY</p>
                        <p className="text-sm">M.: 9650650297</p>
                        <p className="text-sm">8447736035</p>
                    </div>
                </div>

                <div className="flex flex-col content-center bg-gray-300">
                    <p className="text-center">D-435, Gali No.-59,Mahavir Enclave,Part-3,West Delhi-110059</p>
                    <p className="text-center">E-mail id:bindusharma.manoj99@gmail.com</p>
                </div>
                <div className="bg-gray-100 p-4">
                    <div className="grid grid-cols-1 gap-4 mt-2 sm:grid-cols-2">
                        <div className='text-left'>
                            <p className="text-sm">M/s: <span className="font-semibold">{firstPart} <br /> {secondPart}  </span></p>
                            <p className="text-sm">GSTIN: <span className="font-semibold">{invoiceDetails.gstin}</span></p>
                            <p className="text-sm">State: <span className="font-semibold">{invoiceDetails.state}</span></p>
                        </div>
                        <div className='text-left'>
                            <p className="text-sm">State Code: <span className="font-semibold">{invoiceDetails.stateCode}</span></p>
                            <p className="text-sm">Invoice No: <span className="font-semibold">{invoiceDetails.invoiceNo}</span></p>
                            <p className="text-sm">Invoice Date: <span className="font-semibold">{formatDate(invoiceDetails.invoiceDate)}</span></p>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-100 overflow-x-auto">
                    <table className="w-full table-auto sm:min-w-full">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="px-2 py-2">S.No</th>
                                <th className="px-2 py-2">Description</th>
                                <th className="px-2 py-2">HSN/SAC Code</th>
                                <th className="px-2 py-2">Quantity</th>
                                <th className="px-2 py-2">Rate</th>
                                <th className="px-2 py-2">Total Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={index} className="text-center">
                                    <td className="border px-2 py-2">{index + 1}</td>
                                    <td className="border px-2 py-2">{item.description}</td>
                                    <td className="border px-2 py-2">{item.hsnAsc}</td>
                                    <td className="border px-2 py-2">{item.quantity}</td>
                                    <td className="border px-2 py-2">{item.rate}</td>
                                    <td className="border px-2 py-2">{item.totalValue}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="bg-gray-100 p-4">
                    <div className="grid grid-cols-1 gap-4 mt-2 sm:grid-cols-2">
                        <div>
                            <p className="text-sm">Grand Total (In Words): <span className="font-semibold">{invoiceDetails.grandTotalInWords}</span></p>
                        </div>
                        <div className='text-left'>
                            <p className="text-sm">Total: <span className="font-semibold">{subtotal !== undefined ? subtotal.toFixed(2) : '-'}</span></p>
                            <p className="text-sm">Freight Charges: <span className="font-semibold">{invoiceDetails.freightCharges}</span></p>
                            <p className="text-sm">CGST: <span className="font-semibold">{invoiceDetails.cgst}</span></p>
                            <p className="text-sm">SGST: <span className="font-semibold">{invoiceDetails.sgst}</span></p>
                            <p className="text-sm">IGST: <span className="font-semibold">{invoiceDetails.igst}</span></p>
                            <p className="text-sm">Grand Total: <span className="font-semibold">{invoiceDetails.grandTotal}</span></p>
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
                        <p className="text-sm absolute bottom-0 right-0">Authorised Signatory</p>
                        <img src={signature} alt="Signature" className="absolute top-0 left-0 right-0 mx-auto mt-4 w-44 h-auto" />
                        {/* <img src={stamp} alt="stamp" className="absolute top-0 left-0 right-0 mx-auto mt-4 w-80 h-auto" /> */}
                    </div>
                </div>
            </div>
            <div className='mb-12 pb-10 text-center'>
                <button onClick={handlePrint} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 print-hidden">Print</button>
            </div>
        </>
    );
}

export default InvoiceDetails;
