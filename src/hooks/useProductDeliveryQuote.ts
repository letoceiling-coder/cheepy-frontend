import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getStorefrontAuthToken, storeDeliveryQuoteApi } from "@/lib/api";

/**
 * Общий запрос котировки доставки для карточки товара (геро-блок и вкладка «Доставка»).
 * Одинаковый queryKey — один запрос в кеш React Query.
 */
export function useProductDeliveryQuote(
  productRouteId: string | undefined,
  productNumericId: number | undefined,
  quantity: number,
) {
  const { isAuthenticated } = useAuth();
  const [tokenTick, setTokenTick] = useState(0);

  useEffect(() => {
    setTokenTick((t) => t + 1);
  }, [isAuthenticated, productRouteId]);

  const hasStoreToken = typeof window !== "undefined" && Boolean(getStorefrontAuthToken());

  const deliveryQuoteEnabled =
    Boolean(
      isAuthenticated &&
        hasStoreToken &&
        productRouteId &&
        productNumericId &&
        Number.isFinite(productNumericId) &&
        productNumericId > 0 &&
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
