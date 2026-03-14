import { ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import hero2 from "@/assets/hero-2.jpg";

const PromoVideoBanner = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className={`py-8 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="relative rounded-xl overflow-hidden aspect-video md:aspect-[21/9]">
        <video autoPlay muted loop playsInline preload="metadata" poster={hero2} className="absolute inset-0 w-full h-full object-cover block">
          <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-foreground/50 pointer-events-none" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 gap-3">
          <span className="text-[11px] font-semibold text-primary-foreground/70 uppercase tracking-widest">Только на этой неделе</span>
          <h2 className="text-xl md:text-2xl font-bold text-primary-foreground leading-tight max-w-md">Горячие скидки на топовые бренды</h2>
          <p className="text-sm text-primary-foreground/80 max-w-sm">Успейте купить до конца акции — лучшие товары по специальным ценам</p>
          <button className="mt-1 h-9 px-6 gradient-primary text-primary-foreground rounded-lg font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity">
            Смотреть предложения <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default PromoVideoBanner;
