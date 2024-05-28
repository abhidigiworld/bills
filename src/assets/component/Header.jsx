import React from 'react';
import { Link } from 'react-router-dom';
import './printStyles.css';
import logo from '../images/LOGO.png'; 

function Header() {
  return (
    <header className="bg-blue-500 text-white py-4 print-hidden">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center">
          <Link to={'/Main'} className="flex items-center">
            <img src={logo} alt="Sakshi Enterprises Logo" className="h-8 mr-2" /> Sakshi Enterprises
          </Link>
        </h1>
        <p className="text-right hidden md:block">Providing Quality Services Since 2024</p>
      </div>
    </header>
  );
}

export default Header;
