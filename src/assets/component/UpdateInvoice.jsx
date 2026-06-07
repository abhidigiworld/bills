import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

const UpdateInvoice = ({ invoice, onClose }) => {
    const [companyName, setCompanyName] = useState(invoice.companyName);
    const [gstin, setGstin] = useState(invoice.gstin);
    const [state, setState] = useState(invoice.state);
    const [stateCode, setStateCode] = useState(invoice.stateCode);
    const [invoiceNo, setInvoiceNo] = useState(invoice.invoiceNo);
    const [invoiceDate, setInvoiceDate] = useState(invoice.invoiceDate.split('T')[0]);
    const [items, setItems] = useState(invoice.items);
    const [freightCharges, setFreightCharges] = useState(invoice.freightCharges);
    const [cgst, setCgst] = useState(invoice.cgst);
    const [sgst, setSgst] = useState(invoice.sgst);
    const [igst, setIgst] = useState(invoice.igst);
    const [grandTotal, setGrandTotal] = useState(invoice.grandTotal);
    const [grandTotalInWords, setGrandTotalInWords] = useState(invoice.grandTotalInWords);

    const getInitialRate = (val, sub) => {
        if (!val || !sub) return 0;
        return parseFloat(((val / sub) * 100).toFixed(2));
    };

    const initialSubtotal = invoice.items.reduce((total, item) => total + (item.quantity * item.rate), 0);
    const [cgstRate, setCgstRate] = useState(() => getInitialRate(invoice.cgst, initialSubtotal));
    const [sgstRate, setSgstRate] = useState(() => getInitialRate(invoice.sgst, initialSubtotal));
    const [igstRate, setIgstRate] = useState(() => getInitialRate(invoice.igst, initialSubtotal));

    const convertNumberToWords = (number) => {
        if (number === 0) return 'Zero';

        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
                      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        const convertToWordsLessThanThousand = (num) => {
            let words = '';
            if (num >= 100) {
                words += ones[Math.floor(num / 100)] + ' Hundred ';
                num %= 100;
            }
            if (num >= 20) {
                words += tens[Math.floor(num / 10)] + ' ';
                num %= 10;
            }
            if (num > 0) {
                words += ones[num] + ' ';
            }
            return words.trim();
        };

        let integerPart = Math.floor(number);
        let decimalPart = Math.round((number - integerPart) * 100);
        let result = '';

        if (integerPart >= 10000000) {
            const crore = Math.floor(integerPart / 10000000);
            result += convertToWordsLessThanThousand(crore) + ' Crore ';
            integerPart %= 10000000;
        }
        if (integerPart >= 100000) {
            const lakh = Math.floor(integerPart / 100000);
            result += convertToWordsLessThanThousand(lakh) + ' Lakh ';
            integerPart %= 100000;
        }
        if (integerPart >= 1000) {
            const thousand = Math.floor(integerPart / 1000);
            result += convertToWordsLessThanThousand(thousand) + ' Thousand ';
            integerPart %= 1000;
        }
        if (integerPart > 0) {
            result += convertToWordsLessThanThousand(integerPart);
        }

        let words = result.trim();

        if (decimalPart > 0) {
            words += ' and ' + convertToWordsLessThanThousand(decimalPart) + ' Paisa';
        }

        return words.trim();
    };

    const handleCgstRateChange = (newRate) => {
        const rateVal = parseFloat(newRate) || 0;
        setCgstRate(rateVal);
        setCgst(((subtotal * rateVal) / 100).toFixed(2));
    };

    const handleSgstRateChange = (newRate) => {
        const rateVal = parseFloat(newRate) || 0;
        setSgstRate(rateVal);
        setSgst(((subtotal * rateVal) / 100).toFixed(2));
    };

    const handleIgstRateChange = (newRate) => {
        const rateVal = parseFloat(newRate) || 0;
        setIgstRate(rateVal);
        setIgst(((subtotal * rateVal) / 100).toFixed(2));
    };

    const handleCgstValueChange = (newValue) => {
        const val = parseFloat(newValue) || 0;
        setCgst(val);
        setCgstRate(subtotal > 0 ? parseFloat(((val / subtotal) * 100).toFixed(2)) : 0);
    };

    const handleSgstValueChange = (newValue) => {
        const val = parseFloat(newValue) || 0;
        setSgst(val);
        setSgstRate(subtotal > 0 ? parseFloat(((val / subtotal) * 100).toFixed(2)) : 0);
    };

    const handleIgstValueChange = (newValue) => {
        const val = parseFloat(newValue) || 0;
        setIgst(val);
        setIgstRate(subtotal > 0 ? parseFloat(((val / subtotal) * 100).toFixed(2)) : 0);
    };

    const handleUpdate = async () => {
        try {
            const updatedInvoice = {
                companyName,
                gstin,
                state,
                stateCode,
                invoiceNo,
                invoiceDate,
                items,
                freightCharges,
                cgst,
                sgst,
                igst,
                grandTotal,
                grandTotalInWords,
            };

            await axios.put(`${API_BASE_URL}/api/invoices/${invoice._id}`, updatedInvoice);
            onClose();
        } catch (error) {
            console.error('Error updating invoice:', error);
        }
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;

        if (field === 'quantity' || field === 'rate') {
            newItems[index].totalValue = newItems[index].quantity * newItems[index].rate;
        }

        setItems(newItems);
    };

    const calculateSubtotal = () => {
        return items.reduce((total, item) => total + (item.quantity * item.rate), 0);
    };

    const subtotal = calculateSubtotal();

    const calculateGrandTotal = () => {
        const subtotal = calculateSubtotal();
        const totalTaxes = parseFloat(cgst) + parseFloat(sgst) + parseFloat(igst);
        const grandTotal = subtotal + parseFloat(freightCharges) + totalTaxes;
        setGrandTotal(grandTotal.toFixed(2));
    };

    const handleDeleteItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    useEffect(() => {
        if (cgstRate > 0) {
            setCgst(((subtotal * cgstRate) / 100).toFixed(2));
        }
        if (sgstRate > 0) {
            setSgst(((subtotal * sgstRate) / 100).toFixed(2));
        }
        if (igstRate > 0) {
            setIgst(((subtotal * igstRate) / 100).toFixed(2));
        }
    }, [subtotal, cgstRate, sgstRate, igstRate]);

    useEffect(() => {
        calculateGrandTotal();
    }, [subtotal, freightCharges, cgst, sgst, igst]);

    useEffect(() => {
        if (grandTotal) {
            setGrandTotalInWords(convertNumberToWords(parseFloat(grandTotal)));
        }
    }, [grandTotal]);

    const addNewItemRow = () => {
        setItems([
            ...items,
            {
                description: '',
                quantity: 0,
                rate: 0,
                totalValue: 0,
            },
        ]);
    };

    const inputClass = "w-full px-3 py-1.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-sans text-sm transition";

    return (
        <div className="mb-12 print-hidden bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-xl rounded-[2rem] p-6 transition-colors duration-300">
            <div className='printdata font-mono text-slate-800 dark:text-gray-200'>
                <div className="relative bg-gradient-to-r from-indigo-500 to-violet-500 text-white p-4 rounded-t-lg mb-4">
                    <p className="text-2xl font-bold text-center">Update Invoice Details</p>
                    <div className="flex justify-between items-center relative">
                        <div className="flex-1 text-center pt-2" >
                            <p className="text-3xl font-custom fugaz-one-regular">Sakshi Enterprises</p>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className='w-full mb-4 border border-slate-200 dark:border-[#262235] rounded-xl overflow-hidden'>
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-[#262235]">
                                <td colSpan="2" className="px-3 py-2 text-slate-500 dark:text-gray-400 font-bold uppercase text-xs">M/s:</td>
                                <td colSpan="1" className="px-3 py-2">
                                    <input
                                        type="text"
                                        className={inputClass}
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                    />
                                </td>
                                <td colSpan="2" className="px-3 py-2 text-slate-500 dark:text-gray-400 font-bold uppercase text-xs">Invoice No:</td>
                                <td colSpan="2" className="px-3 py-2">
                                    <input
                                        type="text"
                                        className={inputClass}
                                        value={invoiceNo}
                                        onChange={(e) => setInvoiceNo(e.target.value)}
                                    />
                                </td>
                            </tr>
                            <tr className="border-b border-slate-200 dark:border-[#262235]">
                                <td colSpan="2" className="px-3 py-2 text-slate-500 dark:text-gray-400 font-bold uppercase text-xs">GSTIN:</td>
                                <td colSpan="1" className="px-3 py-2">
                                    <input
                                        type="text"
                                        className={inputClass}
                                        value={gstin}
                                        onChange={(e) => setGstin(e.target.value)}
                                    />
                                </td>
                                <td colSpan="2" className="px-3 py-2 text-slate-500 dark:text-gray-400 font-bold uppercase text-xs">Date:</td>
                                <td colSpan="2" className="px-3 py-2">
                                    <input
                                        type="date"
                                        className={inputClass}
                                        value={invoiceDate}
                                        onChange={(e) => setInvoiceDate(e.target.value)}
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td colSpan="2" className="px-3 py-2 text-slate-500 dark:text-gray-400 font-bold uppercase text-xs">State:</td>
                                <td colSpan="1" className="px-3 py-2">
                                    <input
                                        type="text"
                                        className={inputClass}
                                        value={state}
                                        onChange={(e) => setState(e.target.value)}
                                    />
                                </td>
                                <td colSpan="2" className="px-3 py-2 text-slate-500 dark:text-gray-400 font-bold uppercase text-xs">State Code:</td>
                                <td colSpan="2" className="px-3 py-2">
                                    <input
                                        type="text"
                                        className={inputClass}
                                        value={stateCode}
                                        onChange={(e) => setStateCode(e.target.value)}
                                    />
                                </td>
                            </tr>
                        </thead>
                    </table>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full table-auto border border-slate-200 dark:border-[#262235]">
                        <thead>
                            <tr className="bg-slate-100 dark:bg-[#201d2c]/50 text-slate-500 dark:text-gray-400 font-bold uppercase text-xs border-b border-slate-200 dark:border-[#262235]">
                                <th className="px-2 py-2 text-center">S.No</th>
                                <th className="px-3 py-2">Description</th>
                                <th className="px-3 py-2">HSN/SAC Code</th>
                                <th className="px-3 py-2 text-center">Quantity</th>
                                <th className="px-3 py-2 text-center">Rate</th>
                                <th className="px-3 py-2 text-center">Total Value</th>
                                <th className="px-3 py-2 text-center">Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {items.map((item, index) => (
                                <tr key={index} className="border-b border-slate-100 dark:border-[#262235]">
                                    <td className="px-2 py-2 text-center font-bold text-slate-400">{index + 1}</td>
                                    <td className="px-3 py-2">
                                        <input
                                            type="text"
                                            className={inputClass}
                                            value={item.description}
                                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <input
                                            type="text"
                                            className={inputClass}
                                            value={item.hsnAsc}
                                            onChange={(e) => handleItemChange(index, 'hsnAsc', e.target.value)}
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <input
                                            type="number"
                                            className={inputClass}
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <input
                                            type="number"
                                            className={inputClass}
                                            value={item.rate}
                                            onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <input
                                            type="number"
                                            className={inputClass}
                                            value={item.totalValue}
                                            readOnly
                                        />
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                        <button
                                            className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-xs transition shadow-sm"
                                            onClick={() => handleDeleteItem(index)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            
                            <tr className="border-b border-slate-100 dark:border-[#262235]">
                                <td colSpan="3" rowSpan="6" className="px-3 py-3 align-top">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Grand Total (In Words)</label>
                                    <input
                                        type="text"
                                        className={inputClass}
                                        value={grandTotalInWords}
                                        onChange={(e) => setGrandTotalInWords(e.target.value)}
                                    />
                                </td>
                                <td colSpan="2" className="px-3 py-2 text-slate-500 dark:text-gray-400 font-bold uppercase text-xs text-right">Subtotal:</td>
                                <td colSpan="2" className="px-3 py-2 font-bold text-right">₹{subtotal.toFixed(2)}</td>
                            </tr>
                            <tr className="border-b border-slate-100 dark:border-[#262235]">
                                <td colSpan="2" className="px-3 py-2 text-slate-500 dark:text-gray-400 font-bold uppercase text-xs text-right">Freight Charges:</td>
                                <td colSpan="2" className="px-3 py-2">
                                    <input
                                        type="number"
                                        className={inputClass}
                                        value={freightCharges}
                                        onChange={(e) => setFreightCharges(e.target.value)}
                                    />
                                </td>
                            </tr>
                            <tr className="border-b border-slate-100 dark:border-[#262235]">
                                <td colSpan="2" className="px-3 py-2 text-slate-500 dark:text-gray-400 font-bold uppercase text-xs text-right">CGST Rate (%) & Value:</td>
                                <td colSpan="1" className="px-3 py-2">
                                    <input
                                        type="number"
                                        className={inputClass}
                                        value={cgstRate}
                                        onChange={(e) => handleCgstRateChange(e.target.value)}
                                        placeholder="Rate %"
                                    />
                                </td>
                                <td colSpan="1" className="px-3 py-2">
                                    <input
                                        type="number"
                                        className={inputClass}
                                        value={cgst}
                                        onChange={(e) => handleCgstValueChange(e.target.value)}
                                        placeholder="Value ₹"
                                    />
                                </td>
                            </tr>
                            <tr className="border-b border-slate-100 dark:border-[#262235]">
                                <td colSpan="2" className="px-3 py-2 text-slate-500 dark:text-gray-400 font-bold uppercase text-xs text-right">SGST Rate (%) & Value:</td>
                                <td colSpan="1" className="px-3 py-2">
                                    <input
                                        type="number"
                                        className={inputClass}
                                        value={sgstRate}
                                        onChange={(e) => handleSgstRateChange(e.target.value)}
                                        placeholder="Rate %"
                                    />
                                </td>
                                <td colSpan="1" className="px-3 py-2">
                                    <input
                                        type="number"
                                        className={inputClass}
                                        value={sgst}
                                        onChange={(e) => handleSgstValueChange(e.target.value)}
                                        placeholder="Value ₹"
                                    />
                                </td>
                            </tr>
                            <tr className="border-b border-slate-100 dark:border-[#262235]">
                                <td colSpan="2" className="px-3 py-2 text-slate-500 dark:text-gray-400 font-bold uppercase text-xs text-right">IGST Rate (%) & Value:</td>
                                <td colSpan="1" className="px-3 py-2">
                                    <input
                                        type="number"
                                        className={inputClass}
                                        value={igstRate}
                                        onChange={(e) => handleIgstRateChange(e.target.value)}
                                        placeholder="Rate %"
                                    />
                                </td>
                                <td colSpan="1" className="px-3 py-2">
                                    <input
                                        type="number"
                                        className={inputClass}
                                        value={igst}
                                        onChange={(e) => handleIgstValueChange(e.target.value)}
                                        placeholder="Value ₹"
                                    />
                                </td>
                            </tr>
                            <tr className="border-b border-slate-100 dark:border-[#262235]">
                                <td colSpan="2" className="px-3 py-2 text-slate-500 dark:text-gray-400 font-bold uppercase text-xs text-right">Grand Total:</td>
                                <td colSpan="2" className="px-3 py-2">
                                    <input
                                        type="number"
                                        className={inputClass}
                                        value={grandTotal}
                                        onChange={(e) => setGrandTotal(e.target.value)}
                                    />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-center my-4">
                    <button
                        onClick={addNewItemRow}
                        className="bg-indigo-600 hover:bg-indigo-700 dark:bg-violet-600 dark:hover:bg-violet-700 text-white font-bold py-2 px-6 rounded-xl text-sm transition duration-200 shadow"
                    >
                        + Add Item Row
                    </button>
                </div>

                <div className="flex justify-center gap-4 border-t border-slate-200 dark:border-[#262235] pt-4">
                    <button
                        onClick={handleUpdate}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition duration-200 shadow"
                    >
                        Save Invoice Changes
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-gray-300 font-bold py-2.5 px-6 rounded-xl text-sm transition duration-200 shadow"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpdateInvoice;
