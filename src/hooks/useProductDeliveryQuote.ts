import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getStorefrontAuthToken, storeDeliveryQuoteApi } from "@/lib/api";

/** Из публичного API id приходит числом или строкой — нужна нормализация для условий enabled. */
function parseStorefrontProductNumericId(id: string | number | undefined | null): number | undefined {
  if (id == null || id === "") return undefined;
  const n = typeof id === "number" ? id : Number(String(id).trim().replace(/^#/, ""));
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.trunc(n);
}

/**
 * Общий запрос котировки доставки для карточки товара (геро-блок и вкладка «Доставка»).
 * Одинаковый queryKey — один запрос в кеш React Query.
 */
export function useProductDeliveryQuote(
  productRouteId: string | undefined,
  productId: string | number | undefined,
  quantity: number,
) {
  const { isAuthenticated } = useAuth();
  const [tokenTick, setTokenTick] = useState(0);

  useEffect(() => {
    setTokenTick((t) => t + 1);
  }, [isAuthenticated, productRouteId]);

  const hasStoreToken = typeof window !== "undefined" && Boolean(getStorefrontAuthToken());
  const productNumericId = parseStorefrontProductNumericId(productId);

  const deliveryQuoteEnabled =
    Boolean(
      isAuthenticated &&
        hasStoreToken &&
        productRouteId &&
        productNumericId != null &&
        /^\d+$/.test(String(productRouteId).trim()),
    );

  const query = useQuery({
    queryKey: ["store-delivery-quote", productRouteId, quantity, productNumericId ?? 0, tokenTick],
    queryFn: () => storeDeliveryQuoteApi.get(String(productRouteId), quantity),
    enabled: deliveryQuoteEnabled,
    staleTime: 120_000,
    retry: false,
  });

  return {
    deliveryQuoteEnabled,
    deliveryQuote: query.data,
    deliveryQuoteLoading: query.isFetching,
  };
}
