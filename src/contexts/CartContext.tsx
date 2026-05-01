import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { StorefrontProduct } from "@/types/storefront-product";
import { resolveCartLinePricing, type CartLinePricing, type CartPromotionSnapshot } from "@/lib/cartPricing";

export type CartSelectedAttribute = {
  name: string;
  value: string;
};

export interface CartItem {
  lineId: string;
  product: StorefrontProduct;
  quantity: number;
  color: string;
  size: string;
  selectedAttributes: CartSelectedAttribute[];
  promotions: CartPromotionSnapshot[];
  addedAt: string;
}

export type AddToCartOptions = {
  quantity?: number;
  selectedAttributes?: CartSelectedAttribute[];
  promotion?: CartPromotionSnapshot;
  promotions?: CartPromotionSnapshot[];
};

interface CartContextType {
  items: CartItem[];
  addToCart: (product: StorefrontProduct, color: string, size: string, options?: AddToCartOptions) => void;
  removeFromCart: (lineId: string | number) => void;
  updateQuantity: (lineId: string | number, quantity: number) => void;
  updateColor: (lineId: string | number, color: string) => void;
  updateSize: (lineId: string | number, size: string) => void;
  clearCart: () => void;
  getLinePricing: (item: CartItem) => CartLinePricing;
  totalItems: number;
  totalPrice: number;
  totalDiscount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!items.some((item) => item.promotions.some((promotion) => now < promotion.endsAt))) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [items, now]);

  const addToCart = (product: StorefrontProduct, color: string, size: string, options: AddToCartOptions = {}) => {
    const quantity = Math.max(1, Math.floor(options.quantity ?? 1));
    const promotions = options.promotions ?? (options.promotion ? [options.promotion] : []);
    const promotionKey = promotions.length > 0
      ? promotions.map((promotion) => `${promotion.type}:${promotion.id}`).sort().join("|")
      : "regular";
    setItems(prev => {
      const existing = prev.find(i =>
        i.product.id === product.id &&
        i.color === color &&
        i.size === size &&
        (i.promotions.length > 0
          ? i.promotions.map((promotion) => `${promotion.type}:${promotion.id}`).sort().join("|")
          : "regular") === promotionKey
      );
      if (existing) {
        return prev.map(i =>
          i.lineId === existing.lineId
            ? { ...i, quantity: i.quantity + quantity, promotions: promotions.length > 0 ? promotions : i.promotions }
            : i
        );
      }
      return [...prev, {
        lineId: `${product.id}-${color}-${size}-${promotionKey}-${Date.now()}`,
        product,
        quantity,
        color,
        size,
        selectedAttributes: options.selectedAttributes ?? [],
        promotions,
        addedAt: new Date().toISOString(),
      }];
    });
  };

  const matchesLine = (item: CartItem, lineId: string | number) => item.lineId === lineId || item.product.id === lineId;

  const removeFromCart = (lineId: string | number) => {
    setItems(prev => prev.filter(i => !matchesLine(i, lineId)));
  };

  const updateQuantity = (lineId: string | number, quantity: number) => {
    if (quantity < 1) return removeFromCart(lineId);
    setItems(prev => prev.map(i => matchesLine(i, lineId) ? { ...i, quantity } : i));
  };

  const updateColor = (lineId: string | number, color: string) => {
    setItems(prev => prev.map(i => matchesLine(i, lineId) ? { ...i, color } : i));
  };

  const updateSize = (lineId: string | number, size: string) => {
    setItems(prev => prev.map(i => matchesLine(i, lineId) ? { ...i, size } : i));
  };

  const clearCart = () => setItems([]);

  const getLinePricing = (item: CartItem) => resolveCartLinePricing(item, now);
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + getLinePricing(i).lineTotal, 0);
  const totalDiscount = items.reduce((s, i) => s + getLinePricing(i).discountTotal, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, updateColor, updateSize, clearCart, getLinePricing, totalItems, totalPrice, totalDiscount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
