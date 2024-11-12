import React, { useEffect, useState } from 'react';
import axios from 'axios';

function PaymentChart() {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    axios.get('https://billsbackend-git-main-abhidigiworlds-projects.vercel.app/api/invoices')
      .then(response => {
        const data = response.data;

        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        
        // Initialize an array for storing the total payments per month (initialized to 0)
        const paymentData = new Array(12).fill(0); 

        // Loop through all invoices
        data.forEach(invoice => {
          const invoiceDate = new Date(invoice.invoiceDate);
          const monthIndex = invoiceDate.getMonth(); // Get the month index (0 = January, 1 = February, etc.)

          // Add the grand total of the invoice to the respective month
          paymentData[monthIndex] += invoice.grandTotal;
        });

        setChartData(paymentData);  // Set the data for the chart
      })
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  const maxValue = Math.max(...chartData);  // Find the maximum payment value for scaling
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="w-full mt-10 px-2 pb-6">
      <div className="p-4 w-full bg-gradient-to-r from-blue-300 via-purple-100 to-pink-200 shadow-lg rounded-xl">
        <h6 className="text-center text-2xl font-semibold text-grey-700 mb-6 animate-pulse">Monthly Billing Overview</h6>
        <div className="flex justify-center gap-6 flex-wrap">
          {chartData.length > 0 ? (
            chartData.map((value, index) => (
              value > 0 && (
                <div key={index} className="relative flex flex-col items-center w-16 sm:w-20 lg:w-12">
                  <div
                    className="bg-gradient-to-t from-blue-500 to-blue-700 rounded-md hover:from-blue-700 hover:to-blue-500 hover:animate-pulse transition-all duration-300 ease-in-out"
                    style={{
                      height: `${(value / maxValue) * 300}px`,  
                      width: '80%',
                      position: 'relative',
                      bottom: 0, 
                    }}
                  >
                    <div className="w-full h-full animate-pulse bg-opacity-80 rounded-md"></div>
                  </div>
                  <span className="text-sm text-gray-800 mt-2">{months[index]}</span>
                  <span className="text-sm text-gray-800 mt-1">₹{value.toFixed(2)}</span>
                </div>
              )
            ))
          ) : (
            <p className="text-center text-gray-200">Loading data...</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentChart;
