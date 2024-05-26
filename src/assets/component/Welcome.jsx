import React from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

function WelcomePage() {
  return (
    <>
      <Header />
      <div className="bg-gray-100 min-h-screen flex flex-col justify-center items-center">
        <h1 className="text-3xl font-bold mb-8">Welcome to Sakshi Enterprises</h1>
        <div className="flex flex-col md:flex-row gap-4">
          <Link to="/existing-bills" className="bg-blue-500 text-white px-6 py-3 rounded-md shadow-md hover:bg-blue-600 transition duration-300">View Existing Bills</Link>
          <Link to="/new-bill" className="bg-green-500 text-white px-6 py-3 rounded-md shadow-md hover:bg-green-600 transition duration-300">Create New Bill</Link>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default WelcomePage;
