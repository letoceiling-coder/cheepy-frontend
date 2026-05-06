import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { StorefrontProduct } from "@/types/storefront-product";
import {
  listFavorites,
  toggleFavorite as libToggleFavoriteId,
  isFavorite as libIsFavorite,
  clearFavorites as libClearFavorites,
  FAVORITES_EVENT_NAME,
  type FavoriteEntry,
  type ToggleFavoriteOptions,
} from "@/lib/favorites";

export interface FavoritesContextType {
  /** Записи из localStorage (источник правды для счётчиков и списков). */
  favoriteEntries: FavoriteEntry[];
  toggleFavorite: (product: StorefrontProduct) => void;
  toggleFavoriteId: (productId: number | string, opts?: ToggleFavoriteOptions) => void;
  isFavorite: (productId: number | string | null | undefined) => boolean;
  clearFavoriteStorage: () => void;
  count: number;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favoriteEntries, setFavoriteEntries] = useState<FavoriteEntry[]>(() => listFavorites());

  const syncFromStorage = useCallback(() => {
    setFavoriteEntries(listFavorites());
  }, []);

  useEffect(() => {
    syncFromStorage();
    const handler = () => syncFromStorage();
    window.addEventListener(FAVORITES_EVENT_NAME, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(FAVORITES_EVENT_NAME, handler);
      window.removeEventListener("storage", handler);
    };
  }, [syncFromStorage]);

  const toggleFavorite = useCallback((product: StorefrontProduct) => {
    const id = Number(product.id);
    if (!Number.isFinite(id) || id <= 0) return;
    libToggleFavoriteId(id);
  }, []);

  const toggleFavoriteId = useCallback((productId: number | string, opts?: ToggleFavoriteOptions) => {
    libToggleFavoriteId(productId, opts);
  }, []);

  const isFavorite = useCallback((productId: number | string | null | undefined) => libIsFavorite(productId), []);

  const clearFavoriteStorage = useCallback(() => {
    libClearFavorites();
  }, []);

  const value = useMemo(
    () => ({
      favoriteEntries,
      toggleFavorite,
      toggleFavoriteId,
      isFavorite,
      clearFavoriteStorage,
      count: favoriteEntries.length,
    }),
    [favoriteEntries, toggleFavorite, toggleFavoriteId, isFavorite, clearFavoriteStorage],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

export const useFavorites = () => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
};
