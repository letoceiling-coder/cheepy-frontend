import { ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import hero2 from "@/assets/hero-2.jpg";

const SplitVideoFeature = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className={`py-8 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl overflow-hidden border border-border bg-card">
        <div className="aspect-video md:aspect-auto overflow-hidden">
          <video autoPlay muted loop playsInline preload="metadata" poster={hero2} className="w-full h-full object-cover block transition-transform duration-700 hover:scale-105">
            <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="p-5 md:p-8 flex flex-col justify-center gap-3">
          <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">Новая коллекция</span>
          <h3 className="text-xl font-bold text-foreground leading-tight">Смотрите товар в действии</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">Подробные видеообзоры помогут вам сделать правильный выбор — увидьте качество и детали вживую.</p>
          <button className="mt-2 self-start h-9 px-5 gradient-primary text-primary-foreground rounded-lg font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity">
            Смотреть каталог <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default SplitVideoFeature;
