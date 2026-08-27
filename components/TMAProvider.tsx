"use client";

import { useEffect, useState, createContext, useContext } from "react";

const TMAContext = createContext(false);

export const useTMA = () => useContext(TMAContext);

export default function TMAProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check immediately
    if ((window as any).Telegram?.WebApp) {
      (window as any).Telegram.WebApp.ready();
      setIsLoaded(true);
      return;
    }

    // Poll every 50ms — SDK may load after mount
    const interval = setInterval(() => {
      if ((window as any).Telegram?.WebApp) {
        (window as any).Telegram.WebApp.ready();
        setIsLoaded(true);
        clearInterval(interval);
      }
    }, 50);

    // After 5s stop polling and mark as loaded anyway so app isn't stuck
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!isLoaded) setIsLoaded(true);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <TMAContext.Provider value={isLoaded}>
      {children}
    </TMAContext.Provider>
  );
}
