import { useQuery } from "@tanstack/react-query";
import { publicApi, type StorefrontProductCardPayload } from "@/lib/api";

/** Стабильный список id для queryKey и батч-запроса. */
export function normalizeStorefrontProductIds(ids: Array<string | number | null | undefined>): string[] {
  return [...new Set(ids.map((x) => String(x ?? "").trim()).filter((x) => x.length > 0))].sort();
}

/**
 * Одна точка для цен витрины с комиссией: POST /public/products/storefront-cards.
 * Новые промо-блоки подключают этот hook, без N запросов product().
 */
export function useStorefrontProductCards(ids: Array<string | number | null | undefined>) {
  const list = normalizeStorefrontProductIds(ids);
  return useQuery({
    queryKey: ["public-storefront-product-cards", list.join("|")],
    queryFn: async (): Promise<Record<string, StorefrontProductCardPayload>> => {
      const res = await publicApi.productsStorefrontCards(list);
      return res.by_id && typeof res.by_id === "object" ? res.by_id : {};
    },
    enabled: list.length > 0,
    staleTime: 60_000,
    retry: false,
  });
}

export type { StorefrontProductCardPayload };
