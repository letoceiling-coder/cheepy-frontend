import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api";

export type PublicMenuCategory = {
  id: number;
  name: string;
  slug: string;
  icon?: string | null;
  products_count?: number;
  children?: PublicMenuCategory[];
};

export function flattenPublicMenuCategories(nodes: PublicMenuCategory[]): PublicMenuCategory[] {
  return nodes.flatMap((node) => [
    node,
    ...(Array.isArray(node.children) ? flattenPublicMenuCategories(node.children) : []),
  ]);
}

export const PUBLIC_MENU_QUERY_KEY = ["public-catalog-menu"] as const;

export async function fetchPublicMenuCategoriesFlat(): Promise<PublicMenuCategory[]> {
  const res = await publicApi.menu();
  const raw = Array.isArray(res.categories) ? (res.categories as PublicMenuCategory[]) : [];
  return flattenPublicMenuCategories(raw);
}

/**
 * Единый запрос меню витрины для главной и блоков категорий (дедупликация React Query).
 */
export function usePublicMenuCategories() {
  return useQuery({
    queryKey: PUBLIC_MENU_QUERY_KEY,
    queryFn: fetchPublicMenuCategoriesFlat,
    staleTime: 60_000,
    gcTime: 300_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
