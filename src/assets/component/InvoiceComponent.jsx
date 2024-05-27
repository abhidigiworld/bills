import React, { useState } from 'react';
import './printStyles.css';
import axios from 'axios';
import logo from '../images/LOGO.png';

function InvoiceComponent({ invoiceDetails }) {
    const [items, setItems] = useState([]);
    const [description, setDescription] = useState('');
    const [hsnAsc, setHsnAsc] = useState('');
    const [quantity, setQuantity] = useState('');
    const [rate, setRate] = useState('');
    const [total, setTotal] = useState(0);
    const [freightCharges, setFreightCharges] = useState(0);
    const [cgst, setCgst] = useState(0);
    const [sgst, setSgst] = useState(0);
    const [igst, setIgst] = useState(0);
    const [grandTotal, setGrandTotal] = useState(0);
    const [grandTotalInWords, setGrandTotalInWords] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);

    const addItem = () => {
        const newItem = {
            description: description,
            hsnAsc: hsnAsc,
            quantity: quantity,
            rate: rate,
            totalValue: (quantity * rate).toFixed(2)
        };
        setItems([...items, newItem]);
        setDescription('');
        setHsnAsc('');
        setQuantity('');
        setRate('');
    };

    const calculateBill = () => {
        let totalAmount = 0;
        items.forEach(item => {
            totalAmount += parseFloat(item.totalValue);
        });
        setTotal(totalAmount);

        // calculation
        const freight = 50; // Sample static data
        const cgstRate = 9; // Sample static data
        const sgstRate = 9; // Sample static data
        const igstRate = 18; // Sample static data

        const totalTaxes = (totalAmount * (cgstRate + sgstRate)) / 100;
        const totalTaxableAmount = totalAmount + freight;
        const totalCgst = (totalTaxableAmount * cgstRate) / 100;
        const totalSgst = (totalTaxableAmount * sgstRate) / 100;
        const totalIgst = (totalTaxableAmount * igstRate) / 100;

        setFreightCharges(freight);
        setCgst(totalCgst);
        setSgst(totalSgst);
        setIgst(totalIgst);
        setGrandTotal(totalTaxableAmount + totalTaxes);

        // Convert grand total to words
        // This is a placeholder function, you may replace it with a library or custom logic
        const grandTotalWords = convertNumberToWords(totalTaxableAmount + totalTaxes);
        setGrandTotalInWords(grandTotalWords);
    };

    const convertNumberToWords = (number) => {
        if (number === 0) return 'Zero';
        number=Math.round(number);
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        const teens = ['', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', 'Ten', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        const scales = ['', 'Thousand', 'Million', 'Billion', 'Trillion'];

        const numberToWords = (num) => {
            if (num === 0) return '';
            let words = '';
            if (num >= 100) {
                words = numberToWords(Math.floor(num / 100)) + ' Hundred ';
                num %= 100;
            }
            if (num >= 11 && num <= 19) {
                words += teens[num - 10] + ' ';
            } else if (num >= 10 || num === 0) {
                words += tens[Math.floor(num / 10)] + ' ';
                num %= 10;
            }
            if (num >= 1 && num <= 9) {
                words += ones[num] + ' ';
            }
            return words.trim();
        };

        let words = '';
        let scaleIndex = 0;
        while (number > 0) {
            const chunk = number % 1000;
            if (chunk !== 0) {
                words = numberToWords(chunk) + ' ' + scales[scaleIndex] + (words ? ' ' : '') + words;
            }
            number = Math.floor(number / 1000);
            scaleIndex++;
        }

        const decimalPart = (number * 100).toString().split('.')[1]; // Extract decimal part with 2 digits after point
        let decimalWords = '';
        if (decimalPart) {
            decimalWords = ' and ' + numberToWords(parseInt(decimalPart)) + ' Cents';
        }

        return words.trim() + decimalWords;
    };


    const handleSave = async () => {
        try {
            const response = await axios.post('https://billsbackend-git-main-abhidigiworlds-projects.vercel.app/api/invoices', {
                companyName: invoiceDetails.msInput,
                gstin: invoiceDetails.gstin,
                state: invoiceDetails.state,
                stateCode: invoiceDetails.stateCode,
                invoiceNo: invoiceDetails.invoiceNo,
                invoiceDate: invoiceDetails.invoiceDate,
                items: items.map(item => ({
                    description: item.description,
                    hsnAsc: item.hsnAsc,
                    quantity: item.quantity,
                    rate: item.rate,
                    totalValue: item.totalValue
                }))
            });
            console.log('Invoice saved successfully', response.data);
            setSaveSuccess(true); // Set save success message
            myfunc();
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const myfunc = ()=>{
        setTimeout(()=>{
            setSaveSuccess(false);
        },1000);
    };
     
    const handlePrint = () => {
        window.print();
        console.log('Printing invoice...');
    };

    return (
        <>
            <div className="container mx-auto mt-8 px-4 lg:px-8">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex flex-col space-y-2 w-1/3 print-hidden">
                        <input type="text" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="border px-3 py-2 rounded" />
                        <input type="text" placeholder="HSN/SAC Code" value={hsnAsc} onChange={(e) => setHsnAsc(e.target.value)} className="border px-3 py-2 rounded" />
                        <input type="number" placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="border px-3 py-2 rounded" />
                        <input type="number" placeholder="Rate" value={rate} onChange={(e) => setRate(e.target.value)} className="border px-3 py-2 rounded" />
                        <button onClick={addItem} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Add</button>
                        <button onClick={calculateBill} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Generate Bill</button>
                    </div>
                    <div className='printdata border'>
                        <p className="text-lg font-bold bg-gray-300">Tax Invoice</p>
                        <div className="flex justify-between px-4 py-2 bg-gray-300">
                            <div className="flex items-center">
                                <img src={logo} alt="Your Company Logo" class="w-16 h-16 mr-2" />
                                <p className="text-lg font-bold">Sakshi Enterprises</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm">GSTIN: 070URPS6573P1ZY</p>
                                <p className="text-sm">M.: 9650650297</p>
                            </div>
                        </div>
                        <div className="bg-gray-100 p-4">
                            <div className="grid grid-cols-1 gap-4 mt-2 sm:grid-cols-2"> {/* Responsive grid for invoice details */}
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
                            <table className="w-full table-auto sm:min-w-full"> {/* Set minimum width for smaller screens */}
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
                            <div className="grid grid-cols-1 gap-4 mt-2 sm:grid-cols-2"> {/* Responsive grid for invoice summary */}
                                <div>
                                    <p className="text-sm">Grand Total (In Words): <span className="font-semibold">{grandTotalInWords}</span></p>
                                </div>
                                <div className='text-left'>
                                    <p className="text-sm">Total: <span className="font-semibold">{total.toFixed(2)}</span></p>
                                    <p className="text-sm">Freight Charges: <span className="font-semibold">{freightCharges.toFixed(2)}</span></p>
                                    <p className="text-sm">CGST: <span className="font-semibold">{cgst.toFixed(2)}</span></p>
                                    <p className="text-sm">SGST: <span className="font-semibold">{sgst.toFixed(2)}</span></p>
                                    <p className="text-sm">IGST: <span className="font-semibold">{igst.toFixed(2)}</span></p>
                                    <p className="text-sm">Grand Total: <span className="font-semibold">{grandTotal.toFixed(2)}</span></p>
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

                </div>
                <div className="flex justify-end mt-4">
                    <button onClick={handleSave} className="bg-green-500 text-white px-4 py-2 rounded mr-2 hover:bg-green-600 print-hidden">Save</button>
                    <button onClick={handlePrint} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 print-hidden">Print</button>
                </div>
            </div>
            {saveSuccess && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-4 rounded shadow-md">
                        <p className="text-green-500 font-bold">Invoice saved successfully!</p>
                    </div>
                </div>
            )}
        </>
    );
}

export default InvoiceComponent;
