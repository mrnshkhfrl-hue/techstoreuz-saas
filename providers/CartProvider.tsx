'use client';

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

export type CartItem = {
  id: string;
  type: 'NEW' | 'USED';
  title: string;
  variant?: string;
  price: number;
  image?: string;
};

interface CartContextValue {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  itemCount: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  // Empty by default — strictly no mock items
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      // Check if already in cart
      const exists = prev.some((i) => i.id === item.id);
      if (exists) return prev;
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = items.length;
  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + item.price, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      clearCart,
      itemCount,
      totalPrice,
    }),
    [items, addItem, removeItem, clearCart, itemCount, totalPrice]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
