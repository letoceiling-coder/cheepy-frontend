import { useState } from "react";
import { ChevronLeft, ChevronRight, Heart, ShoppingCart } from "lucide-react";
import { useDragScroll } from "@/hooks/useDragScroll";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { mockProducts } from "@/data/mock-data";

const LargeProductSlider = () => {
  const { ref, isVisible } = useScrollAnimation();
  const scrollRef = useDragScroll<HTMLDivElement>();
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const products = mockProducts.slice(0, 10);

  const scroll = (dir: number) => scrollRef.current?.scrollBy({ left: dir * 360, behavior: "smooth" });

  return (
    <section ref={ref} className={`py-6 transition-all duration-700 ${isVisible ? "opacity-100" : "opacity-0"}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Хиты продаж</h2>
          <p className="text-muted-foreground text-sm mt-1">Лучшие товары этой недели</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => scroll(-1)} className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors"><ChevronLeft size={18} /></button>
          <button onClick={() => scroll(1)} className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors"><ChevronRight size={18} /></button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-5 overflow-x-auto no-scrollbar pb-2 cursor-grab active:cursor-grabbing">
        {products.map((p) => {
          const isHovered = hoveredId === p.id;
          const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
          return (
            <div
              key={p.id}
              className="min-w-[240px] md:min-w-[280px] max-h-[340px] flex-shrink-0 bg-card rounded-xl overflow-hidden border border-border group"
              onMouseEnter={() => setHoveredId(p.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div className="relative aspect-[3/4] overflow-hidden">
                <img
                  src={isHovered && p.images[1] ? p.images[1] : p.images[0]}
                  alt={p.name}
                  className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                />
                {discount > 0 && (
                  <span className="absolute top-3 left-3 gradient-hero text-primary-foreground text-xs font-semibold px-2 py-0.5 rounded-full">-{discount}%</span>
                )}
                <button className={`absolute top-3 right-3 w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:bg-destructive hover:text-destructive-foreground ${isHovered ? "opacity-100" : "opacity-0"}`}>
                  <Heart size={16} />
                </button>
                <button className={`absolute bottom-3 left-3 right-3 h-11 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 hover:opacity-90 ${isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
                  <ShoppingCart size={16} /> В корзину
                </button>
              </div>
              <div className="p-4">
                <p className="text-xs text-muted-foreground mb-1">{p.seller}</p>
                <h3 className="font-medium text-foreground text-sm truncate mb-2">{p.name}</h3>
                <div className="flex items-baseline gap-2">
                  <span className={`font-bold ${discount ? "text-destructive" : "text-foreground"}`}>{p.price.toLocaleString()} ₽</span>
                  {p.oldPrice && <span className="text-sm text-muted-foreground line-through">{p.oldPrice.toLocaleString()} ₽</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default LargeProductSlider;
