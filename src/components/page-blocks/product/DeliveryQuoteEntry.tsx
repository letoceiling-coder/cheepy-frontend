import type { StorefrontDeliveryQuoteItem } from "@/lib/api";
import { cn } from "@/lib/utils";

function formatDeliveryQuoteDates(q: StorefrontDeliveryQuoteItem): string {
  if (q.date_from === q.date_to) {
    return q.date_from_label_ru;
  }
  return `с ${q.date_from_label_ru} по ${q.date_to_label_ru}`;
}

function formatDeliveryQuotePriceRub(price: number): string {
  const n = typeof price === "number" && Number.isFinite(price) ? price : Number(price);
  return `${n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽`;
}

export default function DeliveryQuoteEntry({
  q,
  variant = "comfortable",
}: {
  q: StorefrontDeliveryQuoteItem;
  variant?: "compact" | "comfortable";
}) {
  const priceText = formatDeliveryQuotePriceRub(q.price_rub);
  const dateText = formatDeliveryQuoteDates(q);
  const compact = variant === "compact";

  return (
    <div className="space-y-1.5 w-full min-w-0">
      <span
        className={cn("block font-semibold text-foreground leading-tight", compact ? "text-xs" : "text-sm")}
      >
        {q.provider_title}
      </span>
      <p className={cn("text-foreground leading-snug text-balance", compact ? "text-xs" : "text-sm")}>
        <span className="font-medium">{q.display_service_label}:</span>{" "}
        <span className="tabular-nums font-semibold">{priceText}</span>
      </p>
      <p
        className={cn("text-muted-foreground leading-snug text-balance", compact ? "text-[11px]" : "text-xs")}
      >
        {dateText}
      </p>
    </div>
  );
}
