import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    websiteTitle: 'AUCTION PRO',
    auctionTitle: 'Premier Cricket League Auction 2026',
    currencySymbol: '₹',
    defaultBudget: 100000000,
    defaultIncrement: 500000,
    publicDisplayUrl: '/live'
  });

  const fetchSettings = async () => {
    try {
      const res = await axiosClient.get('/settings/public');
      if (res.data.success && res.data.settings) {
        setSettings(prev => ({ ...prev, ...res.data.settings }));
      }
    } catch (err) {
      console.warn('Could not load settings:', err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
    const num = Number(amount);
    const sym = settings.currencySymbol || '₹';

    // Format with Indian Numbering or international commas
    return `${sym} ${num.toLocaleString('en-IN')}`;
  };

  const formatLakhCrore = (amount) => {
    if (!amount || isNaN(amount)) return '0';
    const num = Number(amount);
    const sym = settings.currencySymbol || '₹';

    if (num >= 10000000) {
      return `${sym} ${(num / 10000000).toFixed(2)} Cr`;
    }
    if (num >= 100000) {
      return `${sym} ${(num / 100000).toFixed(2)} Lakh`;
    }
    return `${sym} ${num.toLocaleString('en-IN')}`;
  };

  return (
    <SettingsContext.Provider value={{ settings, setSettings, fetchSettings, formatCurrency, formatLakhCrore }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
