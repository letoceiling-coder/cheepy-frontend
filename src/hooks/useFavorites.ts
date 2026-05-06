import { useEffect, useState, useCallback, useMemo } from "react";
import {
  FAVORITES_EVENT_NAME,
  isFavorite as isFavoriteFn,
  listFavoriteIds,
  listFavorites,
  toggleFavorite as toggleFavoriteFn,
  type FavoriteEntry,
  type ToggleFavoriteOptions,
} from "@/lib/favorites";

function useFavoritesSubscription<T>(read: () => T): T {
  const [value, setValue] = useState<T>(read);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => setValue(read());
    window.addEventListener(FAVORITES_EVENT_NAME, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(FAVORITES_EVENT_NAME, handler);
      window.removeEventListener("storage", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return value;
}

export function useFavoriteIds(): number[] {
  return useFavoritesSubscription(() => listFavoriteIds());
}

export function useFavoriteEntries(): FavoriteEntry[] {
  return useFavoritesSubscription(() => listFavorites());
}

export function useIsFavorite(productId: number | string | undefined | null): boolean {
  const ids = useFavoriteIds();
  const id = Number(productId);
  return useMemo(() => Boolean(id) && ids.includes(id), [ids, id]);
}

export function useToggleFavorite() {
  return useCallback((productId: number | string, opts?: ToggleFavoriteOptions) => {
    return toggleFavoriteFn(productId, opts);
  }, []);
}

export { isFavoriteFn as isFavorite };
