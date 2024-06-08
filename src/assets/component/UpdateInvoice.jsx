import React, { useState , useEffect} from 'react';
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

            await axios.put(`https://billsbackend-git-main-abhidigiworlds-projects.vercel.app/api/invoices/${invoice._id}`, updatedInvoice);
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
    
    // Call calculateGrandTotal whenever any of the relevant values change
    useEffect(() => {
        calculateGrandTotal();
    }, [subtotal, freightCharges, cgst, sgst, igst]);

    return (
        <div className="mb-12">
            <div className='printdata font-mono'>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 rounded-t-lg mb-4">
                    <p className="text-2xl font-bold text-center">Update Invoice</p>
                    <div className="flex justify-between items-center relative">
                        <div className="flex-1 text-center pt-2" >
                            <p className="text-3xl font-custom fugaz-one-regular">Sakshi Enterprises</p>
                        </div>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                <table className='w-full mb-2 '>
                    <thead>
                        <tr>
                            <td colSpan="2" className="border border-black px-2 py-1">M/s:</td>
                            <td colSpan="1" className="border border-black px-2 py-1">
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                />
                            </td>
                            <td colSpan="2" className="border border-black px-2 py-1">Invoice No:</td>
                            <td colSpan="2" className="border border-black px-2 py-1">
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded"
                                    value={invoiceNo}
                                    onChange={(e) => setInvoiceNo(e.target.value)}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td colSpan="2" className="border border-black px-2 py-1">GSTIN:</td>
                            <td colSpan="1" className="border border-black px-2 py-1">
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded"
                                    value={gstin}
                                    onChange={(e) => setGstin(e.target.value)}
                                />
                            </td>
                            <td colSpan="2" className="border border-black px-2 py-1">Date:</td>
                            <td colSpan="2" className="border border-black px-2 py-1 custom-width">
                                <input
                                    type="date"
                                    className="w-full px-3 py-2 border rounded bg-white text-black"
                                    value={invoiceDate}
                                    onChange={(e) => setInvoiceDate(e.target.value)}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td colSpan="2" className="border border-black px-2 py-1">State:</td>
                            <td colSpan="1" className="border border-black px-2 py-1">
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded"
                                    value={state}
                                    onChange={(e) => setState(e.target.value)}
                                />
                            </td>
                            <td colSpan="2" className="border border-black px-2 py-1">State Code:</td>
                            <td colSpan="2" className="border border-black px-2 py-1">
                                <span className="font-semibold"><input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded"
                                    value={stateCode}
                                    onChange={(e) => setStateCode(e.target.value)}
                                /></span>
                            </td>
                        </tr>
                    </thead>
                </table>
                </div>

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
                                <tr key={index} className="text-center">
                                    <td className="border border-black py-1">{index + 1}</td>
                                    <td className="border border-black py-1">
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border rounded"
                                            value={item.description}
                                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                        />
                                    </td>
                                    <td className="border border-black py-1">
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border rounded"
                                            value={item.hsnAsc}
                                            onChange={(e) => handleItemChange(index, 'hsnAsc', e.target.value)}
                                        />
                                    </td>
                                    <td className="border border-black py-1">
                                        <input
                                            type="number"
                                            className="w-full px-3 py-2 border rounded"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                        />
                                    </td>
                                    <td className="border border-black py-1">
                                        <input
                                            type="number"
                                            className="w-full px-3 py-2 border rounded"
                                            value={item.rate}
                                            onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                                        />
                                    </td>
                                    <td className="border border-black py-1">
                                        <input
                                            type="number"
                                            className="w-full px-3 py-2 border rounded"
                                            value={item.totalValue} // Use totalValue directly
                                            readOnly // Make the input read-only to prevent direct editing
                                        />

                                    </td>
                                </tr>
                            ))}
                            <tr className="bg-gray-0">
                                <td colSpan="3" rowSpan="6" className="border border-black px-1 py-1">Grand Total (In Words): <span className="font-semibold">
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border rounded"
                                        value={grandTotalInWords}
                                        onChange={(e) => setGrandTotalInWords(e.target.value)}
                                    />
                                </span></td>
                                <td colSpan="2" className="border border-black px-1 py-1">Subtotal:</td>
                                <td className="border border-black px-1 py-1">{subtotal.toFixed(2)}</td>
                            </tr>
                            <tr className="bg-gray-0">
                                <td colSpan="2" className="border border-black px-1 py-1">Freight</td>
                                <td className="border border-black px-1 py-1">
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 border rounded"
                                        value={freightCharges}
                                        onChange={(e) => setFreightCharges(e.target.value)}
                                    />
                                </td>
                            </tr>
                            <tr className="bg-gray-0">
                                <td colSpan="2" className="border border-black px-1 py-1">CGST: {cgstper} %</td>
                                <td className="border border-black px-1 py-1">
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 border rounded"
                                        value={cgst}
                                        onChange={(e) => setCgst(e.target.value)}
                                    />
                                </td>
                            </tr>
                            <tr className="bg-gray-0">
                                <td colSpan="2" className="border border-black px-1 py-1">SGST: {sgstper} %</td>
                                <td className="border border-black px-1 py-1">
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 border rounded"
                                        value={sgst}
                                        onChange={(e) => setSgst(e.target.value)}
                                    />
                                </td>
                            </tr>
                            <tr className="bg-gray-0">
                                <td colSpan="2" className="border border-black px-1 py-1">IGST: {igstper} %</td>
                                <td className="border border-black px-1 py-1">
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 border rounded"
                                        value={igst}
                                        onChange={(e) => setIgst(e.target.value)}
                                    />
                                </td>
                            </tr>
                            <tr className="bg-gray-0">
                                <td colSpan="2" className="border border-black px-1 py-1">Grand Total:</td>
                                <td className="border border-black px-1 py-1">  <input
                                    type="number"
                                    className="w-full px-3 py-2 border rounded"
                                    value={grandTotal}
                                    onChange={(e) => setGrandTotal(e.target.value)}
                                /></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 flex justify-center pb-4">
                    <button
                        onClick={handleUpdate}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                        Update Invoice
                    </button>
                    <button
                        onClick={onClose}
                        className="ml-4 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpdateInvoice;

