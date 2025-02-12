import React from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import PaymentChart from './PaymentChart';
import './printStyles.css';
import bouncingImage from '../images/chair.png';

function WelcomePage() {
  return (
    <>
      <Header />
      <div className=" min-h-screen flex flex-col justify-center items-center px-4 pt-8 pb-8">
        <p className='bg-red-100 p-2 border-2 border-red-500 rounded-xl text-red-600 animate-pulse mb-6'>
          The "Salary Slip" button is currently under development. Please check back later.
        </p>
        <p className='bg-green-100 p-2 border-2 border-green-500 rounded-xl text-green-600 animate-pulse mb-6'>
          You can use the 'Add Employee' button to add a new employee or update an existing one.
        </p>
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-4">
          <div className="hidden md:block w-full max-w-xs">
            <img
              src="https://i.pinimg.com/originals/46/71/c6/4671c6bfaa611757647e91a3aca2ba4f.gif"
              alt="Bouncing Image"
              className="animate-custom-bounce w-full h-auto"
            />
          </div>
          <div className="flex flex-col flex-wrap md:flex-row gap-4 w-full max-w-xs sm:max-w-md md:max-w-lg">
            <Link
              to="/existing-bills"
              className="bg-blue-500 text-white px-6 py-3 rounded-md shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out hover:bg-blue-600 hover:translate-y-1"
            >
              View Existing Bills
            </Link>
            <Link
              to="/new-bill"
              className="bg-green-500 text-white px-6 py-3 rounded-md shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out hover:bg-green-600 hover:translate-y-1"
            >
              Create New Bill
            </Link>
            <Link
              to="/new-employee"
              className="bg-green-500 text-white px-6 py-3 rounded-md shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out hover:bg-green-600 hover:translate-y-1"
            >
              Add New Employee
            </Link>
            <Link
              to="/new-Salary"
              className="bg-green-500 text-white px-6 py-3 rounded-md shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out hover:bg-green-600 hover:translate-y-1"
            >
              Salary Slip
            </Link>
          </div>

        </div>
        <div className="w-full text-center mt-4">
          <PaymentChart />
        </div>
      </div>
      <Footer />
    </>
  );
}

export default WelcomePage;
