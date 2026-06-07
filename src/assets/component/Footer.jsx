import React from 'react';
import './printStyles.css';

function Footer() {
  return (
    <footer className="w-full bg-white dark:bg-[#181622] text-slate-500 dark:text-gray-400 border-t border-slate-200 dark:border-[#262235] p-3 text-center print-hidden transition-colors duration-300 shadow-sm">
      <div className="container mx-auto text-xs font-semibold uppercase tracking-wider">
        <p>&copy; Sakshi Enterprises {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}

export default Footer;
