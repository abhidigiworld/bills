import React from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import bouncingImage from '../images/chair.png'; 
import './printStyles.css';

function WelcomePage() {
  return (
    <>
      <Header />
      <div className="relative bg-gray-100 min-h-screen flex flex-col justify-center items-center">
        <h1 className="text-3xl font-bold mb-8 text-center">Welcome to Sakshi Enterprises</h1>
        {/* <div className="absolute left-0 top-1/2 transform -translate-y-1/2 hidden md:block">
          <img 
            src={bouncingImage} 
            alt="Bouncing Image" 
            className="animate-custom-bounce" 
          />
        </div> */}
        <div className="flex flex-col md:flex-row gap-4">
          <Link to="/existing-bills" className="bg-blue-500 text-white px-6 py-3 rounded-md shadow-md hover:bg-blue-600 transition duration-300 shadow-2xl shadow-blue-500/50 hover:shadow-none">View Existing Bills</Link>
          <Link to="/new-bill" className="bg-green-500 text-white px-6 py-3 rounded-md shadow-md hover:bg-green-600 transition duration-300 shadow-2xl shadow-green-500/50 hover:shadow-none">Create New Bill</Link>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default WelcomePage;
