import { useMemo, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { useDragScroll } from "@/hooks/useDragScroll";
import { Link } from "react-router-dom";
import { hotDeals, type HotDeal } from "@/data/marketplaceData";
import { resolveCrmMediaAssetUrl } from "@/lib/api";
import type { BlockScheduleSetting, HotDealProductSetting } from "@/constructor/settingsProfiles";

const useCountdown = (endsAt: number) => {
  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, endsAt - Date.now()));

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, endsAt - Date.now());
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [endsAt, timeLeft]);

  const hours = Math.floor(timeLeft / 3600000);
  const minutes = Math.floor((timeLeft % 3600000) / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const expired = timeLeft <= 0;

  return { hours, minutes, seconds, expired };
};

type RenderDeal = {
  id: string | number;
  name: string;
  image: string;
  price: number;
  oldPrice: number;
  endsAt: number;
  url: string;
};

function parsePriceText(text: string | null | undefined): number {
  const digits = String(text ?? '').replace(/[^\d]/g, '');
  return digits ? Number(digits) : 0;
}

function fromConfiguredDeal(deal: HotDealProductSetting): RenderDeal | null {
  if (deal.enabled === false || !deal.productId) return null;
  const now = Date.now();
  const startsAt = deal.startsAt ? new Date(deal.startsAt).getTime() : 0;
  const endsAt = deal.endsAt ? new Date(deal.endsAt).getTime() : now + 24 * 3600000;
  if (Number.isFinite(startsAt) && startsAt > now) return null;
  const price = deal.priceRaw ?? parsePriceText(deal.priceText);
  if (!price) return null;
  const oldPrice = Math.round(price / (1 - Math.min(99, Math.max(1, deal.discountPercent || 1)) / 100));
  return {
    id: deal.productId,
    name: deal.title || `Товар #${deal.productId}`,
    image: resolveCrmMediaAssetUrl(deal.imageUrl),
    price,
    oldPrice,
    endsAt,
    url: deal.productUrl || `/product/${deal.productId}`,
  };
}

function isScheduleActive(schedule: BlockScheduleSetting | undefined): boolean {
  if (!schedule?.enabled) return true;
  const now = new Date();
  return (schedule.windows ?? []).some((w) => {
    if (!w.enabled) return false;
    const start = w.startDate ? new Date(`${w.startDate}T${w.startTime || '00:00'}`).getTime() : 0;
    const end = w.endDate ? new Date(`${w.endDate}T${w.endTime || '23:59'}`).getTime() : Number.POSITIVE_INFINITY;
    const t = now.getTime();
    if (t < start || t > end) return false;
    if (Array.isArray(w.daysOfWeek) && w.daysOfWeek.length > 0 && !w.daysOfWeek.includes(now.getDay())) return false;
    return true;
  });
}

const DealCard = ({ deal }: { deal: RenderDeal }) => {
  const { hours, minutes, seconds, expired } = useCountdown(deal.endsAt);
  const discount = Math.round((1 - deal.price / deal.oldPrice) * 100);

  return (
    <div className="shrink-0 w-[180px] bg-card rounded-xl border border-border overflow-hidden snap-start group flex flex-col">
      <Link to={deal.url} className="block relative aspect-square overflow-hidden bg-secondary">
        <img src={deal.image} alt={deal.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        {expired ? (
          <span className="absolute top-2 left-2 bg-muted text-muted-foreground text-xs font-semibold px-2 py-1 rounded">
            Акция завершена
          </span>
        ) : (
          <span className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded">
            -{discount}%
          </span>
        )}
      </Link>
      <div className="flex-1 min-h-0 p-3 flex flex-col">
        <p className="text-sm text-foreground line-clamp-2 mb-2 font-medium">{deal.name}</p>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-lg font-bold text-foreground">{deal.price.toLocaleString()} ₽</span>
          <span className="text-xs text-muted-foreground line-through">{deal.oldPrice.toLocaleString()} ₽</span>
        </div>
        {!expired && (
          <div className="flex items-center gap-1 mb-3">
            <span className="text-xs text-muted-foreground">Осталось:</span>
            <div className="flex gap-0.5">
              {[String(hours).padStart(2, "0"), String(minutes).padStart(2, "0"), String(seconds).padStart(2, "0")].map(
                (v, i) => (
                  <span key={i} className="bg-foreground text-background text-xs font-mono font-bold px-1.5 py-0.5 rounded">
                    {v}
                  </span>
                )
              )}
            </div>
          </div>
        )}
        <button
          className="mt-auto w-full gradient-primary text-primary-foreground text-xs py-2 rounded-full font-medium flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-50"
          disabled={expired}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          Купить
        </button>
      </div>
    </div>
  );
};

type HotDealsProps = {
  title?: string;
  subtitle?: string;
  dealItems?: HotDealProductSetting[];
  schedule?: BlockScheduleSetting;
};

const HotDeals = ({ title, subtitle, dealItems, schedule }: HotDealsProps) => {
  const scrollRef = useDragScroll<HTMLDivElement>();
  const configuredDeals = useMemo(() => (dealItems ?? []).map(fromConfiguredDeal).filter(Boolean) as RenderDeal[], [dealItems]);
  const deals: RenderDeal[] = configuredDeals.length > 0
    ? configuredDeals
    : hotDeals.map((deal: HotDeal) => ({
      id: deal.id,
      name: deal.name,
      image: deal.image,
      price: deal.price,
      oldPrice: deal.oldPrice,
      endsAt: deal.endsAt,
      url: `/product/${deal.id}`,
    }));

  if (!isScheduleActive(schedule) || deals.length === 0) return null;

  return (
    <section className="mb-6">
      <div className="flex items-baseline gap-3 mb-3">
        <h2 className="text-xl font-bold text-foreground">{title || "ГОРЯЧИЕ ПРЕДЛОЖЕНИЯ"}</h2>
        <span className="text-sm text-destructive font-semibold animate-pulse">LIVE</span>
      </div>
      {subtitle ? <p className="text-sm text-muted-foreground -mt-2 mb-3">{subtitle}</p> : null}
      <div className="relative flex items-center gap-3">
        <button
          onClick={() => scrollRef.current?.scrollBy({ left: -240, behavior: "smooth" })}
          className="shrink-0 w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground hover:bg-secondary/80 transition-colors"
          aria-label="Назад"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div ref={scrollRef} className="flex-1 overflow-x-auto flex gap-4 py-2 no-scrollbar snap-x snap-mandatory cursor-grab active:cursor-grabbing">
          {hotDeals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
        <button
          onClick={() => scrollRef.current?.scrollBy({ left: 240, behavior: "smooth" })}
          className="shrink-0 w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground hover:bg-secondary/80 transition-colors"
          aria-label="Вперёд"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
};

export default HotDeals;
