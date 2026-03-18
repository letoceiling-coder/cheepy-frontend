import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useDragScroll } from "@/hooks/useDragScroll";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
import look1 from "@/assets/look-1.jpg";
import product1 from "@/assets/product-1.jpg";
import product3 from "@/assets/product-3.jpg";

const looks = [
  { image: hero1, title: "Urban Minimal", tag: "Streetwear" },
  { image: look1, title: "Classic Elegance", tag: "Формальный" },
  { image: hero2, title: "Casual Friday", tag: "Повседневный" },
  { image: product1, title: "Sport Luxe", tag: "Спорт" },
  { image: hero3, title: "Boho Spirit", tag: "Бохо" },
  { image: product3, title: "Evening Out", tag: "Вечерний" },
];

const LookbookSlider = () => {
  const { ref, isVisible } = useScrollAnimation();
  const scrollRef = useDragScroll<HTMLDivElement>();

  const scroll = (dir: number) => scrollRef.current?.scrollBy({ left: dir * 400, behavior: "smooth" });

  return (
    <section ref={ref} className={`py-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Лукбук</h2>
          <p className="text-muted-foreground text-sm mt-1">Готовые образы от стилистов</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => scroll(-1)} className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors"><ChevronLeft size={18} /></button>
          <button onClick={() => scroll(1)} className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors"><ChevronRight size={18} /></button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto no-scrollbar pb-2 cursor-grab active:cursor-grabbing">
        {looks.map((l, i) => (
          <div key={i} className="min-w-[200px] sm:min-w-[220px] md:min-w-[240px] lg:min-w-[260px] max-w-[260px] flex-shrink-0 rounded-xl overflow-hidden relative cursor-pointer group aspect-[3/4]">
            <img src={l.image} alt={l.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/5 to-transparent" />
            <div className="absolute top-3 left-3">
              <span className="bg-primary-foreground/20 backdrop-blur-sm text-primary-foreground text-[11px] px-2.5 py-0.5 rounded-full font-medium">{l.tag}</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-sm font-bold text-primary-foreground mb-1.5">{l.title}</h3>
              <button className="flex items-center gap-1.5 text-primary-foreground text-xs font-medium group/btn">
                Смотреть образ <ArrowRight size={12} className="transition-transform group-hover/btn:translate-x-1" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default LookbookSlider;
