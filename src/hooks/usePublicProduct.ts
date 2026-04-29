import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api";

export function usePublicProduct(id: string | undefined) {
  return useQuery({
    queryKey: ["public-product", id],
    queryFn: () => publicApi.product(String(id)),
    enabled: Boolean(id && /^\d+$/.test(String(id).trim())),
    staleTime: 60_000,
  });
}
