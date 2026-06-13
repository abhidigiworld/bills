import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';
import axios from 'axios';
import { useSettings } from '../../context/SettingsContext';

const UpdateInvoice = ({ invoice, onClose }) => {
    const { settings } = useSettings();
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

    const initialSubtotal = invoice.items.reduce((total, item) => total + (parseFloat(item.totalValue) || 0), 0);
    const [cgstRate, setCgstRate] = useState(() => getInitialRate(invoice.cgst, initialSubtotal));
    const [sgstRate, setSgstRate] = useState(() => getInitialRate(invoice.sgst, initialSubtotal));
    const [igstRate, setIgstRate] = useState(() => getInitialRate(invoice.igst, initialSubtotal));

    const convertNumberToWords = (number) => {
        if (isNaN(number) || number === null || number === undefined) return '';

        let num = parseFloat(number);
        if (num < 0) return 'Negative ' + convertNumberToWords(Math.abs(num));
        if (num === 0) return 'Zero';

        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
                      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        const convertToWordsLessThanThousand = (val) => {
            let words = '';
            if (val >= 100) {
                words += ones[Math.floor(val / 100)] + ' Hundred ';
                val %= 100;
            }
            if (val >= 20) {
                words += tens[Math.floor(val / 10)] + ' ';
                val %= 10;
            }
            if (val > 0) {
                words += ones[val] + ' ';
            }
            return words.trim();
        };

        let integerPart = Math.floor(num);
        let decimalPart = Math.round((num - integerPart) * 100);
        let result = '';

        if (integerPart >= 10000000) { // Crore (1,00,00,000)
            const crore = Math.floor(integerPart / 10000000);
            result += convertToWordsLessThanThousand(crore) + ' Crore ';
            integerPart %= 10000000;
        }
        if (integerPart >= 100000) { // Lakh (1,00,000)
            const lakh = Math.floor(integerPart / 100000);
            result += convertToWordsLessThanThousand(lakh) + ' Lakh ';
            integerPart %= 100000;
        }
        if (integerPart >= 1000) { // Thousand (1,000)
            const thousand = Math.floor(integerPart / 1000);
            result += convertToWordsLessThanThousand(thousand) + ' Thousand ';
            integerPart %= 1000;
        }
        if (integerPart > 0) {
            result += convertToWordsLessThanThousand(integerPart);
        }

        let words = result.trim();

        // Convert decimal part to words (Paisa)
        if (decimalPart > 0) {
            if (words !== '') {
                words += ' and ' + convertToWordsLessThanThousand(decimalPart) + ' Paisa';
            } else {
                words = convertToWordsLessThanThousand(decimalPart) + ' Paisa';
            }
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
    };

    const handleSgstValueChange = (newValue) => {
        const val = parseFloat(newValue) || 0;
        setSgst(val);
    };

    const handleIgstValueChange = (newValue) => {
        const val = parseFloat(newValue) || 0;
        setIgst(val);
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
            onClose(true);
        } catch (error) {
            console.error('Error updating invoice:', error);
        }
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;

        if (field === 'quantity' || field === 'rate') {
            const q = parseFloat(newItems[index].quantity);
            const r = parseFloat(newItems[index].rate);
            if (!isNaN(q) && !isNaN(r)) {
                newItems[index].totalValue = (q * r).toFixed(2);
            }
        }

        setItems(newItems);
    };

    const calculateSubtotal = () => {
        return items.reduce((total, item) => total + (parseFloat(item.totalValue) || 0), 0);
    };

    const subtotal = calculateSubtotal();

    const calculateGrandTotal = () => {
        const subtotal = calculateSubtotal();
        const totalTaxes = (parseFloat(cgst) || 0) + (parseFloat(sgst) || 0) + (parseFloat(igst) || 0);
        const grandTotal = subtotal + (parseFloat(freightCharges) || 0) + totalTaxes;
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

    const inputClass = "w-full px-3 py-1.5 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-sans text-sm transition";

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
            onClick={handleBackdropClick}
        >
            <div className="relative bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-2xl rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6 md:p-8 transition-colors duration-300">
                
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Close"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className='printdata font-mono text-slate-800 dark:text-gray-200'>
                <div className="relative bg-gradient-to-r from-indigo-500 to-violet-500 text-white p-4 rounded-t-lg mb-4">
                    <p className="text-2xl font-bold text-center">Update Invoice Details</p>
                    <div className="flex justify-between items-center relative">
                        <div className="flex-1 text-center pt-2" >
                            <p className="text-3xl font-custom fugaz-one-regular">{settings.company_name}</p>
                        </div>
                    </div>
                </div>

                {/* Metadata Grid Form (mobile only) */}
                <div className="block sm:hidden bg-slate-50 dark:bg-[#201d2c]/50 p-4 border border-slate-200 dark:border-[#262235] rounded-xl mb-4 space-y-3">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">M/s (Company Name)</label>
                        <input
                            type="text"
                            className={inputClass}
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">GSTIN</label>
                        <input
                            type="text"
                            className={inputClass}
                            value={gstin}
                            onChange={(e) => setGstin(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">State</label>
                        <input
                            type="text"
                            className={inputClass}
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">State Code</label>
                        <input
                            type="text"
                            className={inputClass}
                            value={stateCode}
                            onChange={(e) => setStateCode(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Invoice No</label>
                        <input
                            type="text"
                            className={inputClass}
                            value={invoiceNo}
                            onChange={(e) => setInvoiceNo(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Date</label>
                        <input
                            type="date"
                            className={inputClass}
                            value={invoiceDate}
                            onChange={(e) => setInvoiceDate(e.target.value)}
                        />
                    </div>
                </div>

                {/* Metadata Table (desktop only) */}
                <div className="hidden sm:block overflow-x-auto mb-4">
                    <table className='w-full border border-slate-200 dark:border-[#262235] rounded-lg overflow-hidden'>
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

                {/* Items List (mobile only) */}
                <div className="block md:hidden space-y-4 mb-6">
                    {items.map((item, index) => (
                        <div key={index} className="bg-slate-50 dark:bg-[#201d2c]/50 p-4 border border-slate-200 dark:border-[#262235] rounded-xl space-y-3 relative">
                            <div className="flex justify-between items-center border-b border-slate-200 dark:border-[#262235] pb-2">
                                <span className="font-bold text-slate-700 dark:text-gray-300">Item #{index + 1}</span>
                                <button
                                    className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg text-xs transition shadow-sm"
                                    onClick={() => handleDeleteItem(index)}
                                >
                                    Delete
                                </button>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Description</label>
                                <input
                                    type="text"
                                    className={inputClass}
                                    value={item.description}
                                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">HSN/SAC Code</label>
                                <input
                                    type="text"
                                    className={inputClass}
                                    value={item.hsnAsc}
                                    onChange={(e) => handleItemChange(index, 'hsnAsc', e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Quantity</label>
                                    <input
                                        type="number"
                                        className={inputClass}
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Rate</label>
                                    <input
                                        type="number"
                                        className={inputClass}
                                        value={item.rate}
                                        onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Total Value</label>
                                <input
                                    type="number"
                                    className={inputClass}
                                    value={item.totalValue}
                                    onChange={(e) => handleItemChange(index, 'totalValue', e.target.value)}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Summary & Calculations (mobile only) */}
                <div className="block md:hidden bg-slate-50 dark:bg-[#201d2c]/50 p-4 border border-slate-200 dark:border-[#262235] rounded-xl mb-4 space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-[#262235] pb-2 font-bold text-slate-800 dark:text-white text-sm">
                        <span>Subtotal:</span>
                        <span>₹{subtotal.toFixed(2)}</span>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Freight Charges</label>
                        <input
                            type="number"
                            className={inputClass}
                            value={freightCharges}
                            onChange={(e) => setFreightCharges(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">CGST Rate (%)</label>
                            <input
                                type="number"
                                className={inputClass}
                                value={cgstRate}
                                onChange={(e) => handleCgstRateChange(e.target.value)}
                                placeholder="Rate %"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">CGST Value (₹)</label>
                            <input
                                type="number"
                                className={inputClass}
                                value={cgst}
                                onChange={(e) => handleCgstValueChange(e.target.value)}
                                placeholder="Value ₹"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">SGST Rate (%)</label>
                            <input
                                type="number"
                                className={inputClass}
                                value={sgstRate}
                                onChange={(e) => handleSgstRateChange(e.target.value)}
                                placeholder="Rate %"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">SGST Value (₹)</label>
                            <input
                                type="number"
                                className={inputClass}
                                value={sgst}
                                onChange={(e) => handleSgstValueChange(e.target.value)}
                                placeholder="Value ₹"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">IGST Rate (%)</label>
                            <input
                                type="number"
                                className={inputClass}
                                value={igstRate}
                                onChange={(e) => handleIgstRateChange(e.target.value)}
                                placeholder="Rate %"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">IGST Value (₹)</label>
                            <input
                                type="number"
                                className={inputClass}
                                value={igst}
                                onChange={(e) => handleIgstValueChange(e.target.value)}
                                placeholder="Value ₹"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Grand Total</label>
                        <input
                            type="number"
                            className={inputClass}
                            value={grandTotal}
                            onChange={(e) => setGrandTotal(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Grand Total (In Words)</label>
                        <input
                            type="text"
                            className={inputClass}
                            value={grandTotalInWords}
                            onChange={(e) => setGrandTotalInWords(e.target.value)}
                        />
                    </div>
                </div>

                {/* Items Table (desktop only) */}
                <div className="hidden md:block overflow-x-auto mb-4">
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
                                            onChange={(e) => handleItemChange(index, 'totalValue', e.target.value)}
                                        />
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                        <button
                                            className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg text-xs transition shadow-sm"
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
                        className="bg-indigo-600 hover:bg-indigo-700 dark:bg-violet-600 dark:hover:bg-violet-700 text-white font-bold py-2 px-6 rounded-lg text-sm transition duration-200 shadow"
                    >
                        + Add Item Row
                    </button>
                </div>

                <div className="flex justify-center gap-4 border-t border-slate-200 dark:border-[#262235] pt-4">
                    <button
                        onClick={handleUpdate}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-lg text-sm transition duration-200 shadow"
                    >
                        Save Invoice Changes
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-gray-300 font-bold py-2.5 px-6 rounded-lg text-sm transition duration-200 shadow"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
        </div>
    );
};

export default UpdateInvoice;
