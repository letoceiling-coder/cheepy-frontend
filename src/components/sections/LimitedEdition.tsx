import { useState, useEffect } from "react";
import { Clock, ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import product1 from "@/assets/product-1.jpg";
import product3 from "@/assets/product-3.jpg";
import product5 from "@/assets/product-5.jpg";

const items = [
  { name: "Лимитированная парка", price: "14 990 ₽", stock: 12, total: 50, image: product1 },
  { name: "Коллаб кроссовки", price: "11 990 ₽", stock: 5, total: 30, image: product3 },
  { name: "Эксклюзив сумка", price: "19 990 ₽", stock: 3, total: 20, image: product5 },
];

const LimitedEdition = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [time, setTime] = useState({ h: 5, m: 42, s: 18 });

  useEffect(() => {
    const id = setInterval(() => {
      setTime((t) => {
        let { h, m, s } = t;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) return { h: 0, m: 0, s: 0 };
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <section ref={ref} className={`py-8 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Лимитированная серия</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Эксклюзивные товары в ограниченном количестве</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/20">
          <Clock size={13} className="text-destructive" />
          <span className="text-sm font-bold text-destructive tabular-nums">{pad(time.h)}:{pad(time.m)}:{pad(time.s)}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {items.map((item, i) => {
          const pct = ((item.total - item.stock) / item.total) * 100;
          return (
            <div key={i} className="rounded-xl border border-border bg-card overflow-hidden group cursor-pointer">
              <div className="aspect-[4/3] overflow-hidden relative">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute top-2 left-2 bg-foreground/80 text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded">LIMITED</span>
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-foreground">{item.name}</p>
                <p className="text-sm font-bold text-primary mt-1">{item.price}</p>
                <div className="mt-2">
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Осталось {item.stock} шт.</span>
                    <span>{Math.round(pct)}% продано</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-destructive transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <button className="mt-3 w-full h-8 gradient-primary text-primary-foreground rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity">
                  Купить <ArrowRight size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default LimitedEdition;
