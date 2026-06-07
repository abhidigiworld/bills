import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { API_BASE_URL } from '../../config';

// Register ChartJS elements
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

function PaymentChart() {
  const [invoices, setInvoices] = useState([]);
  
  // Dynamic filter lists
  const [yearsList, setYearsList] = useState([]);
  const [statesList, setStatesList] = useState([]);
  const [companiesList, setCompaniesList] = useState([]);

  // Selected filters
  const [selectedYear, setSelectedYear] = useState('All Years');
  const [selectedState, setSelectedState] = useState('All States');
  const [selectedCompany, setSelectedCompany] = useState('All Companies');

  // Chart data states
  const [filteredBarData, setFilteredBarData] = useState(new Array(12).fill(0));
  const [filteredStateData, setFilteredStateData] = useState({});
  const [filteredCompanyData, setFilteredCompanyData] = useState({});

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/invoices`)
      .then(response => {
        const data = response.data;
        setInvoices(data);

        // Dynamically extract unique years, states, and companies
        const yearsSet = new Set();
        const statesSet = new Set();
        const companiesSet = new Set();

        data.forEach(invoice => {
          if (invoice.invoiceDate) {
            const year = new Date(invoice.invoiceDate).getFullYear();
            if (year) yearsSet.add(year.toString());
          }
          if (invoice.state) {
            statesSet.add(invoice.state.trim());
          }
          if (invoice.companyName) {
            // Take the first part of company name before comma for cleaner filtering
            const name = invoice.companyName.split(',')[0].trim();
            companiesSet.add(name);
          }
        });

        setYearsList([...yearsSet].sort((a, b) => b - a));
        setStatesList([...statesSet].sort());
        setCompaniesList([...companiesSet].sort());
      })
      .catch(error => console.error('Error fetching invoice data:', error));
  }, []);

  // Update filtered data whenever filter states or invoices change
  useEffect(() => {
    const monthlyTotals = new Array(12).fill(0);
    const stateTotals = {};
    const companyTotals = {};

    invoices.forEach(invoice => {
      const date = new Date(invoice.invoiceDate);
      const invoiceYear = date.getFullYear().toString();
      const invoiceMonthIndex = date.getMonth();
      const invoiceState = invoice.state?.trim() || '';
      const invoiceCompany = invoice.companyName?.split(',')[0]?.trim() || '';
      const amount = invoice.grandTotal || 0;

      // Check filters
      const matchYear = selectedYear === 'All Years' || invoiceYear === selectedYear;
      const matchState = selectedState === 'All States' || invoiceState === selectedState;
      const matchCompany = selectedCompany === 'All Companies' || invoiceCompany === selectedCompany;

      if (matchYear && matchState && matchCompany) {
        // Accumulate monthly bar data
        monthlyTotals[invoiceMonthIndex] += amount;

        // Accumulate state pie data
        if (invoiceState) {
          stateTotals[invoiceState] = (stateTotals[invoiceState] || 0) + amount;
        }

        // Accumulate company pie data
        if (invoiceCompany) {
          companyTotals[invoiceCompany] = (companyTotals[invoiceCompany] || 0) + amount;
        }
      }
    });

    setFilteredBarData(monthlyTotals);
    setFilteredStateData(stateTotals);
    setFilteredCompanyData(companyTotals);
  }, [invoices, selectedYear, selectedState, selectedCompany]);

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // Bar Chart Configuration
  const barChartData = {
    labels: months,
    datasets: [
      {
        label: 'Total Billing (₹)',
        data: filteredBarData,
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        borderRadius: 8,
        hoverBackgroundColor: 'rgba(153, 102, 255, 0.8)',
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `₹ ${context.parsed.y.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return '₹' + value.toLocaleString();
          }
        }
      }
    }
  };

  // Pie Chart Helper
  const getPieChartData = (totals) => ({
    labels: Object.keys(totals),
    datasets: [
      {
        data: Object.values(totals),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
          '#E7E9ED', '#76A343', '#D64541', '#1BBC9B', '#4D8FAC', '#9B59B6'
        ],
        hoverBackgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
          '#E7E9ED', '#76A343', '#D64541', '#1BBC9B', '#4D8FAC', '#9B59B6'
        ],
        borderWidth: 1,
      },
    ],
  });

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 15,
          font: {
            size: 11
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const val = context.parsed;
            return `${context.label}: ₹ ${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
          }
        }
      }
    }
  };

  return (
    <div className="w-full mt-6 px-2 pb-6">
      <div className="p-6 w-full bg-gradient-to-r from-blue-100 via-purple-50 to-pink-100 shadow-xl rounded-xl border border-indigo-50">
        <h6 className="text-center text-3xl font-extrabold text-indigo-950 mb-6 tracking-wide">
          Billing Analytics
        </h6>

        {/* Filters Panel */}
        <div className="bg-white bg-opacity-70 backdrop-blur-md rounded-lg p-4 shadow-sm mb-6 flex flex-wrap gap-4 justify-center items-center border border-white">
          <div className="flex flex-col min-w-[140px]">
            <label className="text-xs font-bold text-gray-500 mb-1">Select Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="p-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All Years">All Years</option>
              {yearsList.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="flex flex-col min-w-[160px]">
            <label className="text-xs font-bold text-gray-500 mb-1">Filter by State</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="p-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All States">All States</option>
              {statesList.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex flex-col min-w-[200px]">
            <label className="text-xs font-bold text-gray-500 mb-1">Filter by Company</label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="p-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All Companies">All Companies</option>
              {companiesList.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Reset Filters Link */}
          {(selectedYear !== 'All Years' || selectedState !== 'All States' || selectedCompany !== 'All Companies') && (
            <button
              onClick={() => {
                setSelectedYear('All Years');
                setSelectedState('All States');
                setSelectedCompany('All Companies');
              }}
              className="mt-4 text-xs text-indigo-700 hover:text-indigo-900 font-bold transition hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Bar Chart Block */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-indigo-50 mb-8">
          <h6 className="text-left text-lg font-bold text-gray-800 mb-4">
            Monthly Payout Distribution ({selectedYear})
          </h6>
          <div className="h-80 w-full relative">
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>

        {/* Pie Charts Block */}
        <div className="flex flex-col lg:flex-row justify-center items-stretch gap-6">
          {/* State Pie Chart */}
          <div className="flex flex-col bg-white rounded-xl p-6 shadow-sm border border-indigo-50 w-full lg:w-1/2">
            <h6 className="text-center text-base font-bold text-gray-800 mb-4">State-wise Breakdown</h6>
            <div className="h-64 relative flex items-center justify-center">
              {Object.keys(filteredStateData).length > 0 ? (
                <Pie data={getPieChartData(filteredStateData)} options={pieChartOptions} />
              ) : (
                <p className="text-gray-400 text-sm">No billing data matching selected filters.</p>
              )}
            </div>
          </div>

          {/* Company Pie Chart */}
          <div className="flex flex-col bg-white rounded-xl p-6 shadow-sm border border-indigo-50 w-full lg:w-1/2">
            <h6 className="text-center text-base font-bold text-gray-800 mb-4">Company-wise Breakdown</h6>
            <div className="h-64 relative flex items-center justify-center">
              {Object.keys(filteredCompanyData).length > 0 ? (
                <Pie data={getPieChartData(filteredCompanyData)} options={pieChartOptions} />
              ) : (
                <p className="text-gray-400 text-sm">No billing data matching selected filters.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentChart;
