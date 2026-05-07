import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Category } from "@/lib/api";
import type { ProductFeedSettings } from "@/constructor/settingsProfiles";
import { useTopPreferredCategories } from "@/hooks/useUserPreferences";
import {
  buildCategorySlugById,
  resolveProductFeedCategorySlugs,
} from "@/lib/catalogCategorySlugs";
import {
  PUBLIC_MENU_QUERY_KEY,
  fetchPublicMenuCategoriesFlat,
} from "@/hooks/usePublicMenuCategories";

/**
 * Единая резолюция slug'ов каталога для блоков с лентой товаров (manual / auto + cold start).
 * Меню разделяет кэш с `usePublicMenuCategories` (`PUBLIC_MENU_QUERY_KEY`).
 */
export function useResolvedCatalogSlugsForProductFeed(feed: Partial<ProductFeedSettings> | undefined): {
  resolvedSlugs: string[];
  menuPending: boolean;
} {
  const dataMode: "manual" | "auto" = feed?.mode === "auto" ? "auto" : "manual";
  const includeDescendants = feed?.includeDescendants !== false;
  const categoryIds = Array.isArray(feed?.categoryIds) ? feed!.categoryIds! : [];

  const menuQuery = useQuery({
    queryKey: PUBLIC_MENU_QUERY_KEY,
    queryFn: fetchPublicMenuCategoriesFlat,
    staleTime: 60_000,
    gcTime: 300_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const flatCats = (menuQuery.data ?? []) as Category[];
  const slugById = useMemo(() => buildCategorySlugById(flatCats), [flatCats]);
  const preferredCats = useTopPreferredCategories(8);

  const resolvedSlugs = useMemo(
    () =>
      resolveProductFeedCategorySlugs({
        dataMode,
        flatCats,
        slugById,
        categoryIds,
        includeDescendants,
        preferredCats,
      }),
    [dataMode, flatCats, slugById, categoryIds, includeDescendants, preferredCats],
  );

  return { resolvedSlugs, menuPending: menuQuery.isPending };
}
