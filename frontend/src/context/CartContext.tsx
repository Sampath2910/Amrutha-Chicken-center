"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Product } from "@/lib/api"; // We'll create this model

export interface CartItem {
  id: string; // combination of productId_cookingApplied (e.g. "1_true", "1_false")
  product: Product;
  quantityValue: number; // e.g. 0.25, 0.50, 1.00, 10
  quantityUnit: string; // G, KG, PCS
  cookingApplied: boolean;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, qty: number, unit: string, cooking: boolean) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  getCartTotalWeight: () => number;
  getCartItemTotal: () => number;
  getCartCookingCharge: (cookingRate: number) => number;
  isOrderEligibleForDelivery: () => boolean;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Load cart from LocalStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("amrutha_cart");
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart items:", e);
      }
    }
  }, []);

  // Save cart to LocalStorage on change
  const saveCart = (items: CartItem[]) => {
    setCartItems(items);
    localStorage.setItem("amrutha_cart", JSON.stringify(items));
  };

  const addToCart = (product: Product, qty: number, unit: string, cooking: boolean) => {
    const itemId = `${product.id}_${cooking}`;
    const existingIndex = cartItems.findIndex((item) => item.id === itemId);

    let updatedCart = [...cartItems];
    if (existingIndex > -1) {
      updatedCart[existingIndex].quantityValue += qty;
    } else {
      updatedCart.push({
        id: itemId,
        product,
        quantityValue: qty,
        quantityUnit: unit,
        cookingApplied: cooking,
      });
    }
    saveCart(updatedCart);
  };

  const removeFromCart = (id: string) => {
    const updatedCart = cartItems.filter((item) => item.id !== id);
    saveCart(updatedCart);
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(id);
      return;
    }
    const updatedCart = cartItems.map((item) => {
      if (item.id === id) {
        return { ...item, quantityValue: qty };
      }
      return item;
    });
    saveCart(updatedCart);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const getCartTotalWeight = (): number => {
    return cartItems.reduce((total, item) => {
      const unit = item.quantityUnit.toUpperCase();
      if (unit === "KG") {
        return total + item.quantityValue;
      } else if (unit === "G") {
        return total + item.quantityValue / 1000;
      }
      return total; // PCS items (like chapathis) don't count towards minimum delivery weight rules
    }, 0);
  };

  const getCartItemTotal = (): number => {
    return cartItems.reduce((total, item) => {
      return total + item.product.basePrice * item.quantityValue;
    }, 0);
  };

  const getCartCookingCharge = (cookingRate: number): number => {
    return cartItems.reduce((total, item) => {
      if (item.cookingApplied && item.product.isChicken) {
        let weightKg = 0;
        const unit = item.quantityUnit.toUpperCase();
        if (unit === "KG") {
          weightKg = item.quantityValue;
        } else if (unit === "G") {
          weightKg = item.quantityValue / 1000;
        }
        return total + weightKg * cookingRate;
      }
      return total;
    }, 0);
  };

  const isOrderEligibleForDelivery = (): boolean => {
    return getCartTotalWeight() >= 1.0;
  };

  const cartCount = cartItems.reduce((total, item) => total + (item.quantityUnit === "PCS" ? item.quantityValue : 1), 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotalWeight,
        getCartItemTotal,
        getCartCookingCharge,
        isOrderEligibleForDelivery,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
