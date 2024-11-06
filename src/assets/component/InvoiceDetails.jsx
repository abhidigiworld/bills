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
    const [gstper, setgstper] = useState('');
    const [igstper, setigstper] = useState('');
    const [cgstper, setcgstper] = useState('');
    const [sgstper, setsgstper] = useState('');
    const [showSignature, setShowSignature] = useState(true);
    const [showStamp, setShowStamp] = useState(true);

    const [userHeight, setUserHeight] = useState(30);
    const [isVisible, setIsVisible] = useState(false);
    const [numRows, setNumRows] = useState(1);

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
                const response = await axios.get(`https://billsbackend-git-main-abhidigiworlds-projects.vercel.app/api/invoices/${invoiceId}`);
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
        <>
            <div className='printdata font-mono m-auto'>
                <div className="bg-gradient-to-r from-indigo-400 to-violet-400
 text-white p-4 rounded-t-lg mr-1 ">
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
                        <p className="text-xs text-gray-500">Terms & Conditions: </p>
                        <ul className="list-disc pl-2 text-sm text-gray-600 text-left">
                            <li>All disputes are subject to jurisdiction of Delhi Courts</li>
                            <li>Payment should be made by cash/cheque/draft only.</li>
                            <li>Late payment will be charged if bill unpaid for 15 days.</li>
                        </ul>
                    </div>
                    <div className="text-right relative">
                        <p className="text-sm">For Sakshi Enterprises</p>
                        {showSignature && (
                            <img src={signature} alt="Signature" className="absolute top-0 left-0 right-0 mx-auto mt-4 w-36 h-auto" />
                        )}
                        {showStamp && (
                            <img src={stamp} alt="stamp" className="absolute top-0 left-0 right-0 mx-auto mt-4 w-80 h-auto" />
                        )}
                        <p className="text-sm absolute bottom-0 right-0">Authorised Signatory</p>
                    </div>
                </div>
            </div>

            <div className="mb-8 p-4 bg-white rounded-lg shadow-md print-hidden">
                {/* Section Title */}
                <h2 className="text-base font-bold text-center text-gray-800 mb-4">
                    Print Options and Row Settings
                </h2>

                {/* Main Content Wrapper */}
                <div className="flex justify-between items-start mb-4">
                    {/* Right Section: Print Buttons */}
                    <div className="flex flex-col w-1/2 pl-2">
                        <p className="text-sm text-gray-700 mb-2">
                            Choose the format for printing:
                        </p>
                        <div className="flex flex-wrap justify-start gap-2 mt-2">
                            <button
                                onClick={() => handlePrint(true, true)}
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-300 shadow-sm hover:shadow-none"
                            >
                                Print with Sign and Stamp
                            </button>
                            <button
                                onClick={() => handlePrint(true, false)}
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-300 shadow-sm hover:shadow-none"
                            >
                                Print with Sign
                            </button>
                            <button
                                onClick={() => handlePrint(false, true)}
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-300 shadow-sm hover:shadow-none"
                            >
                                Print with Stamp
                            </button>
                            <button
                                onClick={() => handlePrint(false, false)}
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-300 shadow-sm hover:shadow-none"
                            >
                                Print without Sign and Stamp
                            </button>
                        </div>
                    </div>

                    {/* Left Section: Adjustment Options */}
                    <div className="flex flex-col w-1/2 pr-2">
                        <h3 className="text-sm font-semibold text-gray-800 mb-2">
                            Adjust Row Height and Visibility:
                        </h3>

                        {/* Show/Hide Row Button */}
                        <button
                            onClick={toggleVisibility}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out shadow-sm hover:shadow-none"
                        >
                            {isVisible ? 'Hide' : 'Show'} Second Row
                        </button>

                        {/* Row Height Input */}
                        <div className="flex items-center text-sm font-medium text-gray-700 mt-4">
                            <label className="mr-2">Set Row Height (px):</label>
                            <input
                                type="number"
                                value={userHeight}
                                onChange={handleHeightChange}
                                className="border p-2 text-sm rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Row Count Input */}
                        <div className="flex items-center text-sm font-medium text-gray-700 mt-4">
                            <label className="mr-2">Enter Number of Rows:</label>
                            <input
                                type="number"
                                value={numRows}
                                onChange={handleInputChange}
                                min="1"
                                placeholder="Number of rows"
                                className="border p-2 text-sm rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default InvoiceDetails;
