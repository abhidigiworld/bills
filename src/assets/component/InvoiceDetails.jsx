import React, { useState, useEffect } from 'react';
import './printStyles.css';
import axios from 'axios';
import logo from '../images/LOGO.png';
import signature from '../images/sign.png';
import stamp from '../images/stamp.png';
import { API_BASE_URL } from '../../config';

function InvoiceDetails({ invoiceId, onClose }) {
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
    const [gstper, setgstper] = useState('');
    const [igstper, setigstper] = useState('');
    const [cgstper, setcgstper] = useState('');
    const [sgstper, setsgstper] = useState('');
    const [showSignature, setShowSignature] = useState(true);
    const [showStamp, setShowStamp] = useState(true);

    const [userHeight, setUserHeight] = useState(30);
    const [isVisible, setIsVisible] = useState(false);
    const [numRows, setNumRows] = useState(1);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && onClose) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget && onClose) {
            onClose();
        }
    };

    const handleInputChange = (event) => {
        setNumRows(Number(event.target.value)); // Update number of rows
    };

    const handleHeightChange = (e) => {
        const height = e.target.value ? parseInt(e.target.value, 10) : 0;
        setUserHeight(height);
    };

    const toggleVisibility = () => {
        setIsVisible(!isVisible);
    };

    useEffect(() => {
        if (invoiceDetails.companyName) {
            const firstCommaIndex = invoiceDetails.companyName.indexOf(',');
            if (firstCommaIndex !== -1) {
                const first = invoiceDetails.companyName.substring(0, firstCommaIndex).trim();
                const second = invoiceDetails.companyName.substring(firstCommaIndex + 1).trim();
                setFirstPart(first);
                setSecondPart(second);
            } else {
                setFirstPart(invoiceDetails.companyName);
            }
        } else {
            setFirstPart('');
            setSecondPart('');
        }
    }, [invoiceDetails.companyName]);

    useEffect(() => {
        const fetchInvoiceDetails = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/api/invoices/${invoiceId}`);
                const data = response.data;
                setInvoiceDetails(data);
                setItems(data.items);
                const subTotal = data.items.reduce((acc, item) => acc + item.totalValue, 0);
                setSubtotal(subTotal);
                const gst = 0.09;
                const cgst = gst * subTotal;
                const sgst = gst * subTotal;
                const igst = 0;
                const total = subTotal + data.freightCharges + cgst + sgst + igst;
                setTotal(total);
                setFreightCharges(data.freightCharges);
                setCGST(cgst);
                setSGST(sgst);
                setIGST(igst);
                setGrandTotal(total);
                setGrandTotalInWords('Grand Total in words');
            } catch (error) {
                console.error('Error fetching invoice details:', error);
            }
        };

        fetchInvoiceDetails();
    }, [invoiceId]);

    useEffect(() => {
        const roundToTwoDecimals = (num) => Math.round(num * 100) / 100;

        const parsedCgst = parseFloat(invoiceDetails?.cgst) || 0;
        const parsedSgst = parseFloat(invoiceDetails?.sgst) || 0;
        const parsedIgst = parseFloat(invoiceDetails?.igst) || 0;
        const parsedTotal = parseFloat(total) || 0;
        const parsedSubtotal = parseFloat(subtotal) || 0;

        const gstPer = roundToTwoDecimals(((parsedCgst + parsedSgst + parsedIgst) / parsedTotal) * 100);
        const cgstPer = roundToTwoDecimals((parsedCgst / parsedSubtotal) * 100);
        const sgstPer = roundToTwoDecimals((parsedSgst / parsedSubtotal) * 100);
        const igstPer = roundToTwoDecimals((parsedIgst / parsedSubtotal) * 100);

        setgstper(isNaN(gstPer) ? 0 : gstPer);
        setcgstper(isNaN(cgstPer) ? 0 : cgstPer);
        setigstper(isNaN(igstPer) ? 0 : igstPer);
        setsgstper(isNaN(sgstPer) ? 0 : sgstPer);
    }, [invoiceDetails.cgst, invoiceDetails.sgst, invoiceDetails.igst, total, subtotal]);

    const handlePrint = (showSignature, showStamp) => {
        setShowSignature(showSignature);
        setShowStamp(showStamp);

        setTimeout(() => {
            window.print();
        }, 100);
    };

    if (Object.keys(invoiceDetails).length === 0) {
        return null;
    }

    const formatDate = (dateString) => {
        const [year, month, day] = dateString.slice(0, 10).split('-');
        return `${day}-${month}-${year}`;
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto print:static print:bg-transparent print:backdrop-blur-none print:block print:p-0"
            onClick={handleBackdropClick}
        >
            <div className="relative bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-2xl rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6 md:p-8 transition-colors duration-300 print:static print:max-h-none print:overflow-visible print:p-0 print:border-none print:shadow-none print:bg-transparent">
                
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 print-hidden"
                    title="Close"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className='printdata font-mono m-auto'>
                    <div className="bg-gradient-to-r from-indigo-400 to-violet-400 text-white p-4 rounded-t-lg mr-1 invoice-print-header border-b border-black">
                        <p className="text-2xl font-bold text-center">Tax Invoice</p>
                        <div className="flex justify-between items-center relative">
                            <div className="absolute" style={{ top: '0px', left: '-10px' }}>
                                <img src={logo} alt="Your Company Logo" className="w-32 h-auto" />
                            </div>
                            <div className="flex-1 text-center pt-2" style={{ marginLeft: '155px' }}>
                                <p className="text-3xl font-custom fugaz-one-regular">Sakshi Enterprises</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold">GSTIN: 07OURPS6573P1ZY</p>
                                <p className="text-sm">M.: 9650650297</p>
                            </div>
                        </div>
                        <div className="flex flex-col content-center mt-4">
                            <p className="text-sm text-center">D-435, Gali No.-59,Mahavir Enclave,Part-3,West Delhi-110059</p>
                            <p className="text-sm text-center">E-mail id: manojsharma.2016m@gmail.com</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto mr-1">
                        <table className='w-full mb-2 mt-0.5 '>
                            <thead>
                                <tr>
                                    <td colSpan="2" className="border border-black px-2 py-1">M/s:</td>
                                    <td colSpan="1" className="border border-black px-2 py-1"><span className="font-semibold">{firstPart} <br /> {secondPart}</span></td>
                                    <td colSpan="2" className="border border-black px-2 py-1">Invoice No:</td>
                                    <td colSpan="2" className="border border-black px-2 py-1"><span className="font-semibold">{invoiceDetails.invoiceNo}</span></td>
                                </tr>
                                <tr>
                                    <td colSpan="2" className="border border-black px-2 py-1">GSTIN:</td>
                                    <td colSpan="1" className="border border-black px-2 py-1"><span className="font-semibold">{invoiceDetails.gstin}</span></td>
                                    <td colSpan="2" className="border border-black px-2 py-1">Date:</td>
                                    <td colSpan="2" className="border border-black px-2 py-1 custom-width"><span className="font-semibold">{formatDate(invoiceDetails.invoiceDate)}</span></td>
                                </tr>
                                <tr>
                                    <td colSpan="2" className="border border-black px-2 py-1">State:</td>
                                    <td colSpan="1" className="border border-black px-2 py-1"><span className="font-semibold">{invoiceDetails.state}</span></td>
                                    <td colSpan="2" className="border border-black px-2 py-1">State Code:</td>
                                    <td colSpan="2" className="border border-black px-2 py-1"><span className="font-semibold">{invoiceDetails.stateCode}</span></td>
                                </tr>
                            </thead>
                        </table>
                    </div>

                    <div className="overflow-x-auto mr-1">
                        <table className="w-full table-auto sm:min-w-full mb-1">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="border border-black py-0.5">S.No</th>
                                    <th className="border border-black py-0.5">Description</th>
                                    <th className="border border-black py-0.5">HSN/SAC Code</th>
                                    <th className="border border-black py-0.5">Quantity</th>
                                    <th className="border border-black py-0.5">Rate</th>
                                    <th className="border border-black py-0.5">Total Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => (
                                    <tr key={index} className="text-center">
                                        <td className="border border-black p-0.5">{index + 1}</td>
                                        <td className="border border-black p-0.5">{item.description}</td>
                                        <td className="border border-black p-0.5">{item.hsnAsc}</td>
                                        <td className="border border-black p-0.5">{item.quantity}</td>
                                        <td className="border border-black p-0.5">{item.rate}</td>
                                        <td className="border border-black p-0.5">{item.totalValue}</td>
                                    </tr>
                                ))}
                                {Array.from({ length: numRows }).map((_, index) => (
                                    <tr
                                        key={index}
                                        className="border border-black"
                                        style={{
                                            height: `${userHeight}px`,
                                            display: isVisible ? 'table-row' : 'none',
                                        }}
                                    >
                                        <td className="border border-black"></td>
                                        <td className="border border-black"></td>
                                        <td className="border border-black"></td>
                                        <td className="border border-black"></td>
                                        <td className="border border-black"></td>
                                        <td className="border border-black"></td>
                                    </tr>
                                ))}
                                <tr className="bg-gray-0">
                                    <td colSpan="3" rowSpan="6" className="border border-black px-1 py-1">Grand Total (In Words): <span className="font-semibold">{invoiceDetails.grandTotalInWords}</span></td>
                                    <td colSpan="2" className="border border-black px-1 py-1">Subtotal:</td>
                                    <td className="border border-black px-1 py-1">{subtotal !== undefined ? subtotal.toFixed(2) : '-'}</td>
                                </tr>
                                <tr className="bg-gray-0">
                                    <td colSpan="2" className="border border-black px-1 py-1">Freight</td>
                                    <td className="border border-black px-1 py-1">{invoiceDetails.freightCharges}</td>
                                </tr>
                                <tr className="bg-gray-0">
                                    <td colSpan="2" className="border border-black px-1 py-1">CGST:{cgstper} %</td>
                                    <td className="border border-black px-1 py-1">{invoiceDetails.cgst}</td>
                                </tr>
                                <tr className="bg-gray-0">
                                    <td colSpan="2" className="border border-black px-1 py-1">SGST:{sgstper} %</td>
                                    <td className="border border-black px-1 py-1">{invoiceDetails.sgst}</td>
                                </tr>
                                <tr className="bg-gray-0">
                                    <td colSpan="2" className="border border-black px-1 py-1">IGST:{igstper} % </td>
                                    <td className="border border-black px-1 py-1">{invoiceDetails.igst}</td>
                                </tr>
                                <tr className="bg-gray-0">
                                    <td colSpan="2" className="border border-black px-1 py-1">Grand Total:</td>
                                    <td className="border border-black px-1 py-1">{invoiceDetails.grandTotal}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="p-2 px-8 flex justify-between mt-2">
                        <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Terms & Conditions: </p>
                            <ul className="list-disc pl-4 text-[10px] text-gray-600 text-left leading-normal mt-1">
                                <li>All disputes are subject to jurisdiction of Delhi Courts</li>
                                <li>Payment should be made by cash/cheque/draft only.</li>
                                <li>Late payment will be charged if bill unpaid for 15 days.</li>
                            </ul>
                        </div>
                        <div className="text-right flex flex-col justify-between h-20 min-w-[200px] relative print:h-20">
                            <p className="text-[10px] font-bold text-gray-750">For Sakshi Enterprises</p>
                            <div className="relative h-8 w-full flex items-end justify-end">
                                {showSignature && (
                                    <img src={signature} alt="Signature" className="absolute bottom-[-20px] right-2 max-h-16 w-auto object-contain z-20 pointer-events-none" />
                                )}
                                {showStamp && (
                                    <img src={stamp} alt="stamp" className="absolute bottom-[-35px] right-2 max-h-22 w-auto object-contain z-10 opacity-85 pointer-events-none" />
                                )}
                            </div>
                            <p className="text-[10px] font-bold text-gray-750 relative z-0">Authorised Signatory</p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 p-6 bg-slate-50 dark:bg-[#201d2c]/40 border border-slate-200/60 dark:border-[#2e2944] rounded-xl shadow-inner print-hidden transition-colors duration-300">
                    <h2 className="text-sm font-bold text-slate-800 dark:text-gray-200 mb-4">
                        Print Options and Row Settings
                    </h2>

                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                        <div className="flex flex-col w-full md:w-1/2">
                            <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                                Choose Print Format
                            </p>
                            <div className="flex flex-wrap justify-start gap-2">
                                <button
                                    onClick={() => handlePrint(true, true)}
                                    className="bg-indigo-600 hover:bg-indigo-700 dark:bg-violet-600 dark:hover:bg-violet-700 text-white font-bold py-2 px-3 rounded-lg text-xs shadow-sm transition duration-200"
                                >
                                    Print with Sign & Stamp
                                </button>
                                <button
                                    onClick={() => handlePrint(true, false)}
                                    className="bg-indigo-600 hover:bg-indigo-700 dark:bg-violet-600 dark:hover:bg-violet-700 text-white font-bold py-2 px-3 rounded-lg text-xs shadow-sm transition duration-200"
                                >
                                    Print with Sign
                                </button>
                                <button
                                    onClick={() => handlePrint(false, true)}
                                    className="bg-indigo-600 hover:bg-indigo-700 dark:bg-violet-600 dark:hover:bg-violet-700 text-white font-bold py-2 px-3 rounded-lg text-xs shadow-sm transition duration-200"
                                >
                                    Print with Stamp
                                </button>
                                <button
                                    onClick={() => handlePrint(false, false)}
                                    className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-gray-300 font-bold py-2 px-3 rounded-lg text-xs shadow-sm transition duration-200"
                                >
                                    Print Plain Invoice
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col w-full md:w-1/2 space-y-3">
                            <h3 className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">
                                Adjust Row Settings
                            </h3>

                            <div>
                                <button
                                    onClick={toggleVisibility}
                                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 dark:bg-violet-600 dark:hover:bg-violet-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs shadow-sm transition duration-200"
                                >
                                    {isVisible ? 'Hide' : 'Show'} Second Row
                                </button>
                            </div>

                            <div className="flex items-center text-xs font-medium">
                                <label className="mr-3 text-slate-500 dark:text-gray-400 min-w-[120px]">Row Height (px):</label>
                                <input
                                    type="number"
                                    value={userHeight}
                                    onChange={handleHeightChange}
                                    className="px-2 py-1 bg-slate-100 dark:bg-[#2c2741] border border-slate-200 dark:border-[#3d3659] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition text-center w-20"
                                />
                            </div>

                            <div className="flex items-center text-xs font-medium">
                                <label className="mr-3 text-slate-500 dark:text-gray-400 min-w-[120px]">Number of Rows:</label>
                                <input
                                    type="number"
                                    value={numRows}
                                    onChange={handleInputChange}
                                    min="1"
                                    placeholder="Number of rows"
                                    className="px-2 py-1 bg-slate-100 dark:bg-[#2c2741] border border-slate-200 dark:border-[#3d3659] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition text-center w-20"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 border-t border-slate-100 dark:border-[#262235] pt-4 mt-6 print-hidden">
                    <button
                        onClick={onClose}
                        className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-gray-300 font-bold py-2 px-5 rounded-lg text-xs transition duration-200 shadow-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default InvoiceDetails;
