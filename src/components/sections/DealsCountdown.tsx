import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { hotDeals } from "@/data/marketplaceData";

function formatTime(ms: number) {
  if (ms <= 0) return { h: "00", m: "00", s: "00" };
  const s = Math.floor(ms / 1000);
  return {
    h: String(Math.floor(s / 3600)).padStart(2, "0"),
    m: String(Math.floor((s % 3600) / 60)).padStart(2, "0"),
    s: String(s % 60).padStart(2, "0"),
  };
}

const DealsCountdown = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [now, setNow] = useState(Date.now());
  const deals = hotDeals.slice(0, 4);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <section ref={ref} className={`py-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="flex items-center gap-3 mb-8">
        <Clock size={20} className="text-destructive" />
        <h2 className="text-2xl font-bold text-foreground">Успей купить</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {deals.map((d) => {
          const remaining = d.endsAt - now;
          const t = formatTime(remaining);
          return (
            <div key={d.id} className="bg-card rounded-xl border border-border overflow-hidden group cursor-pointer">
              <div className="aspect-square overflow-hidden relative">
                <img src={d.image} alt={d.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute top-3 left-3 bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded-md font-bold">
                  -{Math.round((1 - d.price / d.oldPrice) * 100)}%
                </div>
              </div>
              <div className="p-3">
                <h3 className="text-sm font-medium text-foreground truncate">{d.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-bold text-destructive text-sm">{d.price.toLocaleString()} ₽</span>
                  <span className="text-xs text-muted-foreground line-through">{d.oldPrice.toLocaleString()} ₽</span>
                </div>
                <div className="flex items-center gap-1 mt-3">
                  {[t.h, t.m, t.s].map((v, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <span className="bg-foreground text-background text-xs font-mono font-bold px-1.5 py-0.5 rounded">{v}</span>
                      {i < 2 && <span className="text-muted-foreground text-xs">:</span>}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default DealsCountdown;
