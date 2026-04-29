import { createContext, useContext, useState, ReactNode } from "react";
import type { StorefrontProduct } from "@/types/storefront-product";

export interface CartItem {
  product: StorefrontProduct;
  quantity: number;
  color: string;
  size: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: StorefrontProduct, color: string, size: string) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  updateColor: (productId: number, color: string) => void;
  updateSize: (productId: number, size: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  totalDiscount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (product: StorefrontProduct, color: string, size: string) => {
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id && i.color === color && i.size === size);
      if (existing) {
        return prev.map(i =>
          i.product.id === product.id && i.color === color && i.size === size
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { product, quantity: 1, color, size }];
    });
  };

  const removeFromCart = (productId: number) => {
    setItems(prev => prev.filter(i => i.product.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity < 1) return removeFromCart(productId);
    setItems(prev => prev.map(i => i.product.id === productId ? { ...i, quantity } : i));
  };

  const updateColor = (productId: number, color: string) => {
    setItems(prev => prev.map(i => i.product.id === productId ? { ...i, color } : i));
  };

  const updateSize = (productId: number, size: string) => {
    setItems(prev => prev.map(i => i.product.id === productId ? { ...i, size } : i));
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const totalDiscount = items.reduce((s, i) => {
    if (i.product.oldPrice) return s + (i.product.oldPrice - i.product.price) * i.quantity;
    return s;
  }, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, updateColor, updateSize, clearCart, totalItems, totalPrice, totalDiscount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
