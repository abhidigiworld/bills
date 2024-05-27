import React from 'react';
import './printStyles.css';

function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-4 print-hidden">
      <div className="container mx-auto text-center">
        <p>&copy; Sakshi Enterprises {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}

export default Footer;
