import { useState, useEffect } from "react";
import { ArrowRight, Clock } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import hero2 from "@/assets/hero-2.jpg";

const DiscountPromoBanner = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [t, setT] = useState({ h: 11, m: 34, s: 52 });

  useEffect(() => {
    const id = setInterval(() => {
      setT((prev) => {
        let { h, m, s } = prev;
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
      <div className="relative rounded-xl overflow-hidden h-[180px] md:h-[220px]">
        <img src={hero2} alt="Discount" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-foreground/60" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 gap-2">
          <span className="text-3xl md:text-5xl font-black text-primary-foreground">ДО −50%</span>
          <p className="text-sm text-primary-foreground/80">На всё — только сегодня</p>
          <div className="flex items-center gap-1.5 mt-1">
            <Clock size={14} className="text-primary-foreground/70" />
            {[pad(t.h), pad(t.m), pad(t.s)].map((v, i) => (
              <span key={i} className="bg-primary-foreground/20 backdrop-blur-sm text-primary-foreground text-sm font-bold px-2 py-1 rounded">{v}</span>
            ))}
          </div>
          <button className="mt-2 h-9 px-5 gradient-primary text-primary-foreground rounded-lg font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity">
            Купить со скидкой <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
};
export default DiscountPromoBanner;
