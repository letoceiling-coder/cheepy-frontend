import { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { mockProducts } from "@/data/mock-data";

const DailyDeals = () => {
  const { ref, isVisible } = useScrollAnimation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const deals = mockProducts.filter((p) => p.oldPrice).slice(0, 8);
  const scroll = (d: number) => scrollRef.current?.scrollBy({ left: d * 240, behavior: "smooth" });

  const [sold] = useState(() => deals.map(() => 40 + Math.floor(Math.random() * 50)));

  return (
    <section ref={ref} className={`py-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Flame size={20} className="text-destructive" />
          <h2 className="text-2xl font-bold text-foreground">Предложения дня</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={() => scroll(-1)} className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors"><ChevronLeft size={16} /></button>
          <button onClick={() => scroll(1)} className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors"><ChevronRight size={16} /></button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
        {deals.map((p, i) => {
          const disc = Math.round((1 - p.price / p.oldPrice!) * 100);
          return (
            <div key={p.id} className="min-w-[200px] flex-shrink-0 bg-card rounded-xl border border-border overflow-hidden group cursor-pointer">
              <div className="relative aspect-square overflow-hidden">
                <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[11px] px-2 py-0.5 rounded-md font-bold">-{disc}%</span>
              </div>
              <div className="p-3">
                <p className="text-xs text-foreground truncate mb-1">{p.name}</p>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-sm font-bold text-destructive">{p.price.toLocaleString()} ₽</span>
                  <span className="text-xs text-muted-foreground line-through">{p.oldPrice!.toLocaleString()} ₽</span>
                </div>
                <div className="h-1.5 rounded-full bg-border overflow-hidden">
                  <div className="h-full rounded-full gradient-hero transition-all duration-500" style={{ width: `${sold[i]}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Продано {sold[i]}%</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default DailyDeals;
