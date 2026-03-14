import { ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import hero1 from "@/assets/hero-1.jpg";

const VideoProductCard = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className={`py-8 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="flex flex-col md:flex-row rounded-xl overflow-hidden border border-border bg-card">
        <div className="md:w-1/2 aspect-video md:aspect-auto md:min-h-[220px] overflow-hidden">
          <video autoPlay muted loop playsInline preload="metadata" poster={hero1} className="w-full h-full object-cover block transition-transform duration-700 hover:scale-105">
            <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="md:w-1/2 p-5 md:p-6 flex flex-col justify-center gap-3">
          <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">Видео</span>
          <h3 className="text-lg font-bold text-foreground leading-tight">Откройте для себя трендовые товары</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">Смотрите подборки лучших товаров от экспертов — стиль, качество и выгодные цены.</p>
          <button className="mt-1 self-start h-9 px-5 gradient-primary text-primary-foreground rounded-lg font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity">
            Смотреть <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default VideoProductCard;
