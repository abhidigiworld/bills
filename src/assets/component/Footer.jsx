import React from 'react';
import './printStyles.css';
import { useSettings } from '../../context/SettingsContext';

function Footer() {
  const { settings } = useSettings();
  return (
    <footer className="w-full bg-white dark:bg-[#181622] text-slate-500 dark:text-gray-400 border-t border-slate-200 dark:border-[#262235] p-3 print-hidden transition-colors duration-300 shadow-sm">
      <div className="container mx-auto text-xs font-semibold uppercase tracking-wider flex flex-col sm:flex-row justify-between items-center gap-2">
        <p>&copy; {settings.company_name} {new Date().getFullYear()}</p>
        <p className="normal-case font-medium text-[11px] text-slate-400 dark:text-[#6e6393]">Providing Quality Services Since 2024</p>
      </div>
    </footer>
  );
}

export default Footer;
