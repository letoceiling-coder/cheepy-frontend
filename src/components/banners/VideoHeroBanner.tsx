import { ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import hero1 from "@/assets/hero-1.jpg";

const VideoHeroBanner = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className={`py-8 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="relative rounded-xl overflow-hidden aspect-video md:aspect-[21/9]">
        <video autoPlay muted loop playsInline preload="metadata" poster={hero1} className="w-full h-full object-cover block transition-transform duration-700 hover:scale-105">
          <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-foreground/40 pointer-events-none" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 gap-2">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground">Весенняя коллекция 2025</h2>
          <p className="text-sm text-primary-foreground/80 max-w-md">Стиль, комфорт и качество в каждой детали</p>
          <button className="mt-2 h-10 px-6 gradient-primary text-primary-foreground rounded-lg font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity">
            Смотреть коллекцию <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
};
export default VideoHeroBanner;
