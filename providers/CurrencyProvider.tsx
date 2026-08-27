"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Currency = "USD" | "UZS";

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  toggleCurrency: () => void;
  exchangeRate?: number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children, initialExchangeRate }: { children: React.ReactNode, initialExchangeRate?: number }) {
  const [currency, setCurrency] = useState<Currency>("UZS");
  const [exchangeRate, setExchangeRate] = useState<number | undefined>(initialExchangeRate);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("preferred_currency") as Currency;
    if (saved === "USD" || saved === "UZS") {
      setCurrency(saved);
    }
    setMounted(true);

    fetch("/api/admin/settings")
      .then(res => res.json())
      .then(data => {
        if (data && data.manualCurrencyRate) {
          setExchangeRate(Number(data.manualCurrencyRate));
        }
      })
      .catch(console.error);
  }, []);

  const handleSetCurrency = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    localStorage.setItem("preferred_currency", newCurrency);
  };

  const toggleCurrency = () => {
    handleSetCurrency(currency === "USD" ? "UZS" : "USD");
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency: handleSetCurrency, toggleCurrency, exchangeRate }}>
      <div className={!mounted ? "opacity-0" : "opacity-100 transition-opacity duration-300"}>
        {children}
      </div>
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
