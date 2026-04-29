import { createContext, useContext, useState, ReactNode } from "react";
import type { StorefrontProduct } from "@/types/storefront-product";

interface FavoritesContextType {
  favorites: StorefrontProduct[];
  toggleFavorite: (product: StorefrontProduct) => void;
  isFavorite: (productId: number) => boolean;
  count: number;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favorites, setFavorites] = useState<StorefrontProduct[]>([]);

  const toggleFavorite = (product: StorefrontProduct) => {
    setFavorites(prev =>
      prev.some(p => p.id === product.id)
        ? prev.filter(p => p.id !== product.id)
        : [...prev, product]
    );
  };

  const isFavorite = (productId: number) => favorites.some(p => p.id === productId);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, count: favorites.length }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
};
