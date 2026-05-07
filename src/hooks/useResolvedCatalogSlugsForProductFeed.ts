import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api";
import type { ProductFeedSettings } from "@/constructor/settingsProfiles";
import { useTopPreferredCategories } from "@/hooks/useUserPreferences";
import { buildCategorySlugById, flattenMenuCategories, resolveProductFeedCategorySlugs } from "@/lib/catalogCategorySlugs";

/**
 * Единая резолюция slug'ов каталога для блоков с лентой товаров (manual / auto + cold start).
 */
export function useResolvedCatalogSlugsForProductFeed(feed: Partial<ProductFeedSettings> | undefined): {
  resolvedSlugs: string[];
  menuPending: boolean;
} {
  const dataMode: "manual" | "auto" = feed?.mode === "auto" ? "auto" : "manual";
  const includeDescendants = feed?.includeDescendants !== false;
  const categoryIds = Array.isArray(feed?.categoryIds) ? feed!.categoryIds! : [];

  const menuQuery = useQuery({
    queryKey: ["public-menu-categories"],
    queryFn: () => publicApi.menu(),
    staleTime: 5 * 60_000,
  });

  const flatCats = useMemo(() => flattenMenuCategories(menuQuery.data?.categories), [menuQuery.data]);
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
