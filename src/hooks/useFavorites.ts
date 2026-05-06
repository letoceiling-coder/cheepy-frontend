/**
 * Обёртки над {@link useFavorites} контекста: избранное хранится в localStorage через lib/favorites.
 */
import { useFavorites as useFavoritesCtx } from "@/contexts/FavoritesContext";
import type { ToggleFavoriteOptions } from "@/lib/favorites";

export type { FavoriteEntry, ToggleFavoriteOptions } from "@/lib/favorites";

export function useFavoriteIds(): number[] {
  const { favoriteEntries } = useFavoritesCtx();
  return favoriteEntries.map((e) => e.productId);
}

export function useFavoriteEntries(): import("@/lib/favorites").FavoriteEntry[] {
  const { favoriteEntries } = useFavoritesCtx();
  return favoriteEntries;
}

export function useIsFavorite(productId: number | string | null | undefined): boolean {
  const { isFavorite } = useFavoritesCtx();
  if (productId == null || productId === "") return false;
  return isFavorite(productId);
}

export function useToggleFavorite() {
  const { toggleFavoriteId } = useFavoritesCtx();
  return (productId: number | string, opts?: ToggleFavoriteOptions) => {
    toggleFavoriteId(productId, opts);
  };
}
