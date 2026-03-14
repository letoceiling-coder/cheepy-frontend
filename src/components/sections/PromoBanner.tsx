import { ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import hero1 from "@/assets/hero-1.jpg";

const PromoBanner = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className={`py-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="relative rounded-2xl overflow-hidden h-[280px] md:h-[360px]">
        <img src={hero1} alt="Promo" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/50 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="px-8 md:px-14 max-w-lg">
            <span className="text-xs uppercase tracking-widest text-primary-foreground/70 font-medium">Специальное предложение</span>
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mt-3 leading-tight">Скидки до 70% на весеннюю коллекцию</h2>
            <p className="text-primary-foreground/80 mt-3 text-sm">Более 5 000 товаров по сниженным ценам</p>
            <button className="mt-6 h-12 px-8 rounded-xl gradient-primary text-primary-foreground font-semibold flex items-center gap-2 hover:opacity-90 transition-all duration-300 group">
              Смотреть <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromoBanner;
