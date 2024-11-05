import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './printStyles.css';
import logo from '../images/LOGO.png'; 

function Header() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/'); 
  };

  return (
    <header className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 print-hidden">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center">
          <Link to={'/Main'} className="flex items-center">
            <img src={logo} alt="Sakshi Enterprises Logo" className="h-8 mr-2" /> Sakshi Enterprises
          </Link>
        </h1>
        <p className="text-right hidden md:block">Providing Quality Services Since 2024</p>
        <button 
          onClick={handleLogout} 
          className="bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600 ml-4">
          Logout
        </button>
      </div>
    </header>
  );
}

export default Header;
