import React, { useState } from 'react';
import './printStyles.css';
import axios from 'axios';
import logo from '../images/LOGO.png';
import signature from '../images/sign.png';
import stamp from '../images/stamp.png'

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
    const [billGenerated, setBillGenerated] = useState(false);
    const [freight, setfreight] = useState();
    const [cgstRate, setcgstRate] = useState();
    const [sgstRate, setsgstRate] = useState();
    const [igstRate, setigstRate] = useState();

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

        const totalTaxableAmount = parseFloat(totalAmount) + parseFloat(freight);

        // Calculate individual taxes
        const totalCgst = (parseFloat(totalTaxableAmount) * parseFloat(cgstRate)) / 100;
        const totalSgst = (totalTaxableAmount * sgstRate) / 100;
        const totalIgst = (totalTaxableAmount * igstRate) / 100;

        setFreightCharges(parseFloat(freight).toFixed(2));
        setCgst(parseFloat(totalCgst).toFixed(2));
        setSgst(parseFloat(totalSgst).toFixed(2));
        setIgst(parseFloat(totalIgst).toFixed(2));
        setGrandTotal((parseFloat(totalTaxableAmount) + parseFloat(totalCgst) + parseFloat(totalSgst) + parseFloat(totalIgst)).toFixed(2));
        const grandTotalWords = convertNumberToWords(grandTotal);
        setGrandTotalInWords(grandTotalWords);
        setBillGenerated(true);
    };


    const convertNumberToWords = (number) => {
        if (number === 0) return 'Zero';
    
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        const teens = ['', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', 'Ten', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
        const convertToWords = (num) => {
            let words = '';
    
            if (num >= 100) {
                words += ones[Math.floor(num / 100)] + ' Hundred ';
                num %= 100;
            }
    
            if (num >= 20) {
                words += tens[Math.floor(num / 10)] + ' ';
                num %= 10;
            }
    
            if (num >= 1 && num <= 9) {
                words += ones[num] + ' ';
            }
    
            return words.trim();
        };
    
        const scales = ['', 'Thousand', 'Lakh', 'Crore', 'Arab', 'Kharab', 'Neel', 'Padma', 'Shankh', 'Maha Shankh'];
        let scaleIndex = 0; // Start with Thousand
        let words = '';
    
        // Separate integer and decimal parts
        let integerPart = Math.floor(number);
        let decimalPart = Math.round((number - integerPart) * 100);
    
        // Convert integer part to words
        while (integerPart > 0) {
            const remainder = integerPart % 1000;
    
            if (remainder !== 0) {
                const scaleWord = scales[scaleIndex];
                words = convertToWords(remainder) + ' ' + scaleWord + ' ' + words;
            }
    
            integerPart = Math.floor(integerPart / 1000);
            scaleIndex++;
        }
    
        // Convert decimal part to words
        if (decimalPart > 0) {
            words += ' and ' + convertToWords(decimalPart) + ' Paisa ';
        }
    
        return words.trim();
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
                })),
                freightCharges: freightCharges,
                cgst: cgst,
                sgst: sgst,
                igst: igst,
                grandTotal: grandTotal,
                grandTotalInWords: grandTotalInWords
            });
            console.log('Invoice saved successfully', response.data);
            setSaveSuccess(true); // Set save success message
            myfunc();
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const myfunc = () => {
        setTimeout(() => {
            setSaveSuccess(false);
        }, 1000);
    };

    const handlePrint = () => {
        window.print();
        console.log('Printing invoice...');
    };

    return (
        <>
        <div className="container mx-auto mt-8 px-4 lg:px-8 mb-12 pb-8">
            <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex flex-col space-y-2 w-full lg:w-1/3 print-hidden">
                    <input type="text" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="border px-3 py-2 rounded" />
                    <input type="text" placeholder="HSN/SAC Code" value={hsnAsc} onChange={(e) => setHsnAsc(e.target.value)} className="border px-3 py-2 rounded" />
                    <input type="number" placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="border px-3 py-2 rounded" />
                    <input type="number" placeholder="Rate" value={rate} onChange={(e) => setRate(e.target.value)} className="border px-3 py-2 rounded" />
                    <button onClick={addItem} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Add</button>
                    <input type="number" placeholder="Freight Charges" value={freight} onChange={(e) => setfreight(e.target.value)} className="border px-3 py-2 rounded" />
                    <input type="number" placeholder="CGST Rate" value={cgstRate} onChange={(e) => setcgstRate(e.target.value)} className="border px-3 py-2 rounded" />
                    <input type="number" placeholder="SGST Rate" value={sgstRate} onChange={(e) => setsgstRate(e.target.value)} className="border px-3 py-2 rounded" />
                    <input type="number" placeholder="IGST Rate" value={igstRate} onChange={(e) => setigstRate(e.target.value)} className="border px-3 py-2 rounded" />
                    <button onClick={calculateBill} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Generate Bill</button>
                </div>
                <div className='printdata border w-full lg:w-2/3'>
                    <p className="text-lg font-bold bg-gray-300 text-center">Tax Invoice</p>
                    <div className="flex flex-col sm:flex-row justify-between px-4 py-2 bg-gray-300">
                        <div className="flex items-center">
                            <img src={logo} alt="Your Company Logo" className="w-12 h-12 sm:w-16 sm:h-16 mr-2" />
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
    
                    <div className="bg-gray-100 overflow-x-auto">
                        <table className="w-full table-auto sm:min-w-full">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="px-2 sm:px-4 py-2">S.No</th>
                                    <th className="px-2 sm:px-4 py-2">Description</th>
                                    <th className="px-2 sm:px-4 py-2">HSN/SAC Code</th>
                                    <th className="px-2 sm:px-4 py-2">Quantity</th>
                                    <th className="px-2 sm:px-4 py-2">Rate</th>
                                    <th className="px-2 sm:px-4 py-2">Total Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => (
                                    <tr key={index} className="text-center">
                                        <td className="border px-2 sm:px-4 py-2">{index + 1}</td>
                                        <td className="border px-2 sm:px-4 py-2">{item.description}</td>
                                        <td className="border px-2 sm:px-4 py-2">{item.hsnAsc}</td>
                                        <td className="border px-2 sm:px-4 py-2">{item.quantity}</td>
                                        <td className="border px-2 sm:px-4 py-2">{item.rate}</td>
                                        <td className="border px-2 sm:px-4 py-2">{item.totalValue}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
    
                    <div className="bg-gray-100 p-4">
                        <div className="grid grid-cols-1 gap-4 mt-2 sm:grid-cols-2">
                            <div>
                                <p className="text-sm">Grand Total (In Words): <span className="font-semibold">{grandTotalInWords}</span></p>
                            </div>
                            <div className='text-left'>
                                <p className="text-sm">Total: <span className="font-semibold">{total}</span></p>
                                <p className="text-sm">Freight Charges: <span className="font-semibold">{freight}</span></p>
                                <p className="text-sm">CGST: <span className="font-semibold">{cgst}</span></p>
                                <p className="text-sm">SGST: <span className="font-semibold">{sgst}</span></p>
                                <p className="text-sm">IGST: <span className="font-semibold">{igst}</span></p>
                                <p className="text-sm">Grand Total: <span className="font-semibold">{grandTotal}</span></p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-200 p-4 px-8 flex flex-col sm:flex-row justify-between">
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
                            {billGenerated && (
                                <>
                                    <img src={signature} alt="Signature" className="absolute top-0 left-0 right-0 mx-auto mt-4 w-32 sm:w-44 h-auto" />
                                    <img src={stamp} alt="stamp" className="absolute top-0 left-0 right-0 mx-auto mt-4 w-64 sm:w-80 h-auto" />
                                </>
                            )}
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
