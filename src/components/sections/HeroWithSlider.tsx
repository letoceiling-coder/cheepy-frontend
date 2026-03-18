import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDragScroll } from "@/hooks/useDragScroll";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { mockProducts } from "@/data/mock-data";

const HeroWithSlider = () => {
  const { ref, isVisible } = useScrollAnimation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const products = mockProducts.slice(0, 8);
  const scroll = (d: number) => scrollRef.current?.scrollBy({ left: d * 200, behavior: "smooth" });

  return (
    <section ref={ref} className={`py-4 md:py-6 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="rounded-2xl gradient-primary p-4 md:p-6 max-h-[min(380px,55vh)] flex flex-col">
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-primary-foreground">Выбор редакции</h2>
            <p className="text-primary-foreground/70 text-sm mt-1">Товары, отобранные нашими стилистами</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => scroll(-1)} className="w-9 h-9 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors text-primary-foreground"><ChevronLeft size={16} /></button>
            <button onClick={() => scroll(1)} className="w-9 h-9 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors text-primary-foreground"><ChevronRight size={16} /></button>
          </div>
        </div>
        <div ref={scrollRef} className="flex gap-3 overflow-x-auto no-scrollbar pb-1 min-h-0 flex-1 cursor-grab active:cursor-grabbing">
          {products.map((p) => (
            <div key={p.id} className="min-w-[120px] sm:min-w-[140px] flex-shrink-0 group cursor-pointer">
              <div className="aspect-[3/4] max-h-[160px] rounded-xl overflow-hidden mb-1.5">
                <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <p className="text-xs text-primary-foreground truncate">{p.name}</p>
              <p className="text-sm font-bold text-primary-foreground">{p.price.toLocaleString()} ₽</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroWithSlider;
