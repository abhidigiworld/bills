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
    <>
      <div className="w-full mt-10 px-4 pb-6">
        <div className="p-4 w-full bg-gradient-to-r from-blue-300 via-purple-100 to-pink-200 shadow-lg rounded-xl">
          <h6 className="text-center text-2xl font-semibold text-white mb-6 animate-pulse">Monthly Payment Overview</h6>
          <div className="flex justify-center gap-6 flex-wrap">
            {chartData.length > 0 ? (
              chartData.map((value, index) => (
                <div key={index} className="relative flex flex-col items-center w-16 sm:w-20 lg:w-12">
                  <div
                    className="bg-gradient-to-t from-blue-500 to-blue-700 rounded-md hover:from-blue-700 hover:to-blue-500 transition-all duration-300 ease-in-out"
                    style={{
                      height: `${(value / maxValue) * 250}px`, // Height grows upward
                      width: '100%',
                      position: 'relative', // Ensure the bar's height is controlled properly
                      bottom: 0, // Ensure it stays at the bottom of the container
                    }}
                  >
                    {/* Optional: Adding pulsing animation to the bars */}
                    <div className="w-full h-full animate-pulse bg-opacity-50 rounded-md"></div>
                  </div>
                  {/* Month and value should be positioned below the bars */}
                  <span className="text-sm text-gray-800 mt-2">{months[index]}</span>
                  <span className="text-sm text-gray-800 mt-1">₹{value.toFixed(2)}</span>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-200">Loading data...</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default PaymentChart;
