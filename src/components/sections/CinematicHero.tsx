import { useState, useEffect, useCallback } from "react";
import { ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";

const slides = [
  { image: hero1, title: "Новая коллекция SS'25", subtitle: "Откройте для себя последние тренды", cta1: "Смотреть коллекцию", cta2: "Подробнее" },
  { image: hero2, title: "Streetwear Culture", subtitle: "Лимитированные дропы каждую неделю", cta1: "Исследовать", cta2: "О бренде" },
  { image: hero3, title: "Летние скидки до -60%", subtitle: "Более 10 000 товаров по специальным ценам", cta1: "К распродаже", cta2: "Все акции" },
];

const CinematicHero = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => setCurrent((p) => (p + 1) % slides.length), []);

  useEffect(() => {
    if (isPaused) return;
    const t = setInterval(next, 6000);
    return () => clearInterval(t);
  }, [isPaused, next]);

  return (
    <section
      ref={ref}
      className="relative rounded-2xl overflow-hidden my-8"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative h-[400px] md:h-[520px]">
        {slides.map((s, i) => (
          <div key={i} className={`absolute inset-0 transition-opacity duration-700 ${i === current ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
            <img src={s.image} alt={s.title} className="w-full h-full object-cover scale-105 transition-transform duration-[8000ms] ease-out" style={{ transform: i === current ? "scale(1)" : "scale(1.05)" }} />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent" />
          </div>
        ))}
        <div className={`absolute inset-0 flex items-end pb-12 md:pb-16 px-8 md:px-14 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="max-w-xl" key={current}>
            <p className="text-primary-foreground/70 text-sm uppercase tracking-widest mb-2">{slides[current].subtitle}</p>
            <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground leading-tight mb-6">{slides[current].title}</h2>
            <div className="flex flex-wrap gap-3">
              <button className="h-12 px-8 rounded-xl gradient-primary text-primary-foreground font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity group">
                {slides[current].cta1} <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </button>
              <button className="h-12 px-8 rounded-xl border border-primary-foreground/30 text-primary-foreground font-medium hover:bg-primary-foreground/10 transition-colors">
                {slides[current].cta2}
              </button>
            </div>
          </div>
        </div>
        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "w-8 bg-primary-foreground" : "w-3 bg-primary-foreground/40"}`} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CinematicHero;
