import { ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import hero1 from "@/assets/hero-1.jpg";

const FullWidthPromoBanner = () => {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <section ref={ref} className={`py-8 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="relative rounded-xl overflow-hidden h-[200px] md:h-[260px] group">
        <img src={hero1} alt="Promo" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/40 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-12 max-w-lg">
          <span className="text-[11px] text-primary-foreground/70 font-semibold uppercase tracking-wider">Ограниченное время</span>
          <h2 className="text-xl md:text-2xl font-bold text-primary-foreground mt-1 leading-tight">Специальные предложения этой недели</h2>
          <p className="text-sm text-primary-foreground/80 mt-2">Лучшие товары по сниженным ценам — успейте до конца акции</p>
          <button className="mt-4 self-start h-9 px-5 gradient-primary text-primary-foreground rounded-lg font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity">
            Смотреть <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
};
export default FullWidthPromoBanner;
