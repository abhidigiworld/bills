import React, { useState, useEffect } from 'react';
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
    const [firstPart, setFirstPart] = useState('');
    const [secondPart, setSecondPart] = useState('');

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
        const newItem = {
            id: items.length + 1,
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
                return {
                    ...item,
                    [field]: parseFloat(value) || 0,
                    totalValue: calculateTotalValue(newQuantity, newRate)
                };
            }
            return item;
        }));
    };

    const handlePrint = () => {
        alert("Print the bill from view bills after saving");
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
            <div className="container mx-auto px-4 lg:px-8 mb-12 pb-8 font-mono">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex flex-col space-y-2 w-full lg:w-1/3 print-hidden">
                        <div className="p-4 bg-white shadow-lg rounded-lg space-y-4 print-hidden">
                            <input
                                type="text"
                                placeholder="Description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="border px-3 py-2 rounded w-full"
                            />
                            <input
                                type="text"
                                placeholder="HSN/SAC Code"
                                value={hsnAsc}
                                onChange={(e) => setHsnAsc(e.target.value)}
                                className="border px-3 py-2 rounded w-full"
                            />
                            <input
                                type="number"
                                placeholder="Quantity"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="border px-3 py-2 rounded w-full"
                            />
                            <input
                                type="number"
                                placeholder="Rate"
                                value={rate}
                                onChange={(e) => setRate(e.target.value)}
                                className="border px-3 py-2 rounded w-full"
                            />
                            <button
                                onClick={addItem}
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-300"
                            >
                                Add
                            </button>
                        </div>

                        <div className="p-4 bg-white shadow-lg rounded-lg space-y-4 print-hidden">
                            <input
                                type="number"
                                placeholder="Freight Charges"
                                value={freight}
                                onChange={(e) => setfreight(e.target.value)}
                                className="border px-3 py-2 rounded w-full"
                            />
                            <input
                                type="number"
                                placeholder="CGST Rate"
                                value={cgstRate}
                                onChange={(e) => setcgstRate(e.target.value)}
                                className="border px-3 py-2 rounded w-full"
                            />
                            <input
                                type="number"
                                placeholder="SGST Rate"
                                value={sgstRate}
                                onChange={(e) => setsgstRate(e.target.value)}
                                className="border px-3 py-2 rounded w-full"
                            />
                            <input
                                type="number"
                                placeholder="IGST Rate"
                                value={igstRate}
                                onChange={(e) => setigstRate(e.target.value)}
                                className="border px-3 py-2 rounded w-full"
                            />

                            <input
                                type="text"
                                id="grandTotalInWords"
                                value={grandTotalInWords}
                                onChange={handleInputChange}
                                placeholder="Enter Grand Total In Words"
                                className="border px-3 py-2 rounded w-full"
                            />

                            <button
                                onClick={calculateBill}
                                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition duration-300"
                            >
                                Generate Bill
                            </button>
                        </div>

                    </div>
                    <div className='printdata w-full'>
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 rounded-t-lg ">
                            <p className="text-2xl font-bold text-center">Tax Invoice</p>
                            <div className="flex justify-between items-center relative">
                                <div className="absolute" style={{ top: '-20px', left: '-10px' }}>
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
                                                    className="border border-black py-1"
                                                />
                                            </td>
                                            <td className="border border-black py-1">
                                                <input
                                                    type="text"
                                                    value={item.hsnAsc}
                                                    onChange={(e) => handleInputChange2(e, item.id, 'hsnAsc')}
                                                    className="border border-black py-1"
                                                />
                                            </td>
                                            <td className="border border-black py-1">
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => handleQuantityOrRateChange(e, item.id, 'quantity')}
                                                    className="border border-black py-1"
                                                />
                                            </td>
                                            <td className="border border-black py-1">
                                                <input
                                                    type="number"
                                                    value={item.rate}
                                                    onChange={(e) => handleQuantityOrRateChange(e, item.id, 'rate')}
                                                    className="border border-black py-1"
                                                />
                                            </td>
                                            <td className="border border-black py-1">
                                                <input
                                                    type="text"
                                                    value={item.totalValue}
                                                    onChange={(e) => handleTotalValueChange(e, item.id)}
                                                    className="border border-black py-1"
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
                                <p className="text-sm text-gray-500">Terms & Conditions: </p>
                                <ul className="list-disc pl-4 text-gray-600 text-left tracking-tight">
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
