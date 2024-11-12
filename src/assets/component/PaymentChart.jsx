import React, { useEffect, useState } from 'react';
import axios from 'axios';

function PaymentChart() {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    axios.get('https://billsbackend-git-main-abhidigiworlds-projects.vercel.app/api/invoices')
      .then(response => {
        const data = response.data;

        // Set months for the x-axis
        const months = ["April", "May", "June", "July", "August", "September", "October", "November", "December", "January", "February", "March"];
        
        // Calculate total payments for each month
        const paymentData = months.map(() => 0);  // Initialize all payments to 0
        
        data.forEach(invoice => {
          const invoiceDate = new Date(invoice.invoiceDate);
          const monthIndex = invoiceDate.getMonth(); // Get the month index from the invoice date
          
          // Sum up all items' total values for each invoice
          const totalInvoiceValue = invoice.items.reduce((sum, item) => sum + item.totalValue, 0);
          paymentData[monthIndex] += totalInvoiceValue; // Add the invoice total to the corresponding month
        });

        setChartData(paymentData);  // Set the data for the chart
      })
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  const maxValue = Math.max(...chartData);  // Find the maximum payment value for scaling
  const months = ["April", "May", "June", "July", "August", "September", "October", "November", "December", "January", "February", "March"];

  return (
    <div className="w-full mt-10 px-4 pb-6">
      <div className="p-4 w-full bg-white shadow-lg rounded-xl">
        <h6 className="text-center text-xl font-semibold text-blue-700 mb-6">Monthly Payment Overview</h6>
        <div className="flex justify-center gap-4 flex-wrap">
          {chartData.length > 0 ? (
            chartData.map((value, index) => (
              <div key={index} className="relative flex flex-col items-center w-16 sm:w-20 md:w-24 lg:w-12">
                <div
                  className="bg-blue-500 rounded-md hover:bg-blue-700 transition-all duration-300 ease-in-out"
                  style={{
                    height: `${(value / maxValue) * 250}px`,
                    width: '100%',
                  }}
                ></div>
                <span className="text-sm text-gray-700 mt-2">{months[index]}</span>
                <span className="text-sm text-gray-600 mt-1">₹{value.toFixed(2)}</span> {/* Display amount in INR */}
              </div>
            ))
          ) : (
            <p className="text-center text-gray-600">Loading data...</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentChart;
