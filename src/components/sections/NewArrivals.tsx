import { useRef } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { mockProducts } from "@/data/mock-data";

const NewArrivals = () => {
  const { ref, isVisible } = useScrollAnimation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const products = mockProducts.slice(6, 16);
  const scroll = (d: number) => scrollRef.current?.scrollBy({ left: d * 200, behavior: "smooth" });

  return (
    <section ref={ref} className={`py-6 transition-all duration-700 ${isVisible ? "opacity-100" : "opacity-0"}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary" />
          <h2 className="text-lg font-bold text-foreground">Новинки</h2>
        </div>
        <div className="flex gap-1">
          <button onClick={() => scroll(-1)} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors"><ChevronLeft size={14} /></button>
          <button onClick={() => scroll(1)} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors"><ChevronRight size={14} /></button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {products.map((p) => (
          <div key={p.id} className="min-w-[160px] w-[160px] flex-shrink-0 group cursor-pointer">
            <div className="h-[200px] rounded-xl overflow-hidden mb-1.5 relative">
              <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[9px] px-2 py-0.5 rounded-full font-medium">NEW</span>
            </div>
            <p className="text-[11px] text-foreground truncate">{p.name}</p>
            <p className="text-xs font-bold text-foreground">{p.price.toLocaleString()} ₽</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default NewArrivals;
