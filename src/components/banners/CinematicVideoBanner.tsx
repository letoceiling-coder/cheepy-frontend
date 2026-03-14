import { ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import hero1 from "@/assets/hero-1.jpg";

const CinematicVideoBanner = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className={`py-8 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="relative rounded-xl overflow-hidden aspect-video md:aspect-[21/9]">
        <video autoPlay muted loop playsInline preload="metadata" poster={hero1} className="w-full h-full object-cover block">
          <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/30 to-transparent pointer-events-none" />
        <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-12 max-w-lg">
          <span className="text-[11px] text-primary-foreground/60 font-semibold uppercase tracking-widest">Кинематографичный стиль</span>
          <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mt-2 leading-tight">Почувствуйте разницу премиум качества</h2>
          <p className="text-sm text-primary-foreground/70 mt-2">Эксклюзивная подборка от лучших брендов</p>
          <button className="mt-4 self-start h-10 px-6 bg-primary-foreground text-foreground rounded-lg font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity">
            Открыть каталог <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
};
export default CinematicVideoBanner;
