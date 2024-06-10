import React from 'react';
import './printStyles.css';

function Footer() {
  return (
    <footer className="fixed bottom-0 w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white p-4 print-hidden">
      <div className="container mx-auto text-center">
        <p>&copy; Sakshi Enterprises {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}

export default Footer;
