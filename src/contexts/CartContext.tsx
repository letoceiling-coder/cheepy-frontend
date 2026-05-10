import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import type { StorefrontProduct } from "@/types/storefront-product";
import { resolveCartLinePricing, type CartLinePricing, type CartPromotionSnapshot } from "@/lib/cartPricing";
import { useAuth } from "@/contexts/AuthContext";
import { storeCartSyncApi } from "@/lib/api";
import { useLocation } from "react-router-dom";

const CART_STORAGE_KEY = "cheepy_cart_v1";

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function isStorefrontProductShape(x: unknown): x is StorefrontProduct {
  if (!isRecord(x)) return false;
  const idOk = typeof x.id === "string" || typeof x.id === "number";
  const nameOk = typeof x.name === "string";
  const priceOk = typeof x.price === "number";
  const imagesOk = Array.isArray(x.images) && x.images.every((i: unknown) => typeof i === "string");
  return idOk && nameOk && priceOk && imagesOk;
}

function isCartItemShape(x: unknown): x is CartItem {
  if (!isRecord(x)) return false;
  if (typeof x.lineId !== "string") return false;
  if (!isStorefrontProductShape(x.product)) return false;
  if (typeof x.quantity !== "number" || x.quantity < 1) return false;
  if (typeof x.color !== "string") return false;
  if (typeof x.size !== "string") return false;
  if (!Array.isArray(x.selectedAttributes)) return false;
  if (!Array.isArray(x.promotions)) return false;
  if (typeof x.addedAt !== "string") return false;
  return true;
}

function cartLinesSyncKey(lines: CartItem[]): string {
  return lines
    .map((i) => `${i.product.id}:${i.quantity}:${i.color}:${i.size}`)
    .sort()
    .join("|");
}

function loadPersistedCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCartItemShape);
  } catch {
    return [];
  }
}

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
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<CartItem[]>(() => loadPersistedCart());
  const [now, setNow] = useState(() => Date.now());
  const cartSyncKey = useMemo(() => cartLinesSyncKey(items), [items]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (pathname.startsWith("/crm")) return;
    const timer = window.setTimeout(() => {
      void storeCartSyncApi
        .sync({
          items: items.map((i) => ({
            product_id: String(i.product.id),
            quantity: i.quantity,
            color: i.color || undefined,
            size: i.size || undefined,
          })),
        })
        .catch(() => {});
    }, 550);
    return () => window.clearTimeout(timer);
  }, [isAuthenticated, cartSyncKey, pathname]);

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
