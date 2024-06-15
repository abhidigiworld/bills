import React from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import './printStyles.css';
import bouncingImage from '../images/chair.png'

function WelcomePage() {
  return (
    <>
      <Header />
      <div className="bg-indigo-50 h-screen flex flex-col justify-center items-center">
        <div className='flex flex-row justify-center items-center'>
          <div className="hidden md:block">
            <img
              src={bouncingImage}
              alt="Bouncing Image"
              className="animate-custom-bounce w-full h-auto"
            />
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <Link to="/existing-bills" className="bg-blue-500 text-white px-6 py-3 rounded-md shadow-md hover:bg-blue-600 transition duration-300 shadow-2xl shadow-blue-500/50 hover:shadow-none">View Existing Bills</Link>
            <Link to="/new-bill" className="bg-green-500 text-white px-6 py-3 rounded-md shadow-md hover:bg-green-600 transition duration-300 shadow-2xl shadow-green-500/50 hover:shadow-none">Create New Bill</Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default WelcomePage;
