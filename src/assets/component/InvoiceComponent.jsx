import React, { useState, useEffect } from 'react';
import './printStyles.css';
import axios from 'axios';
import logo from '../images/LOGO.png';
import signature from '../images/sign.png';
import stamp from '../images/stamp.png';
import { API_BASE_URL } from '../../config';
import { useSettings } from '../../context/SettingsContext';

function InvoiceComponent({ invoiceDetails }) {
    const { settings } = useSettings();
    const logoSrc = settings.company_logo || logo;
    const signatureSrc = settings.company_signature || signature;
    const stampSrc = settings.company_stamp || stamp;

    const [items, setItems] = useState([]);
    const [description, setDescription] = useState('');
    const [hsnAsc, setHsnAsc] = useState('');
    const [quantity, setQuantity] = useState('');
    const [rate, setRate] = useState('');
    const [totalValueInput, setTotalValueInput] = useState('');
    const [total, setTotal] = useState(0);
    const [freightCharges, setFreightCharges] = useState(0);
    const [cgst, setCgst] = useState(0);
    const [sgst, setSgst] = useState(0);
    const [igst, setIgst] = useState(0);
    const [grandTotal, setGrandTotal] = useState(0);
    const [grandTotalInWords, setGrandTotalInWords] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [billGenerated, setBillGenerated] = useState(false);
    const [freight, setfreight] = useState();
    const [cgstRate, setcgstRate] = useState();
    const [sgstRate, setsgstRate] = useState();
    const [igstRate, setigstRate] = useState();
    const [firstPart, setFirstPart] = useState('');
    const [secondPart, setSecondPart] = useState('');

    const triggerSuccess = (msg) => {
        setSuccessMessage(msg);
        setErrorMessage('');
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const triggerError = (msg) => {
        setErrorMessage(msg);
        setSuccessMessage('');
        setTimeout(() => setErrorMessage(''), 3500);
    };

    useEffect(() => {
        // Split the address by the first comma encountered
        const firstCommaIndex = invoiceDetails.msInput.indexOf(',');
        if (firstCommaIndex !== -1) {
            const first = invoiceDetails.msInput.substring(0, firstCommaIndex).trim();
            const second = invoiceDetails.msInput.substring(firstCommaIndex + 1).trim();
            setFirstPart(first);
            setSecondPart(second);
        } else {
            // If no comma found, set the whole address in the first part
            setFirstPart(invoiceDetails.msInput);
        }
    }, [invoiceDetails.msInput])

    const addItem = () => {
        let finalTotal = parseFloat(totalValueInput) || 0;
        if (!totalValueInput && quantity && rate) {
            finalTotal = parseFloat(quantity) * parseFloat(rate);
        }

        const newItem = {
            id: items.length + 1,
            description: description,
            hsnAsc: hsnAsc,
            quantity: quantity,
            rate: rate,
            totalValue: finalTotal.toFixed(2)
        };
        setItems([...items, newItem]);
        setDescription('');
        setHsnAsc('');
        setQuantity('');
        setRate('');
        setTotalValueInput('');
    };

    const calculateBill = () => {
        let totalAmount = 0;
        items.forEach(item => {
            totalAmount += parseFloat(item.totalValue) || 0;
        });
        setTotal(totalAmount);

        const freightVal = parseFloat(freight) || 0;
        const totalTaxableAmount = totalAmount + freightVal;

        const cgstRateVal = parseFloat(cgstRate) || 0;
        const sgstRateVal = parseFloat(sgstRate) || 0;
        const igstRateVal = parseFloat(igstRate) || 0;

        // Calculate individual taxes
        const totalCgst = (totalTaxableAmount * cgstRateVal) / 100;
        const totalSgst = (totalTaxableAmount * sgstRateVal) / 100;
        const totalIgst = (totalTaxableAmount * igstRateVal) / 100;

        setFreightCharges(freightVal.toFixed(2));
        setCgst(totalCgst.toFixed(2));
        setSgst(totalSgst.toFixed(2));
        setIgst(totalIgst.toFixed(2));
        const calculatedGrandTotal = (totalTaxableAmount + totalCgst + totalSgst + totalIgst).toFixed(2);
        setGrandTotal(calculatedGrandTotal);
        const grandTotalWords = convertNumberToWords(parseFloat(calculatedGrandTotal));
        setGrandTotalInWords(grandTotalWords);
        setBillGenerated(true);
    };


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


    const handleSave = async () => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/invoices`, {
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
            triggerSuccess('Invoice saved successfully!');
        } catch (error) {
            console.error('Error:', error);
            triggerError(error.response?.data?.error || 'Failed to save invoice.');
        }
    };

    const handleInputChange2 = (e, id, field) => {
        const value = e.target.value;
        setItems(items.map(item =>
            item.id === id
                ? { ...item, [field]: field === 'quantity' || field === 'rate' ? parseFloat(value) || 0 : value }
                : item
        ));
    };

    const calculateTotalValue = (quantity, rate) => {
        return (quantity * rate).toFixed(2);
    };

    const handleQuantityOrRateChange = (e, id, field) => {
        const value = e.target.value;
        setItems(items.map(item => {
            if (item.id === id) {
                const newQuantity = field === 'quantity' ? value : item.quantity;
                const newRate = field === 'rate' ? value : item.rate;
                const q = parseFloat(newQuantity);
                const r = parseFloat(newRate);
                return {
                    ...item,
                    [field]: value,
                    totalValue: (!isNaN(q) && !isNaN(r)) ? (q * r).toFixed(2) : item.totalValue
                };
            }
            return item;
        }));
    };

    const handlePrint = () => {
        triggerError("Print the bill from view bills after saving");
    };

    const handleInputChange = (event) => {
        setGrandTotalInWords(event.target.value);
    };


    const formatDate = (dateString) => {
        const [year, month, day] = dateString.slice(0, 10).split('-');
        return `${day}-${month}-${year}`;
    };

    const handleTotalValueChange = (e, id) => {
        const newValue = e.target.value;
        setItems(items.map(item => item.id === id ? { ...item, totalValue: newValue } : item));
    };

    return (
        <>
            <div className="w-full px-4 lg:px-8 mb-12 pb-8 font-mono text-slate-800 dark:text-gray-200">
                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex flex-col space-y-4 w-full lg:w-[300px] print-hidden flex-shrink-0">
                        <div className="p-5 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-lg rounded-xl space-y-3 transition-colors duration-300">
                            <h4 className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Add Invoice Item</h4>
                            <input
                                type="text"
                                placeholder="Description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                            />
                            <input
                                type="text"
                                placeholder="HSN/SAC Code"
                                value={hsnAsc}
                                onChange={(e) => setHsnAsc(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                            />
                            <input
                                type="number"
                                placeholder="Quantity"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                            />
                            <input
                                type="number"
                                placeholder="Rate"
                                value={rate}
                                onChange={(e) => setRate(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                            />
                            <input
                                type="number"
                                placeholder="Total Value (direct whole value)"
                                value={totalValueInput}
                                onChange={(e) => setTotalValueInput(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                            />
                            <button
                                onClick={addItem}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-violet-600 dark:hover:bg-violet-700 text-white font-bold py-2 rounded-lg transition duration-200 text-sm shadow"
                            >
                                Add Item
                            </button>
                        </div>

                        {/* Mobile/Tablet Item Card Editor - hidden on lg screens and hidden in print */}
                        {items.length > 0 && (
                            <div className="lg:hidden p-5 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-lg rounded-xl space-y-4 transition-colors duration-300 print-hidden">
                                <h4 className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Edit Added Items</h4>
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                                    {items.map((item, index) => (
                                        <div key={item.id} className="p-3 bg-slate-50 dark:bg-[#201d2c]/45 border border-slate-200 dark:border-[#37314e]/60 rounded-lg space-y-3">
                                            <div className="flex justify-between items-center border-b border-slate-200/50 dark:border-[#37314e]/50 pb-1.5">
                                                <span className="text-[11px] font-bold text-slate-400">Item #{index + 1}</span>
                                                <button
                                                    onClick={() => {
                                                        const updated = items.filter(i => i.id !== item.id).map((i, idx) => ({ ...i, id: idx + 1 }));
                                                        setItems(updated);
                                                    }}
                                                    className="text-red-500 hover:text-red-655 text-xs font-bold transition"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                            <div className="space-y-2">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</label>
                                                    <input
                                                        type="text"
                                                        value={item.description}
                                                        onChange={(e) => handleInputChange2(e, item.id, 'description')}
                                                        className="w-full px-3 py-1.5 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#37314e] rounded-md text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">HSN/SAC</label>
                                                        <input
                                                            type="text"
                                                            value={item.hsnAsc}
                                                            onChange={(e) => handleInputChange2(e, item.id, 'hsnAsc')}
                                                            className="w-full px-3 py-1.5 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#37314e] rounded-md text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Value</label>
                                                        <input
                                                            type="text"
                                                            value={item.totalValue}
                                                            onChange={(e) => handleTotalValueChange(e, item.id)}
                                                            className="w-full px-3 py-1.5 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#37314e] rounded-md text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Quantity</label>
                                                        <input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => handleQuantityOrRateChange(e, item.id, 'quantity')}
                                                            className="w-full px-3 py-1.5 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#37314e] rounded-md text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Rate</label>
                                                        <input
                                                            type="number"
                                                            value={item.rate}
                                                            onChange={(e) => handleQuantityOrRateChange(e, item.id, 'rate')}
                                                            className="w-full px-3 py-1.5 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#37314e] rounded-md text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="p-5 bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-lg rounded-xl space-y-3 transition-colors duration-300">
                            <h4 className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Taxes & Discounts</h4>
                            <input
                                type="number"
                                placeholder="Freight Charges"
                                value={freight}
                                onChange={(e) => setfreight(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                            />
                            <input
                                type="number"
                                placeholder="CGST Rate (%)"
                                value={cgstRate}
                                onChange={(e) => setcgstRate(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                            />
                            <input
                                type="number"
                                placeholder="SGST Rate (%)"
                                value={sgstRate}
                                onChange={(e) => setsgstRate(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                            />
                            <input
                                type="number"
                                placeholder="IGST Rate (%)"
                                value={igstRate}
                                onChange={(e) => setigstRate(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                            />

                            <input
                                type="text"
                                id="grandTotalInWords"
                                value={grandTotalInWords}
                                onChange={handleInputChange}
                                placeholder="Enter Grand Total In Words"
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-[#201d2c] border border-slate-200 dark:border-[#37314e] rounded-lg text-sm text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                            />

                            <button
                                onClick={calculateBill}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition duration-200 text-sm shadow"
                            >
                                Calculate Bill
                            </button>
                        </div>
                    </div>
                    <div className='printdata w-full lg:flex-1 min-w-0'>
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 rounded-t-lg ">
                            <p className="text-2xl font-bold text-center">Tax Invoice</p>
                            <div className="flex justify-between items-center relative">
                                <div className="absolute" style={{ top: '-20px', left: '-10px' }}>
                                    <img src={logoSrc} alt="Your Company Logo" className="w-32 h-auto" />
                                </div>
                                <div className="flex-1 text-center pt-2" style={{ marginLeft: '155px' }}>
                                    <p className="text-3xl font-custom fugaz-one-regular">{settings.company_name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold">GSTIN: {settings.company_gstin}</p>
                                    <p className="text-sm">M.: {settings.company_phone}</p>
                                </div>
                            </div>
                            <div className="flex flex-col content-center mt-4">
                                <p className="text-sm text-center">{settings.company_address}</p>
                                <p className="text-sm text-center">E-mail id: {settings.company_email}</p>
                            </div>
                        </div>
                        <table className='bg-gray-0 w-full mb-2 mt-2 overflow-x-auto'>
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

                        <div className="overflow-x-auto">
                            <table className="w-full table-auto sm:min-w-full mb-1">
                                <thead>
                                    <tr className="bg-gray-200">
                                        <th className="border border-black py-1">S.No</th>
                                        <th className="border border-black py-1">Description</th>
                                        <th className="border border-black py-1">HSN/SAC Code</th>
                                        <th className="border border-black py-1">Quantity</th>
                                        <th className="border border-black py-1">Rate</th>
                                        <th className="border border-black py-1">Total Value</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {items.map((item, index) => (
                                        <tr key={item.id} className="text-center">
                                            <td className="border border-black py-1">{index + 1}</td>
                                            <td className="border border-black py-1">
                                                <input
                                                    type="text"
                                                    value={item.description}
                                                    onChange={(e) => handleInputChange2(e, item.id, 'description')}
                                                // className="border border-black py-1"
                                                />
                                            </td>
                                            <td className="border border-black py-1">
                                                <input
                                                    type="text"
                                                    value={item.hsnAsc}
                                                    onChange={(e) => handleInputChange2(e, item.id, 'hsnAsc')}
                                                // className="border border-black py-1"
                                                />
                                            </td>
                                            <td className="border border-black py-1">
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => handleQuantityOrRateChange(e, item.id, 'quantity')}
                                                // className="border border-black py-1"
                                                />
                                            </td>
                                            <td className="border border-black py-1">
                                                <input
                                                    type="number"
                                                    value={item.rate}
                                                    onChange={(e) => handleQuantityOrRateChange(e, item.id, 'rate')}
                                                // className="border border-black py-1"
                                                />
                                            </td>
                                            <td className="border border-black py-1">
                                                <input
                                                    type="text"
                                                    value={item.totalValue}
                                                    onChange={(e) => handleTotalValueChange(e, item.id)}
                                                // className="border border-black py-1"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-0">
                                        <td colSpan="3" rowSpan="6" className="border border-black px-1 py-1">Grand Total (In Words): <span className="font-semibold">{grandTotalInWords}</span></td>
                                        <td colSpan="2" className="border border-black px-1 py-1">Subtotal:</td>
                                        <td className="border border-black px-1 py-1">{total !== undefined ? total.toFixed(2) : '-'}</td>
                                    </tr>
                                    <tr className="bg-gray-0">
                                        <td colSpan="2" className="border border-black px-1 py-1">Freight</td>
                                        <td className="border border-black px-1 py-1">{freight}</td>
                                    </tr>
                                    <tr className="bg-gray-0">
                                        <td colSpan="2" className="border border-black px-1 py-1">CGST:{cgstRate} %</td>
                                        <td className="border border-black px-1 py-1">{cgst}</td>
                                    </tr>
                                    <tr className="bg-gray-0">
                                        <td colSpan="2" className="border border-black px-1 py-1">SGST:{sgstRate} %</td>
                                        <td className="border border-black px-1 py-1">{sgst}</td>
                                    </tr>
                                    <tr className="bg-gray-0">
                                        <td colSpan="2" className="border border-black px-1 py-1">IGST:{igstRate} % </td>
                                        <td className="border border-black px-1 py-1">{igst}</td>
                                    </tr>
                                    <tr className="bg-gray-0">
                                        <td colSpan="2" className="border border-black px-1 py-1">Grand Total:</td>
                                        <td className="border border-black px-1 py-1">{grandTotal}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 px-2 flex justify-between">
                            <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Terms & Conditions: </p>
                                <ul className="list-disc pl-4 text-[10px] text-gray-600 text-left leading-normal mt-1">
                                    <li>All disputes are subject to jurisdiction of Delhi Courts</li>
                                    <li>Payment should be made by cash/cheque/draft only.</li>
                                    <li>Late payment will be charged if bill unpaid for 15 days.</li>
                                </ul>
                            </div>
                            <div className="text-right flex flex-col justify-between h-20 min-w-[200px] relative print:h-20">
                                <p className="text-[10px] font-bold text-gray-750">For {settings.company_name}</p>
                                <div className="relative h-8 w-full flex items-end justify-end">
                                    <img src={signatureSrc} alt="Signature" className="absolute bottom-[-40px] right-2 max-h-16 w-auto object-contain z-20 pointer-events-none" />
                                    <img src={stampSrc} alt="stamp" className="absolute bottom-[-45px] right-8 max-h-22 w-auto object-contain z-10 opacity-85 pointer-events-none" />
                                </div>
                                <p className="text-[10px] font-bold text-gray-750 relative z-0">Authorised Signatory</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end mt-4">
                    <button onClick={handleSave} className="bg-green-500 text-white px-4 py-2 rounded-md mr-2 hover:bg-green-600 print-hidden">Save</button>
                    <button onClick={handlePrint} className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 print-hidden">Print</button>
                </div>
            </div>
            {/* Centered Premium Overlay Modal for Notifications */}
            {(successMessage || errorMessage) && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in print-hidden">
                    <div className="bg-white dark:bg-[#181622]/95 border border-slate-200 dark:border-[#262235] shadow-2xl rounded-2xl p-6 sm:p-8 w-full max-w-sm text-center relative transition-all duration-300 animate-slide-down">
                        {/* Close button */}
                        <button
                            onClick={() => {
                                setSuccessMessage('');
                                setErrorMessage('');
                            }}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Close"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {successMessage ? (
                            <div className="space-y-4">
                                <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-950/40 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">Success!</h3>
                                <p className="text-sm text-slate-600 dark:text-gray-300">{successMessage}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-950/40 rounded-full flex items-center justify-center text-red-600 dark:text-red-400">
                                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">Notification</h3>
                                <p className="text-sm text-slate-600 dark:text-gray-300">{errorMessage}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

export default InvoiceComponent;
