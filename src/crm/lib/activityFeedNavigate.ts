import type { NavigateFunction } from "react-router-dom";
import type { CrmActivityFeedItem } from "@/lib/api";

/**
 * Переход по событию ленты: заказ → карточка заказа, webhook → журнал.
 */
export function navigateFromActivityFeed(navigate: NavigateFunction, item: CrmActivityFeedItem): void {
  if (item.id.startsWith("order-")) {
    const num = item.id.slice("order-".length);
    if (/^\d+$/.test(num)) {
      navigate(`/crm/orders/${num}`);
      return;
    }
  }
  if (item.id.startsWith("webhook-")) {
    navigate("/crm/webhook-logs");
    return;
  }
  navigate("/crm/notifications");
}
