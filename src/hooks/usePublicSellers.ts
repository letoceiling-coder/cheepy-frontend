import { useInfiniteQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api";

export type SellersSort = "products_desc" | "name_asc" | "reviews_desc" | "newest";

export function usePublicSellersInfinite(sortBy: SellersSort) {
  return useInfiniteQuery({
    queryKey: ["public-sellers-list", sortBy],
    queryFn: ({ pageParam }) =>
      publicApi.sellers({ page: pageParam as number, per_page: 24, sort_by: sortBy }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.last_page > last.meta.current_page ? last.meta.current_page + 1 : undefined,
    staleTime: 60_000,
  });
}
