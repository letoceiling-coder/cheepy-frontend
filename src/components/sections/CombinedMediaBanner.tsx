import { ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import hero1 from "@/assets/hero-1.jpg";

const CombinedMediaBanner = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className={`py-8 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 rounded-xl overflow-hidden">
        <div className="md:col-span-3 relative rounded-xl overflow-hidden aspect-[16/9] group cursor-pointer">
          <img src={hero1} alt="Banner" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/60 to-transparent pointer-events-none" />
          <div className="absolute bottom-4 left-4 right-4">
            <span className="text-[11px] text-primary-foreground/70 font-semibold uppercase tracking-wider">Коллекция 2025</span>
            <h3 className="text-lg font-bold text-primary-foreground mt-1">Новый сезон уже здесь</h3>
            <button className="mt-2 h-8 px-4 gradient-primary text-primary-foreground rounded-lg font-semibold text-xs inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity">
              Смотреть <ArrowRight size={12} />
            </button>
          </div>
        </div>
        <div className="md:col-span-2 relative rounded-xl overflow-hidden aspect-video md:aspect-auto">
          <video autoPlay muted loop playsInline preload="metadata" poster={hero1} className="w-full h-full object-cover block transition-transform duration-700 hover:scale-105">
            <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-foreground/30 pointer-events-none" />
          <div className="absolute bottom-4 left-4">
            <p className="text-sm font-bold text-primary-foreground">Смотрите в действии</p>
            <p className="text-xs text-primary-foreground/70">Видеообзор коллекции</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CombinedMediaBanner;
