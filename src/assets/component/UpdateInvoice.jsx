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

        // Recalculate the total value when quantity or rate changes
        if (field === 'quantity' || field === 'rate') {
            newItems[index].totalValue = newItems[index].quantity * newItems[index].rate;
        }

        setItems(newItems);
    };

    const calculateSubtotal = () => {
        return items.reduce((total, item) => total + (item.quantity * item.rate), 0);
    };

    const subtotal = calculateSubtotal();
    const cgstper = cgst ? ((cgst / subtotal) * 100).toFixed(2) : 0;
    const sgstper = sgst ? ((sgst / subtotal) * 100).toFixed(2) : 0;
    const igstper = igst ? ((igst / subtotal) * 100).toFixed(2) : 0;

    const calculateGrandTotal = () => {
        // Calculate subtotal
        const subtotal = calculateSubtotal();

        // Calculate total taxes (sum of CGST, SGST, IGST)
        const totalTaxes = parseFloat(cgst) + parseFloat(sgst) + parseFloat(igst);

        // Calculate grand total (subtotal + freight charges + total taxes)
        const grandTotal = subtotal + parseFloat(freightCharges) + totalTaxes;

        // Set the calculated grand total
        setGrandTotal(grandTotal.toFixed(2));
    };

    const handleDeleteItem = (index) => {
        const newItems = items.filter((_, i) => i !== index); // Filter out the item at the given index
        setItems(newItems);
    };

    // Call calculateGrandTotal whenever any of the relevant values change
    useEffect(() => {
        calculateGrandTotal();
    }, [subtotal, freightCharges, cgst, sgst, igst]);

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
                                <td colSpan="2" className="px-3 py-2 text-slate-500 dark:text-gray-400 font-bold uppercase text-xs text-right">CGST: {cgstper} %</td>
                                <td colSpan="2" className="px-3 py-2">
                                    <input
                                        type="number"
                                        className={inputClass}
                                        value={cgst}
                                        onChange={(e) => setCgst(e.target.value)}
                                    />
                                </td>
                            </tr>
                            <tr className="border-b border-slate-100 dark:border-[#262235]">
                                <td colSpan="2" className="px-3 py-2 text-slate-500 dark:text-gray-400 font-bold uppercase text-xs text-right">SGST: {sgstper} %</td>
                                <td colSpan="2" className="px-3 py-2">
                                    <input
                                        type="number"
                                        className={inputClass}
                                        value={sgst}
                                        onChange={(e) => setSgst(e.target.value)}
                                    />
                                </td>
                            </tr>
                            <tr className="border-b border-slate-100 dark:border-[#262235]">
                                <td colSpan="2" className="px-3 py-2 text-slate-500 dark:text-gray-400 font-bold uppercase text-xs text-right">IGST: {igstper} %</td>
                                <td colSpan="2" className="px-3 py-2">
                                    <input
                                        type="number"
                                        className={inputClass}
                                        value={igst}
                                        onChange={(e) => setIgst(e.target.value)}
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
