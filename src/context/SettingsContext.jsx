import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    company_name: 'Sakshi Enterprises',
    company_subtitle: 'Enterprise management and payroll portal',
    company_gstin: '07OURPS6573P1ZY',
    company_phone: '9650650297',
    company_email: 'manojsharma.2016m@gmail.com',
    company_address: 'D-435, Gali No.-59,Mahavir Enclave,Part-3,West Delhi-110059',
    company_logo: '',
    company_signature: '',
    company_stamp: ''
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/system-settings`);
      if (response.data && response.data.success) {
        setSettings(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load system settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings: fetchSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
