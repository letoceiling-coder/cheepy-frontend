import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { mockProducts } from "@/data/mock-data";

function fmt(ms: number) {
  if (ms <= 0) return { h: "00", m: "00", s: "00" };
  const s = Math.floor(ms / 1000);
  return { h: String(Math.floor(s / 3600)).padStart(2, "0"), m: String(Math.floor((s % 3600) / 60)).padStart(2, "0"), s: String(s % 60).padStart(2, "0") };
}

const FlashSale = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [now, setNow] = useState(Date.now());
  const endsAt = Date.now() + 4 * 3600 * 1000;
  const products = mockProducts.filter((p) => p.oldPrice).slice(0, 4);

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const t = fmt(endsAt - now);

  return (
    <section ref={ref} className={`py-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="rounded-2xl bg-foreground p-6 md:p-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Zap size={22} className="text-amber-400" />
            <h2 className="text-2xl font-bold text-background">Flash Sale</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-background/60">Заканчивается через</span>
            {[t.h, t.m, t.s].map((v, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="bg-destructive text-destructive-foreground text-sm font-mono font-bold px-2 py-1 rounded">{v}</span>
                {i < 2 && <span className="text-background/40">:</span>}
              </span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map((p) => {
            const disc = Math.round((1 - p.price / p.oldPrice!) * 100);
            return (
              <div key={p.id} className="rounded-xl overflow-hidden cursor-pointer group bg-background/5">
                <div className="relative aspect-square overflow-hidden">
                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <span className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-md font-bold">-{disc}%</span>
                </div>
                <div className="p-3">
                  <p className="text-xs text-background/80 truncate">{p.name}</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-sm font-bold text-background">{p.price.toLocaleString()} ₽</span>
                    <span className="text-xs text-background/40 line-through">{p.oldPrice!.toLocaleString()} ₽</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FlashSale;
