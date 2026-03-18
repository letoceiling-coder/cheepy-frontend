import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { useDragScroll } from "@/hooks/useDragScroll";
import { Link } from "react-router-dom";
import { hotDeals, type HotDeal } from "@/data/marketplaceData";

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

const DealCard = ({ deal }: { deal: HotDeal }) => {
  const { hours, minutes, seconds, expired } = useCountdown(deal.endsAt);
  const discount = Math.round((1 - deal.price / deal.oldPrice) * 100);

  return (
    <div className="shrink-0 w-[180px] bg-card rounded-xl border border-border overflow-hidden snap-start group flex flex-col">
      <Link to={`/product/${deal.id}`} className="block relative aspect-square overflow-hidden bg-secondary">
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

const HotDeals = () => {
  const scrollRef = useDragScroll<HTMLDivElement>();

  return (
    <section className="mb-6">
      <div className="flex items-baseline gap-3 mb-3">
        <h2 className="text-xl font-bold text-foreground">ГОРЯЧИЕ ПРЕДЛОЖЕНИЯ</h2>
        <span className="text-sm text-destructive font-semibold animate-pulse">LIVE</span>
      </div>
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
