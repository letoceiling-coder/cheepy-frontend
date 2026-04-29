import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api";

export function usePublicSeller(slug: string | undefined, opts?: { sortBy?: string; page?: number }) {
  return useQuery({
    queryKey: ["public-seller", slug, opts?.sortBy ?? "popular", opts?.page ?? 1],
    queryFn: () =>
      publicApi.seller(String(slug), {
        page: opts?.page ?? 1,
        per_page: 24,
        sort_by: opts?.sortBy,
      }),
    enabled: Boolean(slug && String(slug).trim().length > 0),
    staleTime: 60_000,
  });
}

export function usePublicSellerReviews(slug: string | undefined, page = 1) {
  return useQuery({
    queryKey: ["seller-reviews", slug, page],
    queryFn: () => publicApi.sellerReviews(String(slug), page, 40),
    enabled: Boolean(slug && String(slug).trim().length > 0),
    staleTime: 30_000,
  });
}
